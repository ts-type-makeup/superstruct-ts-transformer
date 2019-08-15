import { validate } from "superstruct-ts-transformer";

type TestType = { [key: string]: number };

export const obj = validate<TestType>(JSON.parse("{ }"));
