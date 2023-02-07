/**
 * TODO
 */
import path from "path";
import { toBoolean } from "../../utils/boolean.utils";
import { CONSTANTS } from "../../constants/mesh.constants";
import { getEnv } from "../../utils/env.utils";

/**
 * TODO
 * @type {{}}
 */
export const MINIMESH = {
  ...CONSTANTS,
  isProduction: function () {
    return this.environment === "production";
  },
  isLocal: function () {
    return this.environment === "local";
  },
  setRoot: function (dir: string) {
    this.root = path.dirname(path.normalize(dir));
  },
  host: getEnv(CONSTANTS.env.host.key) ?? CONSTANTS.env.host.value,
  port: getEnv(CONSTANTS.env.port.key) ?? CONSTANTS.env.port.value,
  root: process.cwd(),
  environment: (getEnv(CONSTANTS.env.environment.key) ??
    CONSTANTS.env.environment.value) as
    | "local"
    | "development"
    | "test"
    | "production",
  enableRequestLogging: toBoolean(
    getEnv(CONSTANTS.env.enableRequestLogging.key) as string
  ),
  logLevel: getEnv(CONSTANTS.env.logLevel.key) ?? CONSTANTS.env.logLevel.value,
  basicAuthUser: getEnv(CONSTANTS.env.basicAuthUser.key),
  basicAuthPassword: getEnv(CONSTANTS.env.basicAuthPassword.key),
};
