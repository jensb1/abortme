import type { ElectrobunConfig } from "electrobun";

export default {
  app: {
    name: "AbortMe",
    identifier: "dev.abortme.app",
    version: "0.0.1",
  },
  build: {
    bun: {
      entrypoint: "src/main/index.ts",
    },
    views: {},
    copy: {
      "dist/renderer": "views/renderer",
    },
  },
} satisfies ElectrobunConfig;
