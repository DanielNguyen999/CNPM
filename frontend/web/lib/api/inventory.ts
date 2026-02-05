import apiClient from "@/lib/apiClient";

export interface InventoryItem {
    id: number;
    product_id: number;
    quantity: number;
    reserved_quantity: number;
    available_quantity: number;
    low_stock_threshold: number;
    product_name?: string; // Enhanced during frontend mapping if backend JOINs aren't present
}

export const inventoryApi = {
    list: async () => {
        const { data } = await apiClient.get<InventoryItem[]>("/inventory");
        return data;
    },

    // Adjust stock manually
    adjust: async (productId: number, quantity_change: number, reason: string, notes?: string) => {
        const { data } = await apiClient.post(`/inventory/${productId}/adjust`, {
            quantity_change,
            reason,
            notes
        });
        return data;
    },

    getHistory: async (params?: { skip?: number; limit?: number }) => {
        const { data } = await apiClient.get<any[]>("/inventory/movements", { params });
        return data;
    },

    getProductHistory: async (productId: number, params?: { skip?: number; limit?: number }) => {
        const { data } = await apiClient.get<any[]>(`/inventory/${productId}/movements`, { params });
        return data;
    }
};
