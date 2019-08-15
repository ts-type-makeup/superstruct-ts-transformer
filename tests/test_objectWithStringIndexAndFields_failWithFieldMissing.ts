import { validate } from "superstruct-ts-transformer";

type TestType = { fieldNumber: number; [key: string]: number };

export const obj = validate<TestType>(
  JSON.parse('{ "field1": 123, "field2": 321 }')
);
