type BigIntToString<T> = T extends bigint
  ? string
  : T extends object
    ? { [K in keyof T]: BigIntToString<T[K]> }
    : T;

export function serializeBigInts<T>(obj: T): BigIntToString<T> {
  if (typeof obj === "bigint") {
    return obj.toString() as BigIntToString<T>;
  }

  if (Array.isArray(obj)) {
    return obj.map(serializeBigInts) as BigIntToString<T>;
  }

  if (typeof obj === "object" && obj !== null) {
    const result: any = {};
    for (const key in obj) {
      result[key] = serializeBigInts(obj[key]);
    }
    return result as BigIntToString<T>;
  }

  return obj as BigIntToString<T>;
}
