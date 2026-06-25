import type { IntlShape } from "react-intl";
import { ApiError } from "./effectApi";

// Reads the stable identifier off a thrown error. Our own failures are ApiError
// (see effectApi); errors thrown by the Canva SDK (CanvaError) also expose a
// string `code`, so the export flow can reuse this mapping too.
function errorCode(error: unknown): string | undefined {
  if (error instanceof ApiError) {
    return error.code;
  }
  if (error && typeof error === "object" && "code" in error) {
    const { code } = error as { code: unknown };
    if (typeof code === "string") {
      return code;
    }
  }
  return undefined;
}

// Maps a thrown error to a localized, user-facing message. We switch on the
// error's identifier and never surface the backend's raw string, so the message
// always matches the user's current Canva language. See:
// https://www.canva.dev/docs/apps/localization/backend-responses/
export function apiErrorMessage(error: unknown, intl: IntlShape): string {
  switch (errorCode(error)) {
    case "unauthorized":
    case "permission_denied":
    case "missing_permission":
      return intl.formatMessage({
        defaultMessage:
          "Your Canva session has expired. Please close and reopen the app, then try again.",
        description:
          "Error shown when the backend rejects the request because the user is not authorized",
      });
    case "rate_limited":
    case "quota_exceeded":
      return intl.formatMessage({
        defaultMessage:
          "You're sending requests too quickly. Please wait a moment and try again.",
        description: "Error shown when the user is rate limited by the backend",
      });
    case "network_error":
    case "user_offline":
    case "timeout":
      return intl.formatMessage({
        defaultMessage:
          "We couldn't reach the server. Check your connection and try again.",
        description:
          "Error shown when the request fails at the network level before a response arrives",
      });
    default:
      return intl.formatMessage({
        defaultMessage: "Something went wrong. Please try again.",
        description: "Generic fallback error message for a failed request",
      });
  }
}
