import { validate } from "superstruct-ts-transformer";

enum TestEnum {
  EnumField0 = 1,
  EnumField1 = 4,
  EnumField2 = 9
}

type TestType = {
  fieldEnum: TestEnum;
};

export const obj = validate<TestType>(JSON.parse('{ "fieldEnum": 4 }'));
