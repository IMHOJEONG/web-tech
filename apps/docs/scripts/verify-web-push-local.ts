import assert from 'node:assert/strict'
import { spawn, type ChildProcess } from 'node:child_process'
import { createECDH, randomBytes } from 'node:crypto'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import { dirname, resolve } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { fileURLToPath } from 'node:url'
import {
    chromium,
    expect,
    type BrowserContext,
    type Page,
} from '@playwright/test'

const docs = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const backend = resolve(docs, '../docs-backend')
const origin = 'http://127.0.0.1:3017'
const apiOrigin = 'http://127.0.0.1:8007'
const processes: ChildProcess[] = []
const checks: Record<string, string | number | boolean> = {}
const interruption = new AbortController()
let stage = 'prepare'
let context: BrowserContext | undefined
let cleanupPage: Page | undefined
let temporary: string | undefined

function interrupt() {
    interruption.abort()
    void context?.close().catch(() => {})
}
process.once('SIGINT', interrupt)
process.once('SIGTERM', interrupt)

async function freePort(port: number) {
    const server = createServer()
    await new Promise<void>((accept, reject) => {
        server.once('error', reject)
        server.listen(port, '127.0.0.1', accept)
    })
    await new Promise<void>((accept, reject) =>
        server.close((error) => (error ? reject(error) : accept()))
    )
}

function start(
    command: string,
    args: string[],
    cwd: string,
    env: NodeJS.ProcessEnv
) {
    interruption.signal.throwIfAborted()
    // Never forward subprocess logs: framework errors can include request headers.
    const child = spawn(command, args, {
        cwd,
        env,
        detached: true,
        stdio: 'ignore',
    })
    processes.push(child)
    child.on('error', () => {})
    return child
}

async function stop(child: ChildProcess) {
    if (!child.pid) return
    try {
        process.kill(-child.pid, 'SIGTERM')
    } catch (error) {
        if (
            !error ||
            typeof error !== 'object' ||
            !('code' in error) ||
            error.code !== 'ESRCH'
        )
            throw error
        return
    }
    for (let attempt = 0; attempt < 30; attempt++) {
        try {
            process.kill(-child.pid, 0)
        } catch {
            return
        }
        await delay(100)
    }
    try {
        process.kill(-child.pid, 'SIGKILL')
    } catch {
        // The process group may have exited between the probe and signal.
    }
}

async function ready(url: string, child: ChildProcess) {
    const deadline = Date.now() + 120_000
    while (Date.now() < deadline) {
        interruption.signal.throwIfAborted()
        if (child.exitCode !== null || child.signalCode !== null)
            throw new Error('Server exited')
        try {
            if ((await fetch(url, { signal: AbortSignal.timeout(2000) })).ok)
                return
        } catch {
            // A refused connection is expected during server startup.
        }
        await delay(500, undefined, { signal: interruption.signal })
    }
    throw new Error('Server startup timed out')
}

async function run() {
    await freePort(3017)
    await freePort(8007)
    temporary = await mkdtemp(resolve(tmpdir(), 'heap-forge-push-'))
    const store = resolve(temporary, 'subscriptions.json')
    const key = createECDH('prime256v1')
    key.generateKeys()
    const publicKey = key.getPublicKey().toString('base64url')
    const apiToken = randomBytes(32).toString('hex')
    const adminToken = randomBytes(32).toString('hex')
    const inviteCode = randomBytes(32).toString('hex')
    const sessionSecret = randomBytes(32).toString('hex')
    for (const [name, value] of Object.entries({
        'api-token': apiToken,
        'admin-token': adminToken,
        'private-key': key.getPrivateKey().toString('base64url'),
    })) {
        await writeFile(resolve(temporary, name), value, { mode: 0o600 })
    }
    const env: NodeJS.ProcessEnv = { ...process.env }
    for (const name of Object.keys(env)) {
        if (
            /^(BLOG_PUSH_|PUSH_|BLOG_CONTENT_|BETTER_STACK_|BETTERSTACK_)/.test(
                name
            )
        )
            env[name] = ''
    }
    const backendEnv = {
        ...env,
        PORT: '8007',
        CONTENT_API_TOKEN_FILE: '',
        CONTENT_API_TOKEN: randomBytes(32).toString('hex'),
        PUSH_ENABLED: 'true',
        PUSH_API_TOKEN_FILE: resolve(temporary, 'api-token'),
        PUSH_ADMIN_TOKEN_FILE: resolve(temporary, 'admin-token'),
        PUSH_VAPID_PRIVATE_KEY_FILE: resolve(temporary, 'private-key'),
        PUSH_VAPID_PUBLIC_KEY: publicKey,
        PUSH_VAPID_SUBJECT: 'mailto:local-test@heap-forge.app',
        PUSH_STORE_FILE: store,
    }
    const backendStart = () =>
        start(process.execPath, ['dist/src/main.js'], backend, backendEnv)
    stage = 'servers'
    let server = backendStart()
    await ready(`${apiOrigin}/health`, server)
    const frontend = start('pnpm', ['dev:e2e'], docs, {
        ...env,
        DOCS_E2E_PORT: '3017',
        BLOG_PUSH_ENABLED: 'true',
        BLOG_PUSH_WAF_VERIFIED: 'false',
        BLOG_PUSH_INVITE_CODE: inviteCode,
        BLOG_PUSH_SESSION_SECRET: sessionSecret,
        BLOG_PUSH_API_BASE_URL: apiOrigin,
        BLOG_PUSH_API_TOKEN: apiToken,
        BLOG_CONTENT_INCLUDE_REMOTE_INDEX: 'false',
        BLOG_CONTENT_API_BASE_URL: '',
        BLOG_CONTENT_API_BASE_URL_INTERNAL: '',
        BLOG_CONTENT_API_BASE_URL_PUBLIC: '',
    })
    await ready(`${origin}/api/push/access`, frontend)
    assert.equal((await fetch(`${origin}/api/push`)).status, 401)
    assert.equal(
        (
            await fetch(`${origin}/api/push/subscriptions`, {
                method: 'POST',
                headers: { Origin: origin, 'Content-Type': 'application/json' },
                body: '{}',
            })
        ).status,
        401
    )
    const access = await fetch(`${origin}/api/push/access`, {
        method: 'POST',
        headers: { Origin: origin, 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: inviteCode }),
    })
    assert.equal(access.status, 200)
    const cookie = access.headers.get('set-cookie')?.split(';')[0]
    assert.ok(cookie)
    checks.participantAccessGate = true
    const config = await fetch(`${origin}/api/push`, {
        headers: { Cookie: cookie },
    }).then((response) => response.json())
    assert.deepEqual(config, { publicKey })
    checks.publicConfigOnly = true
    const mutate = (method: string, body: object, requestOrigin = origin) =>
        fetch(`${origin}/api/push/subscriptions`, {
            method,
            headers: {
                Origin: requestOrigin,
                'Content-Type': 'application/json',
                Cookie: cookie,
            },
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(8000),
        })
    stage = 'authorization'
    checks.unauthenticatedConfigStatus = (
        await fetch(`${apiOrigin}/api/push/config`)
    ).status
    checks.foreignOriginStatus = (
        await mutate('POST', {}, 'https://foreign.example')
    ).status
    checks.invalidSubscriptionStatus = (await mutate('POST', {})).status
    assert.equal(checks.unauthenticatedConfigStatus, 401)
    assert.equal(checks.foreignOriginStatus, 403)
    assert.equal(checks.invalidSubscriptionStatus, 400)
    assert.equal(
        (
            await fetch(`${apiOrigin}/api/push/test`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${apiToken}`,
                    'Content-Type': 'application/json',
                },
                body: '{}',
            })
        ).status,
        401
    )
    checks.authorizationBoundaries = true

    // Synthetic subscription checks only persistence, never provider delivery.
    const synthetic = {
        endpoint: 'https://fcm.googleapis.com/local-persistence-test',
        keys: {
            p256dh: publicKey,
            auth: randomBytes(16).toString('base64url'),
        },
    }
    const storedCount = async () => {
        const entries: unknown = JSON.parse(await readFile(store, 'utf8'))
        assert.ok(Array.isArray(entries))
        return entries.length
    }
    stage = 'persistence'
    assert.equal((await mutate('POST', synthetic)).status, 200)
    assert.equal((await mutate('POST', synthetic)).status, 200)
    assert.equal(await storedCount(), 1)
    await stop(server)
    server = backendStart()
    await ready(`${apiOrigin}/health`, server)
    assert.equal((await mutate('POST', synthetic)).status, 200)
    assert.equal(await storedCount(), 1)
    assert.equal((await mutate('DELETE', synthetic)).status, 200)
    assert.equal(await storedCount(), 0)
    checks.syntheticPersistenceAndRestart = true
    console.log(
        '[push-local] Local HTTP, authorization and persistence checks passed.'
    )

    stage = 'chrome'
    context = await chromium.launchPersistentContext(
        resolve(temporary, 'chrome-profile'),
        {
            channel: 'chrome',
            headless: false,
            ignoreDefaultArgs: ['--disable-background-networking'],
        }
    )
    interruption.signal.throwIfAborted()
    checks.chromeVersion = context.browser()?.version() ?? 'unknown'
    await context.grantPermissions(['notifications'], { origin })
    const page = await context.newPage()
    cleanupPage = page
    await page.goto(`${origin}/ko/about`, { timeout: 90_000 })
    const panel = page.getByRole('region', {
        name: '이 브라우저에서 알림 받아보기',
    })
    await panel.getByLabel('실험 참여 코드').fill(inviteCode)
    await panel.getByRole('button', { name: '참여 코드 확인' }).click()
    const subscribe = panel.getByRole('button', { name: '테스트 알림 받기' })
    await expect(subscribe).toBeEnabled({ timeout: 30_000 })
    stage = 'native-subscription'
    await subscribe.click()
    const unsubscribe = panel.getByRole('button', { name: '알림 구독 해지' })
    try {
        await expect(unsubscribe).toBeEnabled({ timeout: 45_000 })
    } catch (error) {
        const diagnostic = await page.evaluate(async () => ({
            permission: Notification.permission,
            workerState:
                (await navigator.serviceWorker.getRegistration('/'))?.active
                    ?.state ?? 'missing',
        }))
        checks.notificationPermission = diagnostic.permission
        checks.workerState = diagnostic.workerState
        checks.panelStatus =
            (await panel.getByRole('status').textContent()) ?? 'missing'
        throw error
    }
    assert.equal(await storedCount(), 1)
    const subscription = await page.evaluate(async () =>
        (
            await (
                await navigator.serviceWorker.ready
            ).pushManager.getSubscription()
        )?.toJSON()
    )
    assert.ok(subscription?.endpoint)
    checks.nativeSubscription = true
    console.log('[push-local] Native Chrome subscription stored.')

    stage = 'local-notification'
    await page.evaluate(async () => {
        const registered = await navigator.serviceWorker.ready
        await registered.showNotification('HEAP-FORGE local check', {
            tag: 'local-control',
        })
    })
    checks.localNotificationCount = await page.evaluate(async () => {
        const notifications = await (
            await navigator.serviceWorker.ready
        ).getNotifications({ tag: 'local-control' })
        const count = notifications.length
        for (const notification of notifications) notification.close()
        return count
    })
    assert.equal(checks.localNotificationCount, 1)

    stage = 'provider-send'
    const worker = context.serviceWorkers()[0]
    assert.ok(worker)
    await worker.evaluate(() => {
        Reflect.set(globalThis, '__pushCount', 0)
        globalThis.addEventListener('push', () => {
            Reflect.set(
                globalThis,
                '__pushCount',
                Number(Reflect.get(globalThis, '__pushCount')) + 1
            )
        })
    })
    const send = await fetch(`${apiOrigin}/api/push/test`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${adminToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
        signal: AbortSignal.timeout(8000),
    })
    checks.providerResponseStatus = send.status
    assert.equal(send.status, 200)
    assert.deepEqual(await send.json(), { sent: true })
    checks.providerAccepted = true
    stage = 'browser-receipt'
    let receiptObserved = false
    try {
        await expect
            .poll(
                () =>
                    worker.evaluate(() =>
                        Number(Reflect.get(globalThis, '__pushCount'))
                    ),
                {
                    timeout: 60_000,
                }
            )
            .toBeGreaterThan(0)
        await expect
            .poll(
                () =>
                    page.evaluate(
                        async () =>
                            (
                                await (
                                    await navigator.serviceWorker.ready
                                ).getNotifications()
                            ).length
                    ),
                { timeout: 10_000 }
            )
            .toBe(1)
        receiptObserved = true
    } catch {
        // Delivery failure must not skip the independent unsubscribe check.
    }
    checks.observedPushEvents = await worker.evaluate(() =>
        Number(Reflect.get(globalThis, '__pushCount'))
    )
    checks.providerNotificationCount = await page.evaluate(
        async () =>
            (
                await (
                    await navigator.serviceWorker.ready
                ).getNotifications({ tag: 'heap-forge-push-test' })
            ).length
    )
    checks.browserReceivedAndNotificationCreated = receiptObserved
    stage = 'unsubscribe'
    await unsubscribe.click()
    await expect(subscribe).toBeEnabled()
    assert.equal(await storedCount(), 0)
    assert.equal(
        await page.evaluate(async () =>
            (await navigator.serviceWorker.ready).pushManager.getSubscription()
        ),
        null
    )
    checks.nativeUnsubscribe = true
    checks.osBannerAndManualClick = 'not-verified'
    stage = 'complete'
    if (!receiptObserved) {
        stage = 'browser-receipt'
        throw new Error('Provider receipt was not observed')
    }
}

try {
    await run()
} catch (error) {
    checks.failedStage = stage
    checks.errorType = error instanceof Error ? error.name : 'UnknownError'
    process.exitCode = 1
} finally {
    if (cleanupPage && !cleanupPage.isClosed()) {
        await Promise.race([
            cleanupPage
                .evaluate(async () => {
                    const registered =
                        await navigator.serviceWorker.getRegistration('/')
                    const current =
                        await registered?.pushManager.getSubscription()
                    if (current) await current.unsubscribe()
                })
                .catch(() => {}),
            delay(5000),
        ])
    }
    await context?.close().catch(() => {})
    for (const child of [...processes].reverse()) await stop(child)
    if (temporary) await rm(temporary, { recursive: true, force: true })
    checks.temporarySecretsRemoved = true
    process.off('SIGINT', interrupt)
    process.off('SIGTERM', interrupt)
    console.log(
        JSON.stringify({ node: process.version, stage, checks }, null, 2)
    )
}
