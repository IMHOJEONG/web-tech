import { createHash, randomUUID } from 'node:crypto'

export type GenerationMode = 'baseline' | 'generation'
export type Revision = 'r1' | 'r2'
export type Lease = Readonly<{ generation: number; revision: Revision }>

// Single-process experiment only, not a distributed publication authority.
export function createGenerationSession(mode: GenerationMode) {
    const namespace = randomUUID()
    let current: Lease = Object.freeze({ generation: 1, revision: 'r1' })
    return {
        mode,
        current: () => current,
        advance(expected: number, revision: Revision): Lease | null {
            if (expected !== current.generation) return null
            current = Object.freeze({
                generation: current.generation + 1,
                revision,
            })
            return current
        },
        keyFor(key: string, lease: Lease) {
            if (mode === 'baseline') return key
            return createHash('sha256')
                .update(`${namespace}\0${lease.generation}\0${key}`)
                .digest('hex')
        },
        canWrite(lease: Lease) {
            return (
                mode === 'baseline' || lease.generation === current.generation
            )
        },
    }
}
