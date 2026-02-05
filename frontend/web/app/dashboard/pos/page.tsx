"use client";

import React, { useEffect } from 'react';
import { usePosStore } from '@/store/posStore';
import { PosSearchBar } from '@/components/pos/PosSearchBar';
import { CustomerPicker } from '@/components/pos/CustomerPicker';
import { CartTable } from '@/components/pos/CartTable';
import { CheckoutPanel } from '@/components/pos/CheckoutPanel';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { User, ShoppingCart, CreditCard } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export default function PosPage() {
    const { items, customer, clearCart } = usePosStore();
    const { toast } = useToast();

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Focus Search: /
            if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
                e.preventDefault();
                const searchInput = document.querySelector('input[placeholder="Tìm kiếm sản phẩm..."]') as HTMLInputElement;
                if (searchInput) searchInput.focus();
            }

            // Checkout: Ctrl + Enter
            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                if (items.length === 0) {
                    toast({
                        variant: "destructive",
                        title: "Giỏ hàng trống",
                        description: "Vui lòng thêm sản phẩm trước khi thanh toán.",
                    });
                    return;
                }
                // Trigger checkout button click programmatically or call store logic if exposed
                const checkoutBtn = document.getElementById('btn-checkout');
                if (checkoutBtn) checkoutBtn.click();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [items, toast]);

    return (
        <div className="h-[calc(100vh-8rem)] flex flex-col gap-4 pb-2 animate-in fade-in duration-500">
            <Breadcrumb className="px-4 -mb-2">
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage>Bán hàng (POS)</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
            <div className="flex-1 flex gap-4 min-h-0">
                {/* Left Column: Search & Customer */}
                <div className="w-[30%] min-w-[320px] flex flex-col gap-4">
                    <Card className="border-none shadow-sm flex-1 flex flex-col overflow-hidden">
                        <CardHeader className="py-3 px-4 border-b bg-slate-50_">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2 uppercase tracking-wide text-slate-500">
                                <User className="h-4 w-4" /> Khách hàng
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4">
                            <CustomerPicker />
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm flex-[2] flex flex-col overflow-hidden">
                        <CardHeader className="py-3 px-4 border-b bg-slate-50_">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2 uppercase tracking-wide text-slate-500">
                                <ShoppingCart className="h-4 w-4" /> Sản phẩm
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 flex-1 flex flex-col min-h-0">
                            <div className="flex-1 flex flex-col gap-2 min-h-0">
                                <PosSearchBar />
                                <div className="mt-auto pt-4 text-[10px] text-slate-400 text-center">
                                    <span className="font-bold bg-slate-100 px-1 py-0.5 rounded border">/</span> để tìm kiếm &middot; <span className="font-bold bg-slate-100 px-1 py-0.5 rounded border">↑↓</span> để chọn &middot; <span className="font-bold bg-slate-100 px-1 py-0.5 rounded border">Enter</span> để thêm
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Middle Column: Cart */}
                <div className="flex-1 flex flex-col min-w-0">
                    <Card className="border-none shadow-sm h-full flex flex-col overflow-hidden bg-white">
                        <CardHeader className="py-3 px-4 border-b bg-white z-10">
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-800">
                                    <ShoppingCart className="h-5 w-5 text-indigo-600" /> Giỏ hàng
                                </CardTitle>
                                <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-full">{items.length} sản phẩm</span>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0 flex-1 overflow-auto relative">
                            <CartTable />
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Checkout */}
                <div className="w-[28%] min-w-[340px]">
                    <Card className="border-none shadow-lg h-full flex flex-col overflow-hidden border-indigo-100 bg-slate-50/50">
                        <CardHeader className="py-4 px-5 border-b bg-white">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2 uppercase tracking-wide text-slate-500">
                                <CreditCard className="h-4 w-4" /> Thanh toán
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 flex-1 flex flex-col">
                            <CheckoutPanel />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
