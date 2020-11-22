import { validate } from "superstruct-ts-transformer";

type Uuid = string & { readonly __brand: unique symbol };

const uuidRegExp = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isUuid = (value: unknown): value is Uuid =>
  typeof value === "string" && !!value && uuidRegExp.test(value);

type TestType = Uuid;

export const obj = validate<TestType>(
  JSON.parse('"thisisnotuuid"'),
  [isUuid]
);
