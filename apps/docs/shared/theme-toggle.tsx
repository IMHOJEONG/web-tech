'use client'

import { MdDarkMode, MdLightMode } from 'react-icons/md'
import { useThemeStore } from '~/feature/theme-toggle/theme.store'

export const ThemeToggle = () => {
    const { setTheme, theme } = useThemeStore()

    const handleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark')
    }

    if (theme === 'light') {
        return (
            <MdDarkMode
                className="text-lg size-[2rem]"
                onClick={() => setTheme('dark')}
            />
        )
    }

    return (
        <MdLightMode
            className="text-lg size-[2rem]"
            onClick={() => setTheme('light')}
        />
    )
}
