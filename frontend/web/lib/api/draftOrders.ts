import apiClient from '../apiClient';

export const draftOrdersApi = {
    aiParse: async (text: string) => {
        const { data } = await apiClient.post('/ai/parse', {
            user_input: text,
            source: 'AI_TEXT'
        });
        return data;
    },
    listDrafts: async (skip = 0, limit = 100) => {
        const { data } = await apiClient.get(`/draft-orders?skip=${skip}&limit=${limit}`);
        return data;
    },
    getDraft: async (id: number) => {
        const { data } = await apiClient.get(`/draft-orders/${id}`);
        return data;
    },
    updateDraft: async (id: number, payload: any) => {
        const { data } = await apiClient.patch(`/draft-orders/${id}`, payload);
        return data;
    },
    confirmDraft: async (id: number, overrides?: any) => {
        const { data } = await apiClient.post(`/draft-orders/${id}/confirm`, { overrides });
        return data;
    },
};
