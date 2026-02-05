import apiClient from "@/lib/apiClient";

export interface PortalOrder {
    id: number;
    order_code: string;
    total_amount: number;
    paid_amount: number;
    payment_status: string;
    created_at: string;
    items?: any[];
    notes?: string;
}

export interface PortalDebt {
    id: number;
    order_id: number;
    order_code: string;
    total_amount: number;
    paid_amount: number;
    remaining_amount: number;
    status: string;
    created_at: string;
    due_date?: string;
    payments?: any[];
}

export interface PaginatedOrders {
    items: PortalOrder[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
}

export interface PaginatedDebts {
    items: PortalDebt[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
    total_amount_pending: number;
}

export const portalApi = {
    getOrders: async (page = 1, page_size = 20): Promise<PaginatedOrders> => {
        const params = new URLSearchParams();
        params.append('page', page.toString());
        params.append('page_size', page_size.toString());
        const response = await apiClient.get<PaginatedOrders>(`/portal/orders?${params.toString()}`);
        return response.data;
    },
    getDebts: async (page = 1, page_size = 20): Promise<PaginatedDebts> => {
        const params = new URLSearchParams();
        params.append('page', page.toString());
        params.append('page_size', page_size.toString());
        const response = await apiClient.get<PaginatedDebts>(`/portal/debts?${params.toString()}`);
        return response.data;
    },
    getProfile: async () => {
        const response = await apiClient.get("/portal/profile");
        return response.data;
    },
    updateProfile: async (data: { full_name: string; phone?: string; address?: string }) => {
        const response = await apiClient.put("/portal/profile", data);
        return response.data;
    },
    getOrder: async (id: number) => {
        const response = await apiClient.get<PortalOrder>(`/portal/orders/${id}`);
        return response.data;
    },
    getDebt: async (id: number) => {
        const response = await apiClient.get<PortalDebt>(`/portal/debts/${id}`);
        return response.data;
    }
};
