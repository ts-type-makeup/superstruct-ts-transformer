import { validate } from "superstruct-ts-transformer";

type TestType = { fieldChild: TestChildType };

type TestChildType = { fieldNumber: number };

export const obj = validate<TestType>(
  JSON.parse('{ "fieldChild": { "fieldNumber": 123 } }')
);
