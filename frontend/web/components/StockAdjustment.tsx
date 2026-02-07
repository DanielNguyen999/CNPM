"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Dialog,
    DialogFooter,
} from "@/components/ui/dialog";
import { DraggableDialogContent } from "@/components/ui/DraggableDialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { inventoryApi } from "@/lib/api/inventory";

/**
 * Stock Adjustment Modal
 * Allows adding or removing stock for a product.
 */

interface StockAdjustmentProps {
    isOpen: boolean;
    onClose: () => void;
    product: any;
    canDoAdjustment?: boolean; // OWNER/ADMIN only
}

export function StockAdjustment({ isOpen, onClose, product, canDoAdjustment = true }: StockAdjustmentProps) {
    const queryClient = useQueryClient();
    const [quantityChange, setQuantityChange] = useState("");
    const [reason, setReason] = useState("");
    const [notes, setNotes] = useState("");
    const [type, setType] = useState<"IMPORT" | "EXPORT" | "ADJUSTMENT">("IMPORT");

    const mutation = useMutation({
        mutationFn: async (data: any) => {
            return inventoryApi.adjust(
                product.product_id,
                data.quantity_change,
                data.reason,
                data.notes
            );
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["inventory"] });
            queryClient.invalidateQueries({ queryKey: ["lowStock"] }); // Update dashboard alert
            onClose();
            setQuantityChange("");
            setReason("");
            setNotes("");
            setType("IMPORT");
        },
    });

    const formatNumber = (val: string) => {
        // Gỡ bỏ mọi thứ không phải là số
        const digits = val.replace(/\D/g, "");
        // Thêm dấu chấm mỗi 3 chữ số
        return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    };

    const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatNumber(e.target.value);
        setQuantityChange(formatted);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Gỡ bỏ dấu chấm trước khi parse
        const cleanValue = quantityChange.replace(/\./g, "");
        let qty = parseInt(cleanValue, 10);

        if (isNaN(qty)) return;

        if (type === "EXPORT") {
            qty = -Math.abs(qty);
        } else if (type === "IMPORT") {
            qty = Math.abs(qty);
        }

        mutation.mutate({
            quantity_change: qty,
            reason: reason || (type === 'IMPORT' ? 'Nhập hàng' : type === 'EXPORT' ? 'Xuất hàng' : 'Điều chỉnh'),
            notes,
        });
    };

    if (!product) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DraggableDialogContent
                className="sm:max-w-md"
                title={`Điều chỉnh kho: ${product.product_code || `#${product.product_id}`}`}
            >
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Loại giao dịch</Label>
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant={type === "IMPORT" ? "default" : "outline"}
                                onClick={() => setType("IMPORT")}
                                className={type === "IMPORT" ? "bg-emerald-600 hover:bg-emerald-700" : ""}
                            >
                                Nhập kho
                            </Button>
                            <Button
                                type="button"
                                variant={type === "EXPORT" ? "default" : "outline"}
                                onClick={() => setType("EXPORT")}
                                className={type === "EXPORT" ? "bg-rose-600 hover:bg-rose-700" : ""}
                            >
                                Xuất kho
                            </Button>
                            <Button
                                type="button"
                                variant={type === "ADJUSTMENT" ? "default" : "outline"}
                                onClick={() => setType("ADJUSTMENT")}
                                disabled={!canDoAdjustment}
                                title={!canDoAdjustment ? "Chỉ chủ doanh nghiệp mới có thể điều chỉnh kiểm kê" : ""}
                            >
                                Khác
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="quantity_change">Số lượng {type === 'EXPORT' ? '(sẽ trừ)' : type === 'IMPORT' ? '(sẽ cộng)' : '(+/-)'}</Label>
                        <Input
                            id="quantity_change"
                            type="text"
                            inputMode="numeric"
                            value={quantityChange}
                            onChange={handleQuantityChange}
                            placeholder="0"
                            className="text-lg font-bold"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="reason">Lý do</Label>
                        <Input
                            id="reason"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder={type === 'IMPORT' ? "Nhập hàng nhà cung cấp..." : "Hư hỏng, sử dụng..."}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="notes">Ghi chú</Label>
                        <Input
                            id="notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>Hủy</Button>
                        <Button type="submit" disabled={mutation.isPending} className="bg-indigo-600">
                            {mutation.isPending ? "Đang xử lý..." : "Xác nhận"}
                        </Button>
                    </DialogFooter>
                </form>
            </DraggableDialogContent>
        </Dialog>
    );
}
