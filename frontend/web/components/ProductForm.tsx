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
import apiClient from "@/lib/apiClient";
import { unitsApi } from "@/lib/api/units";
import { productsApi } from "@/lib/api/products";

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
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["products"] });
            onClose();
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        mutation.mutate({
            ...formData,
            base_unit_id: parseInt(formData.base_unit_id),
            base_price: parseFloat(formData.base_price),
            cost_price: formData.cost_price ? parseFloat(formData.cost_price) : undefined,
        });
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

                    <div className="space-y-2">
                        <Label htmlFor="image_url">Link hình ảnh (URL)</Label>
                        <Input
                            id="image_url"
                            value={formData.image_url}
                            onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                            placeholder="https://example.com/image.jpg"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Mô tả</Label>
                        <Input
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>Hủy</Button>
                        <Button type="submit" disabled={mutation.isPending}>
                            {mutation.isPending ? "Đang lưu..." : "Lưu thay đổi"}
                        </Button>
                    </DialogFooter>
                </form>
            </DraggableDialogContent>
        </Dialog>
    );
}
