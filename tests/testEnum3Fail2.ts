import { validate } from "superstruct-ts-transformer";

enum TestEnum {
  Foo = "foo",
  Bar = "bar",
  Xyzzy = "xyzzy"
}

type TestType = {
  fieldEnum: TestEnum;
};

export const obj = validate<TestType>(JSON.parse('{ "fieldEnum": "eh" }'));
