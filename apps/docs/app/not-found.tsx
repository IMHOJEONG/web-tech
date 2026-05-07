import { Suspense } from 'react'
import { ErrorBox } from '~/feature/error/error-box'

export default function Page() {
    return (
        <Suspense>
            <ErrorBox
                eyebrow="페이지를 찾을 수 없음"
                title="요청한 문서를 찾지 못했습니다"
                description="문서가 삭제되었거나 주소가 바뀌었을 수 있습니다. 피드나 문서 인덱스에서 다시 찾아보세요."
                secondaryLabel="피드로 이동"
                secondaryHref="/feed"
            />
        </Suspense>
    )
}
