import { validate } from "superstruct-ts-transformer";

type TestType = [number, string];

export const obj = validate<TestType>(JSON.parse('[123, "testStr"]'));
