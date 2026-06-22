import { describe, expect, it } from "vitest";
import { parsePagination } from "./api-util.js";

describe("parsePagination", () => {
  it("defaults to limit 100 / offset 0 when absent", () => {
    expect(parsePagination({})).toEqual({ limit: 100, offset: 0 });
  });

  it("reads provided numeric strings", () => {
    expect(parsePagination({ limit: "25", offset: "50" })).toEqual({
      limit: 25,
      offset: 50,
    });
  });

  it("clamps limit into [1, maxLimit] and offset to >= 0", () => {
    expect(parsePagination({ limit: "0" }).limit).toBe(100); // 0 → default
    expect(parsePagination({ limit: "-3" }).limit).toBe(1); // below floor
    expect(parsePagination({ limit: "99999" }).limit).toBe(1000); // above ceiling
    expect(parsePagination({ offset: "-5" }).offset).toBe(0);
  });

  it("ignores non-numeric input by falling back to defaults", () => {
    expect(parsePagination({ limit: "abc", offset: "xyz" })).toEqual({
      limit: 100,
      offset: 0,
    });
  });

  it("honours custom defaultLimit / maxLimit", () => {
    expect(parsePagination({}, { defaultLimit: 50 }).limit).toBe(50);
    expect(parsePagination({ limit: "500" }, { maxLimit: 200 }).limit).toBe(200);
  });
});
