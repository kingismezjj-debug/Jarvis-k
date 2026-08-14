export interface JsonSchemaValidationResult {
  valid: boolean
  reasonCode?: "SCHEMA_UNSUPPORTED" | "VALUE_INVALID"
}

type JsonSchemaType =
  | "object"
  | "array"
  | "string"
  | "number"
  | "integer"
  | "boolean"
  | "null"

interface JsonSchemaObject {
  $schema?: string
  title?: string
  description?: string
  default?: unknown
  type?: JsonSchemaType
  properties?: Record<string, unknown>
  required?: string[]
  additionalProperties?: boolean | unknown
  items?: unknown
  minItems?: number
  maxItems?: number
  minLength?: number
  maxLength?: number
  pattern?: string
  minimum?: number
  maximum?: number
  exclusiveMinimum?: number
  exclusiveMaximum?: number
  enum?: unknown[]
  const?: unknown
}

const SUPPORTED_SCHEMA_KEYS = new Set([
  "$schema",
  "title",
  "description",
  "default",
  "type",
  "properties",
  "required",
  "additionalProperties",
  "items",
  "minItems",
  "maxItems",
  "minLength",
  "maxLength",
  "pattern",
  "minimum",
  "maximum",
  "exclusiveMinimum",
  "exclusiveMaximum",
  "enum",
  "const",
])

export function validateJsonSchemaValue(
  schema: unknown,
  value: unknown,
): JsonSchemaValidationResult {
  if (!isSupportedSchema(schema)) {
    return { valid: false, reasonCode: "SCHEMA_UNSUPPORTED" }
  }
  return validateValue(schema, value)
    ? { valid: true }
    : { valid: false, reasonCode: "VALUE_INVALID" }
}

function isSupportedSchema(schema: unknown): schema is JsonSchemaObject {
  if (!isPlainObject(schema)) {
    return false
  }
  for (const key of Object.keys(schema)) {
    if (!SUPPORTED_SCHEMA_KEYS.has(key)) {
      return false
    }
  }
  const typed = schema as JsonSchemaObject
  if (
    typed.type !== undefined &&
    ![
      "object",
      "array",
      "string",
      "number",
      "integer",
      "boolean",
      "null",
    ].includes(typed.type)
  ) {
    return false
  }
  if (
    typed.properties !== undefined &&
    (!isPlainObject(typed.properties) ||
      !Object.values(typed.properties).every(isSupportedSchema))
  ) {
    return false
  }
  if (typed.items !== undefined && !isSupportedSchema(typed.items)) {
    return false
  }
  return true
}

function validateValue(schema: JsonSchemaObject, value: unknown): boolean {
  if (schema.const !== undefined && !jsonEqual(value, schema.const)) {
    return false
  }
  if (
    schema.enum !== undefined &&
    !schema.enum.some((candidate) => jsonEqual(value, candidate))
  ) {
    return false
  }
  if (schema.type !== undefined && !matchesType(value, schema.type)) {
    return false
  }

  switch (schema.type) {
    case "object":
      return validateObject(schema, value)
    case "array":
      return validateArray(schema, value)
    case "string":
      return validateString(schema, value)
    case "number":
    case "integer":
      return validateNumber(schema, value)
    default:
      return true
  }
}

function validateObject(schema: JsonSchemaObject, value: unknown): boolean {
  if (!isPlainObject(value)) {
    return false
  }
  const record = value as Record<string, unknown>
  const properties = schema.properties ?? {}
  for (const field of schema.required ?? []) {
    if (!Object.prototype.hasOwnProperty.call(record, field)) {
      return false
    }
  }
  if (schema.additionalProperties === false) {
    for (const key of Object.keys(record)) {
      if (!Object.prototype.hasOwnProperty.call(properties, key)) {
        return false
      }
    }
  }
  for (const [key, propertySchema] of Object.entries(properties)) {
    if (
      Object.prototype.hasOwnProperty.call(record, key) &&
      !validateValue(propertySchema as JsonSchemaObject, record[key])
    ) {
      return false
    }
  }
  return true
}

function validateArray(schema: JsonSchemaObject, value: unknown): boolean {
  if (!Array.isArray(value)) {
    return false
  }
  if (schema.minItems !== undefined && value.length < schema.minItems) {
    return false
  }
  if (schema.maxItems !== undefined && value.length > schema.maxItems) {
    return false
  }
  if (schema.items !== undefined) {
    return value.every((item) =>
      validateValue(schema.items as JsonSchemaObject, item),
    )
  }
  return true
}

function validateString(schema: JsonSchemaObject, value: unknown): boolean {
  if (typeof value !== "string") {
    return false
  }
  if (schema.minLength !== undefined && value.length < schema.minLength) {
    return false
  }
  if (schema.maxLength !== undefined && value.length > schema.maxLength) {
    return false
  }
  if (schema.pattern !== undefined && !new RegExp(schema.pattern, "u").test(value)) {
    return false
  }
  return true
}

function validateNumber(schema: JsonSchemaObject, value: unknown): boolean {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return false
  }
  if (schema.type === "integer" && !Number.isInteger(value)) {
    return false
  }
  if (schema.minimum !== undefined && value < schema.minimum) {
    return false
  }
  if (schema.maximum !== undefined && value > schema.maximum) {
    return false
  }
  if (schema.exclusiveMinimum !== undefined && value <= schema.exclusiveMinimum) {
    return false
  }
  if (schema.exclusiveMaximum !== undefined && value >= schema.exclusiveMaximum) {
    return false
  }
  return true
}

function matchesType(value: unknown, type: JsonSchemaType): boolean {
  switch (type) {
    case "object":
      return isPlainObject(value)
    case "array":
      return Array.isArray(value)
    case "string":
      return typeof value === "string"
    case "number":
      return typeof value === "number" && Number.isFinite(value)
    case "integer":
      return typeof value === "number" && Number.isInteger(value)
    case "boolean":
      return typeof value === "boolean"
    case "null":
      return value === null
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    (Object.getPrototypeOf(value) === Object.prototype ||
      Object.getPrototypeOf(value) === null)
  )
}

function jsonEqual(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right)
}
