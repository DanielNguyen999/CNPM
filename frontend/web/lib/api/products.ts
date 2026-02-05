import apiClient from '../apiClient';

export interface Product {
    id: number;
    product_code: string;
    name: string;
    description?: string;
    category?: string;
    base_unit_id: number;
    base_price: number;
    sell_price?: number;
    cost_price?: number;
    stock_quantity?: number;
    image_url?: string;
    is_active: boolean;
}

export interface PaginatedProducts {
    items: Product[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
}

export const productsApi = {
    list: async (search?: string, page = 1, page_size = 100): Promise<PaginatedProducts> => {
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        params.append('page', page.toString());
        params.append('page_size', page_size.toString());

        const { data } = await apiClient.get<PaginatedProducts>(`/products?${params.toString()}`);
        return data;
    },

    getById: async (id: number) => {
        const { data } = await apiClient.get<Product>(`/products/${id}`);
        return data;
    },

    create: async (payload: Partial<Product>) => {
        const { data } = await apiClient.post<Product>("/products", payload);
        return data;
    },

    update: async (id: number, payload: Partial<Product>) => {
        const { data } = await apiClient.put<Product>(`/products/${id}`, payload);
        return data;
    },

    delete: async (id: number) => {
        await apiClient.delete(`/products/${id}`);
    }
};
