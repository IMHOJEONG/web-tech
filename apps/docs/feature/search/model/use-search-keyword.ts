'use client'

import {
    useRef,
    useState,
    type ChangeEvent,
    type CompositionEvent,
} from 'react'
import {
    limitSearchInput,
    normalizeSearchQuery,
} from '~/shared/lib/search-query'

export function useSearchKeyword(initialValue = '') {
    const [keyword, setKeyword] = useState(normalizeSearchQuery(initialValue))
    const composing = useRef(false)

    return {
        keyword,
        setKeyword,
        composing,
        inputProps: {
            value: keyword,
            onChange: (event: ChangeEvent<HTMLInputElement>) => {
                const value = event.currentTarget.value
                setKeyword(composing.current ? value : limitSearchInput(value))
            },
            onCompositionStart: () => {
                composing.current = true
            },
            onCompositionEnd: (event: CompositionEvent<HTMLInputElement>) => {
                composing.current = false
                setKeyword(limitSearchInput(event.currentTarget.value))
            },
            onKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => {
                if (
                    event.key === 'Enter' &&
                    (composing.current ||
                        event.nativeEvent.isComposing ||
                        event.keyCode === 229)
                ) {
                    event.preventDefault()
                }
            },
        },
    }
}
