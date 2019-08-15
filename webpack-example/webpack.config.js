const {
  createValidatorTransformer
} = require("superstruct-ts-transformer/dist/transformer");

module.exports = {
  entry: "./index.ts",
  output: {
    filename: "bundle.js"
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js"]
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: [
          {
            loader: "ts-loader",
            options: {
              getCustomTransformers: program => ({
                before: [createValidatorTransformer(program)] // <-- custom transfomer configuration
              })
            }
          }
        ]
      }
    ]
  }
};
