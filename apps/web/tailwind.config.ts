import presetTailwind from "@web-tech/ui/tailwind.config";

import type { Config } from "tailwindcss";

const config = {
  presets: [presetTailwind],
  plugins: [...presetTailwind.plugins],
} satisfies Partial<Config>;

export default config;
