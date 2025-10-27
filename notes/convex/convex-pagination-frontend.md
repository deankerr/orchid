# Convex Pagination Frontend Cheat Sheet

## Using `usePaginatedQuery`

### Basic Usage

```typescript
import { usePaginatedQuery } from "convex/react";
import { api } from "../convex/_generated/api";

export function MessageList() {
  const { results, status, isLoading, loadMore } = usePaginatedQuery(
    api.messages.list,
    {}, // Arguments (excluding paginationOpts)
    { initialNumItems: 10 }
  );

  return (
    <div>
      {results?.map((message) => (
        <div key={message._id}>{message.body}</div>
      ))}
      <button
        onClick={() => loadMore(10)}
        disabled={status !== "CanLoadMore"}
      >
        Load More
      </button>
    </div>
  );
}
```

### Status Types

- `"LoadingFirstPage"`: Initial load
- `"CanLoadMore"`: More data available
- `"LoadingMore"`: Currently loading more
- `"Exhausted"`: No more data

### With Additional Arguments

```typescript
const { results, status, loadMore } = usePaginatedQuery(
  api.messages.listWithStatus,
  { status: 'active' }, // Your custom args
  { initialNumItems: 5 },
)
```

### Loading States

```typescript
export function MessageList() {
  const { results, status, isLoading, loadMore } = usePaginatedQuery(
    api.messages.list,
    {},
    { initialNumItems: 10 }
  );

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {results?.map((message) => (
        <div key={message._id}>{message.body}</div>
      ))}

      {status === "CanLoadMore" && (
        <button onClick={() => loadMore(10)}>
          Load More
        </button>
      )}

      {status === "LoadingMore" && (
        <div>Loading more...</div>
      )}

      {status === "Exhausted" && (
        <div>No more messages</div>
      )}
    </div>
  );
}
```

## Advanced Patterns

### Infinite Scroll with Intersection Observer

```typescript
import { useEffect, useRef } from "react";

export function InfiniteMessageList() {
  const { results, status, loadMore } = usePaginatedQuery(
    api.messages.list,
    {},
    { initialNumItems: 20 }
  );

  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loadMoreRef.current || status !== "CanLoadMore") return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore(20);
        }
      },
      { threshold: 1.0 }
    );

    observer.observe(loadMoreRef.current);

    return () => observer.disconnect();
  }, [status, loadMore]);

  return (
    <div>
      {results?.map((message) => (
        <div key={message._id}>{message.body}</div>
      ))}
      <div ref={loadMoreRef}>
        {status === "LoadingMore" && "Loading more..."}
        {status === "Exhausted" && "No more messages"}
      </div>
    </div>
  );
}
```

### Multiple Paginated Lists

```typescript
import { useQueries } from "convex/react";

export function Dashboard() {
  const results = useQueries({
    messages: {
      query: api.messages.list,
      args: { channelId: "general" },
    },
    users: {
      query: api.users.list,
      args: { status: "active" },
    },
  });

  // Convert to paginated queries
  const messages = usePaginatedQuery(
    api.messages.list,
    { channelId: "general" },
    { initialNumItems: 10 }
  );

  const users = usePaginatedQuery(
    api.users.list,
    { status: "active" },
    { initialNumItems: 5 }
  );

  return (
    <div>
      <section>
        <h2>Messages</h2>
        {messages.results?.map((msg) => (
          <div key={msg._id}>{msg.body}</div>
        ))}
        <button
          onClick={() => messages.loadMore(10)}
          disabled={messages.status !== "CanLoadMore"}
        >
          More Messages
        </button>
      </section>

      <section>
        <h2>Active Users</h2>
        {users.results?.map((user) => (
          <div key={user._id}>{user.name}</div>
        ))}
        <button
          onClick={() => users.loadMore(5)}
          disabled={users.status !== "CanLoadMore"}
        >
          More Users
        </button>
      </section>
    </div>
  );
}
```

## Optimistic Updates

### Insert at Top

```typescript
const createMessage = useMutation(api.messages.create).withOptimisticUpdate((localStore, args) => {
  insertAtTop({
    paginatedQuery: api.messages.list,
    argsToMatch: { channelId: args.channelId },
    localQueryStore: localStore,
    item: {
      _id: crypto.randomUUID() as Id<'messages'>,
      body: args.body,
      channelId: args.channelId,
      _creationTime: Date.now(),
    },
  })
})
```

### Update Existing Item

```typescript
const updateMessage = useMutation(api.messages.update).withOptimisticUpdate((localStore, args) => {
  optimisticallyUpdateValueInPaginatedQuery(
    localStore,
    api.messages.list,
    { channelId: args.channelId },
    (message) => (message._id === args.id ? { ...message, body: args.newBody } : message),
  )
})
```

### Insert at Position

```typescript
const createTask = useMutation(api.tasks.create).withOptimisticUpdate((localStore, args) => {
  insertAtPosition({
    paginatedQuery: api.tasks.listByPriority,
    argsToMatch: { listId: args.listId },
    sortOrder: 'asc',
    sortKeyFromItem: (item) => [item.priority, item._creationTime],
    localQueryStore: localStore,
    item: {
      _id: crypto.randomUUID() as Id<'tasks'>,
      _creationTime: Date.now(),
      title: args.title,
      priority: args.priority,
      listId: args.listId,
    },
  })
})
```

## Custom Hooks

### Reusable Paginated List Hook

```typescript
function usePaginatedList<T>(
  query: PaginatedQueryReference,
  args: any,
  initialNumItems: number = 10
) {
  const { results, status, isLoading, loadMore } = usePaginatedQuery(
    query,
    args,
    { initialNumItems }
  );

  const loadMoreIfNeeded = useCallback(() => {
    if (status === "CanLoadMore") {
      loadMore(initialNumItems);
    }
  }, [status, loadMore, initialNumItems]);

  return {
    items: results || [],
    isLoading,
    canLoadMore: status === "CanLoadMore",
    isExhausted: status === "Exhausted",
    loadMore: loadMoreIfNeeded,
    loadMoreWithCount: loadMore,
  };
}

// Usage
export function MessageList() {
  const { items, canLoadMore, loadMoreWithCount } = usePaginatedList(
    api.messages.list,
    {},
    20
  );

  return (
    <div>
      {items.map((message) => (
        <div key={message._id}>{message.body}</div>
      ))}
      {canLoadMore && (
        <button onClick={() => loadMoreWithCount(20)}>
          Load More
        </button>
      )}
    </div>
  );
}
```

## Error Handling

### Error Boundary for Paginated Queries

```typescript
import { ErrorBoundary } from "react-error-boundary";

function PaginatedErrorFallback({ error }: { error: Error }) {
  return (
    <div>
      <h2>Failed to load data</h2>
      <p>{error.message}</p>
      <button onClick={() => window.location.reload()}>
        Try Again
      </button>
    </div>
  );
}

export function App() {
  return (
    <ErrorBoundary FallbackComponent={PaginatedErrorFallback}>
      <MessageList />
    </ErrorBoundary>
  );
}
```

### Retry Logic

```typescript
function usePaginatedWithRetry<T>(
  query: PaginatedQueryReference,
  args: any,
  options: { initialNumItems?: number; maxRetries?: number } = {},
) {
  const { initialNumItems = 10, maxRetries = 3 } = options
  const [retryCount, setRetryCount] = useState(0)
  const [error, setError] = useState<Error | null>(null)

  const { results, status, isLoading, loadMore } = usePaginatedQuery(query, args, {
    initialNumItems,
  })

  useEffect(() => {
    if (error && retryCount < maxRetries) {
      const timer = setTimeout(
        () => {
          setRetryCount((prev) => prev + 1)
          setError(null)
        },
        1000 * Math.pow(2, retryCount),
      ) // Exponential backoff

      return () => clearTimeout(timer)
    }
  }, [error, retryCount, maxRetries])

  const loadMoreWithRetry = useCallback(
    (numItems: number) => {
      try {
        loadMore(numItems)
      } catch (err) {
        setError(err as Error)
      }
    },
    [loadMore],
  )

  return {
    results,
    status,
    isLoading,
    error,
    retryCount,
    loadMore: loadMoreWithRetry,
  }
}
```

## Performance Tips

### Memoize Arguments

```typescript
const args = useMemo(
  () => ({
    channelId: selectedChannel,
    status: 'active',
  }),
  [selectedChannel],
)

const { results } = usePaginatedQuery(api.messages.list, args, { initialNumItems: 20 })
```

### Virtual Scrolling

```typescript
import { FixedSizeList as List } from "react-window";

export function VirtualMessageList() {
  const { results } = usePaginatedQuery(
    api.messages.list,
    {},
    { initialNumItems: 1000 }
  );

  const Row = ({ index, style }: { index: number; style: any }) => (
    <div style={style}>
      {results[index]?.body}
    </div>
  );

  return (
    <List
      height={600}
      itemCount={results?.length || 0}
      itemSize={80}
    >
      {Row}
    </List>
  );
}
```

## Common Gotchas

### ❌ Wrong: Changing Arguments Causes Reset

```typescript
// This will reset pagination every time selectedChannel changes
const { results } = usePaginatedQuery(
  api.messages.list,
  { channelId: selectedChannel }, // Changes reset pagination
  { initialNumItems: 10 },
)
```

### ✅ Correct: Stable Arguments

```typescript
const args = useMemo(
  () => ({
    channelId: selectedChannel,
  }),
  [selectedChannel],
)

const { results } = usePaginatedQuery(api.messages.list, args, { initialNumItems: 10 })
```

### ❌ Wrong: Calling loadMore in Render

```typescript
function BadComponent() {
  const { loadMore, status } = usePaginatedQuery(/* ... */);

  // This causes infinite loops!
  if (status === "CanLoadMore") {
    loadMore(10); // Don't do this!
  }

  return <div>...</div>;
}
```

### ✅ Correct: loadMore in Event Handlers

```typescript
function GoodComponent() {
  const { loadMore, status } = usePaginatedQuery(/* ... */);

  const handleLoadMore = () => {
    if (status === "CanLoadMore") {
      loadMore(10);
    }
  };

  return (
    <button onClick={handleLoadMore} disabled={status !== "CanLoadMore"}>
      Load More
    </button>
  );
}
```
