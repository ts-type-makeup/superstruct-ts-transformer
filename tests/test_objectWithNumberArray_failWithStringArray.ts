import { validate } from "superstruct-ts-transformer";

type TestType = { fieldArray: number[] };

export const obj = validate<TestType>(
  JSON.parse('{ "fieldArray": ["asd", "dsa"] }')
);
