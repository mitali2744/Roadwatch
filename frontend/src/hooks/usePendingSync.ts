import { useState, useEffect } from "react";
import { getPendingComplaints, clearPendingComplaints } from "../lib/offlineStore";
import { submitComplaint } from "../api/complaints";
import { useOnlineStatus } from "./useOnlineStatus";
import toast from "react-hot-toast";

export function usePendingSync() {
  const isOnline = useOnlineStatus();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const checkPending = async () => {
      const pending = await getPendingComplaints();
      setPendingCount(pending.length);
    };
    checkPending();
    const interval = setInterval(checkPending, 10000);
    return () => clearInterval(interval);
  }, []);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && pendingCount > 0) {
      syncPending();
    }
  }, [isOnline]);

  const syncPending = async () => {
    const pending = await getPendingComplaints();
    if (pending.length === 0) return;

    let synced = 0;
    for (const complaint of pending) {
      try {
        const formData = new FormData();
        Object.entries(complaint).forEach(([k, v]) => {
          if (v !== undefined && v !== null) formData.append(k, String(v));
        });
        await submitComplaint(formData);
        synced++;
      } catch {
        // Will retry next time
      }
    }

    if (synced > 0) {
      await clearPendingComplaints();
      setPendingCount(0);
      toast.success(`${synced} offline complaint(s) synced`);
    }
  };

  return { pendingCount, syncPending };
}
