/** @type {import('@shikijs/rehype').RehypeShikiOptions} */
export const shikiRehypeOptions = {
    themes: {
        light: 'github-dark',
        dark: 'github-dark',
    },
    transformers: [
        {
            name: 'preserve-code-language',
            code(node) {
                this.addClassToHast(node, `language-${this.options.lang}`)
            },
        },
    ],
}
