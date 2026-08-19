---
name: Cyber-Ops Sentinel
colors:
  surface: "#111318"
  surface-dim: "#111318"
  surface-bright: "#37393e"
  surface-container-lowest: "#0c0e12"
  surface-container-low: "#1a1c20"
  surface-container: "#1e2024"
  surface-container-high: "#282a2e"
  surface-container-highest: "#333539"
  on-surface: "#e2e2e8"
  on-surface-variant: "#e8bcbb"
  inverse-surface: "#e2e2e8"
  inverse-on-surface: "#2f3035"
  outline: "#ae8787"
  outline-variant: "#5e3f3e"
  surface-tint: "#ffb3b3"
  primary: "#ffb3b3"
  on-primary: "#680014"
  primary-container: "#ff525f"
  on-primary-container: "#5b0011"
  inverse-primary: "#bf002e"
  secondary: "#ffd799"
  on-secondary: "#432c00"
  secondary-container: "#feb300"
  on-secondary-container: "#6a4800"
  tertiary: "#00e475"
  on-tertiary: "#003918"
  tertiary-container: "#00a754"
  on-tertiary-container: "#003114"
  error: "#ffb4ab"
  on-error: "#690005"
  error-container: "#93000a"
  on-error-container: "#ffdad6"
  primary-fixed: "#ffdad9"
  primary-fixed-dim: "#ffb3b3"
  on-primary-fixed: "#400009"
  on-primary-fixed-variant: "#920021"
  secondary-fixed: "#ffdeac"
  secondary-fixed-dim: "#ffba38"
  on-secondary-fixed: "#281900"
  on-secondary-fixed-variant: "#604100"
  tertiary-fixed: "#62ff96"
  tertiary-fixed-dim: "#00e475"
  on-tertiary-fixed: "#00210b"
  on-tertiary-fixed-variant: "#005226"
  background: "#111318"
  on-background: "#e2e2e8"
  surface-variant: "#333539"
typography:
  display-lg:
    fontFamily: Sora
    fontSize: 48px
    fontWeight: "700"
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Sora
    fontSize: 24px
    fontWeight: "600"
    lineHeight: 32px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: "400"
    lineHeight: 24px
  data-lg:
    fontFamily: JetBrains Mono
    fontSize: 32px
    fontWeight: "700"
    lineHeight: 40px
  data-sm:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: "500"
    lineHeight: 20px
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: "700"
    lineHeight: 16px
    letterSpacing: 0.1em
  headline-md-mobile:
    fontFamily: Sora
    fontSize: 20px
    fontWeight: "600"
    lineHeight: 28px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  xs: 8px
  sm: 16px
  md: 24px
  lg: 32px
  xl: 48px
  gutter: 20px
  margin-mobile: 16px
  margin-desktop: 32px
---

## Brand & Style

The design system is engineered for high-stakes cybersecurity monitoring, evoking a sense of mission-critical urgency and technical sophistication. The aesthetic is rooted in **Futuristic Modernism** with a heavy influence from tactical HUDs (Heads-Up Displays).

The target audience consists of Security Operations Center (SOC) analysts and threat hunters who require immediate visual prioritization of data. The emotional response is one of controlled intensity—calm, dark backgrounds provide a stable foundation, while vibrant, glowing accents draw the eye to critical anomalies. Visual motifs include semi-transparent layering, subtle "scan-line" textures, and high-precision monospaced typography that suggests a deep connection to the underlying machine code.

## Colors

The palette is built on a "True Dark" foundation to reduce eye strain during long shifts, using a primary background of `#0A0C10`.

- **Semantic Primaries:**
  - **Critical (Red):** `#FF1744` - Used for active exploits and severe vulnerabilities.
  - **High (Amber):** `#FFB300` - Used for elevated risks requiring attention.
  - **Low/Mitigated (Green):** `#00E676` - Indicates stable or resolved states.
  - **System (Blue):** `#2979FF` - Used for neutral data, navigation, and interactive UI elements.
- **Surface Strategy:** Layers are constructed with semi-transparent fills (80-90% opacity) to allow subtle background bleeding, enhancing the high-tech, "glass-panel" aesthetic.

## Typography

This design system utilizes a dual-purpose typographic approach. **Sora** is used for structural headlines to provide a modern, geometric feel. **Inter** handles standard body copy for maximum legibility.

Crucially, **JetBrains Mono** is the "voice of the machine," used for all technical data, CVE IDs, timestamps, and status labels. This monospaced font ensures that numeric data aligns perfectly in tables and dashboards, reinforcing the professional, developer-centric nature of the tool. Large data points (e.g., threat counts) should always use the `data-lg` role to emphasize their importance.

## Layout & Spacing

The layout follows a **Fluid Grid** model with high-density data requirements.

- **Grid:** A 12-column layout on desktop with 20px gutters. Elements should snap to a 4px base unit to maintain technical precision.
- **Rhythm:** Spacing between cards and modules should remain consistent at `lg` (32px) to prevent the UI from feeling cluttered despite high data density.
- **Responsive Behavior:** On mobile devices, the 12-column grid collapses to a 2-column layout. "Threat Streams" and "KEV Matrices" transition from side-by-side containers to a vertical stack. Side margins reduce to 16px to maximize screen real estate for data tables.

## Elevation & Depth

Depth is not communicated through traditional drop shadows, but through **Tonal Layering and Glows**.

1.  **Base Layer:** The darkest neutral (`#0A0C10`).
2.  **Container Layer:** Surfaces use `#12151C` with a 1px border.
3.  **Active Depth:** Critical containers use "Neon Glows"—a 1px inner border of the semantic color (e.g., Red) paired with an outer box-shadow of the same color at 15-20% opacity and a 12px blur.
4.  **Glassmorphism:** Overlays and dropdown menus use a backdrop-blur (10px to 20px) to maintain context of the data beneath them while appearing physically "above" the interface.

## Shapes

The shape language is disciplined and professional. We use a **Soft (0.25rem)** roundedness for standard buttons and input fields to prevent the UI from feeling overly aggressive. Large dashboard cards use `rounded-lg` (0.5rem) to slightly soften the technical edge. Status tags and "pill" indicators use `rounded-xl` (0.75rem) to differentiate them from functional buttons.

## Components

- **Buttons:** Primary buttons feature a subtle gradient fill or a solid ghost-style border. Interaction should trigger an "inner-glow" effect rather than a color shift.
- **Threat Chips:** Small, monospaced labels with a low-opacity background tint of the semantic color and a high-contrast 1px border.
- **Data Tables (KEV Matrix):** Rows should have a subtle hover state (`#FFFFFF` at 5% opacity). CVSS scores are visualized using horizontal progress bars with neon glows.
- **Inputs:** Dark backgrounds with a 1px `accent_blue` border on focus. Text cursor and selection should utilize the neon primary color.
- **Radar/HUD Elements:** Use circular progress rings and thin-line iconography to reinforce the "scanning" metaphor of the brand.
- **Navigation Dock:** A floating, semi-transparent footer dock with blurred background and monochromatic icons that light up in `accent_blue` when active.
