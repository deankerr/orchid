# SVG Sprite System Documentation

## Overview

The SVG sprite system replaces individual Lucide React components with a single optimized sprite file for better performance in data-heavy components like the endpoints data grid.

## Architecture

### Core Components

1. **Sprite Generation Script** (`scripts/generate-sprite.ts`)
   - Extracts SVGs from `lucide-static` package
   - Optimizes SVGs using SVGO
   - Generates single sprite file with `<symbol>` elements
   - Creates TypeScript definitions

2. **SpriteIcon Component** (`components/ui/sprite-icon.tsx`)
   - React component that renders icons from the sprite
   - Simple, focused API
   - Supports all standard SVG props

3. **Type Definitions** (`lib/sprite-icons.ts`)
   - Auto-generated TypeScript types
   - Single utility function for sprite URLs
   - Minimal, focused exports

## Usage

### Basic Usage

```tsx
import { SpriteIcon } from '@/components/ui/sprite-icon'

// Simple usage
<SpriteIcon name="brain-cog" size={24} className="text-blue-500" />

// With all props
<SpriteIcon
  name="database"
  size={20}
  className="text-cyan-600"
  strokeWidth="1.5"
/>
```

### In Attribute Badges

```tsx
import { AttributeBadge } from '@/components/shared/attribute-badge'

<AttributeBadge
  icon="wrench"  // sprite icon name - fully type-safe
  name="tools"
  details="Supports tool parameters"
  color="blue"
/>
```

### Direct Usage in Attributes

```tsx
// In lib/attributes.ts - no casting needed
export const attributes = {
  tools: {
    icon: 'wrench',  // TypeScript enforces valid icon names
    details: 'Supports tool parameters',
    color: 'blue',
  },
}
```

## Available Icons

The sprite currently includes 26 icons used in the endpoints data grid:

**Core Icons:**
- `audio-lines` - Audio capabilities
- `brain-cog` - AI reasoning features
- `database` - Caching functionality
- `flag` - Request pricing
- `globe` - Web search capabilities
- `image` - Image processing

**Attribute Icons:**
- `alarm-clock` - Rate limits
- `braces` - JSON formatting
- `cake-slice` - Free tier
- `calendar` - Daily limits
- `chevrons-down` - Deranked status
- `fingerprint` - User ID requirements
- `letter-text` - Text limits
- `link` - File URL support
- `message-square` - Completions API
- `messages-square` - Chat API
- `octagon-x` - Disabled status
- `save` - Data retention
- `scan-eye` - Training data
- `scroll-text` - Data publishing
- `shield-alert` - Moderation
- `square-stop` - Stream cancellation
- `wrench` - Tools support

**Modality Icons:**
- `file-chart-column-increasing` - File input
- `image-down` - Image output
- `image-up` - Image input

## Build Integration

### Scripts

```bash
# Generate sprite (manual)
bun run sprite

# Generate sprite with watch mode (future)
bun run sprite:dev
```

### Build Process

The sprite generation is integrated into the development workflow:

1. **Development**: Run `bun run sprite` when adding new icons
2. **Build**: Sprite is generated as part of the build process
3. **Output**: 
   - `public/sprites/lucide-sprite.svg` - The sprite file
   - `lib/sprite-icons.ts` - TypeScript definitions

## Performance Benefits

### Bundle Size Reduction
- **Before**: Individual React components (~2-5KB each)
- **After**: Single sprite file (~8KB total for 26 icons)
- **Savings**: ~60-80% reduction in icon-related bundle size

### Runtime Performance
- **Before**: React component overhead per icon
- **After**: Native SVG symbol referencing
- **Result**: Faster rendering, especially with many icons

### Caching Benefits
- Single sprite file cached across all pages
- No individual icon requests
- Better browser caching efficiency

## Migration Guide

### From Lucide React Components

1. **Update imports:**
   ```tsx
   // Before
   import { BrainCogIcon } from 'lucide-react'
   
   // After
   import { SpriteIcon } from '@/components/ui/sprite-icon'
   ```

2. **Update usage:**
   ```tsx
   // Before
   <BrainCogIcon size={24} className="text-blue-500" />
   
   // After
   <SpriteIcon name="brain-cog" size={24} className="text-blue-500" />
   ```

3. **Update attribute definitions:**
   ```tsx
   // Before
   icon: BrainCogIcon,
   
   // After
   icon: 'brain-cog' as SpriteIconName,
   ```

### Gradual Migration Strategy

1. Start with data-heavy components (endpoints grid)
2. Use mapping utilities for compatibility
3. Migrate component by component
4. Remove unused Lucide imports

## Adding New Icons

### 1. Update Icon List

Add the icon name to `REQUIRED_ICONS` in `scripts/generate-sprite.ts`:

```typescript
const REQUIRED_ICONS = [
  // ... existing icons
  'new-icon-name',
] as const
```

### 2. Update Mapping (Optional)

Add to `lib/lucide-sprite-mapping.ts` if migrating from Lucide React:

```typescript
export const LUCIDE_TO_SPRITE_MAP: Record<string, SpriteIconName> = {
  // ... existing mappings
  NewIconIcon: 'new-icon-name',
}
```

### 3. Regenerate Sprite

```bash
bun run sprite
```

### 4. Update Usage

```tsx
<SpriteIcon name="new-icon-name" size={24} />
```

## Troubleshooting

### Icons Not Displaying

1. **Check sprite file exists**: `public/sprites/lucide-sprite.svg`
2. **Verify icon name**: Check `lib/sprite-icons.ts` for valid names
3. **Regenerate sprite**: Run `bun run sprite`

### TypeScript Errors

1. **Invalid icon name**: Use names from `SpriteIconName` type
2. **Missing types**: Regenerate sprite to update types
3. **Import errors**: Check import paths

### Performance Issues

1. **Sprite not loading**: Check network tab for 404s
2. **Multiple requests**: Ensure single sprite file is used
3. **Large sprite**: Remove unused icons from `REQUIRED_ICONS`

## Future Enhancements

### Planned Features

1. **Watch Mode**: Auto-regenerate sprite during development
2. **Multiple Sprites**: Code-splitting for different icon sets
3. **Icon Discovery**: Automatic detection of used icons
4. **Hot Reload**: Live updates during development

### Expansion Strategy

1. **Phase 1**: Endpoints data grid (✅ Complete)
2. **Phase 2**: Changes data grid and shared components
3. **Phase 3**: All UI components
4. **Phase 4**: Complete Lucide React replacement

## Technical Details

### Sprite Structure

```xml
<svg xmlns="http://www.w3.org/2000/svg" style="display: none;">
  <symbol id="lucide-brain-cog" viewBox="0 0 24 24">
    <!-- SVG paths -->
  </symbol>
  <!-- More symbols... -->
</svg>
```

### Usage Pattern

```xml
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
  <use href="/sprites/lucide-sprite.svg#lucide-brain-cog" />
</svg>
```

### Browser Support

- **Modern browsers**: Full support
- **IE11**: Requires polyfill for `<use>` with external references
- **Safari**: Full support (iOS 9.3+)

## Conclusion

The SVG sprite system provides significant performance improvements for icon-heavy components while maintaining the same developer experience as Lucide React components. The system is designed for gradual adoption and easy expansion.