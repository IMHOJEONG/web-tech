'use client'

import { Input } from '@/components/ui/input'
import { useRouter, useSearchParams } from 'next/navigation'
import { ChangeEvent, KeyboardEvent } from 'react'

// title, summary 검색 내용 추가 필요
export const Search = () => {
    const router = useRouter()
    const searchParams = useSearchParams()

    return (
        <div className="max-w-[500px]">
            <Input
                onChange={(event: ChangeEvent<HTMLInputElement>) => {}}
                // 조합 확정용?
                onKeyDown={async (event: KeyboardEvent<HTMLInputElement>) => {
                    if (
                        event.key === 'Enter' &&
                        !event.nativeEvent.isComposing
                    ) {
                        const keyword = event.currentTarget.value.trim()
                        if (!keyword) {
                            router.push(`/docs`)
                            return
                        }

                        const params = new URLSearchParams(
                            searchParams.toString()
                        )
                        params.set('q', keyword)

                        router.push(`/docs?${params.toString()}`)
                    }
                }}
                maxLength={10}
                minLength={1}
            />
        </div>
    )
}
