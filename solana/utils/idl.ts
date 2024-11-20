import { stakingIdl } from "../constants/staking-idl.js";
import type { Idl, IdlConst, IdlErrorCode } from "@coral-xyz/anchor/dist/cjs/idl.js";

type ErrorItem = IdlErrorCode

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

const camelToSnakeUpperCase = (str: string): string => {
	return str.replace(/([a-z])([A-Z])/g, "$1_$2").toUpperCase();
};

export const useErrorsIDL = <T extends { errors: Readonly<ErrorItem[]>}>(
	idl: T,
): ErrorsIDLMap<T["errors"]> => {
	const errors = idl.errors;

    if (!errors) {
		throw new Error("No errors found in IDL");
	}

	const mappedErrors = errors.reduce(
		(acc, error) => {
			const key = camelToSnakeUpperCase(error.name) as Uppercase<
				SnakeCase<(typeof error)["name"]>
			>;
			acc[key] = error;
			return acc;
		},
		{} as ErrorsIDLMap<typeof errors>,
	);

	return mappedErrors;
};

type ConstantItem = IdlConst;

type ConstantsIDLMap<Constants extends ConstantItem[]> = {
    [E in Constants[number] as Uppercase<E["name"]>]: E['value'];
};

export const useConstantsIDL = <T extends { constants: Readonly<ConstantItem[]> }>(
    idl: T
): ConstantsIDLMap<T["constants"]> => {
    const constants = idl.constants

    if (!constants) {
        throw new Error("No constants found in IDL");
    }

    const mappedConstants = constants.reduce(
        (acc, constant) => {
            const key = constant.name as (typeof constant)["name"]
            acc[key] = Number.parseInt(constant.value)
            return acc;
        },
        {} as ConstantsIDLMap<typeof constants>,
    );

    return mappedConstants
};

export const constants = useConstantsIDL(stakingIdl);