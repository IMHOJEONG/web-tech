export const CODE_COLLAPSE_THRESHOLD = 20
export const CODE_PREVIEW_LINES = 10

export function getCodeDisclosure(code: string) {
    const lines = code.replace(/\r\n?/g, '\n').replace(/\n$/, '').split('\n')
    const lineCount = code.trim() ? lines.length : 0

    return {
        lineCount,
        collapsible: lineCount > CODE_COLLAPSE_THRESHOLD,
        preview: lines.slice(0, CODE_PREVIEW_LINES).join('\n'),
    }
}

export function getCodeDisclosureSummary(lineCount: number) {
    const count = Math.max(0, Math.trunc(lineCount))
    return `<span data-code-locale="ko"><span class="mdx-code-disclosure__closed">전체 코드 보기</span><span class="mdx-code-disclosure__open">코드 접기</span> <small><span class="mdx-code-disclosure__closed">${CODE_PREVIEW_LINES} / </span>${count}줄</small></span><span data-code-locale="en"><span class="mdx-code-disclosure__closed">Show full code</span><span class="mdx-code-disclosure__open">Collapse code</span> <small><span class="mdx-code-disclosure__closed">${CODE_PREVIEW_LINES} / </span>${count} lines</small></span>`
}
