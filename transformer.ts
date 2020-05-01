import ts from "typescript";
import { TypeModel, typeVisitor, TypeModelObject } from "ts-type-visitor";

const flatten = <T>(arr: T[][]) =>
  arr.reduce((acc, curr) => [...acc, ...curr], []);

const createSuperStructDotStructPropAccess = () =>
  ts.createPropertyAccess(ts.createIdentifier("superstruct"), "struct");

type SuperstructType =
  | "any"
  | "arguments"
  | "array"
  | "boolean"
  | "buffer"
  | "date"
  | "error"
  | "function"
  | "generatorfunction"
  | "map"
  | "null"
  | "number"
  | "object"
  | "promise"
  | "regexp"
  | "set"
  | "string"
  | "symbol"
  | "undefined"
  | "weakmap"
  | "weakset";

type SuperstructFunc =
  | "array"
  | "enum"
  | "function"
  | "instance"
  | "interface"
  | "intersection"
  | "lazy"
  | "dynamic"
  | "literal"
  | "object"
  | "optional"
  | "pick"
  | "record"
  | "scalar"
  | "tuple"
  | "union";

const createSuperstructObjectLiteralFromProps = ({
  props,
  strictNullChecks
}: {
  props: TypeModelObject["props"];
  strictNullChecks: boolean;
}) =>
  ts.createObjectLiteral(
    /* properties */
    props.map(prop =>
      ts.createPropertyAssignment(
        prop.name,
        createSuperStructValidatorForm(prop, prop.optional, strictNullChecks)
      )
    ),
    /* multiline */ true
  );

const createSuperstructLiteral = ({ type: name }: { type: SuperstructType }) =>
  ts.createStringLiteral(name);

const wrapOptional = ({
  exp,
  optional
}: {
  exp: ts.Expression;
  optional: boolean;
}) =>
  optional ? createSuperstructCall({ func: "optional", args: [exp] }) : exp;

const wrapNonStrictNullChecks = ({
  exp,
  strictNullChecks
}: {
  exp: ts.Expression;
  strictNullChecks: boolean;
}) =>
  !strictNullChecks
    ? createSuperstructCall({
        func: "union",
        args: [
          ts.createArrayLiteral([
            createSuperstructLiteral({ type: "null" }),
            exp
          ])
        ]
      })
    : exp;

const wrapOptionalOrNonStrictNullCheck = ({
  exp,
  optional,
  strictNullChecks
}: {
  exp: ts.Expression;
  optional: boolean;
  strictNullChecks: boolean;
}) =>
  wrapOptional({
    exp: wrapNonStrictNullChecks({ exp, strictNullChecks }),
    optional
  });

const createSuperstructCall = ({
  func,
  args
}: {
  func: SuperstructFunc;
  args: ts.Expression[] | undefined;
}) =>
  ts.createCall(
    ts.createPropertyAccess(createSuperStructDotStructPropAccess(), func),
    /* type args */ undefined,
    /* args */ args
  );

const createSuperStructValidatorForm = (
  typeModel: TypeModel,
  optional: boolean,
  strictNullChecks: boolean
): ts.Expression => {
  switch (typeModel.kind) {
    case "any":
    case "unknown":
    case "esSymbol": // ES symbols can't be represented in json
    case "uniqueEsSymbol":
    case "void": // void can't be represented in json
    case "never": // never can't be represented in json
    case "typeParameter": // type parameter can't be represented in json
    case "bigintLiteral": // bigint doesn't have a consistent json representation
    case "bigint": // bigint doesn't have a consistent json representation
    case "bigintLiteral": // bigint doesn't have a consistent json representation
      return createSuperstructLiteral({
        type: "any"
      });

    case "enum":
    case "enumLiteral":
      return wrapOptionalOrNonStrictNullCheck({
        exp: createSuperstructCall({
          func: "union",
          args: [
            ts.createArrayLiteral(
              typeModel.values.map(t =>
                createSuperStructValidatorForm(t, false, strictNullChecks)
              )
            )
          ]
        }),
        optional,
        strictNullChecks
      });

    case "string":
      return wrapOptionalOrNonStrictNullCheck({
        exp: createSuperstructLiteral({ type: "string" }),
        optional,
        strictNullChecks
      });

    case "number":
      return wrapOptionalOrNonStrictNullCheck({
        exp: createSuperstructLiteral({ type: "number" }),
        optional,
        strictNullChecks
      });

    case "boolean":
      return wrapOptionalOrNonStrictNullCheck({
        exp: createSuperstructLiteral({ type: "boolean" }),
        optional,
        strictNullChecks
      });

    case "stringLiteral":
      return wrapOptionalOrNonStrictNullCheck({
        exp: createSuperstructCall({
          func: "literal",
          args: [ts.createLiteral(typeModel.value)]
        }),
        optional,
        strictNullChecks
      });

    case "numberLiteral":
      return wrapOptionalOrNonStrictNullCheck({
        exp: createSuperstructCall({
          func: "literal",
          args: [ts.createLiteral(typeModel.value)]
        }),
        optional,
        strictNullChecks
      });

    case "booleanLiteral":
      return wrapOptionalOrNonStrictNullCheck({
        exp: createSuperstructCall({
          func: "literal",
          args: [ts.createLiteral(typeModel.value)]
        }),
        optional,
        strictNullChecks
      });

    case "undefined":
      return wrapOptionalOrNonStrictNullCheck({
        exp: createSuperstructLiteral({ type: "undefined" }),
        optional,
        strictNullChecks
      });

    case "null":
      return wrapOptionalOrNonStrictNullCheck({
        exp: createSuperstructLiteral({ type: "null" }),
        optional,
        strictNullChecks
      });

    case "objectWithIndex":
      return wrapOptionalOrNonStrictNullCheck({
        exp: createSuperstructCall({
          func: "intersection",
          args: [
            ts.createArrayLiteral([
              createSuperstructCall({
                func: "interface",
                args: [
                  createSuperstructObjectLiteralFromProps({
                    props: typeModel.props,
                    strictNullChecks
                  })
                ]
              }),
              createSuperStructValidatorForm(
                typeModel.index,
                false,
                strictNullChecks
              )
            ])
          ]
        }),
        optional,
        strictNullChecks
      });

    case "object": {
      return wrapOptionalOrNonStrictNullCheck({
        exp: createSuperstructObjectLiteralFromProps({
          props: typeModel.props,
          strictNullChecks
        }),
        optional,
        strictNullChecks
      });
    }

    case "union":
      return wrapOptionalOrNonStrictNullCheck({
        exp: createSuperstructCall({
          func: "union",
          args: [
            ts.createArrayLiteral(
              typeModel.types.map(t =>
                createSuperStructValidatorForm(t, false, strictNullChecks)
              )
            )
          ]
        }),
        optional,
        strictNullChecks
      });

    case "index":
      if (typeModel.keyType.kind === "number") {
        // number object keys can't represented in json
        return createSuperstructLiteral({
          type: "any"
        });
      } else {
        return wrapOptionalOrNonStrictNullCheck({
          exp: createSuperstructCall({
            func: "record",
            args: [
              ts.createArrayLiteral([
                createSuperStructValidatorForm(typeModel.keyType, false, true),
                createSuperStructValidatorForm(
                  typeModel.valueType,
                  false,
                  strictNullChecks
                )
              ])
            ]
          }),
          optional,
          strictNullChecks
        });
      }

    case "intersection":
      return wrapOptionalOrNonStrictNullCheck({
        exp: createSuperstructCall({
          func: "intersection",
          args: [
            ts.createArrayLiteral(
              typeModel.types.map(t =>
                createSuperStructValidatorForm(t, false, strictNullChecks)
              )
            )
          ]
        }),
        optional,
        strictNullChecks
      });

    case "indexedAccess":
      // TODO implement indexedAccess superstruct
      throw new Error("implement indexedAccess superstruct");

    case "conditional":
      // TODO implement conditional superstruct
      throw new Error("implement conditional superstruct");

    case "substitution":
      // TODO implement substitution superstruct
      throw new Error("implement substitution superstruct");

    case "nonPrimitive":
      // TODO implement nonPrimitive superstruct
      throw new Error("implement nonPrimitive superstruct");

    case "unidentified":
      return ts.createStringLiteral("any");

    case "array":
      return wrapOptionalOrNonStrictNullCheck({
        exp: createSuperstructCall({
          func: "array",
          args: [
            ts.createArrayLiteral([
              createSuperStructValidatorForm(
                typeModel.type,
                false,
                strictNullChecks
              )
            ])
          ]
        }),
        optional,
        strictNullChecks
      });

    case "tuple":
      return wrapOptionalOrNonStrictNullCheck({
        exp: createSuperstructCall({
          func: "tuple",
          args: [
            ts.createArrayLiteral(
              typeModel.types.map(t =>
                createSuperStructValidatorForm(t, false, strictNullChecks)
              )
            )
          ]
        }),
        optional,
        strictNullChecks
      });
  }

  const _exhaustiveCheck: never = typeModel;
};

const createSuperStructValidator = (
  typeModel: TypeModel,
  functionName: string,
  strictNullChecks: boolean
) => {
  const superstructValidator = ts.createCall(
    /* expression */ createSuperStructDotStructPropAccess(),
    /* typeParameters */ undefined,
    /* arguments */ [
      createSuperStructValidatorForm(
        typeModel,
        /* optional */ false,
        /* strictNullChecks */ strictNullChecks
      )
    ]
  );

  const superstructValidatorVariable = ts.createVariableStatement(
    /* modifiers */ undefined,
    /* declarations */ [
      ts.createVariableDeclaration(
        /* name */ "validator",
        /* type */ undefined,
        /* initializer */ superstructValidator
      )
    ]
  );

  const validatorCall = ts.createCall(
    /* expression */ ts.createIdentifier("validator"),
    /* typeParameters */ undefined,
    /* arguments */ [ts.createIdentifier("jsonObj")]
  );

  const body = ts.createBlock(
    [superstructValidatorVariable, ts.createReturn(validatorCall)],
    /* multiline */ true
  );

  const validateFunc = ts.createFunctionDeclaration(
    /* decorators */ undefined,
    /* modifiers */ undefined,
    /* asteriskToken */ undefined,
    /* name */ functionName,
    /* typeParameters */ undefined,
    /* parameters */ [
      ts.createParameter(
        undefined,
        undefined,
        undefined,
        "jsonObj",
        undefined,
        undefined,
        undefined
      )
    ],
    /* type */ undefined,
    /* body */ body
  );

  return validateFunc;
};

type CallToImplement = { typeModel: TypeModel; functionName: string };

function isOurModule(moduleName: string) {
  if (process.env.SUPERSTRUCT_TS_TRANSFORMER_ENV === "debug") {
    return moduleName == "../index";
  }
  return moduleName == "superstruct-ts-transformer";
}

const createVisitor = (
  ctx: ts.TransformationContext,
  sourceFile: ts.SourceFile,
  checker: ts.TypeChecker
) => {
  const typeModels = new Map<ts.SourceFile, CallToImplement[]>();

  const visitor: ts.Visitor = (node: ts.Node) => {
    const pass = () => ts.visitEachChild(node, visitor, ctx);

    if (
      ts.isImportDeclaration(node) &&
      ts.isStringLiteral(node.moduleSpecifier) &&
      isOurModule(node.moduleSpecifier.text)
    ) {
      const moduleTarget = ctx.getCompilerOptions().module;

      if (moduleTarget === ts.ModuleKind.CommonJS) {
        return ts.createVariableStatement(
          /* modifiers */ [ts.createModifier(ts.SyntaxKind.ConstKeyword)],
          /* declarations */ [
            ts.createVariableDeclaration(
              /* name  */ "superstruct",
              /* type */ undefined,
              /* initializer */ ts.createCall(
                /* expression */ ts.createIdentifier("require"),
                /* type args */ undefined,
                /* args */ [ts.createLiteral("superstruct")]
              )
            )
          ]
        );
      } else if (
        moduleTarget === ts.ModuleKind.ES2015 ||
        moduleTarget === ts.ModuleKind.ESNext
      ) {
        const superstructStructImportClause = ts.createImportClause(
          /* name */ undefined,
          /* named bindings */ ts.createNamespaceImport(
            /* name */ ts.createIdentifier("superstruct")
          )
        );

        return ts.createImportDeclaration(
          /* decorators */ undefined,
          /* modifiers */ node.modifiers,
          /* import clause */ superstructStructImportClause,
          /* module specifier */ ts.createStringLiteral("superstruct")
        );
      } else {
        throw new Error(
          "superstruct-ts-transformer doesn't support module targets other than CommonJS and ES2015+"
        );
      }
    }

    if (ts.isSourceFile(node)) {
      const newFileNode = ts.visitEachChild(node, visitor, ctx);

      const newValidators = flatten(
        Array.from(typeModels.values()).map(callsToImplement =>
          callsToImplement.map(callToImplement =>
            createSuperStructValidator(
              callToImplement.typeModel,
              callToImplement.functionName,
              ctx.getCompilerOptions().strictNullChecks || false
            )
          )
        )
      );

      const fileNodeWithValidators = ts.updateSourceFileNode(newFileNode, [
        ...newFileNode.statements,
        ...newValidators
      ]);

      return fileNodeWithValidators;
    }

    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.typeArguments &&
      node.typeArguments.length > 0 &&
      node.arguments.length > 0
    ) {
      const sym = checker.getSymbolAtLocation(node.expression);

      if (
        !!sym &&
        sym.declarations.some(
          decl =>
            ts.isNamedImports(decl.parent) &&
            ts.isImportClause(decl.parent.parent) &&
            ts.isImportDeclaration(decl.parent.parent.parent) &&
            ts.isStringLiteral(decl.parent.parent.parent.moduleSpecifier) &&
            isOurModule(decl.parent.parent.parent.moduleSpecifier.text)
        )
      ) {
        const typeToValidateAgainst = checker.getTypeFromTypeNode(
          node.typeArguments[0]
        );

        const typeModel = typeVisitor(checker, typeToValidateAgainst);
        const typeToValidateAgainstStr = checker
          .typeToString(typeToValidateAgainst)
          .replace(/\[/g, "ARRAY_")
          .replace(/\]/g, "_ENDARRAY")
          .replace(/\s/g, "_")
          .replace(/[\,]/g, "");

        const functionName = node.expression.text;

        const newFunctionName = `${functionName}_${typeToValidateAgainstStr}`;

        const newCallToImplement: CallToImplement = {
          typeModel,
          functionName: newFunctionName
        };

        if (typeModels.has(sourceFile)) {
          typeModels.set(sourceFile, [
            ...typeModels.get(sourceFile)!,
            newCallToImplement
          ]);
        } else {
          typeModels.set(sourceFile, [newCallToImplement]);
        }

        return ts.createCall(
          /* expression */ ts.createIdentifier(newFunctionName),
          /* type argmuents */ undefined,
          /* arguments */ node.arguments.slice(0, 1)
        );
      }
    }

    return pass();
  };

  return visitor;
};

export const createValidatorTransformer = (program: ts.Program) => (
  ctx: ts.TransformationContext
): ts.Transformer<ts.SourceFile> => (sf: ts.SourceFile) =>
  ts.visitNode(sf, createVisitor(ctx, sf, program.getTypeChecker()));
