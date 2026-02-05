"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Search, ShoppingCart, Plus, Minus, Loader2 } from "lucide-react";
import { productsApi } from "@/lib/api/products";
import { ordersApi } from "@/lib/api/orders";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { useAuthStore } from "@/store/useAuthStore";
import { getImageUrl } from "@/lib/utils";

export default function PortalProductsPage() {
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const pageSize = 20;
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [quantity, setQuantity] = useState(1);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const { user } = useAuthStore();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ["portal-products", search, page],
        queryFn: () => productsApi.list(search, page, pageSize),
        placeholderData: (previousData) => previousData, // keepPreviousData equivalent
    });

    const createOrderMutation = useMutation({
        mutationFn: (payload: any) => ordersApi.createOrder(payload),
        onSuccess: () => {
            toast({
                title: "Đặt hàng thành công",
                description: "Đơn hàng của bạn đã được ghi nhận.",
                className: "bg-green-50 text-green-900",
            });
            setIsCartOpen(false);
            setQuantity(1);
            setSelectedProduct(null);
            // Invalidate portal orders to update history
            queryClient.invalidateQueries({ queryKey: ["portal-orders"] });
        },
        onError: (error: any) => {
            toast({
                title: "Lỗi",
                description: error.response?.data?.detail || "Không thể tạo đơn hàng",
                variant: "destructive",
            });
        }
    });

    const handleBuyNow = () => {
        if (!selectedProduct) return;

        const payload = {
            customer_id: user?.id, // Should be resolved on backend usually, but here we might need to pass self
            items: [{
                product_id: selectedProduct.id,
                quantity: quantity,
                unit_price: selectedProduct.sell_price
            }],
            payment_method: "DEBT", // Default to Debt for Portal as requested "record debt"
            paid_amount: 0,
            notes: "Đặt hàng qua Portal"
        };

        createOrderMutation.mutate(payload);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Sản phẩm</h1>
                    <p className="text-muted-foreground">Mua hàng và ghi nợ tự động.</p>
                </div>
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Tìm kiếm sản phẩm..."
                        className="pl-9"
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPage(1); // Reset to page 1 on search
                        }}
                    />
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {data?.items?.map((product: any) => (
                        <Card key={product.id} className="flex flex-col overflow-hidden hover:shadow-lg transition-shadow">
                            <div className="h-48 bg-slate-100 flex items-center justify-center text-slate-400 overflow-hidden relative">
                                {product.image_url ? (
                                    <img
                                        src={getImageUrl(product.image_url)}
                                        alt={product.name}
                                        className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500"
                                    />
                                ) : (
                                    <ShoppingCart className="h-12 w-12 opacity-20" />
                                )}
                            </div>
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <Badge variant="outline" className="mb-2">{product.product_code}</Badge>
                                    <span className="text-xs font-semibold text-emerald-600">
                                        Còn: {product.stock_quantity ?? "Liên hệ"}
                                    </span>
                                </div>
                                <CardTitle className="text-lg line-clamp-2" title={product.name}>
                                    {product.name}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1">
                                <div className="text-xl font-bold text-indigo-600">
                                    {formatCurrency(product.base_price)}
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button
                                    className="w-full"
                                    onClick={() => {
                                        setSelectedProduct(product);
                                        setQuantity(1);
                                        setIsCartOpen(true);
                                    }}
                                >
                                    <ShoppingCart className="mr-2 h-4 w-4" /> Mua hàng
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                    {data?.items?.length === 0 && (
                        <div className="col-span-full text-center py-12 text-muted-foreground">
                            Không tìm thấy sản phẩm nào.
                        </div>
                    )}
                </div>
            )}

            {/* Pagination */}
            {data && data.total_pages > 1 && (
                <div className="flex items-center justify-between px-4 py-4 bg-white border rounded-lg">
                    <div className="text-sm text-muted-foreground">
                        Trang {page} / {data.total_pages} (Tổng: {data.total} sản phẩm)
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1 || isLoading}
                        >
                            Trước
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage((p) => Math.min(data.total_pages, p + 1))}
                            disabled={page === data.total_pages || isLoading}
                        >
                            Sau
                        </Button>
                    </div>
                </div>
            )}

            <Dialog open={isCartOpen} onOpenChange={setIsCartOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Xác nhận mua hàng</DialogTitle>
                        <DialogDescription>
                            Đơn hàng sẽ được ghi nhận vào công nợ của bạn.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedProduct && (
                        <div className="space-y-4 py-4">
                            <div className="flex justify-between font-medium">
                                <span>Sản phẩm:</span>
                                <span>{selectedProduct.name}</span>
                            </div>
                            <div className="flex justify-between font-medium">
                                <span>Đơn giá:</span>
                                <span>{formatCurrency(selectedProduct.sell_price)}</span>
                            </div>

                            <div className="flex items-center justify-between">
                                <span>Số lượng:</span>
                                <div className="flex items-center gap-3">
                                    <Button
                                        variant="outline" size="icon" className="h-8 w-8"
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    >
                                        <Minus className="h-3 w-3" />
                                    </Button>
                                    <span className="w-8 text-center font-bold">{quantity}</span>
                                    <Button
                                        variant="outline" size="icon" className="h-8 w-8"
                                        onClick={() => setQuantity(quantity + 1)}
                                    >
                                        <Plus className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>

                            <div className="border-t pt-4 flex justify-between text-lg font-bold">
                                <span>Tổng cộng:</span>
                                <span className="text-indigo-600">
                                    {formatCurrency(selectedProduct.sell_price * quantity)}
                                </span>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCartOpen(false)}>Hủy</Button>
                        <Button
                            onClick={handleBuyNow}
                            disabled={createOrderMutation.isPending}
                            className="bg-indigo-600 hover:bg-indigo-700"
                        >
                            {createOrderMutation.isPending ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                "Xác nhận đặt hàng"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function ShoppingBagIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
    )
}
