// Web Push Notification utilities

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || ''

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)))
}

export function isNotificationSupported(): boolean {
  return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window
}

export function getNotificationPermission(): NotificationPermission | 'default' {
  if (!isNotificationSupported()) return 'denied'
  return Notification.permission
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null
  try {
    const registration = await navigator.serviceWorker.register('/sw.js')
    return registration
  } catch (error) {
    console.error('SW registration failed:', error)
    return null
  }
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) return 'denied'
  const permission = await Notification.requestPermission()
  return permission
}

export async function subscribeToPush(): Promise<PushSubscription | null> {
  if (!VAPID_PUBLIC_KEY) {
    console.warn('VAPID_PUBLIC_KEY not configured')
    return null
  }

  const registration = await navigator.serviceWorker.ready
  if (!registration) return null

  try {
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
    })
    return subscription
  } catch (error) {
    console.error('Push subscription failed:', error)
    return null
  }
}

export async function unsubscribeFromPush(): Promise<boolean> {
  const registration = await navigator.serviceWorker.ready
  if (!registration) return false

  const subscription = await registration.pushManager.getSubscription()
  if (subscription) {
    return subscription.unsubscribe()
  }
  return true
}

export function serializeSubscription(subscription: PushSubscription) {
  const keys = subscription.getKey('p256dh')
  const auth = subscription.getKey('auth')
  return {
    endpoint: subscription.endpoint,
    p256dh: keys ? btoa(String.fromCharCode(...new Uint8Array(keys))) : '',
    auth: auth ? btoa(String.fromCharCode(...new Uint8Array(auth))) : '',
  }
}
