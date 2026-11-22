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
    const [isComposing, setIsComposing] = useState(false)
    const finishComposition = (value = keyword) => {
        composing.current = false
        setIsComposing(false)
        setKeyword(limitSearchInput(value))
    }

    return {
        keyword,
        setKeyword,
        composing,
        isComposing,
        finishComposition,
        inputProps: {
            value: keyword,
            autoCorrect: 'off',
            autoCapitalize: 'none',
            spellCheck: false,
            enterKeyHint: 'search' as const,
            onChange: (event: ChangeEvent<HTMLInputElement>) => {
                const value = event.currentTarget.value
                setKeyword(composing.current ? value : limitSearchInput(value))
            },
            onCompositionStart: () => {
                composing.current = true
                setIsComposing(true)
            },
            onCompositionEnd: (event: CompositionEvent<HTMLInputElement>) => {
                finishComposition(event.currentTarget.value)
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
