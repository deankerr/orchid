import * as R from 'remeda'

import { internal } from '../../_generated/api'
import { type ActionCtx } from '../../_generated/server'
import { ChangesTableFields } from '../../lib/changesTable'

export async function persistChanges(
  ctx: ActionCtx,
  args: {
    entityType: 'models' | 'endpoints' | 'providers'
    changes: ChangesTableFields[]
  },
) {
  const batches = R.chunk(args.changes, 5000)
  for (const batch of batches) {
    if (args.entityType === 'models') {
      await ctx.runMutation(internal.db.or.modelChanges.insertEvents, {
        events: batch,
      })
    }

    if (args.entityType === 'endpoints') {
      await ctx.runMutation(internal.db.or.endpointChanges.insertEvents, {
        events: batch,
      })
    }

    if (args.entityType === 'providers') {
      await ctx.runMutation(internal.db.or.providerChanges.insertEvents, {
        events: batch,
      })
    }
  }
}
