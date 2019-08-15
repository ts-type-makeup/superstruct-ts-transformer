import { validate } from "superstruct-ts-transformer";

type TestType = { name: string | null };

export const obj = validate<TestType>(JSON.parse('{ "name": "Me" }'));
