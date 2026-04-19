import toast from 'react-hot-toast';

const base = { style: { fontFamily: 'Inter, sans-serif', fontSize: '14px' } };

export const success = (msg) =>
  toast.success(msg, {
    ...base,
    style: { ...base.style, background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0' },
  });

export const error = (msg) =>
  toast.error(msg, {
    ...base,
    style: { ...base.style, background: '#fff1f2', color: '#5C0F1F', border: '1px solid #fecdd3' },
  });

export const info = (msg) =>
  toast(msg, {
    ...base,
    icon: 'ℹ️',
    style: { ...base.style, background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' },
  });

export const loading = (msg) =>
  toast.loading(msg, { ...base });

export default { success, error, info, loading };
