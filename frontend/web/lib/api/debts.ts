import apiClient from "@/lib/apiClient";
import { PaginatedResponse } from "@/lib/api/customers";

export interface DebtSummary {
    id: number;
    customer_id: number;
    customer_name?: string;
    customer_phone?: string;
    order_code?: string;
    total_amount: number;
    paid_amount: number;
    remaining_amount: number;
    status: string;
    due_date?: string;
    created_at: string;
}

export interface DebtPayment {
    id: number;
    debt_id: number;
    payment_amount: number;
    payment_method: string;
    payment_date: string;
    reference_number?: string;
    notes?: string;
    created_at: string;
}

export interface DebtDetail extends DebtSummary {
    notes?: string;
    payments: DebtPayment[];
}

export const debtsApi = {
    list: async (params: {
        page?: number;
        page_size?: number;
        status?: string;
        customer_id?: number;
        sort?: string;
    } = {}) => {
        const response = await apiClient.get<PaginatedResponse<DebtSummary>>("/debts", { params });
        return response.data;
    },

    get: async (id: number) => {
        const response = await apiClient.get<DebtDetail>(`/debts/${id}`);
        return response.data;
    },

    repay: async (id: number, data: {
        payment_amount: number;
        payment_method: string;
        reference_number?: string;
        notes?: string;
    }) => {
        const response = await apiClient.post<DebtDetail>(`/debts/${id}/repay`, data);
        return response.data;
    },
};
