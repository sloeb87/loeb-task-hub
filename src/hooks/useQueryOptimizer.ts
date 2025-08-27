import { useRef, useCallback } from 'react';

interface QueryCache {
  [key: string]: {
    data: any;
    timestamp: number;
    ttl: number;
  };
}

interface BatchedOperation {
  id: string;
  operation: () => Promise<any>;
  resolve: (value: any) => void;
  reject: (error: any) => void;
}

const DEFAULT_TTL = 30000; // 30 seconds
const BATCH_DELAY = 100; // 100ms to collect operations

export function useQueryOptimizer() {
  const cacheRef = useRef<QueryCache>({});
  const batchTimeoutRef = useRef<NodeJS.Timeout>();
  const pendingOperationsRef = useRef<BatchedOperation[]>([]);

  // Intelligent caching
  const getCached = useCallback((key: string): any | null => {
    const cached = cacheRef.current[key];
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data;
    }
    delete cacheRef.current[key]; // Clean up expired cache
    return null;
  }, []);

  const setCache = useCallback((key: string, data: any, ttl = DEFAULT_TTL) => {
    cacheRef.current[key] = {
      data,
      timestamp: Date.now(),
      ttl
    };
  }, []);

  // Debounced query execution
  const debouncedQuery = useCallback(<T>(
    key: string,
    queryFn: () => Promise<T>,
    delay = 300
  ): Promise<T> => {
    return new Promise((resolve, reject) => {
      // Check cache first
      const cached = getCached(key);
      if (cached) {
        resolve(cached);
        return;
      }

      // Add to batch
      const operation: BatchedOperation = {
        id: key,
        operation: queryFn,
        resolve,
        reject
      };

      // Remove any existing operation with same key
      const existingIndex = pendingOperationsRef.current.findIndex(op => op.id === key);
      if (existingIndex >= 0) {
        pendingOperationsRef.current[existingIndex].reject(new Error('Superseded by newer query'));
        pendingOperationsRef.current.splice(existingIndex, 1);
      }

      pendingOperationsRef.current.push(operation);

      // Clear existing timeout and set new one
      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current);
      }

      batchTimeoutRef.current = setTimeout(async () => {
        const operations = [...pendingOperationsRef.current];
        pendingOperationsRef.current = [];

        // Execute operations in parallel
        const promises = operations.map(async (op) => {
          try {
            const result = await op.operation();
            setCache(op.id, result);
            op.resolve(result);
          } catch (error) {
            op.reject(error);
          }
        });

        await Promise.allSettled(promises);
      }, delay);
    });
  }, [getCached, setCache]);

  // Cache invalidation
  const invalidateCache = useCallback((pattern?: string) => {
    if (pattern) {
      Object.keys(cacheRef.current).forEach(key => {
        if (key.includes(pattern)) {
          delete cacheRef.current[key];
        }
      });
    } else {
      cacheRef.current = {};
    }
  }, []);

  // Batch updates for multiple operations
  const batchUpdates = useCallback(async <T>(
    operations: Array<{ key: string; operation: () => Promise<T> }>
  ): Promise<Array<{ key: string; result?: T; error?: any }>> => {
    const promises = operations.map(async ({ key, operation }) => {
      try {
        const result = await operation();
        setCache(key, result);
        return { key, result };
      } catch (error) {
        return { key, error };
      }
    });

    return Promise.allSettled(promises).then(results => 
      results.map((result, index) => {
        const { key } = operations[index];
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          return { key, error: result.reason };
        }
      })
    );
  }, [setCache]);

  // Cleanup
  const cleanup = useCallback(() => {
    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current);
    }
    pendingOperationsRef.current.forEach(op => 
      op.reject(new Error('Query optimizer cleanup'))
    );
    pendingOperationsRef.current = [];
  }, []);

  return {
    getCached,
    setCache,
    debouncedQuery,
    batchUpdates,
    invalidateCache,
    cleanup
  };
}