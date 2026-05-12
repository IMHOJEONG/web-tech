'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'light' | 'dark'

interface ThemeState {
    theme: Theme
    setTheme: (t: Theme) => void
}

function applyThemeToDocument(theme: Theme) {
    const root = document.documentElement

    if (theme === 'dark') {
        root.classList.add('dark')
        return
    }

    root.classList.remove('dark')
}

export const useThemeStore = create<ThemeState>()(
    persist(
        (set) => ({
            theme: 'light',

            setTheme: (t) => {
                set({ theme: t })
                applyThemeToDocument(t)
            },
        }),
        {
            name: 'theme-store',

            /**
             * 💡 persist가 localStorage에서 복원된 직후 호출
             * - head script가 이미 적용한 html class와 상태 동기화
             */
            onRehydrateStorage: () => (state) => {
                if (!state) return

                const isDark =
                    document.documentElement.classList.contains('dark')

                // html class 기준으로 store를 맞춤
                state.theme = isDark ? 'dark' : 'light'
            },
        }
    )
)
