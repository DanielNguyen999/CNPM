import apiClient from "../apiClient";

export interface Unit {
    id: number;
    name: string;
    abbreviation: string;
    description?: string;
}

export const unitsApi = {
    list: async () => {
        const { data } = await apiClient.get<Unit[]>("/units");
        return data;
    },
    create: async (unit: { name: string; abbreviation: string; description?: string }) => {
        const { data } = await apiClient.post<Unit>("/units", unit);
        return data;
    },
    update: async (id: number, unit: { name: string; abbreviation: string; description?: string }) => {
        const { data } = await apiClient.put<Unit>(`/units/${id}`, unit);
        return data;
    },
    delete: async (id: number) => {
        await apiClient.delete(`/units/${id}`);
    },
};
