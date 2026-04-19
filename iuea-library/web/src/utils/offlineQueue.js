/**
 * offlineQueue — persists failed API mutations in localStorage and retries
 * them when the browser comes back online.
 *
 * Usage:
 *   offlineQueue.enqueue({ url, method, data })
 *   offlineQueue.flush(api)   // called automatically on 'online' event
 */

const STORAGE_KEY = 'iuea_offline_queue';

function read() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function write(queue) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
}

const offlineQueue = {
  enqueue(item) {
    const queue = read();
    queue.push({ ...item, id: Date.now() + Math.random() });
    write(queue);
  },

  async flush(api) {
    const queue = read();
    if (!queue.length) return;
    const remaining = [];
    for (const item of queue) {
      try {
        await api({ method: item.method, url: item.url, data: item.data });
      } catch {
        remaining.push(item);
      }
    }
    write(remaining);
  },

  size() {
    return read().length;
  },
};

// Auto-flush on reconnect
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    import('../services/api').then(({ default: api }) => {
      offlineQueue.flush((cfg) => api.request(cfg));
    });
  });
}

export default offlineQueue;
