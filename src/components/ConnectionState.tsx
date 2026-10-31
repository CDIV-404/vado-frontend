import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { WifiOff } from 'lucide-react';

export function ConnectionState() {
  const [offline, setOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const on = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener('offline', off);
    window.addEventListener('online', on);
    return () => {
      window.removeEventListener('offline', off);
      window.removeEventListener('online', on);
    };
  }, []);

  return (
    <AnimatePresence>
      {offline && (
        <motion.div
          role="status"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
          className="mx-3 mt-2 flex items-center gap-2 rounded-2xl border border-[#d8f3ff]/30 bg-glass px-3 py-2 text-[12px] text-mist backdrop-blur-lg"
        >
          <WifiOff size={14} className="text-beam" />
          Connection lost — showing cached vibes.
        </motion.div>
      )}
    </AnimatePresence>
  );
}
