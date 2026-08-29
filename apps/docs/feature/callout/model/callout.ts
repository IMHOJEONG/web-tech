export const CALLOUT_VARIANTS = ['note', 'tip', 'warning'] as const

export type CalloutVariant = (typeof CALLOUT_VARIANTS)[number]

export const CALLOUT_LABELS = {
    note: 'NOTE',
    tip: 'TIP',
    warning: 'WARNING',
} as const satisfies Record<CalloutVariant, string>

export const CALLOUT_MARKER_PATTERN = /^\s*\[!(NOTE|WARNING|TIP)\]\s*/i

export function getCalloutVariantFromText(
    value: string
): CalloutVariant | null {
    const marker = value.match(CALLOUT_MARKER_PATTERN)
    const variant = marker?.[1]?.toLowerCase()

    if (variant === 'note' || variant === 'tip' || variant === 'warning') {
        return variant
    }

    return null
}

export function getCalloutLabel(variant: CalloutVariant) {
    return CALLOUT_LABELS[variant]
}
