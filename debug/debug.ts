import ts from "typescript";
import path from "path";
import fs from "fs";
import { createValidatorTransformer } from "../transformer";

compile(["./debug-source.ts"], {
  target: ts.ScriptTarget.ESNext,
  module: ts.ModuleKind.ESNext
});

function compile(filenames: string[], options: ts.CompilerOptions) {
  const program = ts.createProgram(filenames, options);

  filenames.forEach(filename => {
    const sourceText = fs.readFileSync(path.resolve(__dirname, filename), {
      encoding: "utf-8"
    });

    const output = ts.transpileModule(sourceText, {
      compilerOptions: options,
      transformers: {
        before: [createValidatorTransformer(program)]
      }
    });

    console.log(output.outputText);
  });
}
