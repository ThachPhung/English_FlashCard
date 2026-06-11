import { useEffect } from 'react';

export function useReloadOnFocus(reload) {
  useEffect(() => {
    const onFocus = () => reload();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [reload]);
}
