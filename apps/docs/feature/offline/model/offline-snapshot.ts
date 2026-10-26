import type { OfflineSnapshot } from './offline-client.ts'
import { isOfflineInputWithinBudget } from './offline-input-budget.ts'

const tags = new Set(
    'p article section div span h1 h2 h3 h4 h5 h6 ul ol li pre code strong em b i u s del blockquote aside br hr table thead tbody tfoot tr th td figure figcaption a details summary small sub sup'.split(
        ' '
    )
)
const discard = new Set([
    'SCRIPT',
    'STYLE',
    'IFRAME',
    'OBJECT',
    'EMBED',
    'SVG',
    'MATH',
    'TEMPLATE',
    'BUTTON',
    'FORM',
    'INPUT',
    'TEXTAREA',
    'SELECT',
])
const escapeText = (value: string) =>
    value.replace(
        /[&<>"']/g,
        (character) =>
            ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;',
            })[character]!
    )

async function imageData(image: HTMLImageElement): Promise<string | null> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 2500)
    let reader: ReadableStreamDefaultReader<Uint8Array> | undefined
    try {
        const url = new URL(image.currentSrc || image.src, location.href)
        if (
            url.origin !== location.origin ||
            !/^\/(?:_next\/image|diagrams\/|image\/)/.test(url.pathname)
        )
            return null
        const response = await fetch(url, {
            credentials: 'omit',
            referrerPolicy: 'no-referrer',
            signal: controller.signal,
        })
        const mime = response.headers.get('content-type')?.split(';')[0]
        if (
            !response.ok ||
            !mime ||
            !['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(
                mime
            )
        )
            return null
        reader = response.body?.getReader()
        if (!reader) return null
        const chunks: Uint8Array<ArrayBuffer>[] = []
        let size = 0
        for (;;) {
            const chunk = await reader.read()
            if (chunk.done) break
            size += chunk.value.length
            if (size > 256 * 1024) return null
            chunks.push(new Uint8Array(chunk.value))
        }
        return await new Promise<string>((resolve, reject) => {
            const file = new FileReader()
            file.onload = () => resolve(String(file.result))
            file.onerror = () => reject(new Error('image'))
            file.readAsDataURL(new Blob(chunks, { type: mime }))
        })
    } catch {
        return null
    } finally {
        clearTimeout(timer)
        controller.abort()
        void reader?.cancel().catch(() => {})
    }
}

export async function buildOfflineSnapshot(
    root: HTMLElement,
    metadata: Pick<OfflineSnapshot, 'path' | 'title' | 'locale'>
): Promise<OfflineSnapshot> {
    if (root.querySelector('[data-offline-loading]')) throw new Error('loading')
    if (
        !root.textContent?.trim() ||
        !isOfflineInputWithinBudget(root.innerHTML)
    )
        throw new Error('size')
    let missingImages = 0
    let imageCount = 0
    const render = async (node: Node): Promise<string> => {
        if (node.nodeType === Node.TEXT_NODE)
            return escapeText(node.textContent || '')
        if (!(node instanceof HTMLElement) || discard.has(node.tagName))
            return ''
        if (node instanceof HTMLImageElement) {
            const data = imageCount++ < 5 ? await imageData(node) : null
            if (data)
                return `<img src="${escapeText(data)}" alt="${escapeText(node.alt)}">`
            missingImages++
            return `<p class="offline-image-missing">${metadata.locale === 'en' ? 'Image not saved' : '저장되지 않은 이미지'}: ${escapeText(node.alt)}</p>`
        }
        const children = (
            await Promise.all(Array.from(node.childNodes, render))
        ).join('')
        const tag = node.tagName.toLowerCase()
        if (!tags.has(tag)) return children
        const attributes: string[] = []
        for (const name of [
            'class',
            'id',
            'colspan',
            'rowspan',
            'scope',
            'data-code-locale',
        ]) {
            const value = node.getAttribute(name)
            if (value) attributes.push(`${name}="${escapeText(value)}"`)
        }
        if (tag === 'a') {
            try {
                const href = node.getAttribute('href') || ''
                const link = new URL(href, location.href)
                if (href.startsWith('#')) {
                    attributes.push(`href="${escapeText(href)}"`)
                } else if (
                    ['https:', 'http:', 'mailto:'].includes(link.protocol) &&
                    !link.username &&
                    !link.password
                ) {
                    link.search = ''
                    attributes.push(
                        `href="${escapeText(link.href)}"`,
                        'rel="noopener noreferrer"'
                    )
                }
            } catch {
                /* Preserve text, not executable URLs. */
            }
        }
        if (tag === 'details' && node.hasAttribute('open'))
            attributes.push('open')
        return `<${tag}${attributes.length ? ' ' + attributes.join(' ') : ''}>${children}${['br', 'hr'].includes(tag) ? '' : `</${tag}>`}`
    }
    const body = (await Promise.all(Array.from(root.childNodes, render))).join(
        ''
    )
    if (!body.trim()) throw new Error('snapshot')
    return { ...metadata, body, missingImages }
}
