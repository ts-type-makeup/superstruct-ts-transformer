// @ts-check
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

require("./index.ts");
