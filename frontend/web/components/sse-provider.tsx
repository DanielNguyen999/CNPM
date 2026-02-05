"use client";

import React, { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/components/ui/use-toast';

export const SSEProvider = ({ children }: { children: React.ReactNode }) => {
    const queryClient = useQueryClient();
    const { token, user, isAuthenticated } = useAuthStore();
    const { toast } = useToast();

    useEffect(() => {
        if (!isAuthenticated || !token || !user?.owner_id) return;

        const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080').replace(/\/api\/v1\/?$/, '');
        const sseUrl = `${baseUrl}/api/v1/events/stream?token=${token}`;

        console.log('Connecting to SSE:', sseUrl);
        const eventSource = new EventSource(sseUrl);

        eventSource.addEventListener('update', (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log('Real-time event received:', data);

                const { type, payload } = data;

                // Invalidate specific queries based on event type
                if (type === 'ORDER_CREATED') {
                    queryClient.invalidateQueries({ queryKey: ['orders'] });
                    queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
                    queryClient.invalidateQueries({ queryKey: ['inventory'] });

                    toast({
                        title: "Đơn hàng mới",
                        description: `Đơn hàng ${payload.order_code} vừa được tạo cho ${payload.customer_name || 'Khách lẻ'}. Tổng: ${new Intl.NumberFormat('vi-VN').format(payload.total_amount)}đ`,
                        className: "bg-indigo-600 text-white",
                    });
                } else if (type === 'DEBT_REPAID') {
                    queryClient.invalidateQueries({ queryKey: ['debts'] });
                    queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });

                    toast({
                        title: "Thanh toán công nợ",
                        description: `Khoản nợ đã được thanh toán ${new Intl.NumberFormat('vi-VN').format(payload.payment_amount)}đ. Còn lại: ${new Intl.NumberFormat('vi-VN').format(payload.remaining_amount)}đ`,
                        className: "bg-emerald-600 text-white",
                    });
                } else if (type === 'STOCK_ADJUSTED') {
                    queryClient.invalidateQueries({ queryKey: ['inventory'] });
                    queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
                }
            } catch (err) {
                console.error('Error parsing SSE event:', err);
            }
        });

        eventSource.addEventListener('ping', () => {
            // Keep-alive received
        });

        eventSource.onerror = (err) => {
            console.error('SSE connection error:', err);
            // Browser will usually handle reconnect automatically
        };

        return () => {
            console.log('Closing SSE connection');
            eventSource.close();
        };
    }, [isAuthenticated, token, user?.owner_id, queryClient, toast]);

    return <>{children}</>;
};
