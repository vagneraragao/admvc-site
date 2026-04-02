'use client'

import { useEffect, useState } from 'react'

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

      if (permission !== 'granted') {
        setStatus('denied')
        return
      }

      const registration = await navigator.serviceWorker.ready

      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidPublicKey) {
        console.error('[PUSH] NEXT_PUBLIC_VAPID_PUBLIC_KEY nao configurada')
        setStatus('idle')
        return
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey).buffer as ArrayBuffer,
      })

      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription.toJSON()),
      })

      if (res.ok) {
        setStatus('granted')
      } else {
        console.error('[PUSH] Erro ao guardar subscription')
        setStatus('idle')
      }
    } catch (err) {
      console.error('[PUSH] Erro:', err)
      setStatus('idle')
    }
  }

  if (status === 'unsupported') return null
  if (status === 'granted') return null

  return (
    <button
      onClick={subscribe}
      disabled={status === 'loading' || status === 'denied'}
      className="flex items-center gap-2 rounded-lg bg-[#3F6B4F] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#2d5039] disabled:opacity-50"
    >
      {status === 'loading' ? (
        'A ativar...'
      ) : status === 'denied' ? (
        'Notificacoes bloqueadas'
      ) : (
        'Ativar notificacoes'
      )}
    </button>
  )
}
