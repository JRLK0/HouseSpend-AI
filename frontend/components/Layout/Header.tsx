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
    <header className="bg-white/80 backdrop-blur-md shadow-md border-b border-gray-200/60">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
            {getPageTitle()}
          </h1>
        </div>
        <div className="flex items-center space-x-4">
          {user && (
            <>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 via-purple-600 to-blue-700 rounded-full flex items-center justify-center text-white font-medium shadow-md">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <div className="text-sm">
                  <div className="font-medium text-gray-900">{user.username}</div>
                  <div className="text-xs text-gray-500">{user.email}</div>
                </div>
              </div>
              <button
                onClick={logout}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-white hover:bg-gradient-to-r hover:from-blue-600 hover:via-purple-600 hover:to-blue-700 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
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

