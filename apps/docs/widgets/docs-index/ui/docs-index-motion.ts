import type { CSSProperties } from 'react'

type MotionOrderStyle = CSSProperties & { '--motion-order': number }

export function getMotionOrderStyle(index: number): MotionOrderStyle {
    return { '--motion-order': index }
}
