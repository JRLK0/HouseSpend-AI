'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ticketsApi, TicketDto } from '@/lib/api-client/api';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';
import { DocumentTextIcon } from '@heroicons/react/24/outline';
import { AnimatedCard } from '@/components/ui/animated-card';
import { motion } from 'framer-motion';

export function TicketList() {
  const [tickets, setTickets] = useState<TicketDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      const response = await ticketsApi.getAll();
      setTickets(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar los tickets');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="text-center py-12">
        <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No hay tickets</h3>
        <p className="mt-1 text-sm text-gray-500">Comienza subiendo tu primer ticket.</p>
        <div className="mt-6">
          <Link
            href="/tickets/upload"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Subir Ticket
          </Link>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {tickets.map((ticket, index) => (
        <AnimatedCard
          key={ticket.id}
          delay={index * 0.1}
          className="bg-gradient-to-br from-white to-blue-50/30 rounded-xl shadow-md border border-blue-100/50 p-6 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl"></div>
          <Link href={`/tickets/${ticket.id}`}>
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="cursor-pointer relative z-10"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    {ticket.storeName || 'Ticket sin nombre'}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {formatDate(ticket.createdAt)}
                  </p>
                </div>
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  {ticket.isAnalyzed ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200/50 shadow-sm">
                      Analizado
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-gray-100 to-slate-100 text-gray-700 border border-gray-200/50 shadow-sm">
                      Pendiente
                    </span>
                  )}
                </motion.div>
              </div>

              {ticket.totalAmount && (
                <motion.div 
                  className="mt-4 pt-4 border-t border-gray-200/60"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total</span>
                    <span className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      {formatCurrency(ticket.totalAmount)}
                    </span>
                  </div>
                </motion.div>
              )}

              {ticket.productCount > 0 && (
                <div className="mt-2 text-sm text-gray-500">
                  {ticket.productCount} producto{ticket.productCount !== 1 ? 's' : ''}
                </div>
              )}
            </motion.div>
          </Link>
        </AnimatedCard>
      ))}
    </motion.div>
  );
}

