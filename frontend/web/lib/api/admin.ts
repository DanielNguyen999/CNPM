import apiClient from "@/lib/apiClient";

export interface AdminStats {
    total_owners: number;
    total_users: number;
    total_plans: number;
    active_subscriptions: number;
}

export interface OwnerDetail {
    id: number;
    business_name: string;
    business_address: string;
    full_name: string;
    email: string;
    phone: string;
    is_active: boolean;
    plan_name: string;
    subscription_status: string;
    created_at: string;
}

export const adminApi = {
    getDashboardStats: async () => {
        const response = await apiClient.get<AdminStats>("/admin/dashboard-stats");
        return response.data;
    },
    listOwners: async () => {
        const response = await apiClient.get<OwnerDetail[]>("/admin/owners");
        return response.data;
    },
    getOwner: async (id: number) => {
        const response = await apiClient.get<OwnerDetail>(`/admin/owners/${id}`);
        return response.data;
    },
    toggleOwnerStatus: async (id: number) => {
        const response = await apiClient.post(`/admin/owners/${id}/status`, { is_active: true }); // Simplified for now
        return response.data;
    },
    listPasswordRequests: async () => {
        const response = await apiClient.get("/admin/password-requests");
        return response.data;
    },
    approvePasswordRequest: async (id: number) => {
        const response = await apiClient.post(`/admin/password-requests/${id}/approve`);
        return response.data;
    },
    rejectPasswordRequest: async (id: number) => {
        const response = await apiClient.post(`/admin/password-requests/${id}/reject`);
        return response.data;
    }
};
