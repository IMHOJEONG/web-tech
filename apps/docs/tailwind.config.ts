import presetTailwind from '@web-tech/ui/tailwind.config'

import tailwindcssTypography from '@tailwindcss/typography'
import type { Config } from 'tailwindcss'

const config = {
    presets: [presetTailwind],
    plugins: [...presetTailwind.plugins, tailwindcssTypography],
} satisfies Partial<Config>

export default config
