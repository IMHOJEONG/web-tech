import type { Locator } from '@playwright/test'

/** Measures solid CSS layers, including color-mix and the target's opacity. */
export async function solidContrast(locator: Locator, outline = false) {
    return locator.evaluate((element, measureOutline) => {
        type Color = [number, number, number, number]
        const context = document.createElement('canvas').getContext('2d')!
        const parse = (value: string): Color => {
            context.clearRect(0, 0, 1, 1)
            context.fillStyle = value
            context.fillRect(0, 0, 1, 1)
            return Array.from(context.getImageData(0, 0, 1, 1).data).map(
                (channel) => channel / 255
            ) as Color
        }
        const over = (top: Color, bottom: Color): Color =>
            [
                ...top
                    .slice(0, 3)
                    .map((v, i) => v * top[3] + bottom[i]! * (1 - top[3])),
                1,
            ] as Color
        const layers: Element[] = []
        for (let node = element.parentElement; node; node = node.parentElement)
            layers.unshift(node)
        let backdrop: Color = [1, 1, 1, 1]
        for (const node of layers) {
            const style = getComputedStyle(node)
            if (style.backgroundImage !== 'none' || Number(style.opacity) !== 1)
                throw new Error(
                    'Solid contrast requires non-gradient, opaque ancestors'
                )
            backdrop = over(parse(style.backgroundColor), backdrop)
        }
        const style = getComputedStyle(element)
        if (style.backgroundImage !== 'none')
            throw new Error('Solid contrast cannot measure a gradient')
        const opacity = Number(style.opacity)
        const group = (color: Color) =>
            over([color[0], color[1], color[2], opacity], backdrop)
        const surface = over(parse(style.backgroundColor), backdrop)
        const background = measureOutline ? backdrop : group(surface)
        const foreground = group(
            measureOutline
                ? over(parse(style.outlineColor), backdrop)
                : over(parse(style.color), surface)
        )
        const luminance = (color: Color) =>
            color
                .slice(0, 3)
                .reduce(
                    (sum, v, i) =>
                        sum +
                        (v <= 0.04045
                            ? v / 12.92
                            : ((v + 0.055) / 1.055) ** 2.4) *
                            [0.2126, 0.7152, 0.0722][i]!,
                    0
                )
        const [a, b] = [luminance(foreground), luminance(background)].sort(
            (a, b) => b - a
        )
        return {
            ratio: (a! + 0.05) / (b! + 0.05),
            color: style.color,
            backgroundColor: style.backgroundColor,
            opacity,
            outlineColor: style.outlineColor,
            outlineStyle: style.outlineStyle,
            outlineWidth: style.outlineWidth,
            outlineOffset: style.outlineOffset,
        }
    }, outline)
}
