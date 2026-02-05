"use client";

import { useQuery } from "@tanstack/react-query";
import { Package, Search, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { productsApi } from "@/lib/api/products";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export default function PortalProductsPage() {
    const [searchTerm, setSearchTerm] = useState("");

    const { data, isLoading } = useQuery({
        queryKey: ["portal", "products", searchTerm],
        queryFn: () => productsApi.list(searchTerm),
    });

    const products = data?.items || [];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbPage>Dashboard Khách hàng</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900">Sản phẩm</h2>
                    <p className="text-sm text-slate-500 mt-1">Danh mục hàng hóa đang kinh doanh.</p>
                </div>
            </div>

            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                    placeholder="Tìm kiếm sản phẩm..."
                    className="pl-9 border-slate-200 bg-white"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {isLoading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                        <Card key={i} className="overflow-hidden border-none shadow-sm h-64">
                            <Skeleton className="h-full w-full" />
                        </Card>
                    ))
                ) : products.length ? (
                    products.map((product: any) => (
                        <Card key={product.id} className="overflow-hidden border shadow-sm hover:shadow-md transition-all group flex flex-col">
                            <div className="h-40 bg-slate-100 flex items-center justify-center relative">
                                {product.image_url ? (
                                    <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
                                ) : (
                                    <Package className="h-12 w-12 text-slate-300" />
                                )}
                                <div className="absolute top-2 right-2">
                                    <Badge className="bg-white/90 text-slate-900 border-none shadow-sm backdrop-blur-sm">
                                        {product.category || "Hàng hóa"}
                                    </Badge>
                                </div>
                            </div>
                            <CardContent className="p-4 flex-1 flex flex-col justify-between">
                                <div>
                                    <h3 className="font-bold text-slate-900 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                                        {product.name}
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-1">{product.product_code}</p>
                                </div>
                                <div className="mt-4 flex items-center justify-between">
                                    <span className="text-lg font-bold text-indigo-600">
                                        {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(product.base_price)}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <div className="col-span-full h-64 flex flex-col items-center justify-center text-slate-400 gap-2">
                        <Package className="h-12 w-12 opacity-20" />
                        <p>Không tìm thấy sản phẩm nào.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
