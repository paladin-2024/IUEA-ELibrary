import { useState, useCallback, useRef } from 'react';
import api from '../services/api';

/**
 * useInfiniteBooks — cursor-based infinite scroll for the books list.
 *
 * @param {object} initialParams  — query params sent to GET /books
 * @returns {{ books, isLoading, hasMore, loadMore, reset }}
 */
export default function useInfiniteBooks(initialParams = {}) {
  const [books,     setBooks]     = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore,   setHasMore]   = useState(true);
  const pageRef = useRef(1);
  const paramsRef = useRef(initialParams);

  const loadMore = useCallback(async (overrideParams) => {
    if (isLoading || !hasMore) return;

    const params = overrideParams ?? paramsRef.current;
    paramsRef.current = params;

    setIsLoading(true);
    try {
      const { data } = await api.get('/books', {
        params: { ...params, page: pageRef.current, limit: 20 },
      });
      const incoming = data.books ?? [];
      setBooks((prev) => (pageRef.current === 1 ? incoming : [...prev, ...incoming]));
      setHasMore(pageRef.current < (data.pages ?? 1));
      pageRef.current += 1;
    } catch {}
    setIsLoading(false);
  }, [isLoading, hasMore]);

  const reset = useCallback((newParams = {}) => {
    paramsRef.current = newParams;
    pageRef.current   = 1;
    setBooks([]);
    setHasMore(true);
  }, []);

  return { books, isLoading, hasMore, loadMore, reset };
}
