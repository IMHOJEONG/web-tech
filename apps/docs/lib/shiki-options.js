/** @type {import('@shikijs/rehype').RehypeShikiOptions} */
export const shikiRehypeOptions = {
    themes: {
        light: 'github-dark',
        dark: 'github-dark',
    },
}

// Turbopack loader options must stay serializable; callbacks are runtime-only.
/** @type {import('@shikijs/rehype').RehypeShikiOptions} */
export const runtimeShikiRehypeOptions = {
    ...shikiRehypeOptions,
    transformers: [
        {
            name: 'preserve-code-language',
            code(node) {
                this.addClassToHast(node, `language-${this.options.lang}`)
            },
        },
    ],
}
