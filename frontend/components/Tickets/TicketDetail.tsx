'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ticketsApi, TicketDetailDto } from '@/lib/api-client/api';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';

export function TicketDetail() {
  const params = useParams();
  const router = useRouter();
  const ticketId = parseInt(params.id as string);

  const [ticket, setTicket] = useState<TicketDetailDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAutoAnalyzing, setIsAutoAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  useEffect(() => {
    loadTicket();
  }, [ticketId]);

  // Polling para detectar actualización automática del comercio
  useEffect(() => {
    if (!ticket || ticket.isAnalyzed || ticket.storeName) {
      setIsAutoAnalyzing(false);
      return;
    }

    // Si el ticket no tiene comercio y no está analizado, empezar polling
    setIsAutoAnalyzing(true);
    const interval = setInterval(async () => {
      try {
        const response = await ticketsApi.getById(ticketId);
        if (response.data.storeName && response.data.storeName !== ticket.storeName) {
          setTicket(response.data);
          setIsAutoAnalyzing(false);
          clearInterval(interval);
        }
      } catch (err) {
        // Ignorar errores de polling
      }
    }, 2000); // Polling cada 2 segundos

    return () => clearInterval(interval);
  }, [ticketId, ticket?.id, ticket?.isAnalyzed, ticket?.storeName]);

  const loadTicket = async () => {
    try {
      const response = await ticketsApi.getById(ticketId);
      setTicket(response.data);
      setWarnings([]);
      await loadTicketImage();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar el ticket');
    } finally {
      setIsLoading(false);
    }
  };

  const loadTicketImage = async () => {
    setIsImageLoading(true);
    setImageError(null);

    try {
      const response = await ticketsApi.getImageBlob(ticketId);
      const contentType = response.headers['content-type'] || 'image/jpeg';
      const bytes = new Uint8Array(response.data as ArrayBuffer);
      const binary = bytes.reduce((acc, byte) => acc + String.fromCharCode(byte), '');
      const base64 = typeof window === 'undefined' ? '' : window.btoa(binary);
      setImageSrc(`data:${contentType};base64,${base64}`);
    } catch (err: any) {
      setImageError('No se pudo cargar la imagen del ticket.');
      setImageSrc(null);
    } finally {
      setIsImageLoading(false);
    }
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await ticketsApi.analyze(ticketId);
      setTicket(response.data);
      const warningsHeader = response.headers['x-analysis-warnings'];
      if (warningsHeader) {
        const parsedWarnings = warningsHeader
          .split('|')
          .map((warning: string) => warning.trim())
          .filter(Boolean);
        setWarnings(parsedWarnings);
      } else {
        setWarnings([]);
      }
      await loadTicketImage();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al analizar el ticket');
      setWarnings([]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const statusBadge = useMemo(() => {
    if (isAnalyzing) {
      return {
        label: 'Analizando...',
        className: 'bg-blue-100 text-blue-800 border border-blue-200',
      };
    }

    if (isAutoAnalyzing) {
      return {
        label: 'Detectando comercio...',
        className: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
      };
    }

    if (ticket?.isAnalyzed) {
      return {
        label: 'Analizado',
        className: 'bg-green-100 text-green-800 border border-green-200',
      };
    }

    if (error) {
      return {
        label: 'Error',
        className: 'bg-red-100 text-red-800 border border-red-200',
      };
    }

    return {
      label: 'Pendiente',
      className: 'bg-gray-100 text-gray-700 border border-gray-200',
    };
  }, [isAnalyzing, isAutoAnalyzing, ticket?.isAnalyzed, error]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error && !ticket) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  if (!ticket) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between flex-col lg:flex-row gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {ticket.storeName || 'Ticket sin nombre'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Subido el {formatDate(ticket.createdAt)}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusBadge.className}`}
            >
              {statusBadge.label}
            </span>
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {ticket.isAnalyzed ? (isAnalyzing ? 'Re-analizando...' : 'Re-analizar') : isAnalyzing ? 'Analizando...' : 'Analizar con IA'}
            </button>
          </div>
        </div>

        {ticket.totalAmount !== null && ticket.totalAmount !== undefined && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-lg font-medium text-gray-700">Total</span>
              <span className="text-2xl font-bold text-gray-900">
                {formatCurrency(ticket.totalAmount)}
              </span>
            </div>
            {ticket.purchaseDate && (
              <p className="text-sm text-gray-500 mt-2">
                Fecha de compra: {formatDate(ticket.purchaseDate)}
              </p>
            )}
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="lg:w-1/3">
            <p className="text-sm font-medium text-gray-700 mb-2">Imagen del ticket</p>
            {isImageLoading ? (
              <div className="h-64 flex items-center justify-center border border-gray-200 rounded-lg bg-gray-50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : imageSrc ? (
              <button
                type="button"
                onClick={() => setIsImageModalOpen(true)}
                className="w-full border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
              >
                <img
                  src={imageSrc}
                  alt="Ticket"
                  className="w-full h-64 object-contain bg-white"
                />
                <span className="block text-xs text-gray-500 py-2 bg-gray-50">
                  Haz clic para ampliar
                </span>
              </button>
            ) : (
              <div className="h-64 flex items-center justify-center border border-gray-200 rounded-lg bg-gray-50 text-sm text-gray-500">
                {imageError || 'La imagen del ticket no está disponible.'}
              </div>
            )}
          </div>

          <div className="lg:flex-1">
            <p className="text-sm font-medium text-gray-700 mb-2">Productos</p>
            {ticket.products.length > 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-3">
                {ticket.products.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 flex-wrap">
                        <span className="font-medium text-gray-900">{product.name}</span>
                        {product.isDiscount && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                            Descuento
                          </span>
                        )}
                        {product.category && (
                          <span
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-white"
                            style={{ backgroundColor: product.category.color }}
                          >
                            {product.category.name}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {product.quantity} x {formatCurrency(product.unitPrice)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">
                        {formatCurrency(product.totalPrice)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center border border-dashed border-gray-300 rounded-lg bg-gray-50 text-sm text-gray-500">
                Aún no hay productos disponibles para este ticket.
              </div>
            )}
          </div>
        </div>
      </div>

      {warnings.length > 0 && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm font-semibold text-yellow-800">
            El análisis se completó con advertencias:
          </p>
          <ul className="mt-2 list-disc list-inside text-sm text-yellow-700 space-y-1">
            {warnings.map((warning, index) => (
              <li key={`${warning}-${index}`}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {isImageModalOpen && imageSrc && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={() => setIsImageModalOpen(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-4xl w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center px-4 py-2 border-b border-gray-200">
              <p className="text-sm font-medium text-gray-700">Ticket completo</p>
              <button
                onClick={() => setIsImageModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 text-xl leading-none"
              >
                &times;
              </button>
            </div>
            <div className="bg-black flex items-center justify-center">
              <img
                src={imageSrc}
                alt="Ticket ampliado"
                className="max-h-[80vh] object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

