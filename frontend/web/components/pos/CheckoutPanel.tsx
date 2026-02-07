"use client";


import React, { useState } from 'react';
import { CreditCard, Wallet, Banknote, UserPlus, LogOut, CheckCircle2 } from 'lucide-react';
import { usePosStore } from '@/store/posStore';
import { Button } from '@/components/ui/button';
import { notifications } from '@/lib/notifications';
import { InvoicePrinter } from '@/components/pos/InvoicePrinter';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { ordersApi } from '@/lib/api/orders';
import { customersApi } from '@/lib/api/customers';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export const CheckoutPanel = () => {
    const queryClient = useQueryClient();
    const {
        items,
        customer,
        paymentMethod,
        paidAmount,
        isDebt,
        notes,
        taxRate,
        discountAmount,
        getSubtotal,
        getTotal,
        setPaymentMethod,
        setPaidAmount,
        setIsDebt,
        setNotes,
        clearCart,
        setCustomer
    } = usePosStore();

    const [isSubmitting, setIsSubmitting] = useState(false);

    const subtotal = getSubtotal();
    const taxAmount = subtotal * (taxRate / 100);
    const total = getTotal();

    const [printOrder, setPrintOrder] = useState<any>(null);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const createOrderMutation = useMutation({
        mutationFn: ({ payload, idempotencyKey }: { payload: any, idempotencyKey?: string }) =>
            ordersApi.createOrder(payload, idempotencyKey),
        onSuccess: (data) => {
            notifications.success(
                "Đã tạo đơn hàng",
                `Mã đơn: ${data.order_code}${isDebt ? " (Đơn ghi nợ)" : ""}`
            );

            // Trigger auto print
            setPrintOrder(data);

            // Clear cart
            clearCart();

            // Invalidate all related queries to update UI immediately
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            queryClient.invalidateQueries({ queryKey: ['inventory'] });
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
            queryClient.invalidateQueries({ queryKey: ['lowStock'] });
            if (isDebt) {
                queryClient.invalidateQueries({ queryKey: ['debts'] });
            }
        },
        onError: (error: any) => {
            notifications.error(
                "Lỗi tạo đơn hàng",
                error.response?.data?.detail || "Không thể kết nối máy chủ. Vui lòng thử lại"
            );
        }
    });

    const handleSubmit = async () => {
        if (items.length === 0) return;
        if (!customer) {
            notifications.warning("Thông tin thiếu", "Vui lòng chọn khách hàng trước khi thanh toán.");
            return;
        }

        setIsSubmitting(true);
        try {
            // Generate basic idempotency key (timestamp + customer)
            const idempotencyKey = `ord_${Date.now()}_${customer.id}`;

            const payload = {
                customer_id: customer.id,
                items: items.map(item => ({
                    product_id: item.product_id,
                    unit_id: item.unit_id,
                    quantity: item.quantity,
                    unit_price: item.unit_price,
                    discount_percent: 0,
                })),
                tax_rate: taxRate,
                discount_amount: discountAmount,
                paid_amount: isDebt ? 0 : paidAmount || total,
                payment_method: paymentMethod,
                notes: notes
            };
            await createOrderMutation.mutateAsync({ payload, idempotencyKey });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Keyboard shortcut Ctrl+Enter
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                handleSubmit();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [items, customer, paymentMethod, paidAmount, isDebt, notes]);

    return (
        <div className="flex flex-col h-full space-y-3 p-2">
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-slate-900">Thanh toán</h2>
                    {isDebt && (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded uppercase">Bán nợ</span>
                    )}
                </div>

                <Separator className="my-1" />

                <div className="space-y-1.5">
                    <div className="flex justify-between text-sm text-slate-600">
                        <span>Tạm tính</span>
                        <span>{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-slate-600">
                        <span>Thuế ({taxRate}%)</span>
                        <span>{formatCurrency(taxAmount)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-slate-600">
                        <span>Giảm giá</span>
                        <span className="text-rose-500">-{formatCurrency(discountAmount)}</span>
                    </div>
                    <Separator className="bg-slate-100 my-1" />
                    <div className="flex justify-between text-lg font-bold text-slate-900">
                        <span>Tổng cộng</span>
                        <span className="text-indigo-600">{formatCurrency(total)}</span>
                    </div>
                </div>
            </div>

            <div className="space-y-3 pt-2 border-t">
                <div className="space-y-1.5">
                    <Label className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Phương thức</Label>
                    <div className="grid grid-cols-2 gap-2">
                        <Button
                            variant={paymentMethod === 'CASH' ? 'default' : 'outline'}
                            className={`h-9 ${paymentMethod === 'CASH' ? 'bg-indigo-600' : ''}`}
                            onClick={() => setPaymentMethod('CASH')}
                        >
                            <Banknote className="mr-2 h-4 w-4" /> Tiền mặt
                        </Button>
                        <Button
                            variant={paymentMethod === 'BANK_TRANSFER' ? 'default' : 'outline'}
                            className={`h-9 ${paymentMethod === 'BANK_TRANSFER' ? 'bg-indigo-600' : ''}`}
                            onClick={() => setPaymentMethod('BANK_TRANSFER')}
                        >
                            <CreditCard className="mr-2 h-4 w-4" /> Chuyển khoản
                        </Button>
                    </div>
                </div>

                {!isDebt && (
                    <div className="space-y-1.5">
                        <Label className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Khách trả</Label>
                        <div className="relative">
                            <Input
                                type="number"
                                value={paidAmount || total}
                                onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                                className="h-9 text-lg font-bold pr-12"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">VND</span>
                        </div>
                        {(paidAmount > total) && (
                            <div className="flex justify-between text-xs font-medium text-emerald-600 px-1 italic">
                                <span>Tiền thừa:</span>
                                <span>{formatCurrency(paidAmount - total)}</span>
                            </div>
                        )}
                    </div>
                )}

                <div className="flex items-center space-x-2 py-1">
                    <input
                        type="checkbox"
                        id="isDebt"
                        checked={isDebt}
                        onChange={(e) => setIsDebt(e.target.checked)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                    />
                    <Label htmlFor="isDebt" className="text-sm font-medium cursor-pointer">Ghi nợ cho khách hàng này</Label>
                </div>

                <div className="space-y-1.5">
                    <Label className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Ghi chú</Label>
                    <Input
                        placeholder="Ghi chú đơn hàng..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="h-9"
                    />
                </div>
            </div>

            <div className="pt-2 mt-auto">
                <Button
                    id="btn-checkout"
                    className="w-full h-12 text-lg font-bold bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-[0.98]"
                    disabled={items.length === 0 || !customer || isSubmitting}
                    onClick={handleSubmit}
                >
                    {isSubmitting ? "Đang xử lý..." : "THANH TOÁN"}
                    <span className="ml-2 text-xs font-normal opacity-70">(Ctrl+Enter)</span>
                </Button>
            </div>

            <InvoicePrinter
                order={printOrder}
                autoPrint={!!printOrder}
                onAfterPrint={() => setPrintOrder(null)}
            />
        </div>
    );
};
