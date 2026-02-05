import apiClient from "../apiClient";

export const reportsApi = {
    getDashboardStats: async (date?: string) => {
        const { data } = await apiClient.get("/reports/dashboard", {
            params: { date }
        });
        return data;
    },
    getRevenue: async (startDate: string, endDate: string) => {
        const { data } = await apiClient.get("/reports/revenue", {
            params: { start_date: startDate, end_date: endDate }
        });
        return data;
    },
    getTopProducts: async (limit = 5) => {
        const { data } = await apiClient.get("/reports/top-products", {
            params: { limit }
        });
        return data;
    },
    getAiSummary: async () => {
        const { data } = await apiClient.get("/ai-reports/summary");
        return data;
    },
    getInventoryForecast: async () => {
        const { data } = await apiClient.get("/ai-reports/inventory-forecast");
        return data;
    }
};
