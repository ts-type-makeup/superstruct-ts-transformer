export type Uuid = string & { readonly __brand: unique symbol };

const uuidRegExp = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const isUuid = (value: unknown): value is Uuid =>
  typeof value === "string" && !!value && uuidRegExp.test(value);
