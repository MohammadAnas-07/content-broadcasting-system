import { useState, useEffect, useCallback, useRef } from 'react';
import { broadcastService } from '../services/broadcast.service';

/**
 * Custom hook for broadcast polling with smart refetch based on secondsRemainingInSlot.
 * Instead of a dumb interval, it schedules the next fetch precisely when the rotation changes.
 */
export function useBroadcast(teacherId, subject = '') {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const timeoutRef = useRef(null);
  const intervalRef = useRef(null);
  const mountedRef = useRef(true);

  const fetchBroadcast = useCallback(async () => {
    if (!teacherId) return;
    try {
      setIsLoading(true);
      const res = await broadcastService.getLive(teacherId, subject);
      if (!mountedRef.current) return;

      const items = res.data || [];
      setData(items);
      setError(null);

      // Find the minimum secondsRemainingInSlot across all items
      if (items.length > 0) {
        const minRemaining = Math.min(...items.map((i) => i.secondsRemainingInSlot || 300));
        setCountdown(minRemaining);

        // Schedule next fetch at exactly when rotation changes + 1s buffer
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          if (mountedRef.current) fetchBroadcast();
        }, (minRemaining + 1) * 1000);
      } else {
        setCountdown(null);
        // No content — poll every 30 seconds
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          if (mountedRef.current) fetchBroadcast();
        }, 30000);
      }
    } catch (err) {
      if (!mountedRef.current) return;
      setError(err);
      // Retry after 10s on error
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        if (mountedRef.current) fetchBroadcast();
      }, 10000);
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, [teacherId, subject]);

  // Countdown ticker
  useEffect(() => {
    if (countdown === null || countdown <= 0) return;
    intervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(intervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [countdown]);

  // Initial fetch
  useEffect(() => {
    mountedRef.current = true;
    fetchBroadcast();
    return () => {
      mountedRef.current = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchBroadcast]);

  return {
    data,
    isLoading,
    error,
    isEmpty: !isLoading && data.length === 0,
    currentItem: data.length > 0 ? data[0] : null,
    countdown,
    refetch: fetchBroadcast,
  };
}
