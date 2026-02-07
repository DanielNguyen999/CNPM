import apiClient from '../apiClient';

export const ordersApi = {
    createOrder: async (payload: any, idempotencyKey?: string) => {
        const headers = idempotencyKey ? { 'X-Idempotency-Key': idempotencyKey } : {};
        const { data } = await apiClient.post('/orders', payload, { headers });
        return data;
    },
    listOrders: async (page = 1, page_size = 100, search = '', status = '', fromDate = '', toDate = '', customerId = '') => {
        const params = new URLSearchParams({
            page: page.toString(),
            page_size: page_size.toString(),
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
