import { createIntl } from "react-intl";
import { apiErrorMessage } from "./apiErrorMessage";
import { ApiError, codeFromStatus, TaskNotFoundError } from "./effectApi";

const intl = createIntl({ locale: "en", defaultLocale: "en", messages: {} });

describe("codeFromStatus", () => {
  it("maps HTTP statuses to stable identifiers", () => {
    expect(codeFromStatus(401)).toBe("unauthorized");
    expect(codeFromStatus(403)).toBe("unauthorized");
    expect(codeFromStatus(404)).toBe("not_found");
    expect(codeFromStatus(429)).toBe("rate_limited");
    expect(codeFromStatus(500)).toBe("server_error");
    expect(codeFromStatus(503)).toBe("server_error");
    expect(codeFromStatus(418)).toBe("unknown");
  });
});

describe("apiErrorMessage", () => {
  it("maps distinct error codes to distinct localized messages", () => {
    const unauthorized = apiErrorMessage(new ApiError("unauthorized"), intl);
    const rateLimited = apiErrorMessage(new ApiError("rate_limited"), intl);
    const network = apiErrorMessage(new ApiError("network_error"), intl);
    const generic = apiErrorMessage(new ApiError("server_error"), intl);

    const messages = [unauthorized, rateLimited, network, generic];
    expect(new Set(messages).size).toBe(messages.length);
    for (const message of messages) {
      expect(message.length).toBeGreaterThan(0);
    }
  });

  it("never surfaces a raw backend-provided string to the user", () => {
    const backendString = "Import failed: row 3 missing column";
    const message = apiErrorMessage(new Error(backendString), intl);

    expect(message).not.toBe(backendString);
    // An error with no identifier falls back to the generic message.
    expect(message).toBe(apiErrorMessage(new ApiError("server_error"), intl));
  });

  it("reads the code off a Canva SDK style error object", () => {
    const canvaError = { code: "rate_limited", message: "untranslated" };
    expect(apiErrorMessage(canvaError, intl)).toBe(
      apiErrorMessage(new ApiError("rate_limited"), intl),
    );
  });

  it("treats a missing task as a not-found generic message, not a raw string", () => {
    const message = apiErrorMessage(new TaskNotFoundError("T-123"), intl);
    expect(message).toBe(apiErrorMessage(new ApiError("server_error"), intl));
  });
});
