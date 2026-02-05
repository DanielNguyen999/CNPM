"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    Filter,
    Package,
    Tag,
    BarChart3,
    MoreHorizontal,
    ImageIcon,
    Download
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
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
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { productsApi } from "@/lib/api/products";
import { ProductForm } from "@/components/ProductForm";
import Image from "next/image";
import { useAuthStore } from "@/store/useAuthStore";

export default function ProductsPage() {
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const queryClient = useQueryClient();
    const { canEditProducts, canDeleteProducts } = useAuthStore();
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [productToDelete, setProductToDelete] = useState<number | null>(null);

    const [selectedCategory, setSelectedCategory] = useState<string>("all");

    const { data, isLoading } = useQuery({
        queryKey: ["products", searchTerm],
        queryFn: () => productsApi.list(searchTerm),
    });

    const products = data?.items || [];

    const filteredProducts = products.filter((p: any) =>
        selectedCategory === "all" || p.category === selectedCategory
    );

    const deleteMutation = useMutation({
        mutationFn: (id: number) => productsApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["products"] });
        },
    });

    const handleEdit = (product: any) => {
        if (!canEditProducts()) {
            alert("Bạn không có quyền chỉnh sửa sản phẩm.");
            return;
        }
        setSelectedProduct(product);
        setIsFormOpen(true);
    };

    const handleCreate = () => {
        if (!canEditProducts()) {
            alert("Bạn không có quyền tạo sản phẩm mới.");
            return;
        }
        setSelectedProduct(null);
        setIsFormOpen(true);
    };

    const handleDeleteClick = (id: number) => {
        if (!canDeleteProducts()) {
            alert("Bạn không có quyền xóa sản phẩm.");
            return;
        }
        setProductToDelete(id);
        setIsDeleteDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!productToDelete) return;
        try {
            await deleteMutation.mutateAsync(productToDelete);
            setIsDeleteDialogOpen(false);
        } catch (err: any) {
            toast({
                variant: "destructive",
                title: "Lỗi",
                description: "Không thể xóa sản phẩm",
            });
        } finally {
            setProductToDelete(null);
        }
    };

    const handleExport = () => {
        if (!products || products.length === 0) return;

        const headers = ["Mã SP", "Tên sản phẩm", "Danh mục", "Giá bán", "Giá vốn", "Trạng thái"];
        const csvContent = [
            headers.join(","),
            ...products.map((p: any) => [
                p.product_code,
                `"${p.name}"`,
                `"${p.category || ""}"`,
                p.base_price,
                p.cost_price || 0,
                p.is_active ? "Đang bán" : "Ngừng bán"
            ].join(","))
        ].join("\n");

        const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Danh_sach_san_pham_${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const activeProducts = products?.filter((p: any) => p.is_active).length || 0;
    const categories = Array.from(new Set(products?.map((p: any) => p.category).filter(Boolean) || []));

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <Breadcrumb className="mb-2">
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Sản phẩm</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900">Sản phẩm</h2>
                    <p className="text-sm text-slate-500 mt-1">Quản lý danh mục hàng hóa, giá cả và tồn kho.</p>
                </div>
                {canEditProducts() && (
                    <Button
                        onClick={handleCreate}
                        className="bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-100 gap-2 font-medium"
                    >
                        <Plus className="h-4 w-4" />
                        Thêm mới
                    </Button>
                )}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-none shadow-sm bg-gradient-to-br from-indigo-50 to-white border-l-4 border-indigo-500">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">Tổng sản phẩm</p>
                                <p className="text-3xl font-bold text-slate-900">{data?.total || 0}</p>
                            </div>
                            <div className="p-3 bg-white rounded-full shadow-sm">
                                <Package className="h-6 w-6 text-indigo-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-gradient-to-br from-emerald-50 to-white border-l-4 border-emerald-500">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Đang kinh doanh</p>
                                <p className="text-3xl font-bold text-slate-900">{activeProducts}</p>
                            </div>
                            <div className="p-3 bg-white rounded-full shadow-sm">
                                <Tag className="h-6 w-6 text-emerald-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-gradient-to-br from-amber-50 to-white border-l-4 border-amber-500">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">Danh mục</p>
                                <p className="text-3xl font-bold text-slate-900">{categories.length}</p>
                            </div>
                            <div className="p-3 bg-white rounded-full shadow-sm">
                                <BarChart3 className="h-6 w-6 text-amber-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content */}
            <Card className="border shadow-sm bg-white overflow-hidden">
                <div className="p-4 border-b bg-slate-50/50 flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div className="relative flex-1 max-w-md w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Tìm kiếm tên, mã sản phẩm..."
                            className="pl-9 border-slate-200 bg-white"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={handleExport} className="hidden sm:flex border-slate-200">
                            <Download className="h-4 w-4 mr-2" /> Xuất dữ liệu
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="hidden sm:flex border-slate-200">
                                    <Filter className="h-4 w-4 mr-2" />
                                    {selectedCategory === "all" ? "Bộ lọc" : selectedCategory}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Lọc theo danh mục</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => setSelectedCategory("all")}>
                                    Tất cả
                                </DropdownMenuItem>
                                {categories.map((cat: any) => (
                                    <DropdownMenuItem key={cat} onClick={() => setSelectedCategory(cat)}>
                                        {cat}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-slate-50">
                            <TableRow>
                                <TableHead className="w-[80px]">Hình ảnh</TableHead>
                                <TableHead className="w-[120px]">Mã SP</TableHead>
                                <TableHead>Tên sản phẩm</TableHead>
                                <TableHead>Danh mục</TableHead>
                                <TableHead className="text-right">Giá bán</TableHead>
                                <TableHead className="text-center">Trạng thái</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-10 w-10 rounded-md" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                        <TableCell className="text-right"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                                        <TableCell className="text-center"><Skeleton className="h-6 w-16 mx-auto rounded-full" /></TableCell>
                                        <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                                    </TableRow>
                                ))
                            ) : (filteredProducts?.length ?? 0) > 0 ? (
                                filteredProducts?.map((product: any) => (
                                    <TableRow key={product.id} className="hover:bg-slate-50/50 transition-colors group cursor-pointer" onClick={() => handleEdit(product)}>
                                        <TableCell onClick={(e) => e.stopPropagation()}>
                                            <div className="h-10 w-10 rounded-md bg-slate-100 border flex items-center justify-center text-slate-400 overflow-hidden">
                                                {product.image_url ? (
                                                    <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
                                                ) : (
                                                    <ImageIcon className="h-5 w-5 opacity-50" />
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-mono text-xs font-bold text-slate-500">{product.product_code}</TableCell>
                                        <TableCell>
                                            <div className="font-medium text-slate-900 group-hover:text-indigo-600 transition-colors">
                                                {product.name}
                                            </div>
                                            {product.description && (
                                                <div className="text-xs text-slate-500 truncate max-w-[200px]">{product.description}</div>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {product.category ? (
                                                <Badge variant="outline" className="font-normal text-slate-600 bg-slate-50">
                                                    {product.category}
                                                </Badge>
                                            ) : (
                                                <span className="text-xs text-slate-400 italic">--</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right font-bold text-slate-900">
                                            {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(product.base_price)}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {product.is_active ? (
                                                <Badge variant="success" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none">Đang bán</Badge>
                                            ) : (
                                                <Badge variant="secondary">Ngừng bán</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell onClick={(e) => e.stopPropagation()}>
                                            {(canEditProducts() || canDeleteProducts()) && (
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                            <span className="sr-only">Open menu</span>
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
                                                        {canEditProducts() && (
                                                            <DropdownMenuItem onClick={() => handleEdit(product)}>
                                                                <Edit2 className="mr-2 h-4 w-4" /> Chỉnh sửa
                                                            </DropdownMenuItem>
                                                        )}
                                                        {canDeleteProducts() && (
                                                            <>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem className="text-rose-600 focus:text-rose-600" onClick={() => handleDeleteClick(product.id)}>
                                                                    <Trash2 className="mr-2 h-4 w-4" /> Xóa sản phẩm
                                                                </DropdownMenuItem>
                                                            </>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-64 text-center">
                                        <div className="flex flex-col items-center justify-center text-slate-400 gap-3">
                                            <div className="p-4 rounded-full bg-slate-50">
                                                <Package className="h-12 w-12 opacity-50" />
                                            </div>
                                            <div className="space-y-1">
                                                <h3 className="font-semibold text-slate-900">Chưa có sản phẩm nào</h3>
                                                <p className="text-sm">Hãy thêm sản phẩm đầu tiên để bắt đầu bán hàng.</p>
                                            </div>
                                            <Button onClick={handleCreate} className="mt-2 bg-indigo-600 hover:bg-indigo-700">
                                                <Plus className="mr-2 h-4 w-4" /> Thêm sản phẩm mới
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>

            <ProductForm
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                product={selectedProduct}
            />

            <ConfirmDialog
                isOpen={isDeleteDialogOpen}
                onClose={() => setIsDeleteDialogOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Xóa sản phẩm"
                description="Bạn có chắc chắn muốn xóa sản phẩm này? Hành động này không thể hoàn tác."
                confirmText="Xóa sản phẩm"
                variant="destructive"
                isLoading={deleteMutation.isPending}
            />
        </div>
    );
}
