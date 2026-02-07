"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Dialog,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { DraggableDialogContent } from "@/components/ui/DraggableDialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ImageIcon } from "lucide-react";
import apiClient from "@/lib/apiClient";

import { unitsApi } from "@/lib/api/units";
import { productsApi } from "@/lib/api/products";

import { notifications } from "@/lib/notifications";

/**
 * Product Form Modal Component
 * Used for creating and editing products.
 */

interface ProductFormProps {
    isOpen: boolean;
    onClose: () => void;
    product?: any; // If provided, it's Edit mode
}

export function ProductForm({ isOpen, onClose, product }: ProductFormProps) {
    const queryClient = useQueryClient();
    const isEdit = !!product;

    const [formData, setFormData] = useState({
        product_code: "",
        name: "",
        category: "",
        base_unit_id: "",
        base_price: "",
        cost_price: "",
        image_url: "",
        description: "",
    });

    const { data: units } = useQuery({
        queryKey: ["units"],
        queryFn: unitsApi.list,
        enabled: isOpen,
    });

    useEffect(() => {
        if (product) {
            setFormData({
                product_code: product.product_code || "",
                name: product.name || "",
                category: product.category || "",
                base_unit_id: product.base_unit_id?.toString() || "",
                base_price: product.base_price?.toString() || "",
                cost_price: product.cost_price?.toString() || "",
                image_url: product.image_url || "",
                description: product.description || "",
            });
        } else {
            setFormData({
                product_code: "",
                name: "",
                category: "",
                base_unit_id: "",
                base_price: "",
                cost_price: "",
                image_url: "",
                description: "",
            });
        }
    }, [product, isOpen]);

    const mutation = useMutation({
        mutationFn: async (data: any) => {
            if (isEdit) {
                return productsApi.update(product.id, data);
            } else {
                return productsApi.create(data);
            }
        },
        onSuccess: async () => {
            // Close immediately for better UX
            onClose();

            // Notify user
            notifications.success(
                isEdit ? "Đã cập nhật" : "Đã tạo",
                `Sản phẩm "${formData.name}" đã được lưu thành công.`
            );

            // Wait a bit for DB consistency then refetch
            setTimeout(async () => {
                await queryClient.refetchQueries({ queryKey: ["products"], type: 'active' });
                await queryClient.invalidateQueries({ queryKey: ["products"], exact: false });
            }, 500);
        },
        onError: (error: any) => {
            console.error("Product save error:", error);
            const detail = error.response?.data?.detail;
            notifications.error(
                "Lỗi lưu sản phẩm",
                detail || "Đã có lỗi xảy ra khi lưu thông tin. Vui lòng kiểm tra lại các trường nhập liệu."
            );
        }
    });

    const isGoogleLink = (url: string) => url.includes("google.com/imgres") || url.includes("images.app.goo.gl");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Basic validation
        if (!formData.base_unit_id || formData.base_unit_id === "0") {
            notifications.error("Thiếu thông tin", "Vui lòng chọn đơn vị tính cho sản phẩm.");
            return;
        }

        // Smart link check
        if (formData.image_url && isGoogleLink(formData.image_url)) {
            notifications.warning(
                "Link ảnh không hợp lệ",
                "Anh đang dán link tìm kiếm của Google. Hãy chuột phải vào ảnh -> 'Sao chép địa chỉ hình ảnh' để lấy link trực tiếp nhé!"
            );
            // We still proceed but warn them
        }

        const payload = {
            ...formData,
            base_unit_id: parseInt(formData.base_unit_id),
            base_price: parseFloat(formData.base_price) || 0,
            cost_price: formData.cost_price ? parseFloat(formData.cost_price) : undefined,
        };

        mutation.mutate(payload);
    };


    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DraggableDialogContent
                className="sm:max-w-[500px]"
                title={isEdit ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}
            >
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="product_code">Mã sản phẩm</Label>
                            <Input
                                id="product_code"
                                value={formData.product_code}
                                disabled={isEdit}
                                onChange={(e) => setFormData({ ...formData, product_code: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="category">Danh mục</Label>
                            <Input
                                id="category"
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="name">Tên sản phẩm</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="base_unit">Đơn vị cơ bản</Label>
                            <Select
                                value={formData.base_unit_id}
                                onValueChange={(val: string) => setFormData({ ...formData, base_unit_id: val })}
                                required
                            >
                                <SelectTrigger id="base_unit">
                                    <SelectValue placeholder="Chọn đơn vị" />
                                </SelectTrigger>
                                <SelectContent>
                                    {units?.map((u: any) => (
                                        <SelectItem key={u.id} value={u.id.toString()}>{u.name}</SelectItem>
                                    ))}
                                    {units?.length === 0 && <SelectItem value="0" disabled>Chưa có đơn vị</SelectItem>}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="base_price">Giá bán (VND)</Label>
                            <Input
                                id="base_price"
                                type="number"
                                value={formData.base_price}
                                onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="cost_price">Giá vốn (VND - Tùy chọn)</Label>
                        <Input
                            id="cost_price"
                            type="number"
                            value={formData.cost_price}
                            onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                        />
                    </div>

                    <div className="space-y-4">
                        <Label htmlFor="image_url">Link hình ảnh (URL)</Label>
                        <div className="flex gap-4 items-start">
                            <div className="flex-1 space-y-2">
                                <Input
                                    id="image_url"
                                    value={formData.image_url}
                                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                                    placeholder="https://example.com/image.jpg"
                                    className="bg-slate-50 border-slate-200"
                                />
                                <p className="text-[10px] text-slate-400 italic">Dán link ảnh từ Google, Facebook hoặc kho ảnh của bạn.</p>
                            </div>
                            <div className="h-20 w-20 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden flex-shrink-0 group relative">
                                {formData.image_url ? (
                                    <img
                                        src={formData.image_url}
                                        alt="Preview"
                                        className="h-full w-full object-cover transition-transform group-hover:scale-110"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = 'https://placehold.co/400x400?text=Loi+Anh';
                                        }}
                                    />
                                ) : (
                                    <div className="flex flex-col items-center gap-1 opacity-40">
                                        <ImageIcon className="h-6 w-6" />
                                        <span className="text-[8px] font-bold uppercase">No Image</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Mô tả sản phẩm (Tùy chọn)</Label>
                        <Input
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Mô tả ngắn về sản phẩm..."
                            className="bg-slate-50 border-slate-200"
                        />
                    </div>

                    <DialogFooter className="pt-4 border-t mt-4">
                        <Button type="button" variant="ghost" onClick={onClose} className="text-slate-500 hover:text-slate-700">Hủy</Button>
                        <Button
                            type="submit"
                            disabled={mutation.isPending}
                            className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100 min-w-[120px]"
                        >
                            {mutation.isPending ? (
                                <div className="flex items-center gap-2">
                                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Đang lưu...</span>
                                </div>
                            ) : isEdit ? "Cập nhật sản phẩm" : "Thêm sản phẩm mới"}
                        </Button>
                    </DialogFooter>
                </form>
            </DraggableDialogContent>
        </Dialog>
    );
}

