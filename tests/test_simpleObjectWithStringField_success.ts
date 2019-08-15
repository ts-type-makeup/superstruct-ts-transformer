import { validate } from "superstruct-ts-transformer";

type TestType = { name: string };

export const obj = validate<TestType>(JSON.parse('{ "name": "Me" }'));
