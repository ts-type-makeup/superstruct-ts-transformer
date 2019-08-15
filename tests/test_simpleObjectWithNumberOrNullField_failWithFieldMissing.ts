import { validate } from "superstruct-ts-transformer";

type TestType = { fieldNumber: number | null };

export const obj = validate<TestType>(JSON.parse("{ }"));
