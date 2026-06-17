"use client";

import { useEffect, useState, useCallback } from "react";
import type { DashboardData, SyncStatus } from "@/types/dashboard";

interface UseDashboardReturn {
  data: DashboardData | null;
  isLoading: boolean;
  error: string | null;
  syncStatus: SyncStatus;
  refresh: () => void;
}

export function useDashboard(userId: string): UseDashboardReturn {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("synced");

  const fetchDashboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/dashboard/${userId}`, {
        headers: { "Cache-Control": "no-cache" },
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const json: DashboardData = await res.json();
      setData(json);
      setSyncStatus(json.syncStatus);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // Escucha eventos de conectividad para mostrar estado offline
  useEffect(() => {
    const handleOffline = () => setSyncStatus("offline");
    const handleOnline = () => {
      setSyncStatus("syncing");
      setTimeout(() => setSyncStatus("synced"), 3000);
    };
    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  return { data, isLoading, error, syncStatus, refresh: fetchDashboard };
}
