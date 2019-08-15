import { validate } from "superstruct-ts-transformer";

type TestType = {
  fieldStr: string;
  fieldNumber: number;
  fieldBoolean: boolean;
};

export const obj = validate<TestType>(
  JSON.parse(
    '{ "fieldStr": "test str", "_fieldNumber": 123, "fieldBoolean": true }'
  )
);
