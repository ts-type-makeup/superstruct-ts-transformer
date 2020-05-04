# Superstruct Typescript transformer

<p>
  <a href="https://www.npmjs.com/package/superstruct-ts-transformer">
    <img alt="Npm" src="https://img.shields.io/npm/v/superstruct-ts-transformer.svg?style=flat-square" />
  </a>
  <a href="https://travis-ci.org/ts-type-makeup/superstruct-ts-transformer?branch=master">
    <img alt="Travis CI build status" src="https://travis-ci.org/ts-type-makeup/superstruct-ts-transformer.svg?branch=master" />
  </a>
</p>

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
import * as superstruct from "superstruct";
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

Please read this carefully as you may miss it and be really disappointed afterward

### You can't use babel-only transpilation

You can use babel, but you need to compile by typescript first. Babel plugin is in plans, but not the top priority right now.

### Can express more than types

Currently, there's no way to express something more than Typescript types. Means you if you want to validate email or UUID, there's no way because there's no way to express this is types.
There's a plan to support that, using custom type guards, it'll look a bit like [superstruct custom types](https://github.com/ianstormtaylor/superstruct/blob/master/docs/guide.md#defining-custom-data-types)

### You can't use `tsc`

You need to use [ttypescript](`https://github.com/cevek/ttypescript`), because `tsc` doesn't support custom transformers.

### Module target should be `CommonJS`, `ES2015` and `ESNext`

You can't use other module targets. Also not a show stopper, haven't seen anyone using `UMD` or `AMD` for applications.

### It's only JSON validation

No more, no less. Everything that's not representable in JSON or doesn't have a standard representation is out of the scope of this library, e.g. BigInts, functions, objects with a number indexer. You may want to keep an eye on a custom validators feature though.

## Installation

```bash
npm i -D superstruct-ts-transformer
# or
yarn add --dev superstruct-ts-transformer
```

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

The usage itself is really concise, injecting custom transformer can be trickier

### Webpack with ts-loader integration

1. Import the transformer
```js
// Mind the destructuring
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
Also take a look at [tiny webpack example](/webpack-example)

### Webpack with `awesome-typescript-loader` integration

To be written

### `ts-node` integration

1. Create a `run.js` wrapper to pass the transformer programmatically
```
const {
  createValidatorTransformer
} = require("superstruct-ts-transformer/dist/transformer");

// This is the almost the same at using `ts-node` or `node -r ts-node/register`
// However it allows us to pass transformers
// This should be executed before you start requiring ts and tsx files 
require("ts-node").register({
  programTransformers: program => ({
    before: [createValidatorTransformer(program)] // <-- custom transfomer configuration
    // don't forget that it's an array
  })
});

// require your real entrypoint
require("./index.ts");
```
2. Make use of that script by directly passing it to node, instead of using `ts-node`
If you need to pass specifically options to `ts-node` do it in `run.js` in `register` call
```
// package.json
"scripts": {
  "start": "node run.js"
}
```

In doubt take a look at [tiny ts-node example](/ts-node-example)
