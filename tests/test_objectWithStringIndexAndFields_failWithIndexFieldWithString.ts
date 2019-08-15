import { validate } from "superstruct-ts-transformer";

type TestType = { fieldNumber: number; [key: string]: number };

export const obj = validate<TestType>(
  JSON.parse('{ "fieldNumber": 123, "field1": "asd", "field2": 321 }')
);
