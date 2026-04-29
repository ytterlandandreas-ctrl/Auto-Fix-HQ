"use client";

import { useEffect } from "react";
import { syncOfflineQueue, getPendingCount } from "@/lib/offline-queue";
import { toast } from "sonner";

export function ServiceWorkerProvider() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js").catch((err) => {
      console.warn("SW registration failed", err);
    });

    // Listen for messages from SW
    navigator.serviceWorker.addEventListener("message", (event) => {
      if (event.data?.type === "SYNC_QUEUE") {
        syncQueue();
      }
    });

    // Sync queue when coming back online
    const handleOnline = async () => {
      const count = await getPendingCount();
      if (count > 0) {
        toast.info(`Syncing ${count} offline change${count > 1 ? "s" : ""}...`);
        syncQueue();
      }
    };

    window.addEventListener("online", handleOnline);
    if (navigator.onLine) syncQueue();

    return () => {
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  async function syncQueue() {
    try {
      const result = await syncOfflineQueue();
      if (result.synced > 0) toast.success(`Synced ${result.synced} change${result.synced > 1 ? "s" : ""}`);
      if (result.conflicts > 0) toast.warning(`${result.conflicts} change${result.conflicts > 1 ? "s" : ""} had conflicts — review`);
      if (result.failed > 0) toast.error(`${result.failed} change${result.failed > 1 ? "s" : ""} failed to sync`);
    } catch (err) {
      // silent
    }
  }

  return null;
}
