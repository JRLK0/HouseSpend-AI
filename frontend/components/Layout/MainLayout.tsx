'use client';

import { ReactNode } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';

export function MainLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-purple-50/10">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <AnimatePresence mode="wait">
          <motion.main 
            key={pathname}
            className="flex-1 overflow-y-auto p-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.main>
        </AnimatePresence>
      </div>
    </div>
  );
}

