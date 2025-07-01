import { omit, pick, type Expand } from 'convex-helpers'
import { parse, partial } from 'convex-helpers/validators'
import { defineTable } from 'convex/server'
import {
  v,
  type Infer,
  type ObjectType,
  type PropertyValidators,
  type VObject,
} from 'convex/values'

/*
  The returned object must always be an actual validator which can be used in Convex functions.
  We use Object.assign to piggyback our builder functions onto it without Convex noticing.
*/

/**
 * Stage 1: Initial Builder - pick/omit/partial/parse/and
 */
function createBuilderStage1<F extends PropertyValidators>(
  validator: VObject<ObjectType<F>, F, 'required', any>,
) {
  const fields = validator.fields
  const initialMethods = {
    pick<K extends keyof F & string>(...keys: K[]) {
      const pickedValidator = v.object(pick(fields, keys))
      return createBuilderStage2(pickedValidator)
    },

    omit<K extends keyof F & string>(...keys: K[]) {
      const omittedValidator = v.object(omit(fields, keys))
      return createBuilderStage2(omittedValidator)
    },

    partial() {
      const partialValidator = v.object(partial(fields))
      return createBuilderStage3(partialValidator)
    },

    parse(value: unknown) {
      return parse(validator, value)
    },

    and<F2 extends PropertyValidators>(additionalFields: F2) {
      const combinedFields = { ...fields, ...additionalFields }
      const combinedValidator = v.object(combinedFields)
      return createBuilderStage2(combinedValidator)
    },
  }

  return Object.assign(validator, initialMethods)
}

/**
 * Stage 2: Post-Selection Builder - partial/parse
 */
function createBuilderStage2<F extends PropertyValidators>(
  validator: VObject<ObjectType<F>, F, 'required', any>,
) {
  const fields = validator.fields
  const postSelectionMethods = {
    partial() {
      const partialValidator = v.object(partial(fields))
      return createBuilderStage3(partialValidator)
    },

    parse(value: unknown) {
      return parse(validator, value)
    },
  }

  return Object.assign(validator, postSelectionMethods)
}

/**
 * Stage 3: Partial Builder - parse
 */
function createBuilderStage3<T extends Record<string, any>, F extends PropertyValidators>(
  validator: VObject<T, F, 'required', any>,
) {
  const partialMethods = {
    parse(value: unknown) {
      return parse(validator, value)
    },
  }

  return Object.assign(validator, partialMethods)
}

/**
 * Enhanced Table2 with chainable validator builders
 *
 * @example
 * ```typescript
 * const Users = Table2('users', {
 *   name: v.string(),
 *   email: v.string(),
 *   age: v.optional(v.number())
 * })
 *
 * // Valid chainable operations
 * const partialUser = Users.content.pick('name', 'email').partial()
 * const cleanData = Users.doc.omit('age').parse(dirtyData)
 * const simpleChain = Users.content.pick('name').parse(data)
 *
 */
export function Table2<T extends PropertyValidators, TableName extends string>(
  name: TableName,
  fields: T,
) {
  const table = defineTable(fields)
  const _id = v.id(name)
  const systemFields = { _id, _creationTime: v.number() }
  const schema = { ...fields, ...systemFields } as Expand<T & typeof systemFields>

  const content = createBuilderStage1(v.object(fields))
  const doc = createBuilderStage1(v.object(schema))

  return {
    name,
    table,
    _id,

    content,
    doc,

    $content: {} as Infer<typeof content>,
    $doc: {} as Infer<typeof doc>,
    $id: {} as Infer<typeof _id>,
  }
}

/**
 *
 * @example
 * ```typescript
 * const Users = Table2('users', { name: v.string(), email: v.string() })
 *
 * // Combine table fields with raw field object
 * const loginValidator = andFields(
 *   Users.content.pick('email'),
 *   { password: v.string(), rememberMe: v.optional(v.boolean()) }
 * )
 *
 * // To use with a v.object() validator, extract .fields
 * const addressValidator = v.object({ street: v.string(), city: v.string() })
 * const userWithAddress = andFields(Users.content, addressValidator.fields)
 * ```
 */
export function andFields<
  T1 extends Record<string, any>,
  F1 extends PropertyValidators,
  F2 extends PropertyValidators,
>(validator1: VObject<T1, F1, 'required', any>, additionalFields: F2) {
  const combinedFields = { ...validator1.fields, ...additionalFields }
  const combinedValidator = v.object(combinedFields)

  // Return a new Stage 1 builder with the combined fields
  return createBuilderStage1(combinedValidator)
}
