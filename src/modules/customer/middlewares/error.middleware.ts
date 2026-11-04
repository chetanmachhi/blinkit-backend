import { createErrorHandler } from "../../../shared";
import config from "../config/env";

export const errorHandler = createErrorHandler({
  isProduction: config.NODE_ENV === "production",
});
