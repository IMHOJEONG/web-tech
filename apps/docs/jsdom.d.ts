declare module 'jsdom' {
    export class JSDOM {
        constructor(input?: string)
        readonly window: Window & typeof globalThis
    }
}
