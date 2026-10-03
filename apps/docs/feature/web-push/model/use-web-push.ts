'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'
import ky, { HTTPError } from 'ky'

type PushStatus =
    | 'loading'
    | 'locked'
    | 'ready'
    | 'subscribed'
    | 'denied'
    | 'unsupported'
    | 'unavailable'
    | 'error'

function applicationServerKey(value: string): Uint8Array<ArrayBuffer> {
    const raw = atob(
        value.replace(/-/g, '+').replace(/_/g, '/') +
            '='.repeat((4 - (value.length % 4)) % 4)
    )
    return Uint8Array.from(raw, (character) => character.charCodeAt(0))
}

async function registration() {
    const registered = await navigator.serviceWorker.register('/push-sw.js', {
        scope: '/',
        updateViaCache: 'none',
    })
    let timeout: ReturnType<typeof setTimeout> | undefined
    try {
        await Promise.race([
            navigator.serviceWorker.ready,
            new Promise<never>((_, reject) => {
                timeout = setTimeout(
                    () => reject(new Error('Worker activation timed out')),
                    8000
                )
            }),
        ])
    } finally {
        clearTimeout(timeout)
    }
    return registered
}

const api = ky.create({ timeout: 5000, retry: 0 })

async function syncSubscription(): Promise<boolean> {
    const registered = await navigator.serviceWorker.getRegistration('/')
    const subscription = await registered?.pushManager.getSubscription()
    if (subscription) {
        await api.post('/api/push/subscriptions', {
            json: subscription.toJSON(),
        })
    }
    return Boolean(subscription)
}

function subscriptionStatus(subscribed: boolean): PushStatus {
    return subscribed
        ? 'subscribed'
        : Notification.permission === 'denied'
          ? 'denied'
          : 'ready'
}

function failureStatus(error: unknown): PushStatus {
    if (error instanceof HTTPError && error.response.status === 401)
        return 'locked'
    return 'error'
}

function subscribeToCapabilities() {
    return () => {}
}
function getCapabilities() {
    return (
        window.isSecureContext &&
        'serviceWorker' in navigator &&
        'PushManager' in window &&
        'Notification' in window
    )
}
function getServerCapabilities() {
    return null
}

export function useWebPush() {
    const supported = useSyncExternalStore(
        subscribeToCapabilities,
        getCapabilities,
        getServerCapabilities
    )
    const [status, setStatus] = useState<PushStatus>('loading')
    const [busy, setBusy] = useState(false)
    const [subscribed, setSubscribed] = useState(false)
    const [accessError, setAccessError] = useState(false)

    useEffect(() => {
        let active = true
        if (!supported) return
        const sync = async () => {
            try {
                const access = await api
                    .get('/api/push/access')
                    .json<{ authorized: boolean }>()
                if (!access.authorized) {
                    if (active) setStatus('locked')
                    return
                }
                const existing = await syncSubscription()
                if (active) {
                    setSubscribed(existing)
                    setStatus(subscriptionStatus(existing))
                }
            } catch (error) {
                if (active)
                    setStatus(
                        failureStatus(error) === 'locked'
                            ? 'locked'
                            : 'unavailable'
                    )
            }
        }
        void sync()
        return () => {
            active = false
        }
    }, [supported])

    async function authorize(code: string) {
        if (busy || status !== 'locked') return
        setBusy(true)
        setAccessError(false)
        try {
            await api.post('/api/push/access', { json: { code } })
            const existing = await syncSubscription()
            setSubscribed(existing)
            setStatus(subscriptionStatus(existing))
        } catch (error) {
            if (error instanceof HTTPError && error.response.status === 401) {
                setStatus('locked')
                setAccessError(true)
            } else {
                setStatus('unavailable')
            }
        } finally {
            setBusy(false)
        }
    }

    async function toggle() {
        if (
            busy ||
            !supported ||
            !['ready', 'subscribed', 'error'].includes(status)
        )
            return
        setBusy(true)
        try {
            if (subscribed) {
                const registered =
                    await navigator.serviceWorker.getRegistration('/')
                const current = await registered?.pushManager.getSubscription()
                if (current) {
                    await api.delete('/api/push/subscriptions', {
                        json: current.toJSON(),
                    })
                    if (!(await current.unsubscribe()))
                        throw new Error('Unsubscribe failed')
                }
                setSubscribed(false)
                setStatus('ready')
                return
            }
            // Request permission only from a direct click, before other async work.
            const permission = await Notification.requestPermission()
            if (permission !== 'granted') {
                setStatus(permission === 'denied' ? 'denied' : 'ready')
                return
            }
            const config = await api
                .get('/api/push')
                .json<{ publicKey: string }>()
            const registered = await registration()
            const existing = await registered.pushManager.getSubscription()
            const subscription =
                existing ||
                (await registered.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: applicationServerKey(
                        config.publicKey
                    ),
                }))
            try {
                await api.post('/api/push/subscriptions', {
                    json: subscription.toJSON(),
                })
            } catch (error) {
                if (!existing) await subscription.unsubscribe()
                throw error
            }
            setSubscribed(true)
            setStatus('subscribed')
        } catch (error) {
            setStatus(failureStatus(error))
        } finally {
            setBusy(false)
        }
    }

    return {
        status: supported === false ? 'unsupported' : status,
        busy,
        subscribed,
        accessError,
        authorize,
        toggle,
    }
}
