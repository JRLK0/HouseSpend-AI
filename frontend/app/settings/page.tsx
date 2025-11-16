'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { OpenAIConfigForm } from '@/components/Setup/OpenAIConfigForm';

export default function SettingsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user && !user.isAdmin) {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  const handleSuccess = () => {
    alert('API Key configurada exitosamente');
  };

  if (isLoading || !user || !user.isAdmin) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Configurar OpenAI API Key
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          Actualiza tu API Key de OpenAI para el análisis de tickets.
        </p>
        <OpenAIConfigForm onSuccess={handleSuccess} />
      </div>
    </div>
  );
}

