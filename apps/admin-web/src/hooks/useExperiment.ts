import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fetchExperimentAssignment, recordExperimentEvent } from '../services/api.ts';
import type { ExperimentAssignment } from '../services/api.ts';

type ExperimentEvent = 'exposure' | 'conversion';

type ExperimentCacheEntry = {
  variant: string;
  timestamp: number;
  exposureRecorded: boolean;
};

export type UseExperimentOptions = {
  variants?: string[];
  cacheTtlSeconds?: number;
  autoRecordExposure?: boolean;
  platform?: string;
};

export type UseExperimentResult = {
  variant: string | null;
  loading: boolean;
  error: string | null;
  recordExposure: (properties?: Record<string, any>) => Promise<void>;
  recordConversion: (properties?: Record<string, any>) => Promise<void>;
  refresh: () => Promise<void>;
};

const DEFAULT_CACHE_TTL = 6 * 60 * 60; // 6 hours
const ASSIGNMENT_PREFIX = 'ab:assignment:';

const getStorage = () => {
  if (typeof window === 'undefined') return null;
  try {
    return window.sessionStorage;
  } catch (error) {
    return null;
  }
};

const readCache = (key: string): ExperimentCacheEntry | null => {
  const storage = getStorage();
  if (!storage) return null;
  const raw = storage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ExperimentCacheEntry;
  } catch (error) {
    storage.removeItem(key);
    return null;
  }
};

const writeCache = (key: string, value: ExperimentCacheEntry) => {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch (error) {
    // Ignore quota errors silently
  }
};

const deleteCache = (key: string) => {
  const storage = getStorage();
  if (!storage) return;
  storage.removeItem(key);
};

const buildCacheKey = (experiment: string, variants?: string[]) => {
  const variantsKey = variants && variants.length > 0 ? variants.join('|') : 'default';
  return `${ASSIGNMENT_PREFIX}${experiment}:${variantsKey}`;
};

export function useExperimentAssignment(
  experiment: string,
  options: UseExperimentOptions = {},
): UseExperimentResult {
  const variants = options.variants ?? [];
  const cacheTtl = (options.cacheTtlSeconds ?? DEFAULT_CACHE_TTL) * 1000;
  const autoRecord = options.autoRecordExposure ?? true;
  const platform = options.platform ?? 'web';

  const cacheKey = useMemo(
    () => buildCacheKey(experiment, variants.length ? variants : undefined),
    [experiment, variants.join('|')],
  );

  const [variant, setVariant] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const exposureRecordedRef = useRef<boolean>(false);

  const updateStateFromCache = useCallback(() => {
    const cache = readCache(cacheKey);
    if (!cache) return false;
    if (Date.now() - cache.timestamp > cacheTtl) {
      deleteCache(cacheKey);
      return false;
    }
    setVariant(cache.variant);
    exposureRecordedRef.current = cache.exposureRecorded;
    setLoading(false);
    return true;
  }, [cacheKey, cacheTtl]);

  const persistCache = useCallback(
    (assignment: ExperimentAssignment, exposureRecorded: boolean) => {
      writeCache(cacheKey, {
        variant: assignment.variant,
        timestamp: Date.now(),
        exposureRecorded,
      });
    },
    [cacheKey],
  );

  const fetchAssignment = useCallback(
    async (forceRecordExposure: boolean = false) => {
      setLoading(true);
      setError(null);
      try {
        const assignment = await fetchExperimentAssignment({
          experiment,
          variants: variants.length ? variants : undefined,
          recordExposure: autoRecord && (forceRecordExposure || !exposureRecordedRef.current),
          platform,
        });
        setVariant(assignment.variant);
        const exposureRecorded = autoRecord ? true : exposureRecordedRef.current;
        exposureRecordedRef.current = exposureRecorded;
        persistCache(assignment, exposureRecorded);
      } catch (err: any) {
        setError(err?.message ?? 'Failed to load experiment assignment');
      } finally {
        setLoading(false);
      }
    },
    [autoRecord, experiment, persistCache, platform, variants],
  );

  useEffect(() => {
    const cacheHit = updateStateFromCache();
    if (cacheHit && (!autoRecord || exposureRecordedRef.current)) {
      // Cached assignment is valid and exposure already recorded when required
      return;
    }
    fetchAssignment(!cacheHit);
  }, [autoRecord, fetchAssignment, updateStateFromCache]);

  const recordEvent = useCallback(
    async (event: ExperimentEvent, properties?: Record<string, any>) => {
      if (!variant) return;
      await recordExperimentEvent({
        experiment,
        event,
        variant,
        properties,
      });
      if (event === 'exposure') {
        exposureRecordedRef.current = true;
        persistCache({ experiment, variant }, true);
      }
    },
    [experiment, persistCache, variant],
  );

  const recordExposure = useCallback(
    async (properties?: Record<string, any>) => {
      if (!variant) return;
      if (autoRecord && exposureRecordedRef.current) return;
      await recordEvent('exposure', properties);
    },
    [autoRecord, recordEvent, variant],
  );

  const recordConversion = useCallback(
    async (properties?: Record<string, any>) => {
      if (!variant) return;
      await recordEvent('conversion', properties);
    },
    [recordEvent, variant],
  );

  const refresh = useCallback(async () => {
    await fetchAssignment(true);
  }, [fetchAssignment]);

  return {
    variant,
    loading,
    error,
    recordExposure,
    recordConversion,
    refresh,
  };
}

export function clearExperimentCache(experiment: string, variants?: string[]) {
  const cacheKey = buildCacheKey(experiment, variants && variants.length ? variants : undefined);
  deleteCache(cacheKey);
}

export function clearAllExperimentCaches() {
  const storage = getStorage();
  if (!storage) return;
  const keysToRemove: string[] = [];
  for (let i = 0; i < storage.length; i += 1) {
    const key = storage.key(i);
    if (key && key.startsWith(ASSIGNMENT_PREFIX)) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((key) => storage.removeItem(key));
}
