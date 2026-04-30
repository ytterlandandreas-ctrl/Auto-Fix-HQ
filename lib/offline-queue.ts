"use client";

import { openDB, DBSchema, IDBPDatabase } from "idb";

interface OfflineQueueDB extends DBSchema {
  queue: {
    key: string;
    value: {
      id: string;
      endpoint: string;
      method: string;
      body: unknown;
      createdAt: number;
      retries: number;
    };
  };
  cachedROs: {
    key: string;
    value: {
      id: string;
      data: unknown;
      cachedAt: number;
    };
  };
}

let dbInstance: IDBPDatabase<OfflineQueueDB> | null = null;

async function getDB() {
  if (!dbInstance) {
    dbInstance = await openDB<OfflineQueueDB>("autofixhq-offline", 1, {
      upgrade(db) {
        db.createObjectStore("queue", { keyPath: "id" });
        db.createObjectStore("cachedROs", { keyPath: "id" });
      },
    });
  }
  return dbInstance;
}

export async function enqueueOfflineAction(
  endpoint: string,
  method: string,
  body: unknown
) {
  const db = await getDB();
  const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  await db.put("queue", {
    id,
    endpoint,
    method,
    body,
    createdAt: Date.now(),
    retries: 0,
  });
  return id;
}

export async function syncOfflineQueue(
  onConflict?: (action: unknown) => void
): Promise<{ synced: number; conflicts: number; failed: number }> {
  const db = await getDB();
  const all = await db.getAll("queue");

  let synced = 0;
  let conflicts = 0;
  let failed = 0;

  for (const action of all) {
    try {
      const res = await fetch(action.endpoint, {
        method: action.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(action.body),
      });

      if (res.ok) {
        await db.delete("queue", action.id);
        synced++;
      } else if (res.status === 409) {
        onConflict?.(action);
        await db.delete("queue", action.id);
        conflicts++;
      } else {
        await db.put("queue", { ...action, retries: action.retries + 1 });
        failed++;
      }
    } catch {
      await db.put("queue", { ...action, retries: action.retries + 1 });
      failed++;
    }
  }

  return { synced, conflicts, failed };
}

export async function getPendingCount(): Promise<number> {
  const db = await getDB();
  return db.count("queue");
}

export async function cacheRO(id: string, data: unknown) {
  const db = await getDB();
  await db.put("cachedROs", { id, data, cachedAt: Date.now() });
}

export async function getCachedRO(id: string) {
  const db = await getDB();
  return db.get("cachedROs", id);
}

export async function getCachedROList() {
  const db = await getDB();
  return db.getAll("cachedROs");
}
