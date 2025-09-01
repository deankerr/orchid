# Frontend Development Guide

## Example

```tsx
import { cn } from '@/lib/utils'

export function LabeledBox({
  label,
  className,
  children,
  ...props
}: { label?: string } & React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('bg-card text-card-foreground space-y-2 rounded-sm border p-2', className)}
      {...props}
    >
      {label && <div className="text-muted-foreground font-mono text-sm uppercase">{label}</div>}
      {children}
    </div>
  )
}
```

## Target Audience

ORCHID serves highly technical users who work with OpenRouter and LLMs professionally:

- Deep understanding of AI model concepts (variables, parameters, context lengths, quantization)
- Interested in comprehensive pricing details (cache reads, reasoning tokens, structured outputs)
- Value technical precision over "friendly" explanations
- Need data that's easily accessible, comparable, and actionable
- Will copy/paste values (model slugs, API parameters) directly into their code

## Design Philosophy

### Technical Aesthetic

- **Stark, functional appearance**: Modern terminal aesthetic without literal shell elements
- **Typography**: Monospace fonts for technical content
- **Color palette**: Monochromatic base with strategic color usage
- **Spacing**: Minimal padding, clean layouts
- **Geometry**: Sharp corners, avoid rounded elements
- **Dark**: We only use a "dark mode" theme

### Color Strategy

- **Text**: Primary place for color (status indicators, variant labels)
- **Branding**: Model and provider logos provide natural color accents
- **Backgrounds**: Minimal use of background colors
- **Effects**: Avoid shadows and other visual effects

### Content Presentation

- **Comparability**: Structure data for easy comparison across models/providers
- **Desktop-first**: Mobile optimization is not a current focus
- **Data-heavy patterns**: Optimize for information-dense interfaces

## Component Guidelines

### UI Components

- **Theme adherence**: Use standard shadcn/ui theme variables exclusively
- **No customization**: Avoid custom colors, background colors, border radius
- **Theme extensions**: Add new theme colors to [globals.css](mdc:app/globals.css) when needed

### Styling

- Values like `font-mono` are defined at the root level of components where in use, allowing it to cascade down into sub-components like Buttons, Badges, etc. Do not add these classes to every internal element.
- `border-border` is default, no need to specify anywhere
- Badges: `text-xs` is the default size
- use the `cn()` helper when dynamic classNames are needed
- Follow established patterns across the application

### Structure

- Use a shadcn/ui-inspired structure for components, a single file which exports composable component parts, allowing for dynamic customization.
- Use React.ComponentProps to allow for customization of the outer element, be it a HTML element or another component.
- Destructure and merge the className prop using the `cn` helper.
- Never use default exports.

### Component File Structure/Locations

- Route components (layouts, pages): `app/[relevant directory]`
- Major single file/unique components: `components/`
- Major multi-file components: `components/<component-name>`
- Shared/custom UI components: `components/shared`
- shadcn/ui components only: `components/ui`
- Mixed/unclear: `components/`
- No barrel files

## Feature Flags

- The FeatureFlag component is used to conditionally render features based on a localStorage value
- By design, our frontend does not expose any mutations or sensitive internal data at all
- There is no risk in any unverified user discovering and toggling feature flags
- We use it to hide live feature prototypes where using with production data is useful
- We also use it to hide links to the snapshot dashboard which is not designed for end-users

## React 19 / Next.js 15

- forwardRef is no longer required. refs are now just regular props, and don't need any special handling.
- Next.js dynamic route props are async, meaning that on the server, pages must be async and await the params prop, e.g. `export async function Page({ params }: Promise<{ slug: string[] }>)`, these can then be passed to a separate `use client` page component.
- When a page is reading search params with nuqs, the client component page must be wrapped in `<Suspense>` in the server-side `page.tsx`. No fallback is required.
