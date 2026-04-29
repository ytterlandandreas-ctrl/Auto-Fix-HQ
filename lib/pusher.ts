import PusherServer from "pusher";
import * as PusherJs from "pusher-js";

// pusher-js v8 ships a CJS bundle that attaches the constructor as a named
// property (`module.exports.Pusher`). Turbopack does not synthesize a default
// export from that pattern, so we resolve the constructor manually.
const PusherClientCtor: any =
  (PusherJs as any).default ??
  (PusherJs as any).Pusher ??
  PusherJs;

export const CHANNELS = {
  shop: (shopId: string) => `shop-${shopId}`,
  techBoard: (shopId: string) => `tech-board-${shopId}`,
  roUpdates: (roId: string) => `ro-${roId}`,
  messages: (shopId: string) => `messages-${shopId}`,
};

export const EVENTS = {
  RO_STATUS_CHANGED: "ro-status-changed",
  TECH_CLOCKED_IN: "tech-clocked-in",
  TECH_CLOCKED_OUT: "tech-clocked-out",
  INSPECTION_APPROVED: "inspection-approved",
  NEW_MESSAGE: "new-message",
  INVENTORY_LOW: "inventory-low",
};

const stubChannel = {
  bind: (_event: string, _cb: (...args: any[]) => void) => stubChannel,
  unbind: (_event?: string, _cb?: (...args: any[]) => void) => stubChannel,
  unbind_all: () => stubChannel,
  trigger: (_event: string, _data: any) => false,
};

const stubPusherClient: any = {
  subscribe: (_channel: string) => stubChannel,
  unsubscribe: (_channel: string) => undefined,
  bind: (_event: string, _cb: (...args: any[]) => void) => stubPusherClient,
  unbind: (_event?: string, _cb?: (...args: any[]) => void) => stubPusherClient,
  disconnect: () => undefined,
  connection: {
    bind: () => undefined,
    unbind: () => undefined,
    state: "disconnected",
  },
};

const stubPusherServer: any = {
  trigger: async (_channel: string | string[], _event: string, _data: any) => undefined,
  triggerBatch: async () => undefined,
  authorizeChannel: () => ({ auth: "" }),
  authenticateUser: () => ({ auth: "" }),
};

const devBypass = process.env.DEV_BYPASS === "true";

const hasServerEnv = Boolean(
  process.env.PUSHER_APP_ID &&
    process.env.PUSHER_KEY &&
    process.env.PUSHER_SECRET &&
    process.env.PUSHER_CLUSTER
);

const hasClientEnv = Boolean(
  process.env.NEXT_PUBLIC_PUSHER_KEY && process.env.NEXT_PUBLIC_PUSHER_CLUSTER
);

export const pusherServer: any =
  devBypass || !hasServerEnv
    ? stubPusherServer
    : new PusherServer({
        appId: process.env.PUSHER_APP_ID!,
        key: process.env.PUSHER_KEY!,
        secret: process.env.PUSHER_SECRET!,
        cluster: process.env.PUSHER_CLUSTER!,
        useTLS: true,
      });

export const pusherClient: any =
  devBypass || !hasClientEnv
    ? stubPusherClient
    : new PusherClientCtor(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      });

export async function triggerRoUpdate(
  shopId: string,
  roId: string,
  event: string,
  data: object
) {
  await pusherServer.trigger(CHANNELS.shop(shopId), event, { roId, ...data });
}

export async function triggerTechUpdate(
  shopId: string,
  event: string,
  data: object
) {
  await pusherServer.trigger(CHANNELS.techBoard(shopId), event, data);
}
