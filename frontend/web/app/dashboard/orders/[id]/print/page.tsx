"use client";

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { ordersApi } from '@/lib/api/orders';
import { InvoicePrinter } from '@/components/pos/InvoicePrinter';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

export default function PrintOrderPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const { data: order, isLoading } = useQuery({
        queryKey: ['order', id],
        queryFn: () => ordersApi.getOrder(parseInt(id)),
        enabled: !!id,
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-100">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100 gap-4">
                <p className="text-slate-500">Không tìm thấy đơn hàng</p>
                <Button variant="outline" onClick={() => router.back()}>Quay lại</Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-100 py-8 px-4 flex flex-col items-center gap-6">
            <div className="w-full max-w-[80mm] flex items-center justify-between print:hidden">
                <Button variant="outline" size="sm" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4 mr-2" /> Quay lại
                </Button>
                <Button size="sm" onClick={() => window.print()} className="bg-indigo-600 hover:bg-indigo-700">
                    <Printer className="h-4 w-4 mr-2" /> In ngay
                </Button>
            </div>

            <div className="bg-white shadow-xl rounded-lg overflow-hidden">
                <InvoicePrinter
                    order={order}
                    autoPrint={true}
                    onAfterPrint={() => { }}
                    className="block" // Force visible
                />
            </div>
        </div>
    );
}
