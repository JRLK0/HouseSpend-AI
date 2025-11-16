'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { setupApi } from '@/lib/api-client/api';

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const checkSetup = async () => {
      if (isLoading) return;

      try {
        const response = await setupApi.check();
        if (!response.data.isSetupComplete) {
          router.push('/setup');
          return;
        }

        if (user) {
          router.push('/dashboard');
        } else {
          router.push('/login');
        }
      } catch {
        router.push('/setup');
      }
    };

    checkSetup();
  }, [user, isLoading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Cargando...</p>
      </div>
    </div>
  );
}
