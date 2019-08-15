import { validate } from "superstruct-ts-transformer";

type TestType = { fieldBoolean?: boolean };

export const obj = validate<TestType>(JSON.parse('{ "fieldBoolean": true }'));
