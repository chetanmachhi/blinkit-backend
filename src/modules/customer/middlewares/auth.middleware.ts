import { createAuthMiddleware } from "../../../shared";
import config from "../config/env";

export const authenticate = createAuthMiddleware({
  accessSecret: config.JWT_ACCESS_SECRET,
});
