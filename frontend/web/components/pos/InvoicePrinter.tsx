"use client";

import React, { useRef, useEffect } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';

interface InvoicePrinterProps {
    order: any;
    onAfterPrint: () => void;
    autoPrint: boolean;
}

export const InvoicePrinter = ({ order, onAfterPrint, autoPrint }: InvoicePrinterProps) => {
    const componentRef = useRef<HTMLDivElement>(null);

    const handlePrint = useReactToPrint({
        content: () => componentRef.current,
        onAfterPrint: onAfterPrint,
        documentTitle: `HoaDon_${order?.order_code || 'temp'}`,
    } as any);

    useEffect(() => {
        if (order && autoPrint) {
            handlePrint();
        }
    }, [order, autoPrint, handlePrint]);

    if (!order) return null;

    return (
        <>
            <div className="hidden">
                <div ref={componentRef} className="p-8 bg-white text-black font-mono text-xs w-[80mm] mx-auto">
                    <div className="text-center mb-4">
                        <h1 className="text-xl font-bold uppercase">{order.store_name || "CỬA HÀNG BIZFLOW"}</h1>
                        <p>{order.store_address || "Hệ thống quản lý bán hàng"}</p>
                        <p>{order.store_phone || "Hotline: 1900 xxxx"}</p>
                    </div>

                    <div className="text-center mb-4 border-b border-dashed pb-2">
                        <h2 className="text-lg font-bold uppercase">HÓA ĐƠN BÁN HÀNG</h2>
                        <p>Số: {order.order_code}</p>
                        <p>Ngày: {new Date(order.created_at || Date.now()).toLocaleString('vi-VN')}</p>
                    </div>

                    <div className="mb-4">
                        <p>Khách hàng: {order.customer_name || "Khách lẻ"}</p>
                        {order.customer_phone && <p>SĐT: {order.customer_phone}</p>}
                    </div>

                    <table className="w-full mb-4">
                        <thead>
                            <tr className="border-b border-black">
                                <th className="text-left">SP</th>
                                <th className="text-center">SL</th>
                                <th className="text-right">Giá</th>
                                <th className="text-right">Thành tiền</th>
                            </tr>
                        </thead>
                        <tbody>
                            {order.items?.map((item: any, idx: number) => (
                                <tr key={idx} className="border-b border-dashed border-gray-300">
                                    <td className="py-1">
                                        <div>{item.product_name}</div>
                                        {item.unit_name && <div className="text-[10px] italic">({item.unit_name})</div>}
                                    </td>
                                    <td className="text-center align-top">{Number(item.quantity).toLocaleString('vi-VN')}</td>
                                    <td className="text-right align-top">{Number(item.unit_price).toLocaleString('vi-VN')}</td>
                                    <td className="text-right align-top font-bold">{Number(item.line_total || item.total).toLocaleString('vi-VN')}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="flex justify-between font-bold text-sm mb-1">
                        <span>Tổng tiền hàng:</span>
                        <span>{Number(order.subtotal).toLocaleString('vi-VN')}</span>
                    </div>
                    {order.discount_amount > 0 && (
                        <div className="flex justify-between mb-1">
                            <span>Giảm giá:</span>
                            <span>-{Number(order.discount_amount).toLocaleString('vi-VN')}</span>
                        </div>
                    )}
                    <div className="flex justify-between font-bold text-lg border-t border-black pt-2 mb-4">
                        <span>THANH TOÁN:</span>
                        <span>{Number(order.total_amount).toLocaleString('vi-VN')}</span>
                    </div>

                    <div className="text-center italic mt-6">
                        <p>Cảm ơn quý khách & Hẹn gặp lại!</p>
                        <p>Powered by BizFlow</p>
                    </div>
                </div>
            </div>
            {/* Optional Manual Print Button if needed, usually auto inside logic */}
        </>
    );
};
