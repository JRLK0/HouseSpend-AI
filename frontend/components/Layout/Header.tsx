'use client';

import { useAuth } from '@/lib/contexts/AuthContext';
import { usePathname } from 'next/navigation';

export function Header() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const getPageTitle = () => {
    const routes: Record<string, string> = {
      '/dashboard': 'Dashboard',
      '/tickets': 'Tickets',
      '/tickets/upload': 'Subir Ticket',
      '/users': 'Usuarios',
      '/settings': 'Configuración',
    };

    for (const [path, title] of Object.entries(routes)) {
      if (pathname.startsWith(path)) {
        return title;
      }
    }

    return 'HouseSpend AI';
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold text-gray-900">{getPageTitle()}</h1>
        </div>
        <div className="flex items-center space-x-4">
          {user && (
            <>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <div className="text-sm">
                  <div className="font-medium text-gray-900">{user.username}</div>
                  <div className="text-xs text-gray-500">{user.email}</div>
                </div>
              </div>
              <button
                onClick={logout}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cerrar Sesión
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

