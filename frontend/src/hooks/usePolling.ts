"use client";
import { useState, useEffect, useCallback } from "react";

export function usePolling<T>(fetcher: () => Promise<T>, intervalMs = 18000) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const result = await fetcher();
      setData(result);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [fetcher]);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, intervalMs);
    const onVisibility = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => { clearInterval(id); document.removeEventListener("visibilitychange", onVisibility); };
  }, [refresh, intervalMs]);

  return { data, loading, error, refresh };
}
