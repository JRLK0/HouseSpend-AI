'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { 
  HomeIcon, 
  DocumentTextIcon, 
  PlusCircleIcon, 
  UsersIcon, 
  Cog6ToothIcon,
  CubeIcon
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: HomeIcon },
  { href: '/tickets', label: 'Tickets', icon: DocumentTextIcon },
  { href: '/tickets/upload', label: 'Subir Ticket', icon: PlusCircleIcon },
  { href: '/stock', label: 'Stock', icon: CubeIcon },
];

const adminMenuItems = [
  { href: '/users', label: 'Usuarios', icon: UsersIcon },
  { href: '/settings', label: 'Configuración', icon: Cog6ToothIcon },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/';
    }
    // Para rutas que tienen subrutas, verificar coincidencia exacta primero
    if (href === '/tickets/upload') {
      return pathname === '/tickets/upload';
    }
    if (href === '/tickets') {
      // Solo activar si es exactamente /tickets o empieza con /tickets/ pero NO es /tickets/upload
      return pathname === '/tickets' || (pathname.startsWith('/tickets/') && pathname !== '/tickets/upload');
    }
    // Para otras rutas, verificar si el pathname empieza con el href
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <aside className="w-64 bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 border-r border-gray-200/60 min-h-screen backdrop-blur-sm">
      <div className="p-6">
        <h2 className="text-lg font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 bg-clip-text text-transparent mb-6">
          HouseSpend AI
        </h2>
        <nav className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <div key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 relative overflow-hidden ${
                    active
                      ? 'text-white shadow-md'
                      : 'text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:shadow-sm'
                  }`}
                >
                  {active && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 rounded-lg"
                      initial={false}
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <motion.div
                    className="relative z-10 flex items-center space-x-3"
                    whileHover={{ x: 4 }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </motion.div>
                </Link>
              </div>
            );
          })}
          
          {user?.isAdmin && (
            <>
              <div className="pt-4 mt-4 border-t border-gray-200/60">
                <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Administración
                </div>
              </div>
              {adminMenuItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <div key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 relative overflow-hidden ${
                        active
                          ? 'text-white shadow-md'
                          : 'text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:shadow-sm'
                      }`}
                    >
                      {active && (
                        <motion.div
                          layoutId="activeAdminTab"
                          className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 rounded-lg"
                          initial={false}
                          transition={{ type: "spring", stiffness: 380, damping: 30 }}
                        />
                      )}
                      <motion.div
                        className="relative z-10 flex items-center space-x-3"
                        whileHover={{ x: 4 }}
                        transition={{ type: "spring", stiffness: 400 }}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="font-medium">{item.label}</span>
                      </motion.div>
                    </Link>
                  </div>
                );
              })}
            </>
          )}
        </nav>
      </div>
    </aside>
  );
}

