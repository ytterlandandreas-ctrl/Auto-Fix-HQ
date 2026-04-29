import { UserRole } from "@prisma/client";

export const DEV_ADMIN_SESSION = {
  user: {
    id: "dev-admin-id",
    email: "dev@autofixhq.com",
    name: "Dev Admin",
    role: "platform_owner" as UserRole,
    shopId: null as string | null,
  },
  expires: "2099-01-01",
};

export const DEV_SHOP_SESSION = {
  user: {
    id: "dev-shop-id",
    email: "dev-shop@autofixhq.com",
    name: "Dev Shop Owner",
    role: "shop_owner" as UserRole,
    shopId: "dev-shop-id",
  },
  expires: "2099-01-01",
};

export const DEV_MOCK_SHOP = {
  id: "dev-shop-id",
  name: "Dev Auto Shop",
  logoUrl: null as string | null,
  isSuspended: false,
  subscriptions: [
    {
      addons: [] as { addonKey: string }[],
    },
  ],
};
