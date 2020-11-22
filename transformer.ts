import ts, { SignatureKind } from "typescript";
import { TypeModel, typeVisitor, TypeModelObject } from "ts-type-visitor";
import {
  createSuperStructDotSuperstructPropAccess,
  createSuperStructValidatorForm
} from "./validator";

const flatten = <T>(arr: T[][]) =>
  arr.reduce((acc, curr) => [...acc, ...curr], []);

const createSuperStructValidator = (
  typeModel: TypeModel,
  functionName: string,
  strictNullChecks: boolean,
  customValidators?: Map<ts.Type, string>
) => {
  const customValidatorsObjectLiteralProps: ts.PropertyAssignment[] = [];

  if (customValidators && customValidators.size > 0) {
    customValidators?.forEach(funcName => {
      customValidatorsObjectLiteralProps.push(
        ts.createPropertyAssignment(funcName, ts.createIdentifier(funcName))
      );
    });
  }

  const superstructStructVariable = ts.createVariableStatement(
    /* modifiers */ undefined,
    /* declarations */ [
      ts.createVariableDeclaration(
        /* name */ "struct",
        /* type */ undefined,
        /* initializer */ ts.createCall(
          /* modifiers */ createSuperStructDotSuperstructPropAccess(),
          /* typeParameters */ undefined,
          /* arguments */ [
            ts.createObjectLiteral([
              ts.createPropertyAssignment(
                "types",
                ts.createObjectLiteral(customValidatorsObjectLiteralProps)
              )
            ])
          ]
        )
      )
    ]
  );

  const superstructValidator = ts.createCall(
    /* expression */ ts.createIdentifier("struct"),
    /* typeParameters */ undefined,
    /* arguments */ [
      createSuperStructValidatorForm(
        typeModel,
        /* optional */ false,
        /* strictNullChecks */ strictNullChecks,
        customValidators
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
    [
      superstructStructVariable,
      superstructValidatorVariable,
      ts.createReturn(validatorCall)
    ],
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

type CallToImplement = {
  typeModel: TypeModel;
  functionName: string;
  customValidators: Map<ts.Type, string>;
};

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
      const options = ctx.getCompilerOptions();

      const newValidators = flatten(
        Array.from(typeModels.values()).map(callsToImplement =>
          callsToImplement.map(callToImplement =>
            createSuperStructValidator(
              callToImplement.typeModel,
              callToImplement.functionName,
              options.strict || options.strictNullChecks || false,
              callToImplement.customValidators
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

        let customValidators = new Map<ts.Type, string>();

        const customValidatorsArg = node.arguments[1];
        if (
          customValidatorsArg &&
          ts.isArrayLiteralExpression(customValidatorsArg)
        ) {
          customValidatorsArg.elements.forEach(element => {
            const sym = checker.getSymbolAtLocation(element);
            const type = checker.getTypeAtLocation(element);
            const sigs = checker.getSignaturesOfType(type, SignatureKind.Call);
            // const sig = type.;
            // const name = sig.
            // const decl = sig?.declaration;
            // const decl = sym?.getDeclarations()?.[0] as ts.SignatureDeclaration | undefined;
            // const type2 = decl?.type;
            const decl = sigs[0]?.declaration;
            const typeNode = decl?.type;
            const typeNeeded =
              typeNode && ts.isTypeNode(typeNode)
                ? checker.getTypeFromTypeNode(typeNode)
                : undefined;

            // if (typeNeeded) {

            if (typeNode && ts.isTypePredicateNode(typeNode) && typeNode.type) {
              customValidators.set(
                checker.getTypeFromTypeNode(typeNode.type),
                element.getText()
              );
              // customValidators.set(typeNeeded, element.getText());
            }
            // decl?.getChildren().forEach(child => {
            //   if (ts.isTypePredicateNode(child) && child.type) {
            //     customValidators.set(
            //       checker.getTypeFromTypeNode(child.type),
            //       "isUuid"
            //     );
            //   }
            // });
          });
        }

        const newCallToImplement: CallToImplement = {
          typeModel,
          functionName: newFunctionName,
          customValidators
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
