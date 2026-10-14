'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { DataConnection, MediaConnection, Peer } from 'peerjs'

export type Role = 'host' | 'guest'
export type RoomStatus = 'connecting' | 'waiting' | 'connected' | 'error'

export type Msg =
  | { type: 'settings'; frameId: string; filter: string }
  | { type: 'countdown'; shot: number }
  | { type: 'photo'; shot: number; data: string } // JPEG dataURL
  | { type: 'retake'; shot: number }

const PREFIX = 'snapin-'
const RETRY_MS = 3000
const MAX_RETRY = 20

// STUN publik untuk menemukan alamat; TURN dipakai saat dua device tidak bisa
// saling menjangkau langsung (NAT simetris / CGNAT / AP isolation / `client
// isolation`) dan WAJIB untuk banyak kasus antar-jaringan. Isi lewat .env.local:
//
//   Statis:
//     NEXT_PUBLIC_TURN_URL="turn:host:3478,turns:host:5349"
//     NEXT_PUBLIC_TURN_USERNAME=...
//     NEXT_PUBLIC_TURN_CREDENTIAL=...
//
//   Dinamis (endpoint yang mengembalikan array iceServers, mis. Metered/Twilio):
//     NEXT_PUBLIC_TURN_CREDENTIALS_URL="https://..../api/v1/turn/credentials?apiKey=..."
//
// Tanpa TURN, biasanya hanya jalan kalau kedua device bisa saling menjangkau.
async function buildIceServers(): Promise<RTCIceServer[]> {
  const servers: RTCIceServer[] = [
    {
      urls: [
        'stun:stun.l.google.com:19302',
        'stun:stun1.l.google.com:19302',
        'stun:stun.cloudflare.com:3478',
      ],
    },
  ]

  const url = process.env.NEXT_PUBLIC_TURN_URL
  if (url) {
    servers.push({
      urls: url.split(',').map((s) => s.trim()).filter(Boolean),
      username: process.env.NEXT_PUBLIC_TURN_USERNAME || undefined,
      credential: process.env.NEXT_PUBLIC_TURN_CREDENTIAL || undefined,
    })
  }

  const credsUrl = process.env.NEXT_PUBLIC_TURN_CREDENTIALS_URL
  if (credsUrl) {
    try {
      const res = await fetch(credsUrl, { cache: 'no-store' })
      if (res.ok) {
        const data: unknown = await res.json()
        const list = Array.isArray(data)
          ? data
          : Array.isArray((data as { iceServers?: unknown })?.iceServers)
            ? (data as { iceServers: RTCIceServer[] }).iceServers
            : []
        for (const s of list as RTCIceServer[]) {
          if (s && s.urls) {
            servers.push({ urls: s.urls, username: s.username, credential: s.credential })
          }
        }
      }
    } catch {
      /* biarkan STUN saja kalau gagal */
    }
  }

  return servers
}

export function useRoom(opts: {
  code: string
  role: Role
  localStream: MediaStream | null
  onMessage: (msg: Msg) => void
}) {
  const { code, role, localStream } = opts
  const connRef = useRef<DataConnection | null>(null)
  const onMessageRef = useRef(opts.onMessage)
  onMessageRef.current = opts.onMessage

  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const [status, setStatus] = useState<RoomStatus>('connecting')
  const [iceState, setIceState] = useState('')
  const [lastError, setLastError] = useState('')
  const [myId, setMyId] = useState('')
  const [turnReady, setTurnReady] = useState(false)

  useEffect(() => {
    if (!localStream || !code) return
    let cancelled = false
    let peer: Peer | undefined
    let retryTimer: number | undefined
    let retries = 0

    ;(async () => {
      const { default: PeerCtor } = await import('peerjs') // PeerJS butuh window
      if (cancelled) return

      const iceServers = await buildIceServers()
      if (cancelled) return
      setTurnReady(iceServers.some((s) => String(s.urls).includes('turn')))

      const target = PREFIX + code
      const peerOpts = { config: { iceServers } }
      peer = role === 'host' ? new PeerCtor(target, peerOpts) : new PeerCtor(peerOpts)

      // Pantau status ICE dari RTCPeerConnection supaya kegagalan NAT
      // (butuh TURN) terlihat jelas, bukan cuma "nunggu" tanpa akhir.
      const watchPc = (pc?: RTCPeerConnection) => {
        if (!pc) return
        const update = () => setIceState(pc.iceConnectionState)
        update()
        pc.addEventListener('iceconnectionstatechange', update)
      }

      const wireData = (conn: DataConnection) => {
        connRef.current = conn
        conn.on('open', () => setStatus('connected'))
        conn.on('data', (d) => onMessageRef.current(d as Msg))
        conn.on('close', () => {
          connRef.current = null
          setStatus('waiting')
        })
        conn.on('error', (e) => setLastError(`data: ${(e as Error)?.message ?? String(e)}`))
        watchPc(conn.peerConnection)
      }

      const wireCall = (call: MediaConnection) => {
        call.on('stream', setRemoteStream)
        call.on('close', () => setRemoteStream(null))
        call.on('error', (e) => setLastError(`media: ${(e as Error)?.message ?? String(e)}`))
        watchPc(call.peerConnection)
      }

      // Guest: hubungi host. Panggilan video dilakukan setelah data channel
      // terbuka supaya lebih andal (host pasti sudah siap).
      const connectToHost = () => {
        if (cancelled || !peer) return
        const conn = peer.connect(target, { reliable: true })
        wireData(conn)
        conn.on('open', () => {
          if (cancelled || !peer) return
          wireCall(peer.call(target, localStream))
        })
      }

      peer.on('open', (id) => {
        setMyId(id)
        if (role === 'host') {
          setStatus('waiting')
          return
        }
        setStatus('connecting')
        connectToHost()
      })

      if (role === 'host') {
        peer.on('connection', wireData)
        peer.on('call', (call) => {
          call.answer(localStream)
          wireCall(call)
        })
      }

      peer.on('disconnected', () => {
        // Putus dari server signaling → coba sambung ulang (koneksi P2P tetap jalan).
        if (!cancelled) peer?.reconnect()
      })

      peer.on('error', (err) => {
        if (cancelled) return
        if (err.type === 'peer-unavailable' && role === 'guest') {
          // Host belum siap / belum masuk → coba lagi berkala.
          setLastError('host belum tersedia, mencoba lagi…')
          if (retries < MAX_RETRY) {
            retries += 1
            retryTimer = window.setTimeout(connectToHost, RETRY_MS)
          } else {
            setStatus('error')
          }
          return
        }
        setLastError(`${err.type}: ${err.message}`)
        setStatus('error')
      })
    })()

    return () => {
      cancelled = true
      if (retryTimer) window.clearTimeout(retryTimer)
      peer?.destroy()
      connRef.current = null
      setRemoteStream(null)
    }
  }, [code, role, localStream])

  const send = useCallback((msg: Msg) => {
    if (connRef.current?.open) connRef.current.send(msg)
  }, [])

  return { remoteStream, status, iceState, lastError, myId, turnReady, send }
}
