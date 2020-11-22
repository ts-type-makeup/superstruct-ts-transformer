import ts from "typescript";
import path from "path";
import fs from "fs";
import { createValidatorTransformer } from "../transformer";

compile({
  rootNames: [path.resolve(__dirname, "debug-source.ts")],
  options: {
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.ESNext,
    strict: true
    // strictNullChecks: true,
  }
});

function compile(createProgramOptions: ts.CreateProgramOptions) {
  const program = ts.createProgram(createProgramOptions);

  const result = program.emit(undefined, undefined, undefined, undefined, {
    before: [createValidatorTransformer(program)]
  });
  // result.

  return;
  createProgramOptions.rootNames.forEach(filename => {
    const sourceText = fs.readFileSync(path.resolve(__dirname, filename), {
      encoding: "utf-8"
    });

    const output = ts.transpileModule(sourceText, {
      compilerOptions: createProgramOptions.options,
      transformers: {
        before: [createValidatorTransformer(program)]
      }
    });

    console.log(output.outputText);

    // const output2 = ts.transpileModule(sourceText, {
    //   compilerOptions: options,
    //   transformers: {
    //     before: [createValidatorTransformer(program)]
    //   }
    // });

    // console.log(output2.outputText);
  });
}
