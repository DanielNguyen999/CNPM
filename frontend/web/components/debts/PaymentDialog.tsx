"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { debtsApi } from "@/lib/api/debts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";

interface PaymentDialogProps {
    debt: any;
    isOpen: boolean;
    onClose: () => void;
}

export function PaymentDialog({ debt, isOpen, onClose }: PaymentDialogProps) {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const [amount, setAmount] = useState("");
    const [displayAmount, setDisplayAmount] = useState(""); // For formatted display
    const [method, setMethod] = useState("CASH");
    const [notes, setNotes] = useState("");

    const mutation = useMutation({
        mutationFn: async (data: any) => {
            return debtsApi.repay(debt.id, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["debts"] });
            queryClient.invalidateQueries({ queryKey: ["customers"] });
            queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
            queryClient.invalidateQueries({ queryKey: ["orders"] });
            toast({
                title: "Thanh toán thành công",
                description: `Đã thanh toán ${Number(amount).toLocaleString('vi-VN')} đ`,
                className: "bg-green-50 text-green-900",
            });
            onClose();
            setAmount("");
            setDisplayAmount("");
            setNotes("");
        },
        onError: (err: any) => {
            toast({
                variant: "destructive",
                title: "Lỗi thanh toán",
                description: err.response?.data?.detail || "Vui lòng thử lại",
            });
        }
    });

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (value === "") {
            setAmount("");
            setDisplayAmount("");
            return;
        }

        // Loại bỏ mọi ký tự không phải số, dấu chấm, dấu phẩy
        // Giữ lại dấu chấm/phẩy cuối cùng nếu người dùng đang gõ dở (vd: "100.")
        const cleanValue = value.replace(/[^0-9.,]/g, "");
        const normalized = cleanValue.replace(",", ".");

        // Kiểm tra xem có hợp lệ không (chỉ tối đa 1 dấu chấm)
        if ((normalized.match(/\./g) || []).length <= 1) {
            setAmount(normalized);

            // Format hiển thị: Nếu kết thúc bằng . hoặc mang tính chất gõ dở thì giữ nguyên
            // Nếu là số hoàn chỉnh thì format có dấu chấm ngăn cách hàng nghìn
            if (normalized.endsWith(".") || normalized.includes(".")) {
                setDisplayAmount(cleanValue);
            } else {
                const num = parseInt(normalized);
                if (!isNaN(num)) {
                    setDisplayAmount(num.toLocaleString("vi-VN").replace(/\./g, ","));
                    // Chú ý: vi-VN dùng dấu chấm ngăn nghìn, dấu phẩy ngăn thập phân. 
                    // Nhưng người dùng muốn gõ 10.000 (dấu chấm) cho nghìn?
                    // Ở VN: 10.000.000đ (dấu chấm ngăn nghìn).
                    setDisplayAmount(num.toLocaleString("vi-VN"));
                } else {
                    setDisplayAmount(cleanValue);
                }
            }
        }
    };



    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const val = parseFloat(amount);
        if (isNaN(val) || val <= 0) {
            toast({
                variant: "destructive",
                title: "Lỗi",
                description: "Số tiền không hợp lệ"
            });
            return;
        }
        if (val > debt.remaining_amount) {
            if (!confirm("Số tiền nhập lớn hơn số nợ còn lại. Bạn có chắc chắn muốn thanh toán dư không?")) return;
        }

        mutation.mutate({
            payment_amount: val,
            payment_method: method,
            notes,
        });
    };

    if (!debt) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DraggableDialogContent
                className="sm:max-w-md"
                title={`Thanh toán công nợ #${debt.id}`}
            >
                <div className="py-2 text-sm text-slate-500">
                    Khách hàng: <span className="font-medium text-slate-900">{debt.customer_name}</span><br />
                    Còn nợ: <span className="font-bold text-red-600">{Number(debt.remaining_amount).toLocaleString('vi-VN')} đ</span>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label>Số tiền thanh toán (VND)</Label>
                        <div className="relative">
                            <Input
                                type="text"
                                value={displayAmount}
                                onChange={handleAmountChange}
                                placeholder="VD: 1000.5"
                                autoFocus
                                required
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">đ</span>
                        </div>
                        <p className="text-xs text-slate-500">Có thể nhập số lẻ (dùng dấu chấm . hoặc dấu phẩy ,)</p>

                    </div>
                    <div className="space-y-2">
                        <Label>Phương thức</Label>
                        <Select value={method} onValueChange={setMethod}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="CASH">Tiền mặt</SelectItem>
                                <SelectItem value="BANK_TRANSFER">Chuyển khoản</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Ghi chú</Label>
                        <Input
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="VD: Thu tiền kỳ 1..."
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
