'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { MainLayout } from './MainLayout';

const publicRoutes = ['/login', '/setup'];

export function AuthenticatedLayout({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !user && !publicRoutes.includes(pathname)) {
      router.push('/login');
    }
  }, [user, isLoading, router, pathname]);

  // Si es una ruta pública, mostrar sin layout
  if (publicRoutes.includes(pathname)) {
    return <>{children}</>;
  }

  // Si está cargando o no hay usuario, mostrar loading
  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  // Para rutas autenticadas, mostrar con MainLayout
  return <MainLayout>{children}</MainLayout>;
}

