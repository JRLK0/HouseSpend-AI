'use client';

import { useEffect, useState } from 'react';
import { ticketsApi, TicketDto, analyticsApi, StoreAnalyticsDto, MonthlyExpenseDto, CategoryExpenseDto } from '@/lib/api-client/api';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';
import Link from 'next/link';
import {
  DocumentTextIcon,
  CurrencyEuroIcon,
  ChartBarIcon,
  BuildingStorefrontIcon,
} from '@heroicons/react/24/outline';
import { AnimatedCard } from '@/components/ui/animated-card';
import { AnimatedList } from '@/components/ui/animated-list';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { motion } from 'framer-motion';

const monthNames = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export function Dashboard() {
  const [tickets, setTickets] = useState<TicketDto[]>([]);
  const [storeAnalytics, setStoreAnalytics] = useState<StoreAnalyticsDto | null>(null);
  const [monthlyExpenses, setMonthlyExpenses] = useState<MonthlyExpenseDto[]>([]);
  const [categoryExpenses, setCategoryExpenses] = useState<CategoryExpenseDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTickets: 0,
    totalAmount: 0,
    analyzedTickets: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [ticketsResponse, storesResponse, monthlyResponse, categoriesResponse] = await Promise.all([
        ticketsApi.getAll(),
        analyticsApi.getStoreAnalytics(),
        analyticsApi.getMonthlyExpenses(),
        analyticsApi.getCategoryExpenses(),
      ]);

      const ticketsData = ticketsResponse.data;
      setTickets(ticketsData);
      setStoreAnalytics(storesResponse.data);
      setMonthlyExpenses(monthlyResponse.data);
      setCategoryExpenses(categoriesResponse.data);

      const totalAmount = ticketsData
        .filter((t) => t.totalAmount)
        .reduce((sum, t) => sum + (t.totalAmount || 0), 0);

      setStats({
        totalTickets: ticketsData.length,
        totalAmount,
        analyzedTickets: ticketsData.filter((t) => t.isAnalyzed).length,
      });
    } catch (err) {
      console.error('Error loading data:', err);
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

  const currentMonthExpense = monthlyExpenses.find(
    (m) => m.month === new Date().getMonth() + 1 && m.year === new Date().getFullYear()
  )?.totalAmount || 0;

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Resumen de tus gastos y tickets</p>
      </motion.div>

      {/* Estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <AnimatedCard delay={0.1} className="bg-gradient-to-br from-white to-blue-50/50 rounded-xl shadow-md border border-blue-100/50 p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-2xl"></div>
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="text-sm text-gray-600">Total Tickets</p>
              <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mt-1">
                <AnimatedNumber value={stats.totalTickets} />
              </p>
            </div>
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              <DocumentTextIcon className="w-8 h-8 text-blue-600" />
            </motion.div>
          </div>
        </AnimatedCard>

        <AnimatedCard delay={0.2} className="bg-gradient-to-br from-white to-green-50/50 rounded-xl shadow-md border border-green-100/50 p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-green-400/20 to-blue-400/20 rounded-full blur-2xl"></div>
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="text-sm text-gray-600">Total Gastado</p>
              <p className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mt-1">
                {formatCurrency(stats.totalAmount)}
              </p>
            </div>
            <CurrencyEuroIcon className="w-8 h-8 text-green-600" />
          </div>
        </AnimatedCard>

        <AnimatedCard delay={0.3} className="bg-gradient-to-br from-white to-purple-50/50 rounded-xl shadow-md border border-purple-100/50 p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-2xl"></div>
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="text-sm text-gray-600">Gasto del Mes</p>
              <p className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mt-1">
                {formatCurrency(currentMonthExpense)}
              </p>
            </div>
            <ChartBarIcon className="w-8 h-8 text-purple-600" />
          </div>
        </AnimatedCard>

        <AnimatedCard delay={0.4} className="bg-gradient-to-br from-white to-orange-50/50 rounded-xl shadow-md border border-orange-100/50 p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-orange-400/20 to-red-400/20 rounded-full blur-2xl"></div>
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="text-sm text-gray-600">Comercios</p>
              <p className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mt-1">
                {storeAnalytics?.totalStores || 0}
              </p>
            </div>
            <BuildingStorefrontIcon className="w-8 h-8 text-orange-600" />
          </div>
        </AnimatedCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gastos por comercio */}
        <AnimatedCard delay={0.5} className="bg-gradient-to-br from-white to-blue-50/30 rounded-xl shadow-md border border-blue-100/50 p-6">
          <h2 className="text-lg font-semibold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-4">Gastos por Comercio</h2>
          {storeAnalytics && storeAnalytics.stores.length > 0 ? (
            <AnimatedList>
              {storeAnalytics.stores.slice(0, 5).map((store) => (
                <motion.div
                  key={store.storeName}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  whileHover={{ x: 4 }}
                >
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{store.storeName}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {store.ticketCount} ticket{store.ticketCount !== 1 ? 's' : ''} • 
                      Promedio: {formatCurrency(store.averageTicketAmount)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-900">
                      {formatCurrency(store.totalSpent)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {((store.totalSpent / storeAnalytics.totalSpent) * 100).toFixed(1)}%
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatedList>
          ) : (
            <p className="text-sm text-gray-500 text-center py-8">
              No hay datos de comercios disponibles
            </p>
          )}
        </AnimatedCard>

        {/* Gastos por categoría */}
        <AnimatedCard delay={0.6} className="bg-gradient-to-br from-white to-purple-50/30 rounded-xl shadow-md border border-purple-100/50 p-6">
          <h2 className="text-lg font-semibold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-4">Gastos por Categoría (Este Mes)</h2>
          {categoryExpenses.length > 0 ? (
            <AnimatedList>
              {categoryExpenses.slice(0, 5).map((category) => (
                <motion.div
                  key={category.categoryName}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  whileHover={{ x: 4 }}
                >
                  <div className="flex items-center space-x-3 flex-1">
                    <motion.div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: category.categoryColor }}
                      whileHover={{ scale: 1.2 }}
                    ></motion.div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">{category.categoryName}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {category.productCount} producto{category.productCount !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-gray-900">
                    {formatCurrency(category.totalAmount)}
                  </div>
                </motion.div>
              ))}
            </AnimatedList>
          ) : (
            <p className="text-sm text-gray-500 text-center py-8">
              No hay datos de categorías disponibles para este mes
            </p>
          )}
        </AnimatedCard>
      </div>

      {/* Gráfico de gastos mensuales */}
      <AnimatedCard delay={0.7} className="bg-gradient-to-br from-white to-cyan-50/30 rounded-xl shadow-md border border-cyan-100/50 p-6">
        <h2 className="text-lg font-semibold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-4">Gastos Mensuales</h2>
        {monthlyExpenses.length > 0 ? (
          <AnimatedList staggerDelay={0.05}>
            {monthlyExpenses.map((expense) => {
              const maxAmount = Math.max(...monthlyExpenses.map((e) => e.totalAmount));
              const percentage = maxAmount > 0 ? (expense.totalAmount / maxAmount) * 100 : 0;
              
              return (
                <div key={`${expense.year}-${expense.month}`} className="flex items-center space-x-4">
                  <div className="w-24 text-sm text-gray-600">
                    {monthNames[expense.month - 1]}
                  </div>
                  <div className="flex-1">
                    <div className="h-6 bg-gray-200/60 rounded-full overflow-hidden shadow-inner">
                      <motion.div
                        className="h-full bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 rounded-full shadow-sm"
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                      ></motion.div>
                    </div>
                  </div>
                  <div className="w-24 text-right">
                    <div className="text-sm font-semibold text-gray-900">
                      {formatCurrency(expense.totalAmount)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {expense.ticketCount} ticket{expense.ticketCount !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              );
            })}
          </AnimatedList>
        ) : (
          <p className="text-sm text-gray-500 text-center py-8">
            No hay datos de gastos mensuales disponibles
          </p>
        )}
      </AnimatedCard>

      {/* Tickets recientes */}
      <AnimatedCard delay={0.8} className="bg-gradient-to-br from-white to-indigo-50/30 rounded-xl shadow-md border border-indigo-100/50 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Tickets Recientes</h2>
          <Link
            href="/tickets"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            Ver todos
          </Link>
        </div>
        {tickets.length > 0 ? (
          <AnimatedList>
            {tickets.slice(0, 5).map((ticket) => (
              <Link
                key={ticket.id}
                href={`/tickets/${ticket.id}`}
              >
                <motion.div
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  whileHover={{ x: 4, scale: 1.01 }}
                >
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {ticket.storeName || 'Ticket sin nombre'}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {formatDate(ticket.createdAt)}
                    </div>
                  </div>
                  <div className="text-right">
                    {ticket.totalAmount ? (
                      <div className="text-sm font-semibold text-gray-900">
                        {formatCurrency(ticket.totalAmount)}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-500">Sin analizar</span>
                    )}
                    <div className="text-xs text-gray-500 mt-1">
                      {ticket.productCount} producto{ticket.productCount !== 1 ? 's' : ''}
                    </div>
                  </div>
                </motion.div>
              </Link>
            ))}
          </AnimatedList>
        ) : (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500 mb-4">No hay tickets aún</p>
            <Link
              href="/tickets/upload"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Subir tu primer ticket
            </Link>
          </div>
        )}
      </AnimatedCard>
    </motion.div>
  );
}
