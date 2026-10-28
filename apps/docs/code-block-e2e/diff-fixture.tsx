import { createRoot } from 'react-dom/client'
import { NextIntlClientProvider } from 'next-intl'
import { components } from '../mdx-components'
import { RemoteCodeCopyEnhancer } from '../feature/code-block/ui/remote-code-copy-enhancer'

declare global {
    interface Window {
        diffFixture: { code: string; remoteHtml: string }
    }
}

const { code, remoteHtml } = window.diffFixture
const ArticlePre = components.pre

createRoot(document.getElementById('fixture')!).render(
    <NextIntlClientProvider locale="ko" messages={{}} timeZone="Asia/Seoul">
        <div className="mdx-wrapper">
            {['local', 'shiki'].map((source) => (
                <section data-testid={source} key={source}>
                    <ArticlePre
                        className={source === 'shiki' ? 'shiki' : undefined}
                        style={
                            source === 'shiki'
                                ? {
                                      backgroundColor: '#24292e',
                                      color: '#e1e4e8',
                                  }
                                : undefined
                        }
                    >
                        <code className="language-diff">
                            <span style={{ color: '#fff' }}>{code}</span>
                        </code>
                    </ArticlePre>
                </section>
            ))}
            <section
                data-testid="remote"
                dangerouslySetInnerHTML={{ __html: remoteHtml }}
            />
            <RemoteCodeCopyEnhancer />
        </div>
    </NextIntlClientProvider>
)
