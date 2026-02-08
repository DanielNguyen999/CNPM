"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Search,
    AlertTriangle,
    History,
    Package,
    ArrowRightLeft,
    TrendingDown,
    Download,
    FileSpreadsheet
} from "lucide-react";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { inventoryApi } from "@/lib/api/inventory";
import { StockAdjustment } from "@/components/StockAdjustment";
import { StockHistoryModal } from "@/components/StockHistoryModal";
import { useAuthStore } from "@/store/useAuthStore";
import { getImageUrl } from "@/lib/utils";

export default function InventoryPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [isAdjustmentOpen, setIsAdjustmentOpen] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const { isOwner, isAdmin } = useAuthStore();

    // EMPLOYEE can IMPORT/EXPORT, only OWNER/ADMIN can ADJUSTMENT
    // User requested to enable for Employee too
    const canDoAdjustment = true;

    const { data: inventory, isLoading } = useQuery({
        queryKey: ["inventory"],
        queryFn: inventoryApi.list,
    });

    const filteredInventory = inventory?.filter((item: any) =>
        (item.product_code && item.product_code.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.product_name && item.product_name.toLowerCase().includes(searchTerm.toLowerCase()))
    ) || [];

    const lowStockItems = inventory?.filter((item: any) => item.available_quantity <= item.low_stock_threshold) || [];

    const handleExport = () => {
        if (!inventory || inventory.length === 0) return;

        const headers = ["Mã SP", "Tên sản phẩm", "Tồn thực tế", "Đang giữ khách", "Khả dụng", "Ngưỡng cảnh báo"];
        const csvContent = [
            headers.join(","),
            ...inventory.map((item: any) => [
                item.product_id,
                `"${item.product_name || `SP #${item.product_id}`}"`,
                item.quantity,
                item.reserved_quantity,
                item.available_quantity,
                item.low_stock_threshold
            ].join(","))
        ].join("\n");

        const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Bao_cao_kho_${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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
                                <BreadcrumbPage>Kho hàng</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900">Quản lý kho hàng</h2>
                    <p className="text-sm text-slate-500 mt-1">Theo dõi tồn kho, cảnh báo hàng sắp hết và điều chỉnh kho.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="border-slate-200 text-slate-600 gap-2" onClick={handleExport}>
                        <FileSpreadsheet className="h-4 w-4" />
                        Xuất Excel
                    </Button>
                    <Button
                        onClick={() => {
                            setSelectedItem(null);
                            setIsAdjustmentOpen(true);
                        }}
                        className="bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-100 gap-2"
                    >
                        <ArrowRightLeft className="h-4 w-4" />
                        Điều chỉnh kho
                    </Button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <Card className="border-none shadow-sm bg-gradient-to-br from-slate-50 to-white border-l-4 border-slate-500">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Tổng mặt hàng</p>
                                <p className="text-3xl font-bold text-slate-900">{inventory?.length || 0}</p>
                            </div>
                            <div className="p-3 bg-white rounded-full shadow-sm">
                                <Package className="h-6 w-6 text-slate-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-gradient-to-br from-orange-50 to-white border-l-4 border-orange-500">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold text-orange-600 uppercase tracking-wider mb-1">Cảnh báo tồn thấp</p>
                                <p className="text-3xl font-bold text-slate-900">{lowStockItems.length}</p>
                            </div>
                            <div className="p-3 bg-white rounded-full shadow-sm">
                                <AlertTriangle className="h-6 w-6 text-orange-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-gradient-to-br from-indigo-50 to-white border-l-4 border-indigo-500">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">Tổng tồn kho</p>
                                <p className="text-3xl font-bold text-slate-900">
                                    {Math.floor((inventory || []).reduce((sum: number, i: any) => sum + Number(i.available_quantity), 0)).toLocaleString('vi-VN')}
                                </p>
                            </div>
                            <div className="p-3 bg-white rounded-full shadow-sm">
                                <TrendingDown className="h-6 w-6 text-indigo-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filter Bar */}
            <Card className="border shadow-sm bg-white">
                <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-4 items-center">
                        <div className="relative flex-1 group w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                            <Input
                                placeholder="Tìm theo tên, mã sản phẩm..."
                                className="pl-10 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 bg-slate-50"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2">
                            {lowStockItems.length > 0 && (
                                <Badge variant="destructive" className="animate-pulse">
                                    {lowStockItems.length} sản phẩm cần nhập
                                </Badge>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Table */}
            <Card className="border shadow-sm overflow-hidden bg-white">
                <Table>
                    <TableHeader className="bg-slate-50">
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="w-[80px] font-bold text-slate-700">Ảnh</TableHead>
                            <TableHead className="w-[120px] font-bold text-slate-700">Mã SP</TableHead>
                            <TableHead className="font-bold text-slate-700">Tên sản phẩm</TableHead>
                            <TableHead className="font-bold text-slate-700">Tồn thực tế</TableHead>
                            <TableHead className="font-bold text-slate-700">Đang giữ khách</TableHead>
                            <TableHead className="font-bold text-slate-700">Khả dụng</TableHead>
                            <TableHead className="font-bold text-slate-700 text-center">Ngưỡng cảnh báo</TableHead>
                            <TableHead className="w-[120px] text-right"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-10 w-10 rounded-md" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-16 mx-auto" /></TableCell>
                                    <TableCell><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                                </TableRow>
                            ))
                        ) : (filteredInventory?.length ?? 0) > 0 ? (
                            filteredInventory.map((item: any) => {
                                const isLow = item.available_quantity <= item.low_stock_threshold;
                                return (
                                    <TableRow key={item.id} className={`transition-colors hover:bg-slate-50/50 ${isLow ? 'bg-orange-50/30' : ''}`}>
                                        <TableCell>
                                            <div className="h-10 w-10 rounded-md bg-slate-100 flex items-center justify-center overflow-hidden border">
                                                {item.image_url ? (
                                                    <img src={getImageUrl(item.image_url)} alt={item.product_name} className="h-full w-full object-cover" />
                                                ) : (
                                                    <Package className="h-5 w-5 text-slate-300" />
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-mono font-bold text-slate-600">{item.product_code || `#${item.product_id}`}</TableCell>
                                        <TableCell className="font-medium text-slate-900">{item.product_name || "N/A"}</TableCell>
                                        <TableCell className="font-semibold text-slate-900">
                                            {Math.floor(Number(item.quantity)).toLocaleString('vi-VN')}
                                        </TableCell>
                                        <TableCell className="text-slate-500 italic">
                                            {Math.floor(Number(item.reserved_quantity)).toLocaleString('vi-VN')}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <span className={`font-bold text-lg ${isLow ? 'text-orange-600' : 'text-emerald-600'}`}>
                                                    {Math.floor(Number(item.available_quantity)).toLocaleString('vi-VN')}
                                                </span>
                                                {isLow && (
                                                    <span className="flex items-center text-[10px] font-bold uppercase text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded">
                                                        <AlertTriangle className="h-3 w-3 mr-1" /> Thấp
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center font-medium text-slate-400">
                                            {item.low_stock_threshold}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:text-indigo-800"
                                                onClick={() => {
                                                    setSelectedItem(item);
                                                    setIsAdjustmentOpen(true);
                                                }}
                                            >
                                                Điều chỉnh
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="text-slate-400 hover:text-slate-600"
                                                onClick={() => {
                                                    setSelectedItem(item);
                                                    setIsHistoryOpen(true);
                                                }}
                                            >
                                                <History className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} className="h-48 text-center">
                                    <div className="flex flex-col items-center justify-center text-slate-300 gap-2">
                                        <Package className="h-10 w-10 opacity-20" />
                                        <p className="text-sm font-medium">Kho hàng trống</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </Card>

            <StockAdjustment
                isOpen={isAdjustmentOpen}
                onClose={() => setIsAdjustmentOpen(false)}
                product={selectedItem}
                canDoAdjustment={canDoAdjustment}
            />

            <StockHistoryModal
                isOpen={isHistoryOpen}
                onClose={() => setIsHistoryOpen(false)}
                product={selectedItem}
            />
        </div>
    );
}
