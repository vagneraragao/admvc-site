'use client'

import { useEffect, useState } from 'react'
import { Bell, Loader2 } from 'lucide-react'

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export default function PushNotificationSetup() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'granted' | 'denied' | 'unsupported'>('idle')

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setStatus('unsupported')
      return
    }
    if (Notification.permission === 'granted') {
      setStatus('granted')
    } else if (Notification.permission === 'denied') {
      setStatus('denied')
    }
  }, [])

  async function subscribe() {
    setStatus('loading')
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') { setStatus('denied'); return }

      const registration = await navigator.serviceWorker.ready
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidPublicKey) { setStatus('idle'); return }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey).buffer as ArrayBuffer,
      })

      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription.toJSON()),
      })

      setStatus(res.ok ? 'granted' : 'idle')
    } catch {
      setStatus('idle')
    }
  }

  if (status === 'unsupported' || status === 'granted' || status === 'denied') return null

  return (
    <button onClick={subscribe} disabled={status === 'loading'} title="Activar notificacoes"
      className="h-9 w-9 flex items-center justify-center rounded-lg bg-orange-500/10 text-orange-500 hover:bg-orange-500 hover:text-white transition-all animate-pulse disabled:animate-none">
      {status === 'loading' ? <Loader2 size={14} className="animate-spin" /> : <Bell size={14} />}
    </button>
  )
}
