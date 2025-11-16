'use client';

import { useEffect, useState } from 'react';
import { stockApi, StockItemDto, StockTransactionDto } from '@/lib/api-client/api';
import { formatDate } from '@/lib/utils/formatters';

interface StockItemDetailProps {
  item: StockItemDto;
  onClose: () => void;
  onUpdate: () => void;
}

export function StockItemDetail({ item, onClose, onUpdate }: StockItemDetailProps) {
  const [transactions, setTransactions] = useState<StockTransactionDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadTransactions();
  }, [item.id]);

  const loadTransactions = async () => {
    try {
      setIsLoading(true);
      const response = await stockApi.getTransactions(item.id);
      setTransactions(response.data);
    } catch (err) {
      console.error('Error al cargar transacciones', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">{item.productName}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            >
              &times;
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-500 mb-1">Cantidad actual</div>
              <div className="text-2xl font-bold text-gray-900">
                {item.currentQuantity} {item.unit}
              </div>
            </div>
            {item.category && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-500 mb-1">Categoría</div>
                <span
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
                  style={{ backgroundColor: `${item.category.color}20`, color: item.category.color }}
                >
                  {item.category.name}
                </span>
              </div>
            )}
            {item.minQuantity !== null && item.minQuantity !== undefined && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-500 mb-1">Cantidad mínima</div>
                <div className="text-lg font-semibold text-gray-900">
                  {item.minQuantity} {item.unit}
                </div>
              </div>
            )}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-500 mb-1">Última actualización</div>
              <div className="text-sm font-medium text-gray-900">
                {formatDate(item.lastUpdated)}
              </div>
            </div>
          </div>

          {item.notes && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-sm font-medium text-blue-900 mb-1">Notas</div>
              <div className="text-sm text-blue-800">{item.notes}</div>
          </div>
          )}

          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Historial de transacciones</h3>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : transactions.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">
                No hay transacciones registradas
              </p>
            ) : (
              <div className="space-y-2">
                {transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">
                        {transaction.transactionType === 'Purchase' && 'Compra'}
                        {transaction.transactionType === 'Consumption' && 'Consumo'}
                        {transaction.transactionType === 'Adjustment' && 'Ajuste'}
                        {transaction.transactionType === 'Expiration' && 'Vencimiento'}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {formatDate(transaction.date)}
                        {transaction.ticketId && ` • Ticket #${transaction.ticketId}`}
                      </div>
                      {transaction.notes && (
                        <div className="text-xs text-gray-600 mt-1">{transaction.notes}</div>
                      )}
                    </div>
                    <div
                      className={`text-sm font-semibold ${
                        transaction.quantity >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {transaction.quantity >= 0 ? '+' : ''}
                      {transaction.quantity} {item.unit}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

