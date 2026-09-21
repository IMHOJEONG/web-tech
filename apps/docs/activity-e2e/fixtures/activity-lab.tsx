import {
    Activity,
    StrictMode,
    useEffect,
    useRef,
    useState,
    version,
} from 'react'
import { createRoot } from 'react-dom/client'
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetTitle,
    SheetTrigger,
} from '@web-tech/ui/components/sheet'

type Event = { name: string; focus: string; time: number }

declare global {
    interface Window {
        activityLab: { events: Event[]; react: string }
    }
}

window.activityLab = { events: [], react: version }
const params = new URLSearchParams(location.search)
const policy = params.get('policy') ?? 'default'

function record(name: string) {
    window.activityLab.events.push({
        name,
        focus:
            document.activeElement?.id || document.activeElement?.tagName || '',
        time: performance.now(),
    })
}

document.addEventListener('focusin', () => record('focusin'))

function Pane({ children }: { children: React.ReactNode }) {
    const [count, setCount] = useState(0)
    useEffect(() => {
        record('effect:setup')
        return () => {
            record('effect:cleanup')
            // Intentionally unsafe control case, not production guidance.
            if (policy === 'cleanup-focus') {
                document.getElementById('old-trigger')?.focus()
                record('cleanup:focus')
            }
        }
    }, [])

    return (
        <section id="pane">
            <h2>보존할 화면</h2>
            <label htmlFor="draft">초안</label>
            <input id="draft" defaultValue="" />
            <button id="count" onClick={() => setCount(count + 1)}>
                count: {count}
            </button>
            {children}
        </section>
    )
}

function App() {
    const [visible, setVisible] = useState(true)
    const [mounted, setMounted] = useState(true)
    const [open, setOpen] = useState(false)
    const visibleRef = useRef(true)

    function toggle() {
        visibleRef.current = !visibleRef.current
        if (
            !visibleRef.current &&
            (policy === 'guarded' || policy === 'isolated')
        )
            setOpen(false)
        record(visibleRef.current ? 'request:show' : 'request:hide')
        setVisible(visibleRef.current)
    }

    const content = (
        <SheetContent
            id="dialog-content"
            showCloseButton={policy === 'no-close' ? false : undefined}
            onCloseAutoFocus={(event) => {
                record('dialog:close-auto-focus')
                if (
                    (policy === 'guarded' || policy === 'isolated') &&
                    !visibleRef.current
                ) {
                    event.preventDefault()
                    document.getElementById('toggle')?.focus()
                    record('dialog:fallback-focus')
                }
            }}
        >
            <SheetTitle>문서 편집</SheetTitle>
            <SheetDescription>닫기와 화면 숨김을 비교합니다.</SheetDescription>
            <label htmlFor="dialog-input">제목</label>
            <input id="dialog-input" />
            <SheetClose id="close">취소</SheetClose>
            <button id="leave-view" onClick={toggle}>
                다른 화면으로 이동
            </button>
        </SheetContent>
    )
    const trigger = <SheetTrigger id="dialog-trigger">편집 열기</SheetTrigger>
    const pane = mounted && (
        <Activity mode={visible ? 'visible' : 'hidden'}>
            <Pane>
                {policy === 'isolated' ? (
                    trigger
                ) : (
                    <Sheet open={open} onOpenChange={setOpen}>
                        {trigger}
                        {content}
                    </Sheet>
                )}
            </Pane>
        </Activity>
    )

    return (
        <main>
            <h1>Activity 포커스 실험</h1>
            <button id="old-trigger">이전 작업</button>
            <button id="toggle" onClick={toggle}>
                화면 전환
            </button>
            <button id="mount" onClick={() => setMounted(!mounted)}>
                실제 mount 전환
            </button>
            <output id="state">
                {String(visible)} / {String(open)}
            </output>
            {policy === 'isolated' ? (
                <Sheet open={open} onOpenChange={setOpen}>
                    {pane}
                    {content}
                </Sheet>
            ) : (
                pane
            )}
        </main>
    )
}

const root = createRoot(document.getElementById('root')!)
root.render(
    params.get('strict') === 'true' ? (
        <StrictMode>
            <App />
        </StrictMode>
    ) : (
        <App />
    )
)
