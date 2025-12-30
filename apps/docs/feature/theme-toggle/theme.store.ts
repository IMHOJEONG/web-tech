'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'light' | 'dark'

interface ThemeState {
    theme: Theme
    setTheme: (t: Theme) => void
}

export const useThemeStore = create<ThemeState>()(
    persist(
        (set) => ({
            theme: 'light',

            setTheme: (t) => {
                set({ theme: t })

                // DOM 반영
                if (t === 'dark') {
                    document.documentElement.classList.add('dark')
                } else {
                    document.documentElement.classList.remove('dark')
                }
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
