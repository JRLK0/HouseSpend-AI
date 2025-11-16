'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { setupApi } from '@/lib/api-client/api';

const openAISchema = z.object({
  apiKey: z.string().min(1, 'La API Key es requerida'),
});

type OpenAIFormData = z.infer<typeof openAISchema>;

export function OpenAIConfigForm({ onSuccess }: { onSuccess: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OpenAIFormData>({
    resolver: zodResolver(openAISchema),
  });

  const onSubmit = async (data: OpenAIFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      await setupApi.configureOpenAI(data);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al configurar la API Key');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-2">
          OpenAI API Key
        </label>
        <input
          {...register('apiKey')}
          type="password"
          id="apiKey"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm bg-white text-gray-900"
          placeholder="sk-..."
        />
        <p className="mt-2 text-sm text-gray-500">
          Puedes obtener tu API Key en{' '}
          <a
            href="https://platform.openai.com/api-keys"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            platform.openai.com
          </a>
        </p>
        {errors.apiKey && (
          <p className="mt-1 text-sm text-red-600">{errors.apiKey.message}</p>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? 'Guardando...' : 'Guardar API Key'}
      </button>
    </form>
  );
}

