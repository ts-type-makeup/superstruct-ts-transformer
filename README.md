# Superstruct Typescript transformer

It's a typescript transformer that will transforms `validate<MyType>(JSON.parse("{}"))` calls to an actual [`superstruct` json validator](https://github.com/ianstormtaylor/superstruct)

You write that code:

```typescript
import { validate } from "superstruct-ts-transformer";

type User = {
  name: string;
  alive: boolean;
};

const obj = validate<User>(JSON.parse('{ "name": "Me", "alive": true }'));
```

and it will become when you'll compile it

```js
import superstruct from "superstruct";
var obj = validate_User(JSON.parse('{ "name": "Me", "alive": true }'));

function validate_User(jsonObj) {
  var validator = superstruct.struct({
    name: "string",
    alive: "boolean"
  });
  return validator(jsonObj);
}
```

## ⚠️ Current limitations ⚠️

Please read this carefully as you may miss it and be really dissappointed afterwards

### You can't use babel-only transpilation

You can use babel, but you need to compile by typescript first. Babel plugin is in plans, but not the top priority right now.

### Can express more than types

Currently there's no way to express something more than Typesctipt types. Means you if you want to validate email or uuid, there's no way because there's no way to express this is types.
There's a plan to support that, using custom type guards, it'll look a bit like [superstruct custom types](https://github.com/ianstormtaylor/superstruct/blob/master/docs/guide.md#defining-custom-data-types)

### You can't use `tsc`

Because `tsc` doesn't support custom transformers. It's not a big deal, actually, since this package is meant to be used in an application enviroment, and than mean you'll be using `webpack` with `ts-loader`, `ts-node` and other stuff which has the api to inject a loader into.

### Module target should be `CommonJS`, `ES2015` and `ESNext`

- You can't use other module targets. Also not a show stopper, haven't seen anyone using `UMD` or `AMD` in a while.

### It's only JSON validation

No more, no less. Everything that's not representable in json or doesn't have a standard represenation is out of the scope of this library, e.g. BigInts, functions, objects with a number indexer. You may want to keep an eye on a custom validators feature though.

## Usage

```typescript
// you import validate function from "superstruct-ts-transformer" package
import { validate } from "superstruct-ts-transformer";

// You define or use or import your own type
type User = {
  name: string;
  alive: boolean;
};

// You call this validate function passing your type as generic
// and json parse result as an argument
const obj = validate<User>(JSON.parse('{ "name": "Me", "alive": true }'));
```

### ⚠️ Usage limitations ⚠️

#### Don't wrap or curry `validate` function and don't reexport it

Don't do this

```ts
const myValidate = <T>(jsonStr: string) => validate<T>(JSON.parse(jsonStr));
```

And don't do this

```ts
import { validate } from "superstruct-ts-transformer";
export default validate;
```

Basically just don't be fancy with this function, just import and use it

## How to integrate custom transformer

The usage itself is really consice, injecting custom transformer can be trickier

### Webpack with ts-loader integration

1. Import the transformer
```js
// Mind the destucturing
const {
  createValidatorTransformer
} = require("superstruct-ts-transformer/dist/transformer");
```
2. Add the transformer to the ts-loader config, so it'll look like this
```js
{
  test: /\.tsx?$/,
  use: [{
    loader: "ts-loader",
    options: {
      // provide your options here if you need it
      getCustomTransformers: program => ({
        before: [createValidatorTransformer(program)] // <-- custom transfomer configuration
      })
    }
  }]
}
```
Take a look at [`ts-loader` docs](https://github.com/TypeStrong/ts-loader#options) if in hesitation.
Also take a look at [tiny webpack example](/superstruct-ts-transformer/webpack-example)

### Webpack with `awesome-typescript-loader` integration

To be written

### `ts-node` integration

To be written