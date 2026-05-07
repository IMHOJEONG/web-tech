'use client'

import { ErrorBox } from '~/feature/error/error-box'

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    console.error(error)

    return (
        <html lang="ko">
            <body className="min-h-screen bg-(--hf-surface)">
                <ErrorBox
                    title="애플리케이션 전역 오류가 발생했습니다"
                    description="현재 화면을 정상적으로 렌더링하지 못했습니다. 다시 시도하거나 홈으로 이동해 흐름을 다시 시작해주세요."
                    primaryLabel="다시 시도"
                    onPrimaryAction={reset}
                    secondaryLabel="홈으로 이동"
                    secondaryHref="/"
                />
            </body>
        </html>
    )
}
