"use client";

import { useQuery } from "@tanstack/react-query";
import {
    History,
    ArrowLeft,
    CheckCircle2,
    XCircle,
    ArrowRightLeft,
    Truck,
    RotateCcw
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { inventoryApi } from "@/lib/api/inventory";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export default function InventoryHistoryPage() {
    const router = useRouter();
    const { data: movements, isLoading } = useQuery({
        queryKey: ["inventory-history"],
        queryFn: () => inventoryApi.getHistory({ limit: 100 }),
    });

    const getMovementBadge = (type: string) => {
        switch (type) {
            case "IMPORT":
                return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200"><Truck className="h-3 w-3 mr-1" /> Nhập kho</Badge>;
            case "EXPORT":
                return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200"><Truck className="h-3 w-3 mr-1 rotate-180" /> Xuất kho</Badge>;
            case "ADJUSTMENT":
                return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200"><ArrowRightLeft className="h-3 w-3 mr-1" /> Kiểm kê</Badge>;
            case "RETURN":
                return <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200"><RotateCcw className="h-3 w-3 mr-1" /> Hoàn trả</Badge>;
            default:
                return <Badge variant="outline">{type}</Badge>;
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <Breadcrumb className="mb-2">
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/dashboard/inventory">Kho hàng</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Lịch sử biến động</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900">Lịch sử biến động kho</h2>
                    <p className="text-sm text-slate-500 mt-1">Ghi nhận chi tiết mọi hoạt động xuất nhập tồn.</p>
                </div>
                <Button variant="outline" onClick={() => router.push("/dashboard/inventory")}>
                    <ArrowLeft className="h-4 w-4 mr-2" /> Quay lại kho
                </Button>
            </div>

            <Card className="border shadow-sm bg-white overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-50">
                        <TableRow>
                            <TableHead className="font-bold">Thời gian</TableHead>
                            <TableHead className="font-bold">Sản phẩm</TableHead>
                            <TableHead className="font-bold">Loại biến động</TableHead>
                            <TableHead className="font-bold text-right">Số lượng</TableHead>
                            <TableHead className="font-bold">Đơn vị</TableHead>
                            <TableHead className="font-bold">Ghi chú</TableHead>
                            <TableHead className="font-bold">Người thực hiện</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                </TableRow>
                            ))
                        ) : (movements?.length ?? 0) > 0 ? (
                            movements?.map((move: any) => (
                                <TableRow key={move.id} className="hover:bg-slate-50/50 transition-colors">
                                    <TableCell className="text-sm font-medium text-slate-500">
                                        {format(new Date(move.created_at), "HH:mm dd/MM/yyyy")}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium text-slate-900">{move.product_name || "N/A"}</span>
                                            <span className="text-xs text-slate-400 font-mono">{move.product_code}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{getMovementBadge(move.movement_type)}</TableCell>
                                    <TableCell className={`text-right font-bold ${move.movement_type === 'IMPORT' || move.movement_type === 'RETURN' ? 'text-emerald-600' : 'text-slate-900'}`}>
                                        {move.movement_type === 'EXPORT' ? '-' : '+'}{Number(move.quantity).toLocaleString()}
                                    </TableCell>
                                    <TableCell className="text-sm text-slate-500">
                                        {move.unit_name || "Cái"}
                                    </TableCell>
                                    <TableCell className="text-sm text-slate-600 italic max-w-xs truncate" title={move.notes}>
                                        {move.notes || "-"}
                                    </TableCell>
                                    <TableCell className="text-xs text-slate-400">
                                        ID: {move.created_by}
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={7} className="h-32 text-center text-slate-400">
                                    <div className="flex flex-col items-center justify-center gap-2">
                                        <History className="h-8 w-8 opacity-20" />
                                        <p>Chưa có lịch sử biến động nào.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </Card>
        </div>
    );
}
