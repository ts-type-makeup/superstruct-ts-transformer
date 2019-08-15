import { validate } from "superstruct-ts-transformer";

type TestType = { fieldBoolean: boolean | null };

export const obj = validate<TestType>(JSON.parse('{ "fieldBoolean": true }'));
