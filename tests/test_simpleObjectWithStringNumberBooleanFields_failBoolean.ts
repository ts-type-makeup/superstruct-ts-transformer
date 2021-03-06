import { validate } from "superstruct-ts-transformer";

type TestType = {
  fieldStr: string;
  fieldNumber: number;
  fieldBoolean: boolean;
};

export const obj = validate<TestType>(
  JSON.parse(
    '{ "fieldStr": "test str", "fieldNumber": 123, "_fieldBoolean": true }'
  )
);
