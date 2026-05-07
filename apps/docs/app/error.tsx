'use client'

import { ErrorBox } from '~/feature/error/error-box'

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    console.error(error)

    return (
        <ErrorBox
            eyebrow="불러오기 오류"
            title="문서를 가져오는 중에 문제가 생겼습니다"
            description="잠시 후 다시 시도해 주세요. 같은 문제가 계속되면 콘텐츠 서버 연결이나 접근 설정을 한 번 확인해보는 것이 좋습니다."
            primaryLabel="다시 시도"
            onPrimaryAction={reset}
            secondaryLabel="홈으로 이동"
            secondaryHref="/"
        />
    )
}
