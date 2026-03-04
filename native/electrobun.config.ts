import type { ElectrobunConfig } from "electrobun";

export default {
  app: {
    name: "AbortMe",
    identifier: "dev.abortme.app",
    version: "0.0.1",
  },
  runtime: {
    exitOnLastWindowClosed: false,
  },
  build: {
    bun: {
      entrypoint: "src/main/index.ts",
    },
    mac: {
      icons: "icon.iconset",
    },
    views: {},
    copy: {
      "dist/renderer": "views/renderer",
      "assets/tray-iconTemplate.png": "assets/tray-iconTemplate.png",
      "assets/tray-iconTemplate@2x.png": "assets/tray-iconTemplate@2x.png",
      "assets/tray-icon-breakTemplate.png": "assets/tray-icon-breakTemplate.png",
      "assets/tray-icon-breakTemplate@2x.png": "assets/tray-icon-breakTemplate@2x.png",
    },
  },
} satisfies ElectrobunConfig;
