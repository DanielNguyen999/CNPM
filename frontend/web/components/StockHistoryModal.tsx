"use client";

import { useQuery } from "@tanstack/react-query";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { inventoryApi } from "@/lib/api/inventory";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

interface StockHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: any;
}

export function StockHistoryModal({ isOpen, onClose, product }: StockHistoryModalProps) {
    const { data: movements, isLoading } = useQuery({
        queryKey: ["inventory", "history", product?.product_id],
        queryFn: () => inventoryApi.getProductHistory(product.product_id),
        enabled: isOpen && !!product,
    });

    if (!product) return null;

    const getMovementBadge = (type: string) => {
        switch (type) {
            case "IMPORT":
                return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200">Nhập kho</Badge>;
            case "EXPORT":
                return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">Xuất kho</Badge>;
            case "SALE":
                return <Badge className="bg-indigo-100 text-indigo-800 hover:bg-indigo-200">Bán hàng</Badge>;
            case "RETURN":
                return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Hoàn trả</Badge>;
            case "ADJUSTMENT":
                return <Badge className="bg-slate-100 text-slate-800 hover:bg-slate-200">Kiểm kê</Badge>;
            default:
                return <Badge variant="outline">{type}</Badge>;
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Lịch sử biến động: {product.product_name}</DialogTitle>
                </DialogHeader>

                <div className="mt-4">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Thời gian</TableHead>
                                <TableHead>Loại</TableHead>
                                <TableHead className="text-right">Số lượng</TableHead>
                                <TableHead className="text-right">Tồn sau</TableHead>
                                <TableHead>Lý do / Ghi chú</TableHead>
                                <TableHead>Người thực hiện</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                    </TableRow>
                                ))
                            ) : movements && movements.length > 0 ? (
                                movements.map((m: any) => (
                                    <TableRow key={m.id}>
                                        <TableCell className="text-xs text-slate-500 font-medium">
                                            {format(new Date(m.created_at), "dd/MM/yyyy HH:mm", { locale: vi })}
                                        </TableCell>
                                        <TableCell>{getMovementBadge(m.movement_type)}</TableCell>
                                        <TableCell className={`text-right font-bold ${m.quantity_change > 0 ? "text-emerald-600" : "text-rose-600"}`}>
                                            {m.quantity_change > 0 ? "+" : ""}{Number(m.quantity_change).toLocaleString('vi-VN')}
                                        </TableCell>
                                        <TableCell className="text-right text-slate-700 font-mono">
                                            {Number(m.remaining_quantity).toLocaleString('vi-VN')}
                                        </TableCell>
                                        <TableCell className="max-w-[200px] truncate text-sm text-slate-600" title={m.reason}>
                                            {m.reason}
                                        </TableCell>
                                        <TableCell className="text-xs text-slate-500">
                                            {m.created_by || "System"}
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center text-slate-400">
                                        Chưa có lịch sử biến động nào.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </DialogContent>
        </Dialog>
    );
}
