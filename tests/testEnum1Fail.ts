import { validate } from "superstruct-ts-transformer";

enum TestEnum {
  EnumField0,
  EnumField1,
  EnumField2
}

type TestType = {
  fieldEnum: TestEnum;
};

export const obj = validate<TestType>(JSON.parse('{ "fieldEnum": 30 }'));
