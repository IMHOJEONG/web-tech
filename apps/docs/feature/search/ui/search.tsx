'use client'

import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useRouter, useSearchParams } from 'next/navigation'
import { ChangeEvent, KeyboardEvent, useRef } from 'react'
import { GoSearch } from 'react-icons/go'

export const Search = () => {
    const router = useRouter()
    const searchParams = useSearchParams()
    const inputRef = useRef<HTMLInputElement>(null)

    return (
        <div
            className={cn(
                'group flex items-center gap-2 text-zinc-400 transition-colors hover:text-zinc-200 focus-within:text-cyan-400'
            )}
        >
            <button
                type="button"
                className="flex size-5 items-center justify-center"
                onClick={() => {
                    requestAnimationFrame(() => {
                        inputRef.current?.focus()
                    })
                }}
                aria-label="Search documents"
            >
                <GoSearch className="size-5" />
            </button>
            <Input
                ref={inputRef}
                className={cn(
                    'h-8 w-0 border-0 border-b border-b-transparent bg-transparent px-0 py-0 text-sm text-zinc-100 opacity-0 shadow-none transition-all duration-200 placeholder:text-zinc-500 group-focus-within:w-36 group-focus-within:border-b-cyan-400/70 group-focus-within:px-1.5 group-focus-within:opacity-100 focus-visible:ring-0 focus-visible:ring-offset-0'
                )}
                onChange={(event: ChangeEvent<HTMLInputElement>) => {}}
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
                placeholder="Search docs"
            />
        </div>
    )
}
