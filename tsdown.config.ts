import { defineConfig, type UserConfig } from "tsdown";

const config: UserConfig[] = defineConfig([
  {
    entry: { index: "src/index.ts", cli: "src/cli.ts" },
    platform: "node",
    fixedExtension: false,
    dts: true,
  },
  {
    entry: { client: "src/client/index.ts", preact: "src/preact.ts" },
    platform: "browser",
    fixedExtension: false,
    dts: true,
    clean: false,
  },
]);

export default config;
