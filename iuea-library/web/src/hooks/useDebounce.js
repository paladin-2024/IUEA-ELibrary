import { useState, useEffect } from 'react';

/**
 * useDebounce — returns a debounced copy of `value` that only updates
 * after `delay` ms of inactivity.
 */
export default function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}
