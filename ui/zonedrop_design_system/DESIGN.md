---
name: ZoneDrop Design System
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#45464c'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#575e70'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#151b2b'
  on-primary-container: '#7d8497'
  inverse-primary: '#c0c6db'
  secondary: '#0058be'
  on-secondary: '#ffffff'
  secondary-container: '#2170e4'
  on-secondary-container: '#fefcff'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#001f26'
  on-tertiary-container: '#0090a9'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dce2f8'
  primary-fixed-dim: '#c0c6db'
  on-primary-fixed: '#151b2b'
  on-primary-fixed-variant: '#404758'
  secondary-fixed: '#d8e2ff'
  secondary-fixed-dim: '#adc6ff'
  on-secondary-fixed: '#001a42'
  on-secondary-fixed-variant: '#004395'
  tertiary-fixed: '#acedff'
  tertiary-fixed-dim: '#4cd7f6'
  on-tertiary-fixed: '#001f26'
  on-tertiary-fixed-variant: '#004e5c'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-lg:
    fontFamily: Geist
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: Geist
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Geist
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  mono-data:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  container-padding: 24px
  gutter: 16px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style
The design system is engineered for a high-performance logistics SaaS environment, blending the precision of data-heavy enterprise tools with the fluidity of modern consumer technology. It adopts a **Corporate / Modern** aesthetic with a strong emphasis on functional minimalism. 

The visual narrative is built around "Logistics Intelligence"—evoking feelings of speed, surgical reliability, and systemic order. High-density information is balanced by generous whitespace and a clear visual hierarchy. Design elements should feel technical yet accessible, utilizing map-inspired motifs such as subtle grid overlays and directional paths to reinforce the delivery ecosystem context.

## Colors
The palette is rooted in **Deep Navy (#0B1221)**, providing a stable, trustworthy foundation for the B2B context. 

- **Primary (Deep Navy):** Used for navigation, headers, and high-level structural elements.
- **Action (Electric Blue):** Reserved for primary calls-to-action and interactive states.
- **Tracking (Cyan/Teal):** Dedicated to active logistics flows, route progress, and "in-transit" statuses.
- **Semantic (Green/Orange/Red):** Standardized indicators for successful deliveries, delays, and critical system alerts.

Surface colors should prioritize a clean white background with subtle off-white (`#F8FAFC`) fills for dashboard containers to separate them from the base canvas.

## Typography
This design system utilizes **Geist** for its technical precision and exceptional legibility in data-dense layouts. The font's geometric construction reflects the "Intelligence" aspect of the brand.

For specific logistics data—such as tracking numbers, coordinates, and timestamps—a secondary monospaced font (**JetBrains Mono**) is recommended to ensure character distinction and alignment in tables. 

**Mobile Scaling:** Headlines above 32px should scale down to 24px (headline-md) on mobile devices to maintain readability without excessive horizontal scrolling.

## Layout & Spacing
The layout follows a **12-column fluid grid** for desktop and a **4-column grid** for mobile. Spacing is strictly based on a **4px baseline grid** to ensure mathematical harmony.

- **Margins:** 24px on desktop; 16px on mobile.
- **Gutters:** 16px consistently to maximize information density while maintaining breathability.
- **Data Tables:** Use compact vertical padding (8px or 12px) to allow more rows to be visible above the fold.
- **Dashboards:** Group related metrics into cards. Use a 24px gap between card components to define distinct functional areas.

## Elevation & Depth
Elevation is conveyed through **tonal layering** and **ambient shadows**. This system avoids heavy gradients, favoring a "flat-plus" approach.

- **Level 0 (Canvas):** Background color (`#F8FAFC`).
- **Level 1 (Cards/Surface):** White background with a 1px border (`#E2E8F0`).
- **Level 2 (Interactive):** Used for hovered cards or dropdowns. Apply an extra-diffused shadow: `0px 4px 20px rgba(11, 18, 33, 0.05)`.
- **Level 3 (Modals):** High-depth shadow to pull elements toward the user: `0px 12px 48px rgba(11, 18, 33, 0.12)`.

Map elements should appear to sit "underneath" the UI chrome, using the Level 0 background context.

## Shapes
The design system employs a **Rounded (2)** shape language to soften the industrial nature of logistics. 

- **Standard Elements:** Buttons, input fields, and small widgets use `0.5rem` (8px).
- **Container Elements:** Dashboard cards and large modals use `rounded-lg` (1rem / 16px) to create a premium, modern feel.
- **Status Indicators:** Chips and badges use a full pill-shape (999px) to distinguish them from interactive buttons.

## Components
- **Buttons:** Primary buttons use a solid Electric Blue fill with white text. Secondary buttons use a Deep Navy ghost style (border only) for less urgent actions.
- **Status Chips:** Use a subtle background tint (10% opacity of the semantic color) with a high-contrast text label (e.g., Success Green text on a faint green background).
- **Input Fields:** Use 1px borders (`#CBD5E1`). On focus, the border shifts to Electric Blue with a 2px soft outer glow.
- **Cards:** White surfaces with 16px corner radii. Header sections within cards should be separated by a light horizontal rule.
- **Map Markers:** Utilize a custom teardrop shape with a white inner circle for package icons or vehicle silhouettes.
- **Logistics Timeline:** A vertical stepper component with thin 2px Cyan lines to indicate "completed" routes and dashed Grey lines for "upcoming" legs.
- **Data Visualizations:** Line charts should use a 2px stroke width with rounded join points, utilizing the Electric Blue and Cyan color tokens.