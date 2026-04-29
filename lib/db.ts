import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createMockClient(): PrismaClient {
  const fieldsProxy: any = new Proxy({}, { get: () => undefined });

  const modelHandler: ProxyHandler<any> = {
    get(_target, prop: string) {
      switch (prop) {
        case "count":
          return async () => 0;
        case "findMany":
        case "groupBy":
          return async () => [];
        case "findUnique":
        case "findFirst":
          return async () => null;
        case "findUniqueOrThrow":
        case "findFirstOrThrow":
          return async () => null;
        case "aggregate":
          return async () => ({
            _count: 0,
            _sum: {},
            _avg: {},
            _min: {},
            _max: {},
          });
        case "create":
        case "update":
        case "upsert":
          return async (args: any) => ({ id: "dev-mock-id", ...(args?.data ?? {}) });
        case "createMany":
        case "updateMany":
        case "deleteMany":
          return async () => ({ count: 0 });
        case "delete":
          return async () => null;
        case "fields":
          return fieldsProxy;
        default:
          return async () => null;
      }
    },
  };

  const modelProxyCache = new Map<string, any>();

  const handler: ProxyHandler<any> = {
    get(_target, prop: string) {
      if (typeof prop === "symbol") return undefined;

      if (prop.startsWith("$")) {
        if (prop === "$transaction") {
          return async (input: any) => {
            if (typeof input === "function") return input(client);
            if (Array.isArray(input)) return Promise.all(input);
            return null;
          };
        }
        if (prop === "$queryRaw" || prop === "$executeRaw" || prop === "$queryRawUnsafe" || prop === "$executeRawUnsafe") {
          return async () => [];
        }
        if (prop === "$connect" || prop === "$disconnect") {
          return async () => undefined;
        }
        if (prop === "$on" || prop === "$use" || prop === "$extends") {
          return () => client;
        }
        return async () => null;
      }

      if (!modelProxyCache.has(prop)) {
        modelProxyCache.set(prop, new Proxy({}, modelHandler));
      }
      return modelProxyCache.get(prop);
    },
  };

  const client = new Proxy({}, handler) as unknown as PrismaClient;
  return client;
}

function createClient(): PrismaClient {
  if (process.env.DEV_BYPASS === "true") {
    return createMockClient();
  }
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const db = globalForPrisma.prisma || createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
