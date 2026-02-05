import apiClient from "@/lib/apiClient";

export interface Customer {
    id: number;
    owner_id: number;
    customer_code: string;
    full_name: string;
    phone?: string;
    email?: string;
    address?: string;
    customer_type: string;
    tax_code?: string;
    credit_limit: number;
    is_active: boolean;
    created_at: string;
}

export interface CustomerSummary extends Customer {
    total_debt: number;
    order_count: number;
    last_order_date?: string;
}

export interface CustomerDetail extends CustomerSummary {
    notes?: string;
}

export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
}

export const customersApi = {
    list: async (params: { q?: string; page?: number; page_size?: number } = {}) => {
        const response = await apiClient.get<PaginatedResponse<CustomerSummary>>("/customers", { params });
        return response.data;
    },

    get: async (id: number) => {
        const response = await apiClient.get<CustomerDetail>(`/customers/${id}`);
        return response.data;
    },

    create: async (data: any) => {
        const response = await apiClient.post<Customer>("/customers", data);
        return response.data;
    },

    update: async (id: number, data: any) => {
        const response = await apiClient.put<Customer>(`/customers/${id}`, data);
        return response.data;
    },

    delete: async (id: number) => {
        await apiClient.delete(`/customers/${id}`);
    },

    search: async (query: string) => {
        const response = await apiClient.get<PaginatedResponse<CustomerSummary>>("/customers", {
            params: { q: query, page_size: 5 }
        });
        return response.data.items;
    },

    createQuick: async (name: string, phone: string) => {
        const code = `CUS-${Date.now().toString().slice(-6)}`;
        const response = await apiClient.post<Customer>("/customers", {
            customer_code: code,
            full_name: name,
            phone: phone,
            customer_type: "INDIVIDUAL",
            credit_limit: 0
        });
        return response.data;
    }
};
