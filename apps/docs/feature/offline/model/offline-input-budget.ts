export const OFFLINE_INPUT_MAX_BYTES = 1024 * 1024

export function isOfflineInputWithinBudget(html: string): boolean {
    // UTF-8 cannot be shorter than the UTF-16 code-unit count.
    if (html.length > OFFLINE_INPUT_MAX_BYTES) return false
    return new TextEncoder().encode(html).byteLength <= OFFLINE_INPUT_MAX_BYTES
}
