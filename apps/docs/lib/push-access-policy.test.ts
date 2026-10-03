import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
    createPushAccessSession,
    isPushAccessReady,
    matchesPushInvite,
    PUSH_ACCESS_COOKIE,
    PUSH_ACCESS_TTL_SECONDS,
    readPushAccessCookie,
    verifyPushAccessSession,
    type PushAccessSettings,
} from './push-access-policy.ts'

// Synthetic fixtures, not deployed credentials.
const settings: PushAccessSettings = {
    enabled: true,
    production: true,
    wafVerified: true,
    inviteCode: 'a'.repeat(64),
    sessionSecret: 'b'.repeat(64),
    apiToken: 'c'.repeat(64),
}
const now = Date.UTC(2026, 9, 3)

test('fails closed unless enabled with independent secrets and production WAF attestation', () => {
    assert.equal(isPushAccessReady(settings), true)
    for (const override of [
        { enabled: false },
        { wafVerified: false },
        { inviteCode: '' },
        { sessionSecret: 'weak' },
        { sessionSecret: settings.inviteCode },
        { inviteCode: settings.apiToken },
        { sessionSecret: settings.apiToken },
    ])
        assert.equal(isPushAccessReady({ ...settings, ...override }), false)
    assert.equal(
        isPushAccessReady({
            ...settings,
            production: false,
            wafVerified: false,
        }),
        true
    )
    assert.throws(() =>
        createPushAccessSession({ ...settings, enabled: false }, now)
    )
})

test('invitation rejects malformed or incorrect input', () => {
    assert.equal(
        matchesPushInvite(settings.inviteCode, settings.inviteCode),
        true
    )
    for (const input of [null, {}, 'a', 'd'.repeat(64), 'a'.repeat(129)]) {
        assert.equal(matchesPushInvite(input, settings.inviteCode), false)
    }
})

test('signed sessions expire after one hour and reject tampering and future deadlines', () => {
    const session = createPushAccessSession(settings, now)
    assert.equal(verifyPushAccessSession(session, settings, now), true)
    assert.equal(
        verifyPushAccessSession(
            session,
            settings,
            now + (PUSH_ACCESS_TTL_SECONDS - 1) * 1000
        ),
        true
    )
    assert.equal(
        verifyPushAccessSession(
            session,
            settings,
            now + PUSH_ACCESS_TTL_SECONDS * 1000
        ),
        false
    )
    assert.equal(verifyPushAccessSession(session, settings, now - 1000), false)
    for (const input of [
        null,
        '',
        session + 'x',
        session.replace(/^\d+/, '999999999999'),
        'x'.repeat(129),
    ]) {
        assert.equal(verifyPushAccessSession(input, settings, now), false)
    }
    const last = session.endsWith('a') ? 'b' : 'a'
    assert.equal(
        verifyPushAccessSession(session.slice(0, -1) + last, settings, now),
        false
    )
})

test('rotating either secret invalidates sessions; knowing the invite is not a signing credential', () => {
    const session = createPushAccessSession(settings, now)
    assert.equal(
        verifyPushAccessSession(
            session,
            { ...settings, inviteCode: 'd'.repeat(64) },
            now
        ),
        false
    )
    assert.equal(
        verifyPushAccessSession(
            session,
            { ...settings, sessionSecret: 'e'.repeat(64) },
            now
        ),
        false
    )
    const forged = createPushAccessSession(
        { ...settings, sessionSecret: 'f'.repeat(64) },
        now
    )
    assert.equal(verifyPushAccessSession(forged, settings, now), false)
    assert.notEqual(createPushAccessSession(settings, now), session)
})

test('cookie parsing rejects duplicate values and unrelated cookies', () => {
    const request = (cookie: string) =>
        new Request('https://blog.example/api/push', { headers: { cookie } })
    assert.equal(readPushAccessCookie(request('other=value')), null)
    assert.equal(
        readPushAccessCookie(
            request(`${PUSH_ACCESS_COOKIE}=token; other=value`)
        ),
        'token'
    )
    assert.equal(
        readPushAccessCookie(
            request(`${PUSH_ACCESS_COOKIE}=one; ${PUSH_ACCESS_COOKIE}=two`)
        ),
        null
    )
    assert.equal(readPushAccessCookie(request('')), null)
})
