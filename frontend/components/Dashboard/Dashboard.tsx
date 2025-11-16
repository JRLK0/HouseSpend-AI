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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Resumen de tus gastos y tickets</p>
      </div>

      {/* Estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Tickets</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalTickets}</p>
            </div>
            <DocumentTextIcon className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Gastado</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(stats.totalAmount)}
              </p>
            </div>
            <CurrencyEuroIcon className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Gasto del Mes</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(currentMonthExpense)}
              </p>
            </div>
            <ChartBarIcon className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Comercios</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {storeAnalytics?.totalStores || 0}
              </p>
            </div>
            <BuildingStorefrontIcon className="w-8 h-8 text-orange-600" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gastos por comercio */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Gastos por Comercio</h2>
          {storeAnalytics && storeAnalytics.stores.length > 0 ? (
            <div className="space-y-3">
              {storeAnalytics.stores.slice(0, 5).map((store) => (
                <div key={store.storeName} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
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
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-8">
              No hay datos de comercios disponibles
            </p>
          )}
        </div>

        {/* Gastos por categoría */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Gastos por Categoría (Este Mes)</h2>
          {categoryExpenses.length > 0 ? (
            <div className="space-y-3">
              {categoryExpenses.slice(0, 5).map((category) => (
                <div key={category.categoryName} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3 flex-1">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: category.categoryColor }}
                    ></div>
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
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-8">
              No hay datos de categorías disponibles para este mes
            </p>
          )}
        </div>
      </div>

      {/* Gráfico de gastos mensuales */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Gastos Mensuales</h2>
        {monthlyExpenses.length > 0 ? (
          <div className="space-y-2">
            {monthlyExpenses.map((expense) => {
              const maxAmount = Math.max(...monthlyExpenses.map((e) => e.totalAmount));
              const percentage = maxAmount > 0 ? (expense.totalAmount / maxAmount) * 100 : 0;
              
              return (
                <div key={`${expense.year}-${expense.month}`} className="flex items-center space-x-4">
                  <div className="w-24 text-sm text-gray-600">
                    {monthNames[expense.month - 1]}
                  </div>
                  <div className="flex-1">
                    <div className="h-6 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      ></div>
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
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center py-8">
            No hay datos de gastos mensuales disponibles
          </p>
        )}
      </div>

      {/* Tickets recientes */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Tickets Recientes</h2>
          <Link
            href="/tickets"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Ver todos
          </Link>
        </div>
        {tickets.length > 0 ? (
          <div className="space-y-3">
            {tickets.slice(0, 5).map((ticket) => (
              <Link
                key={ticket.id}
                href={`/tickets/${ticket.id}`}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
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
              </Link>
            ))}
          </div>
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
      </div>
    </div>
  );
}
