'use client'

import { MdDarkMode, MdLightMode } from 'react-icons/md'
import { useThemeStore } from '~/feature/theme-toggle/theme.store'

export const ThemeToggle = () => {
    const { setTheme, theme } = useThemeStore()

    if (theme === 'light') {
        return (
            <button
                type="button"
                className="flex size-5 items-center justify-center text-zinc-400 transition-colors hover:text-zinc-200"
                onClick={() => setTheme('dark')}
                aria-label="Switch to dark mode"
            >
                <MdDarkMode className="size-5" />
            </button>
        )
    }

    return (
        <button
            type="button"
            className="flex size-5 items-center justify-center text-zinc-400 transition-colors hover:text-zinc-200"
            onClick={() => setTheme('light')}
            aria-label="Switch to light mode"
        >
            <MdLightMode className="size-5" />
        </button>
    )
}
