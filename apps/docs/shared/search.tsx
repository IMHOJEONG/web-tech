'use client'

import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useRouter, useSearchParams } from 'next/navigation'
import { ChangeEvent, KeyboardEvent, useRef } from 'react'
import { GoSearch } from 'react-icons/go'

// title, summary 검색 내용 추가 필요
export const Search = () => {
    const router = useRouter()
    const searchParams = useSearchParams()

    const inputRef = useRef<HTMLInputElement>(null)

    return (
        <div
            className={cn('relative max-w-[500px] flex gap-2', 'items-center')}
        >
            <GoSearch
                className="cursor-pointer"
                onClick={() => {
                    inputRef.current?.focus()
                }}
            />
            <Input
                ref={inputRef}
                className={cn(
                    'dark:text-[var(--hf-text-primary)] placeholder:text-[var(--hf-text-primary)]',
                    'text-[var(--hf-text-primary)] placeholder:text-[var(--hf-text-primary)]'
                )}
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
                placeholder="search document..."
            />
        </div>
    )
}
