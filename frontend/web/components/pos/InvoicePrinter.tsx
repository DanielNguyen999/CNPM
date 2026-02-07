"use client";

import React, { useRef, useEffect } from 'react';
import { useReactToPrint } from 'react-to-print';

interface InvoicePrinterProps {
    order: any;
    onAfterPrint: () => void;
    autoPrint: boolean;
    className?: string;
}

export const InvoicePrinter = ({ order, onAfterPrint, autoPrint, className }: InvoicePrinterProps) => {
    const componentRef = useRef<HTMLDivElement>(null);

    const handlePrint = useReactToPrint({
        content: () => componentRef.current,
        onAfterPrint: onAfterPrint,
        documentTitle: `HoaDon_${order?.order_code || 'temp'}`,
        removeAfterPrint: true,
    } as any);

    useEffect(() => {
        if (order && autoPrint && handlePrint) {
            const timer = setTimeout(() => {
                handlePrint();
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [order, autoPrint, handlePrint]);

    if (!order) return null;

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('vi-VN').format(val || 0);
    };

    return (
        <div className={className} style={!className ? { overflow: 'hidden', height: 0, width: 0, position: 'absolute', opacity: 0 } : undefined}>
            <div
                ref={componentRef}
                className="bg-white text-black p-4"
                style={{
                    width: '80mm',
                    margin: '0 auto',
                    fontFamily: 'system-ui, -apple-system, sans-serif'
                }}
            >
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold uppercase tracking-tight leading-tight">CỬA HÀNG BIZFLOW</h1>
                    <p className="text-[11px] mt-1 font-medium text-gray-600">Hệ thống quản lý bán hàng</p>
                    <p className="text-[11px] text-gray-600">Hotline: 1900 xxxx</p>
                </div>

                <div className="text-center mb-6 space-y-1">
                    <h2 className="text-xl font-extrabold uppercase tracking-wide">HÓA ĐƠN BÁN HÀNG</h2>
                    <p className="font-bold text-sm">Số: {order.order_code}</p>
                    <p className="text-[11px] text-gray-500">Ngày: {new Date(order.created_at || Date.now()).toLocaleString('vi-VN')}</p>
                </div>

                <div className="space-y-1 border-t border-dashed border-gray-400 py-4 mb-2">
                    <div className="flex justify-between items-start">
                        <span className="text-gray-600 min-w-[80px]">Khách hàng:</span>
                        <span className="font-bold text-right flex-1">{order.customer_name || order.customer?.full_name || "Khách lẻ"}</span>
                    </div>
                    <div className="flex justify-between items-start">
                        <span className="text-gray-600 min-w-[80px]">SĐT:</span>
                        <span className="font-bold text-right">{order.customer_phone || order.customer?.phone || "---"}</span>
                    </div>
                </div>

                <table className="w-full mb-6 border-t-2 border-black">
                    <thead>
                        <tr className="text-[11px] uppercase border-b border-black">
                            <th className="text-left py-2 font-black">SP</th>
                            <th className="text-center py-2 font-black">SL</th>
                            <th className="text-right py-2 font-black">Giá</th>
                            <th className="text-right py-2 font-black">T.Tiền</th>
                        </tr>
                    </thead>
                    <tbody className="text-[13px] divide-y divide-gray-100">
                        {order.items?.map((item: any, idx: number) => (
                            <tr key={idx}>
                                <td className="py-3 pr-1">
                                    <div className="font-extrabold uppercase leading-tight">{item.product_name || `SP #${item.product_id}`}</div>
                                    {item.unit_name && <div className="text-[10px] text-gray-500 italic mt-0.5">({item.unit_name})</div>}
                                </td>
                                <td className="text-center py-3 font-bold">{item.quantity}</td>
                                <td className="text-right py-3">{formatCurrency(item.unit_price)}</td>
                                <td className="text-right py-3 font-extrabold">{formatCurrency(item.line_total || item.total)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="space-y-2 border-t border-dashed border-gray-400 pt-4 mb-6">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Tổng tiền hàng:</span>
                        <span className="font-bold text-gray-900">{formatCurrency(order.subtotal)}</span>
                    </div>
                    {Number(order.tax_amount || 0) > 0 && (
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Thuế:</span>
                            <span className="font-bold">{formatCurrency(order.tax_amount)}</span>
                        </div>
                    )}
                    {Number(order.discount_amount || 0) > 0 && (
                        <div className="flex justify-between text-sm text-red-600 italic">
                            <span>Giảm giá:</span>
                            <span className="font-bold">-{formatCurrency(order.discount_amount)}</span>
                        </div>
                    )}
                </div>

                <div className="flex justify-between items-baseline border-t-4 border-double border-black pt-4 mb-8">
                    <span className="text-lg font-black tracking-tight uppercase">THANH TOÁN:</span>
                    <span className="text-2xl font-black tracking-tighter">{formatCurrency(order.total_amount)} đ</span>
                </div>

                <div className="text-center space-y-1 mb-4">
                    <p className="italic font-bold text-gray-800 text-sm">Cảm ơn quý khách & Hẹn gặp lại!</p>
                    <p className="text-[10px] uppercase font-black tracking-widest text-gray-400">WWW.BIZFLOW.VN</p>
                </div>

                <style jsx>{`
                    @media print {
                        @page {
                            margin: 0;
                            size: 80mm auto;
                        }
                        div {
                            border: none !important;
                            box-shadow: none !important;
                        }
                    }
                `}</style>
            </div>
        </div>
    );
};
