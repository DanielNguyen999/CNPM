import apiClient from '../apiClient';

export const ordersApi = {
    createOrder: async (payload: any, idempotencyKey?: string) => {
        const headers = idempotencyKey ? { 'X-Idempotency-Key': idempotencyKey } : {};
        const { data } = await apiClient.post('/orders', payload, { headers });
        return data;
    },
    listOrders: async (skip = 0, limit = 100, search = '', status = '', fromDate = '', toDate = '', customerId = '') => {
        const params = new URLSearchParams({
            skip: skip.toString(),
            limit: limit.toString(),
            ...(search && { search }),
            ...(status && { status }),
            ...(fromDate && { start_date: fromDate }),
            ...(toDate && { end_date: toDate }),
            ...(customerId && { customer_id: customerId }),
        });
        const { data } = await apiClient.get(`/orders?${params.toString()}`);
        return data;
    },
    getOrder: async (id: number) => {
        const { data } = await apiClient.get(`/orders/${id}`);
        return data;
    },
    deleteOrder: async (id: number) => {
        await apiClient.delete(`/orders/${id}`);
    }
};
