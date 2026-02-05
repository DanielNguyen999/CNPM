"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Printer } from "lucide-react";
import { useState } from "react";
import { InvoicePrinter } from "@/components/pos/InvoicePrinter";

interface OrderDetailDialogProps {
    order: any;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function OrderDetailDialog({ order, open, onOpenChange }: OrderDetailDialogProps) {
    const [printOrder, setPrintOrder] = useState<any>(null);

    if (!order) return null;

    const handlePrint = () => {
        setPrintOrder(order);
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center justify-between">
                            <span>Đơn hàng #{order.order_code}</span>
                            <div className="flex items-center gap-2">
                                <Badge variant={order.payment_status === 'PAID' ? "success" : "destructive"}>
                                    {order.payment_status || "UNPAID"}
                                </Badge>
                                <Button size="sm" variant="outline" onClick={handlePrint} className="gap-2">
                                    <Printer className="h-4 w-4" /> In hóa đơn
                                </Button>
                            </div>
                        </DialogTitle>
                    </DialogHeader>

                    <div className="grid grid-cols-2 gap-8 text-sm">
                        <div>
                            <h3 className="font-semibold text-slate-900 mb-2">Thông tin chung</h3>
                            <div className="space-y-1 text-slate-600">
                                <p>Khách hàng: <span className="font-medium text-slate-900">{order.customer?.full_name || "Khách lẻ"}</span></p>
                                <p>Ngày tạo: <span className="font-medium text-slate-900">{format(new Date(order.created_at), 'dd/MM/yyyy HH:mm', { locale: vi })}</span></p>
                                <p>Thu ngân: <span className="font-medium text-slate-900">#{order.owner_id}</span></p>
                            </div>
                        </div>
                        <div className="text-right">
                            <h3 className="font-semibold text-slate-900 mb-2">Thanh toán</h3>
                            <div className="space-y-1 text-slate-600">
                                <p>Tổng tiền hàng: <span className="font-medium text-slate-900">{(Number(order.subtotal) || 0).toLocaleString('vi-VN')} đ</span></p>
                                <p>Thuế: <span className="font-medium text-slate-900">{(Number(order.tax_amount) || 0).toLocaleString('vi-VN')} đ</span></p>
                                <p>Giảm giá: <span className="font-medium text-slate-900">{(Number(order.discount_amount) || 0).toLocaleString('vi-VN')} đ</span></p>
                                <p className="text-lg font-bold text-indigo-600 mt-2">
                                    Tổng cộng: {(Number(order.total_amount) || 0).toLocaleString('vi-VN')} đ
                                </p>
                                <p>Đã trả: {(Number(order.paid_amount) || 0).toLocaleString('vi-VN')} đ</p>
                                {order.debt_amount > 0 && <p className="text-red-500 font-bold">Còn nợ: {Number(order.debt_amount).toLocaleString('vi-VN')} đ</p>}
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 border rounded-lg overflow-hidden">
                        <Table>
                            <TableHeader className="bg-slate-50">
                                <TableRow>
                                    <TableHead>Sản phẩm</TableHead>
                                    <TableHead className="text-center">ĐVT</TableHead>
                                    <TableHead className="text-right">Đơn giá</TableHead>
                                    <TableHead className="text-center">SL</TableHead>
                                    <TableHead className="text-right">Thành tiền</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {order.items?.map((item: any, i: number) => (
                                    <TableRow key={i}>
                                        <TableCell className="font-medium">{item.product_name || `SP #${item.product_id}`}</TableCell>
                                        <TableCell className="text-center text-slate-500">{item.unit_name || '-'}</TableCell>
                                        <TableCell className="text-right">{Number(item.unit_price).toLocaleString('vi-VN')}</TableCell>
                                        <TableCell className="text-center font-bold">{Number(item.quantity).toLocaleString('vi-VN')}</TableCell>
                                        <TableCell className="text-right font-bold">{Number(item.line_total || item.total || 0).toLocaleString('vi-VN')}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </DialogContent>
            </Dialog>

            <InvoicePrinter
                order={printOrder}
                autoPrint={!!printOrder}
                onAfterPrint={() => setPrintOrder(null)}
            />
        </>
    );
}
