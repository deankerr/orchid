# Convex Pagination Helpers Cheat Sheet

## Installation

```bash
npm install convex-helpers
```

## `getPage` - Advanced Manual Pagination

`getPage` gives you complete control over pagination with index keys, ranges, and multiple paginations per query.

### Basic Usage

```typescript
import { getPage } from 'convex-helpers/server/pagination'

export const firstPage = query({
  args: {},
  handler: async (ctx) => {
    const { page, indexKeys, hasMore } = await getPage(ctx, {
      table: 'messages',
    })
    return { page, indexKeys, hasMore }
  },
})
```

### Next Page

```typescript
export const nextPage = query({
  args: { startIndexKey: v.array(v.any()) },
  handler: async (ctx, args) => {
    const { page, indexKeys, hasMore } = await getPage(ctx, {
      table: 'messages',
      startIndexKey: args.startIndexKey,
    })
    return { page, indexKeys, hasMore }
  },
})
```

### Using Custom Index

```typescript
import schema from './schema'

export const listByName = query({
  args: {},
  handler: async (ctx) => {
    const { page, indexKeys, hasMore } = await getPage(ctx, {
      table: 'users',
      index: 'by_name', // Must be defined in schema
      schema, // Required for custom indexes
      targetMaxRows: 50,
      order: 'asc',
    })
    return { page, indexKeys, hasMore }
  },
})
```

### Range-based Pagination

```typescript
export const messagesInRange = query({
  args: {
    startIndexKey: v.optional(v.array(v.any())),
    endIndexKey: v.optional(v.array(v.any())),
  },
  handler: async (ctx, args) => {
    const { page } = await getPage(ctx, {
      table: 'messages',
      startIndexKey: args.startIndexKey,
      endIndexKey: args.endIndexKey,
      // Ensures pages stay adjacent even as data changes
    })
    return { page }
  },
})
```

### Time-based Pagination

```typescript
export const recentMessages = query({
  args: {},
  handler: async (ctx) => {
    const yesterday = Date.now() - 24 * 60 * 60 * 1000

    const { page, indexKeys, hasMore } = await getPage(ctx, {
      table: 'messages',
      startIndexKey: [yesterday],
      startInclusive: true,
      order: 'desc', // Most recent first
      targetMaxRows: 100,
      absoluteMaxRows: 500, // Prevent pages from growing too large
    })

    return { page, indexKeys, hasMore }
  },
})
```

## `paginator` - Drop-in Replacement for `.paginate()`

`paginator` provides familiar syntax but allows multiple paginations per query.

### Basic Replacement

```typescript
import { paginator } from 'convex-helpers/server/pagination'

import schema from './schema'

export const list = query({
  args: { opts: paginationOptsValidator },
  handler: async (ctx, { opts }) => {
    // Instead of: return await ctx.db.query("messages").paginate(opts);
    return await paginator(ctx.db, schema).query('messages').paginate(opts)
  },
})
```

### With Index and Filtering

```typescript
export const listByAuthor = query({
  args: {
    opts: paginationOptsValidator,
    author: v.id('users'),
  },
  handler: async (ctx, { opts, author }) => {
    return await paginator(ctx.db, schema)
      .query('messages')
      .withIndex('by_author', (q) => q.eq('author', author))
      .order('desc')
      .paginate(opts)
  },
})
```

## Advanced Patterns

### Join Pagination

```typescript
export const messagesWithAuthors = query({
  args: { opts: paginationOptsValidator },
  handler: async (ctx, { opts }) => {
    // Paginate messages
    const { page: messages, continueCursor } = await paginator(ctx.db, schema)
      .query('messages')
      .paginate(opts)

    // Fetch authors for each message
    const messagesWithAuthors = await Promise.all(
      messages.map(async (message) => {
        const author = await ctx.db.get(message.author)
        return { ...message, author }
      }),
    )

    return { page: messagesWithAuthors, continueCursor }
  },
})
```

### Multiple Paginations in One Query

```typescript
export const dashboardData = query({
  args: {},
  handler: async (ctx) => {
    const p = paginator(ctx.db, schema)

    const [messages, users, notifications] = await Promise.all([
      p.query('messages').withIndex('by_created').paginate({ numItems: 10, cursor: null }),
      p
        .query('users')
        .withIndex('by_status', (q) => q.eq('status', 'active'))
        .paginate({ numItems: 5, cursor: null }),
      p
        .query('notifications')
        .withIndex('by_unread', (q) => q.eq('unread', true))
        .paginate({ numItems: 3, cursor: null }),
    ])

    return { messages, users, notifications }
  },
})
```

### Virtual Scrolling Support

```typescript
export const virtualScroll = query({
  args: {
    startIndex: v.number(),
    endIndex: v.number(),
  },
  handler: async (ctx, args) => {
    const { page } = await getPage(ctx, {
      table: 'messages',
      targetMaxRows: args.endIndex - args.startIndex,
      // Use index keys for precise positioning
      startIndexKey: [args.startIndex],
      endIndexKey: [args.endIndex],
    })

    return page
  },
})
```

## Index Keys Explained

Index keys represent positions in your database indexes. They're arrays that include:

1. **Index field values** - The values for your index fields
2. **Creation time** - `_creationTime` (always included)
3. **Document ID** - `_id` (always included for uniqueness)

### Example Index Key Structure

```typescript
// For table with index: .index("by_author_status", ["author", "status"])
const indexKey = [
  'user_123', // author field value
  'active', // status field value
  1704067200000, // _creationTime
  'msg_456', // _id
]
```

### Using Index Keys for Navigation

```typescript
export const jumpToPosition = query({
  args: { timestamp: v.number() },
  handler: async (ctx, args) => {
    // Jump to messages from a specific time
    const { page, indexKeys } = await getPage(ctx, {
      table: 'messages',
      startIndexKey: [args.timestamp],
      startInclusive: true,
      order: 'desc',
    })

    // Get previous page (older messages)
    const { page: prevPage } = await getPage(ctx, {
      table: 'messages',
      endIndexKey: indexKeys[0], // Use first item's index key as boundary
      order: 'desc',
    })

    return { currentPage: page, previousPage: prevPage }
  },
})
```

## Performance Considerations

### Page Size Management

```typescript
export const smartPagination = query({
  args: { opts: paginationOptsValidator },
  handler: async (ctx, { opts }) => {
    const result = await getPage(ctx, {
      table: 'messages',
      targetMaxRows: opts.numItems,
      absoluteMaxRows: opts.numItems * 2, // Allow some growth
    })

    // Log warnings for large pages
    if (result.page.length > opts.numItems * 1.5) {
      console.warn('Page growing large, consider reducing numItems')
    }

    return result
  },
})
```

### Batch Processing with `getPage`

```typescript
export const processAllMessages = internalAction({
  args: {},
  handler: async (ctx) => {
    let processedCount = 0
    let startIndexKey: IndexKey | undefined

    while (true) {
      const { page, indexKeys, hasMore } = await ctx.runQuery(api.messages.getPageForProcessing, {
        startIndexKey,
      })

      // Process this batch
      for (const message of page) {
        await processMessage(message)
        processedCount++
      }

      if (!hasMore) break

      // Continue from where we left off
      startIndexKey = indexKeys[indexKeys.length - 1]
    }

    return processedCount
  },
})
```

## Reactive Pagination Patterns

### Stitching Pages Together

```typescript
export const stitchedPagination = query({
  args: {
    firstPageCursor: v.optional(v.string()),
    secondPageCursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // First page: up to cursor
    const firstPage = await getPage(ctx, {
      table: 'messages',
      endIndexKey: args.firstPageCursor ? JSON.parse(args.firstPageCursor) : undefined,
    })

    // Second page: from cursor onwards
    const secondPage = await getPage(ctx, {
      table: 'messages',
      startIndexKey: args.firstPageCursor ? JSON.parse(args.firstPageCursor) : undefined,
    })

    return { firstPage: firstPage.page, secondPage: secondPage.page }
  },
})
```

### Bidirectional Scrolling

```typescript
export const bidirectionalScroll = query({
  args: {
    centerIndexKey: v.optional(v.array(v.any())),
    direction: v.union(v.literal('up'), v.literal('down')),
    numItems: v.number(),
  },
  handler: async (ctx, args) => {
    const order = args.direction === 'up' ? 'desc' : 'asc'

    const { page, indexKeys } = await getPage(ctx, {
      table: 'messages',
      startIndexKey: args.centerIndexKey,
      startInclusive: false, // Don't include the center item
      order,
      targetMaxRows: args.numItems,
    })

    return { page, indexKeys }
  },
})
```

## Common Gotchas

### ❌ Wrong: Missing Schema for Custom Index

```typescript
export const broken = query({
  args: {},
  handler: async (ctx) => {
    return await getPage(ctx, {
      table: 'users',
      index: 'by_name', // Error: schema required for custom indexes
      // schema: schema, // Missing!
    })
  },
})
```

### ✅ Correct: Include Schema

```typescript
export const correct = query({
  args: {},
  handler: async (ctx) => {
    return await getPage(ctx, {
      table: 'users',
      index: 'by_name',
      schema, // Required for custom indexes
    })
  },
})
```

### ❌ Wrong: Index Key Length Mismatch

```typescript
export const wrong = query({
  args: {},
  handler: async (ctx) => {
    return await getPage(ctx, {
      table: 'users',
      index: 'by_name', // Index has ["name", "_creationTime", "_id"]
      startIndexKey: ['value1', 'value2', 'value3', 'too', 'many'], // Too long!
      schema,
    })
  },
})
```

### ✅ Correct: Proper Index Key Length

```typescript
export const correct = query({
  args: {},
  handler: async (ctx) => {
    return await getPage(ctx, {
      table: 'users',
      index: 'by_name',
      startIndexKey: ['John'], // Correct length for prefix search
      schema,
    })
  },
})
```

## When to Use Which Helper

| Use Case                       | Recommended Helper                           |
| ------------------------------ | -------------------------------------------- |
| Simple infinite scroll         | Built-in `.paginate()` + `usePaginatedQuery` |
| Multiple paginations per query | `paginator`                                  |
| Complex index navigation       | `getPage`                                    |
| Virtual scrolling              | `getPage` with index keys                    |
| Joins with pagination          | `getPage` or `paginator`                     |
| Time-based navigation          | `getPage`                                    |
| Batch processing               | `getPage`                                    |
| Reactive bidirectional scroll  | `getPage` with stitching                     |

## Schema Requirements

Always ensure your schema has the indexes you need:

```typescript
export default defineSchema({
  messages: defineTable({
    author: v.id('users'),
    body: v.string(),
    status: v.string(),
  })
    .index('by_author', ['author'])
    .index('by_author_status', ['author', 'status'])
    .index('by_status_created', ['status', '_creationTime'])
    .index('by_created', ['_creationTime']), // Default index
})
```
