import { validate } from '../index'

type MyType = {
  fieldStr: string
}

export const obj = validate<MyType>(JSON.parse('{ "fieldStr": "str" }'))