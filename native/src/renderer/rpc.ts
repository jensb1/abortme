import { Electroview } from "electrobun/view";
import type { AppRPC } from "../shared/rpc";

const rpcDef = Electroview.defineRPC<AppRPC>({
  handlers: {
    requests: {},
    messages: ({
      popupTriggered: () => {
        window.dispatchEvent(new Event("popup-triggered"));
      },
      idleStateChanged: (payload: { idle: boolean }) => {
        window.dispatchEvent(
          new CustomEvent("idle-state-changed", { detail: payload }),
        );
      },
    }) as any,
  },
});

let view: Electroview<typeof rpcDef> | null = null;

try {
  view = new Electroview({ rpc: rpcDef });
} catch {
  // RPC unavailable (running in browser without Electrobun)
}

export const rpc = rpcDef;
export { view };
