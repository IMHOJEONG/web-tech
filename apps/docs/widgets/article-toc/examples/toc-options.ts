import type Toc from '../ui/toc'

type GuideOptions = Omit<Parameters<typeof Toc>[0], 'toc' | 'title'>

export const desktopTocOptions = {
    maxDepth: 4,
    skipLevels: [1],
    indented: true,
    defaultOpen: true,
    closeOnNavigate: false,
} satisfies GuideOptions

export const mobileTocOptions = {
    ...desktopTocOptions,
    defaultOpen: false,
    closeOnNavigate: true,
} satisfies GuideOptions
