'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { setupApi } from '@/lib/api-client/api';
import { AdminSetupForm } from '@/components/Setup/AdminSetupForm';
import { OpenAIConfigForm } from '@/components/Setup/OpenAIConfigForm';

export default function SetupPage() {
  const router = useRouter();
  const [step, setStep] = useState<'admin' | 'openai'>('admin');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkSetup();
  }, []);

  const checkSetup = async () => {
    try {
      const response = await setupApi.check();
      if (response.data.isSetupComplete) {
        router.push('/login');
      } else {
        setIsLoading(false);
      }
    } catch {
      setIsLoading(false);
    }
  };

  const handleAdminSuccess = () => {
    setStep('openai');
  };

  const handleOpenAISuccess = () => {
    router.push('/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando configuración...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">HouseSpend AI</h1>
          <p className="mt-2 text-sm text-gray-600">Configuración inicial</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          {step === 'admin' ? (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Crear Usuario Administrador
              </h2>
              <p className="text-sm text-gray-600 mb-6">
                Crea el primer usuario administrador del sistema.
              </p>
              <AdminSetupForm onSuccess={handleAdminSuccess} />
            </div>
          ) : (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Configurar OpenAI API Key
              </h2>
              <p className="text-sm text-gray-600 mb-6">
                Configura tu API Key de OpenAI para habilitar el análisis de tickets con IA.
              </p>
              <OpenAIConfigForm onSuccess={handleOpenAISuccess} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

