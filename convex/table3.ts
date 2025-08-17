import { omit, pick, type BetterOmit, type Expand } from 'convex-helpers'
import { nullable, parse, partial } from 'convex-helpers/validators'
import {
  v,
  type ObjectType,
  type PropertyValidators,
  type VObject,
  type VOptional,
} from 'convex/values'

// Define the type for the builder methods that will be attached to the validator
type PartialFields<Fields extends PropertyValidators> = {
  [K in keyof Fields]: VOptional<Fields[K]>
}

// Define the type for the builder methods that will be attached to the validator
interface BuilderMethods<Fields extends PropertyValidators> {
  pick: <K extends keyof Fields & string>(...keys: K[]) => Builder<Pick<Fields, K>>
  omit: <K extends keyof Fields & string>(...keys: K[]) => Builder<Expand<BetterOmit<Fields, K>>>
  partial: () => Builder<PartialFields<Fields>>
  and: <Fields2 extends PropertyValidators>(additionalFields: Fields2) => Builder<Fields & Fields2>
  parse: (value: unknown) => ObjectType<Fields>
  nullable: () => ReturnType<typeof nullable>
  array: () => ReturnType<typeof v.array>
}

// The Builder type is a VObject augmented with the builder methods
export type Builder<Fields extends PropertyValidators> = VObject<
  ObjectType<Fields>,
  Fields,
  'required',
  any
> &
  BuilderMethods<Fields>

/**
 * Enhances a Convex object validator with chainable builder methods.
 * Each method returns a new, enhanced validator, eliminating the need for a `build()` step.
 *
 * @param validator - The `v.object` validator to enhance.
 * @returns A new `VObject` augmented with chainable builder methods.
 */
function createBuilder<Fields extends PropertyValidators>(
  validator: VObject<ObjectType<Fields>, Fields, 'required', any>,
): Builder<Fields> {
  const fields = validator.fields

  const methods: BuilderMethods<Fields> = {
    pick<K extends keyof Fields & string>(...keys: K[]) {
      const newFields = pick(fields, keys)
      const newValidator = v.object(newFields)
      return createBuilder(newValidator)
    },

    omit<K extends keyof Fields & string>(...keys: K[]) {
      const newFields = omit(fields, keys)
      const newValidator = v.object(newFields)
      return createBuilder(newValidator)
    },

    partial() {
      const newFields = partial(fields)
      const newValidator = v.object(newFields)
      return createBuilder(newValidator)
    },

    and<Fields2 extends PropertyValidators>(additionalFields: Fields2) {
      const newFields = { ...fields, ...additionalFields }
      const newValidator = v.object(newFields)
      return createBuilder(newValidator)
    },

    parse(value: unknown) {
      return parse(validator, value)
    },

    nullable() {
      return nullable(validator)
    },

    array() {
      return v.array(validator)
    },
  }

  return Object.assign(validator, methods)
}

/**
 * Entry point to create a new chainable validator builder from an existing
 * v.object() validator or a raw PropertyValidators object.
 *
 * @param source - A VObject or a PropertyValidators object.
 * @returns A new enhanced VObject validator.
 *
 * @example
 * ```typescript
 * const userValidator = v.object({ name: v.string(), email: v.string() });
 * const userBuilder = withVBuilder(userValidator);
 *
 * const partialUserName = userBuilder.pick('name').partial();
 * // partialUserName is a valid validator, no .build() needed.
 * ```
 */
export function withVBuilder<Fields extends PropertyValidators>(
  source: VObject<ObjectType<Fields>, Fields, 'required', any> | Fields,
) {
  const validator = ('fields' in source ? source : v.object(source as Fields)) as VObject<
    ObjectType<Fields>,
    Fields,
    'required',
    any
  >
  return createBuilder(validator)
}

/**
 * Creates a schema-aware helper for a single Convex table, providing typed
 * access to its validators.
 *
 * This function takes a table name and a `v.object` validator and returns a
 * helper object with typed validators for the table's content, the full
 * document (including system fields), and individual system fields.
 *
 * @param tableName - The name of the table.
 * @param validator - The `v.object` validator for the table.
 * @returns An object containing:
 *  - `name`: The name of the table.
 *  - `validator`: The original validator for the table's content.
 *  - `doc`: A `v.object` validator that includes system fields.
 *  - `systemFields`: An object with validators for the system fields.
 *  - `_id`: A `v.id(tableName)` validator for creating typed ID references.
 *
 * @example
 * ```ts
 * import { defineTable } from "convex/server";
 * import { v } from "convex/values";
 *
 * export const usersValidator = v.object({
 *   name: v.string(),
 *   email: v.string(),
 * });
 *
 * export const vUsers = createVTable("users", usersValidator);
 *
 * // Use in a mutation:
 * export const updateUser = mutation({
 *   args: {
 *     id: vUsers._id,
 *     patch: v.object(vUsers.validator.fields),
 *   },
 *   // ...
 * });
 * ```
 */
export function createTableVHelper<TableName extends string, Fields extends PropertyValidators>(
  tableName: TableName,
  validator: VObject<ObjectType<Fields>, Fields, 'required', any>,
) {
  const systemFields = {
    _id: v.id(tableName),
    _creationTime: v.number(),
  }

  const doc = v.object({
    ...validator.fields,
    ...systemFields,
  })

  return {
    name: tableName,
    validator: withVBuilder(validator),
    doc: withVBuilder(doc),
    systemFields: withVBuilder(systemFields),
    _id: systemFields._id,
  }
}
