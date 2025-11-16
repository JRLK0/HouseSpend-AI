import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar el token JWT a las peticiones
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de autenticación
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Tipos para las respuestas de la API
export interface UserDto {
  id: number;
  username: string;
  email: string;
  isAdmin: boolean;
  createdAt: string;
}

export interface AuthResponseDto {
  token: string;
  user: UserDto;
}

export interface LoginDto {
  username: string;
  password: string;
}

export interface RegisterDto {
  username: string;
  email: string;
  password: string;
}

export interface SetupCheckDto {
  isSetupComplete: boolean;
}

export interface SetupAdminDto {
  username: string;
  email: string;
  password: string;
}

export interface ConfigOpenAIDto {
  apiKey: string;
}

export interface TicketDto {
  id: number;
  storeName?: string;
  totalAmount?: number;
  purchaseDate?: string;
  isAnalyzed: boolean;
  createdAt: string;
  productCount: number;
}

export interface ProductDto {
  id: number;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  category?: CategoryDto;
  isDiscount: boolean;
}

export interface CategoryDto {
  id: number;
  name: string;
  description: string;
  color: string;
}

export interface TicketDetailDto {
  id: number;
  storeName?: string;
  totalAmount?: number;
  purchaseDate?: string;
  isAnalyzed: boolean;
  createdAt: string;
  products: ProductDto[];
}

export interface CreateUserDto {
  username: string;
  email: string;
  password: string;
  isAdmin: boolean;
}

// Funciones de la API
export const setupApi = {
  check: () => apiClient.get<SetupCheckDto>('/setup/check'),
  createAdmin: (data: SetupAdminDto) => apiClient.post('/setup/admin', data),
  configureOpenAI: (data: ConfigOpenAIDto) => apiClient.post('/setup/openai', data),
};

export const authApi = {
  login: (data: LoginDto) => apiClient.post<AuthResponseDto>('/auth/login', data),
  register: (data: RegisterDto) => apiClient.post<AuthResponseDto>('/auth/register', data),
  getMe: () => apiClient.get<UserDto>('/auth/me'),
};

export const ticketsApi = {
  upload: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post<TicketDto>('/tickets/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  analyze: (id: number) => apiClient.post<TicketDetailDto>(`/tickets/${id}/analyze`),
  getAll: () => apiClient.get<TicketDto[]>('/tickets'),
  getById: (id: number) => apiClient.get<TicketDetailDto>(`/tickets/${id}`),
  getImageBlob: (id: number) =>
    apiClient.get<ArrayBuffer>(`/tickets/${id}/image`, {
      responseType: 'arraybuffer',
    }),
};

export const categoriesApi = {
  getAll: () => apiClient.get<CategoryDto[]>('/categories'),
};

export const usersApi = {
  getAll: () => apiClient.get<UserDto[]>('/users'),
  create: (data: CreateUserDto) => apiClient.post<UserDto>('/users', data),
  delete: (id: number) => apiClient.delete(`/users/${id}`),
};

export interface StockItemDto {
  id: number;
  productName: string;
  categoryId?: number;
  category?: CategoryDto;
  currentQuantity: number;
  unit: string;
  minQuantity?: number;
  maxQuantity?: number;
  lastUpdated: string;
  notes?: string;
  isLowStock: boolean;
}

export interface StockItemCreateDto {
  productName: string;
  categoryId?: number;
  currentQuantity: number;
  unit: string;
  minQuantity?: number;
  maxQuantity?: number;
  notes?: string;
}

export interface StockItemUpdateDto {
  productName?: string;
  categoryId?: number;
  currentQuantity?: number;
  unit?: string;
  minQuantity?: number;
  maxQuantity?: number;
  notes?: string;
}

export interface StockTransactionDto {
  id: number;
  stockItemId: number;
  stockItemName: string;
  ticketId?: number;
  transactionType: string;
  quantity: number;
  date: string;
  notes?: string;
}

export interface StockAdjustmentDto {
  quantity: number;
  notes?: string;
}

export interface StockConsumptionDto {
  quantity: number;
  notes?: string;
}

export const stockApi = {
  getAll: () => apiClient.get<StockItemDto[]>('/stock'),
  getById: (id: number) => apiClient.get<StockItemDto>(`/stock/${id}`),
  create: (data: StockItemCreateDto) => apiClient.post<StockItemDto>('/stock', data),
  update: (id: number, data: StockItemUpdateDto) => apiClient.put<StockItemDto>(`/stock/${id}`, data),
  delete: (id: number) => apiClient.delete(`/stock/${id}`),
  adjust: (id: number, data: StockAdjustmentDto) => apiClient.post<StockItemDto>(`/stock/${id}/adjust`, data),
  consume: (id: number, data: StockConsumptionDto) => apiClient.post<StockItemDto>(`/stock/${id}/consume`, data),
  getAlerts: () => apiClient.get<StockItemDto[]>('/stock/alerts'),
  getTransactions: (id: number, page?: number, pageSize?: number) =>
    apiClient.get<StockTransactionDto[]>(`/stock/${id}/transactions`, {
      params: { page, pageSize },
    }),
};

export interface StoreStatDto {
  storeName: string;
  ticketCount: number;
  totalSpent: number;
  averageTicketAmount: number;
  lastPurchaseDate?: string;
}

export interface StoreAnalyticsDto {
  stores: StoreStatDto[];
  totalStores: number;
  totalSpent: number;
  totalTickets: number;
}

export interface MonthlyExpenseDto {
  month: number;
  year: number;
  totalAmount: number;
  ticketCount: number;
}

export interface CategoryExpenseDto {
  categoryName: string;
  totalAmount: number;
  productCount: number;
  categoryColor: string;
}

export const analyticsApi = {
  getStoreAnalytics: () => apiClient.get<StoreAnalyticsDto>('/analytics/stores'),
  getMonthlyExpenses: (year?: number) =>
    apiClient.get<MonthlyExpenseDto[]>('/analytics/monthly', {
      params: { year },
    }),
  getCategoryExpenses: (year?: number, month?: number) =>
    apiClient.get<CategoryExpenseDto[]>('/analytics/categories', {
      params: { year, month },
    }),
};

