const messageKeys = {
    registration: 'workerRegistrationError',
    activation: 'workerActivationError',
    'activation-timeout': 'workerActivationError',
    'worker-unavailable': 'workerUnavailable',
    'message-timeout': 'responseTimeout',
    'message-send': 'responseError',
    'message-invalid': 'responseError',
    'storage-denied': 'storageDenied',
    'storage-quota': 'storageQuota',
    storage: 'storageError',
    confirmation: 'responseError',
    source: 'sourceError',
    'context-timeout': 'sourceContextError',
    path: 'sourceError',
    action: 'responseError',
    snapshot: 'snapshotError',
    loading: 'notReady',
    limit: 'limit',
    size: 'size',
    unknown: 'error',
} as const

export type OfflineErrorCode = keyof typeof messageKeys
const stages = [
    'snapshot',
    'registration',
    'activation',
    'message',
    'validation',
    'source-check',
    'storage-open',
    'storage-read',
    'storage-write',
    'storage-confirmation',
] as const
export type OfflineErrorStage = (typeof stages)[number]
export type OfflineFailure = {
    code: OfflineErrorCode
    stage: OfflineErrorStage
}

export class OfflineOperationError extends Error implements OfflineFailure {
    readonly code: OfflineErrorCode
    readonly stage: OfflineErrorStage

    constructor(code: OfflineErrorCode, stage: OfflineErrorStage) {
        super(code)
        this.name = 'OfflineOperationError'
        this.code = code
        this.stage = stage
    }
}

export function isOfflineErrorCode(value: unknown): value is OfflineErrorCode {
    return typeof value === 'string' && Object.hasOwn(messageKeys, value)
}

export function isOfflineErrorStage(
    value: unknown
): value is OfflineErrorStage {
    return stages.some((stage) => stage === value)
}

export function getOfflineFailure(
    error: unknown,
    stage: OfflineErrorStage
): OfflineFailure {
    if (error instanceof OfflineOperationError)
        return { code: error.code, stage: error.stage }
    if (error instanceof Error) {
        if (error.name === 'QuotaExceededError')
            return { code: 'storage-quota', stage }
        if (['SecurityError', 'NotAllowedError'].includes(error.name))
            return { code: 'storage-denied', stage }
        if (
            stage === 'snapshot' &&
            ['loading', 'size', 'snapshot'].includes(error.message)
        )
            return { code: error.message as OfflineErrorCode, stage }
    }
    return { code: 'unknown', stage }
}

export function getOfflineErrorMessageKey(code: OfflineErrorCode) {
    return messageKeys[code]
}
