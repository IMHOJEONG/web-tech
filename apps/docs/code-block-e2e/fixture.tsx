import { createRoot } from 'react-dom/client'
import { CodeBlockFrame } from '../feature/code-block/ui/code-block-frame'
import { RemoteCodeCopyEnhancer } from '../feature/code-block/ui/remote-code-copy-enhancer'

declare global {
    interface Window {
        codeFixture: { code: string; remoteHtml: string }
        copiedCode?: string
        codeCopyFails?: boolean
    }
}

const { code, remoteHtml } = window.codeFixture
createRoot(document.getElementById('fixture')!).render(
    <div className="mdx-wrapper">
        <section data-testid="local">
            <CodeBlockFrame code={code} language="TS">
                <pre className="mdx-code-block">
                    <code>{code}</code>
                </pre>
            </CodeBlockFrame>
        </section>
        <section data-testid="shiki">
            <CodeBlockFrame code={code} language="TS">
                <pre className="shiki">
                    <code>{code}</code>
                </pre>
            </CodeBlockFrame>
        </section>
        <section
            data-testid="remote"
            dangerouslySetInnerHTML={{ __html: remoteHtml }}
        />
        <RemoteCodeCopyEnhancer />
    </div>
)
