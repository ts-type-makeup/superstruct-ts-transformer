import { TypeModelObject, TypeModel } from "ts-type-visitor";
import ts from "typescript";

export const createSuperStructDotStructPropAccess = () =>
  ts.createPropertyAccess(ts.createIdentifier("superstruct"), "struct");

export const createSuperStructDotSuperstructPropAccess = () =>
  ts.createPropertyAccess(ts.createIdentifier("superstruct"), "superstruct");

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

export const createSuperStructValidatorForm = (
  typeModel: TypeModel,
  optional: boolean,
  strictNullChecks: boolean,
  customValidators?: Map<ts.Type, string>
): ts.Expression => {
  const funcName =
    typeModel.originalType && customValidators?.get(typeModel.originalType);

  if (funcName) {
    return ts.createStringLiteral(funcName);
  }

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
