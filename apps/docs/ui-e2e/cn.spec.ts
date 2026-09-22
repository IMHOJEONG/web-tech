import { expect, test } from '@playwright/test'
import { cn } from '@web-tech/ui/lib/utils'

// Captured from clsx + tailwind-merge before the dependency migration.
const cases: {
    name: string
    inputs: Parameters<typeof cn>
    expected: string
}[] = [
    {
        name: 'conditional inputs',
        inputs: [
            'flex',
            false,
            null,
            undefined,
            ['items-center', ['gap-2']],
            { hidden: false, block: true },
        ],
        expected: 'items-center gap-2 block',
    },
    { name: 'spacing override', inputs: ['px-2 py-1', 'p-4'], expected: 'p-4' },
    {
        name: 'directional spacing',
        inputs: ['p-4', 'px-2'],
        expected: 'p-4 px-2',
    },
    {
        name: 'size override',
        inputs: ['size-6', 'size-11'],
        expected: 'size-11',
    },
    {
        name: 'one dimension override',
        inputs: ['size-9', 'w-12'],
        expected: 'size-9 w-12',
    },
    {
        name: 'responsive',
        inputs: ['p-2 sm:p-4', 'sm:p-6'],
        expected: 'p-2 sm:p-6',
    },
    {
        name: 'dark mode',
        inputs: ['bg-white dark:bg-black', 'dark:bg-input/30'],
        expected: 'bg-white dark:bg-input/30',
    },
    {
        name: 'data attributes',
        inputs: ['data-[state=open]:bg-accent', 'data-[state=open]:bg-primary'],
        expected: 'data-[state=open]:bg-primary',
    },
    {
        name: 'important modifiers',
        inputs: ['p-2!', 'p-4!', 'p-6'],
        expected: 'p-4! p-6',
    },
    {
        name: 'arbitrary widths',
        inputs: ['w-[200px]', 'w-[85vw]'],
        expected: 'w-[85vw]',
    },
    {
        name: 'CSS variable width',
        inputs: ['w-(--sidebar-width)', 'w-full'],
        expected: 'w-full',
    },
    {
        name: 'SVG selector',
        inputs: [
            '[&_svg:not([class*=size-])]:size-4',
            '[&_svg:not([class*=size-])]:size-3',
        ],
        expected: '[&_svg:not([class*=size-])]:size-3',
    },
    {
        name: 'surface tokens',
        inputs: ['bg-background text-foreground', 'bg-popover text-on-surface'],
        expected: 'bg-popover text-on-surface',
    },
    {
        name: 'focus ring',
        inputs: [
            'focus-visible:ring-ring/50 focus-visible:ring-[3px]',
            'focus-visible:ring-2',
        ],
        expected: 'focus-visible:ring-ring/50 focus-visible:ring-2',
    },
    {
        name: 'non-Tailwind classes',
        inputs: ['prose docs-motion custom-layout', 'text-sm'],
        expected: 'prose docs-motion custom-layout text-sm',
    },
]

for (const { name, inputs, expected } of cases) {
    test(`cn compatibility: ${name}`, () => {
        expect(cn(...inputs)).toBe(expected)
    })
}
