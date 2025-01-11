import presetTailwind from '@web-tech/ui/tailwind.config'

import type { Config } from 'tailwindcss'
import tailwindcssTypography from '@tailwindcss/typography'

const config = {
    presets: [presetTailwind],
    plugins: [...presetTailwind.plugins, tailwindcssTypography],
} satisfies Partial<Config>

export default config
