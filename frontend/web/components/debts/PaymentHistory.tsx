"use client";

import React from "react";
import { format } from "date-fns";
import {
    CheckCircle2,
    Circle,
    ArrowDownCircle,
    CreditCard,
    Banknote,
    Navigation
} from "lucide-react";
import { DebtPayment } from "@/lib/api/debts";

interface PaymentHistoryProps {
    payments: DebtPayment[];
}

export default function PaymentHistory({ payments }: PaymentHistoryProps) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(amount);
    };

    const getMethodIcon = (method: string) => {
        switch (method) {
            case "CASH":
                return <Banknote className="w-4 h-4 text-green-600" />;
            case "BANK_TRANSFER":
                return <CreditCard className="w-4 h-4 text-blue-600" />;
            default:
                return <ArrowDownCircle className="w-4 h-4 text-slate-600" />;
        }
    };

    const getMethodName = (method: string) => {
        switch (method) {
            case "CASH": return "Tiền mặt";
            case "BANK_TRANSFER": return "Chuyển khoản";
            case "MOMO": return "MoMo";
            default: return method;
        }
    };

    if (payments.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground bg-slate-50 rounded-lg border border-dashed">
                <Circle className="w-8 h-8 mb-2 opacity-20" />
                <p className="text-sm">Chưa có lịch sử thanh toán</p>
            </div>
        );
    }

    return (
        <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-slate-200 before:via-slate-200 before:to-transparent">
            {payments.map((payment, index) => (
                <div key={payment.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                    {/* Dot */}
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-white shadow-sm shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                        <CheckCircle2 className="w-6 h-6 text-green-500" />
                    </div>

                    {/* Card */}
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded-xl border border-slate-100 shadow-sm transition-all hover:shadow-md">
                        <div className="flex items-center justify-between mb-2">
                            <time className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                {format(new Date(payment.payment_date), "dd/MM/yyyy HH:mm")}
                            </time>
                            <div className="flex items-center bg-slate-50 px-2 py-0.5 rounded text-[10px] font-bold text-slate-500">
                                {getMethodIcon(payment.payment_method)}
                                <span className="ml-1.5">{getMethodName(payment.payment_method)}</span>
                            </div>
                        </div>
                        <div className="text-lg font-bold text-slate-900 mb-1">
                            +{formatCurrency(payment.payment_amount)}
                        </div>
                        {payment.reference_number && (
                            <div className="text-xs text-muted-foreground mb-1">
                                Ref: <span className="font-mono">{payment.reference_number}</span>
                            </div>
                        )}
                        {payment.notes && (
                            <p className="text-sm text-slate-600 italic mt-2 border-l-2 border-slate-100 pl-3">
                                "{payment.notes}"
                            </p>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
