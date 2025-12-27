import { Suspense } from 'react'
import { ErrorBox } from '~/feature/error/error-box'

export default function Page() {
    return (
        <Suspense>
            <ErrorBox />
        </Suspense>
    )
}
