import type { IdlConst, IdlErrorCode } from "@coral-xyz/anchor/dist/cjs/idl.js";
import BN from "bn.js";

const camelToSnakeUpperCase = (str: string): string => {
  return str.replace(/([a-z])([A-Z])/g, "$1_$2").toUpperCase();
};

type ErrorItem = IdlErrorCode;

type ErrorsIDLMap<Errors extends ErrorItem[]> = {
  [E in Errors[number] as Uppercase<SnakeCase<E["name"]>>]: E;
};

type CamelToSnakeCase<S extends string> = S extends `${infer Head}${infer Rest}`
  ? `${Head extends "_"
      ? ""
      : Head extends Capitalize<Head>
      ? "_"
      : ""}${Lowercase<Head>}${CamelToSnakeCase<Rest>}`
  : S;

type RemoveFirstUnderscore<S> = S extends `_${infer R}` ? R : S;

export type SnakeCase<S extends string> = RemoveFirstUnderscore<
  CamelToSnakeCase<S>
>;

export const useErrorsIDL = <T extends { errors: Readonly<ErrorItem[]> }>(
  idl: T
): ErrorsIDLMap<T["errors"]> => {
  const errors = idl.errors;

  if (!errors) {
    throw new Error("No errors found in IDL");
  }

  const mappedErrors = errors.reduce((acc, error) => {
    const key = camelToSnakeUpperCase(error.name) as Uppercase<
      SnakeCase<(typeof error)["name"]>
    >;
    acc[key] = error;
    return acc;
  }, {} as ErrorsIDLMap<typeof errors>);

  return mappedErrors;
};

type ConstantItem = IdlConst;

type ConstantsIDLMap<Constants extends ConstantItem[]> = {
  [E in Constants[number] as Uppercase<E["name"]>]: E["value"];
};

type AnchorConstantTypeMap = {
  u128: BN;
  u64: number;
  u32: number;
  u16: number;
  u8: number;
  i128: BN;
  i64: number;
  i32: number;
  i16: number;
  i8: number;
  string: string;
  bool: boolean;
};

type ParsedAnchorConstant<T extends IdlConst[]> = {
  [K in keyof T]: T[K] extends { name: infer N; type: infer U; value: string }
    ? U extends keyof AnchorConstantTypeMap
      ? { name: N; value: AnchorConstantTypeMap[U] }
      : never
    : never;
};

function parseAnchorConstants<T extends IdlConst[]>(
  constants: T
): ParsedAnchorConstant<T> {
  const typeMap: {
    [key in keyof AnchorConstantTypeMap]: (value: string) => unknown;
  } = {
    u128: (value) => new BN(value),
    u64: (value) => Number(value),
    u32: (value) => Number(value),
    u16: (value) => Number(value),
    u8: (value) => Number(value),
    i128: (value) => new BN(value),
    i64: (value) => Number(value),
    i32: (value) => Number(value),
    i16: (value) => Number(value),
    i8: (value) => Number(value),
    string: (value) => String(value),
    bool: (value) => value === "true",
  };

  return (constants as IdlConst[]).map(({ name, type, value }) => {
    const parser = typeMap[type];
    if (!parser) {
      throw new Error(`Unsupported type '${type}' for constant '${name}'.`);
    }
    return {
      name,
      value: parser(value),
    };
  }) as ParsedAnchorConstant<T>;
}

export const useConstantsIDL = <T extends { constants: Readonly<IdlConst[]> }>(
  idl: T
): ConstantsIDLMap<ParsedAnchorConstant<T["constants"]>> => {
  const constants = idl.constants;

  if (!constants) {
    throw new Error("No constants found in IDL");
  }

  const mappedConstants = constants.reduce((acc, constant) => {
    const key = constant.name as (typeof constant)["name"];
    acc[key] = parseAnchorConstants([constant])[0].value;
    return acc;
  }, {} as ConstantsIDLMap<typeof constants>);

  return mappedConstants;
};
