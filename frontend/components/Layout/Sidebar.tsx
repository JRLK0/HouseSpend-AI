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
    return pathname.startsWith(href);
  };

  return (
    <aside className="w-64 bg-gray-50 border-r border-gray-200 min-h-screen">
      <div className="p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-6">HouseSpend AI</h2>
        <nav className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive(item.href)
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
          
          {user?.isAdmin && (
            <>
              <div className="pt-4 mt-4 border-t border-gray-200">
                <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Administración
                </div>
              </div>
              {adminMenuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive(item.href)
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </>
          )}
        </nav>
      </div>
    </aside>
  );
}

