---
name: Technical Precision System
colors:
    surface: '#111319'
    surface-dim: '#111319'
    surface-bright: '#373940'
    surface-container-lowest: '#0c0e14'
    surface-container-low: '#191b22'
    surface-container: '#1e1f26'
    surface-container-high: '#282a30'
    surface-container-highest: '#33343b'
    on-surface: '#e2e2eb'
    on-surface-variant: '#b9caca'
    inverse-surface: '#e2e2eb'
    inverse-on-surface: '#2e3037'
    outline: '#849495'
    outline-variant: '#3a494a'
    surface-tint: '#00dce5'
    primary: '#e9feff'
    on-primary: '#003739'
    primary-container: '#00f5ff'
    on-primary-container: '#006c71'
    inverse-primary: '#00696e'
    secondary: '#ddb7ff'
    on-secondary: '#490080'
    secondary-container: '#6f00be'
    on-secondary-container: '#d6a9ff'
    tertiary: '#fafaff'
    on-tertiary: '#263143'
    tertiary-container: '#d3def6'
    on-tertiary-container: '#576276'
    error: '#ffb4ab'
    on-error: '#690005'
    error-container: '#93000a'
    on-error-container: '#ffdad6'
    primary-fixed: '#63f7ff'
    primary-fixed-dim: '#00dce5'
    on-primary-fixed: '#002021'
    on-primary-fixed-variant: '#004f53'
    secondary-fixed: '#f0dbff'
    secondary-fixed-dim: '#ddb7ff'
    on-secondary-fixed: '#2c0051'
    on-secondary-fixed-variant: '#6900b3'
    tertiary-fixed: '#d8e3fb'
    tertiary-fixed-dim: '#bcc7de'
    on-tertiary-fixed: '#111c2d'
    on-tertiary-fixed-variant: '#3c475a'
    background: '#111319'
    on-background: '#e2e2eb'
    surface-variant: '#33343b'
typography:
    headline-xl:
        fontFamily: Space Grotesk
        fontSize: 48px
        fontWeight: '700'
        lineHeight: '1.1'
        letterSpacing: -0.02em
    headline-lg:
        fontFamily: Space Grotesk
        fontSize: 32px
        fontWeight: '600'
        lineHeight: '1.2'
    headline-md:
        fontFamily: Space Grotesk
        fontSize: 24px
        fontWeight: '600'
        lineHeight: '1.3'
    body-lg:
        fontFamily: Inter
        fontSize: 18px
        fontWeight: '400'
        lineHeight: '1.6'
    body-md:
        fontFamily: Inter
        fontSize: 16px
        fontWeight: '400'
        lineHeight: '1.6'
    label-md:
        fontFamily: Space Grotesk
        fontSize: 14px
        fontWeight: '500'
        lineHeight: '1'
        letterSpacing: 0.05em
    code-md:
        fontFamily: monospace
        fontSize: 14px
        fontWeight: '400'
        lineHeight: '1.5'
rounded:
    sm: 0.125rem
    DEFAULT: 0.25rem
    md: 0.375rem
    lg: 0.5rem
    xl: 0.75rem
    full: 9999px
spacing:
    base: 8px
    xs: 4px
    sm: 12px
    md: 24px
    lg: 48px
    xl: 80px
    container-max: 1280px
    gutter: 24px
---

## Brand & Style

This design system is engineered for the modern technologist. It evokes the feeling of a premium IDE or a high-end command-line interface, blending high-density information with sophisticated aesthetics. The brand personality is authoritative, precise, and forward-thinking.

The visual style follows a **Modern-Technical** approach. It utilizes a dark-mode-first philosophy where depth is created through tonal layering rather than heavy shadows. Elements of **Minimalism** ensure focus on technical content, while subtle **Glassmorphism** and neon accents provide a "high-tech" veneer that distinguishes the interface from standard corporate blogs. The target audience—developers and designers—will find the UI familiar yet elevated, mirroring the tools they use daily.

## Colors

The palette is anchored in **Deep Charcoal (#0A0C12)** and **Midnight Navy (#111721)** to reduce eye strain during long-form reading.

- **Primary (Neon Cyan):** Used for primary actions, terminal prompts, and critical syntax highlighting. It provides a high-contrast focal point against the dark base.
- **Secondary (Electric Purple):** Reserved for secondary call-outs, category tags (e.g., "Mobile"), and interactive hover states.
- **Surface Tiers:** Backgrounds use a tiered system of dark greys to establish hierarchy. The base is the darkest, with "elevated" surfaces moving toward a lighter charcoal (#1E293B).
- **Accents:** Functional colors for success, error, and warning should be muted but distinct, following the neon-adjacent aesthetic (e.g., a "matrix" green for success).

## Typography

This design system uses a dual-font strategy to balance character with utility.

**Space Grotesk** is the primary typeface for headlines and labels. Its geometric, technical quirks provide a futuristic, developer-centric feel. Headlines should use tighter letter-spacing to appear more architectural.

**Inter** is the workhorse for all body copy and UI elements. Its neutrality and high legibility at small sizes ensure that complex technical tutorials remain readable.

For code snippets and technical metadata, use a high-quality monospaced font. Ensure syntax highlighting themes are customized to match the system’s neon cyan and purple accents.

## Layout & Spacing

The layout is built on a **12-column fluid grid** that snaps to a fixed maximum width of 1280px for desktop viewing.

- **Rhythm:** An 8px linear scale governs all padding and margins, ensuring mathematical consistency across the UI.
- **Article Layout:** Long-form content should be constrained to an 8-column central track (approx. 720px) to maintain an optimal line length for readability.
- **Sidebars:** Use a 4-column secondary track for technical metadata, table of contents, and "related docs."
- **Density:** The UI should lean toward high density in technical areas (like code documentation) and generous whitespace in editorial sections.

## Elevation & Depth

Depth in this design system is primarily communicated through **Tonal Layering** and **Subtle Glows** rather than traditional drop shadows.

1.  **L0 (Base):** The primary background color.
2.  **L1 (Cards/Sections):** A slightly lighter charcoal with a 1px low-contrast border (#ffffff10).
3.  **L2 (Popovers/Modals):** Use a backdrop-blur (12px) with a semi-transparent fill to create a glassmorphic effect.

To denote interactivity or "active" states, apply a subtle **Outer Glow** using the primary cyan color with a high spread and very low opacity (10-15%). This mimics the appearance of a backlit console or glowing hardware.

## Shapes

The shape language is disciplined and geometric. A **Soft (0.25rem)** base roundedness is applied to buttons and input fields to maintain a professional, crisp edge.

- **Containers:** Larger components like cards use `rounded-lg` (0.5rem) to provide a modern feel without appearing "bubbly."
- **Interactive Elements:** Buttons and tags utilize the same 4px radius for consistency.
- **Accents:** Use hard 45-degree chamfered corners occasionally on decorative elements (like article header badges) to lean into the technical/cyberpunk aesthetic.

## Components

- **Buttons:** Primary buttons feature a solid Cyan fill with dark text. Secondary buttons use a ghost style: a 1px Cyan border with a subtle hover glow.
- **Code Blocks:** Encased in a deep black container with a "Copy" button appearing on hover. Include a header bar indicating the language (e.g., TS, Rust) in Space Grotesk.
- **Chips/Tags:** Small, uppercase labels with a low-opacity Purple background and solid Purple text. Used for "Web," "Mobile," or "UI/UX" categories.
- **Input Fields:** Darker than the card background, using a subtle Cyan bottom-border that expands to the full perimeter on focus.
- **Cards:** Border-only cards (no shadow) are preferred. On hover, the border color transitions from muted grey to the primary Cyan.
- **Progress Bars:** Thin (2px or 4px) neon lines used at the top of the viewport to indicate reading progress or at the top of cards for "completion status" in tutorials.
