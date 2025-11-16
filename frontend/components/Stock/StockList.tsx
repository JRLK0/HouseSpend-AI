'use client';

import { useEffect, useState } from 'react';
import { stockApi, StockItemDto, categoriesApi, CategoryDto } from '@/lib/api-client/api';
import { formatDate } from '@/lib/utils/formatters';
import { StockItemDetail } from './StockItemDetail';
import { StockAdjustment } from './StockAdjustment';
import { StockConsumption } from './StockConsumption';

export function StockList() {
  const [items, setItems] = useState<StockItemDto[]>([]);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<StockItemDto | null>(null);
  const [showAdjustment, setShowAdjustment] = useState(false);
  const [showConsumption, setShowConsumption] = useState(false);
  const [filterCategory, setFilterCategory] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [itemsResponse, categoriesResponse] = await Promise.all([
        stockApi.getAll(),
        categoriesApi.getAll(),
      ]);
      setItems(itemsResponse.data);
      setCategories(categoriesResponse.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar el stock');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesCategory = !filterCategory || item.categoryId === filterCategory;
    const matchesSearch = !searchTerm || 
      item.productName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const lowStockItems = items.filter((item) => item.isLowStock);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-col lg:flex-row gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Control de Stock</h1>
          <p className="text-sm text-gray-500 mt-1">
            Gestiona el inventario de productos en casa
          </p>
        </div>
        {lowStockItems.length > 0 && (
          <div className="px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <span className="font-semibold">{lowStockItems.length}</span> productos con stock bajo
            </p>
          </div>
        )}
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar producto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="lg:w-64">
            <select
              value={filterCategory || ''}
              onChange={(e) => setFilterCategory(e.target.value ? parseInt(e.target.value) : null)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todas las categorías</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Lista de productos */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Producto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categoría
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cantidad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mínimo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Última actualización
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No hay productos en stock
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr
                    key={item.id}
                    className={item.isLowStock ? 'bg-yellow-50' : ''}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {item.productName}
                          </div>
                          {item.notes && (
                            <div className="text-xs text-gray-500">{item.notes}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.category ? (
                        <span
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                          style={{ backgroundColor: `${item.category.color}20`, color: item.category.color }}
                        >
                          {item.category.name}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {item.currentQuantity} {item.unit}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {item.minQuantity !== null && item.minQuantity !== undefined
                          ? `${item.minQuantity} ${item.unit}`
                          : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(item.lastUpdated)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => {
                            setSelectedItem(item);
                            setShowConsumption(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Consumir
                        </button>
                        <button
                          onClick={() => {
                            setSelectedItem(item);
                            setShowAdjustment(true);
                          }}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          Ajustar
                        </button>
                        <button
                          onClick={() => setSelectedItem(item)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Ver
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modales */}
      {selectedItem && (
        <>
          <StockItemDetail
            item={selectedItem}
            onClose={() => setSelectedItem(null)}
            onUpdate={loadData}
          />
          {showAdjustment && (
            <StockAdjustment
              item={selectedItem}
              onClose={() => {
                setShowAdjustment(false);
                setSelectedItem(null);
              }}
              onSuccess={loadData}
            />
          )}
          {showConsumption && (
            <StockConsumption
              item={selectedItem}
              onClose={() => {
                setShowConsumption(false);
                setSelectedItem(null);
              }}
              onSuccess={loadData}
            />
          )}
        </>
      )}
    </div>
  );
}

