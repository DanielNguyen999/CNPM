"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { debtsApi } from "@/lib/api/debts";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CreditCard, DollarSign, Wallet, CheckCircle2 } from "lucide-react";

const repaySchema = z.object({
    payment_amount: z.coerce.number().positive("Số tiền phải lớn hơn 0"),
    payment_method: z.string().min(1, "Vui lòng chọn phương thức"),
    reference_number: z.string().optional(),
    notes: z.string().optional(),
});

type RepayFormValues = z.infer<typeof repaySchema>;

interface DebtRepayModalProps {
    debtId: number;
    remainingAmount: number;
    isOpen: boolean;
    onClose: () => void;
}

export default function DebtRepayModal({
    debtId,
    remainingAmount,
    isOpen,
    onClose
}: DebtRepayModalProps) {
    const queryClient = useQueryClient();
    const [isSuccess, setIsSuccess] = useState(false);

    const form = useForm<RepayFormValues>({
        resolver: zodResolver(repaySchema),
        defaultValues: {
            payment_amount: remainingAmount,
            payment_method: "CASH",
        },
    });

    const mutation = useMutation({
        mutationFn: (values: RepayFormValues) => debtsApi.repay(debtId, values),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["debts"] });
            queryClient.invalidateQueries({ queryKey: ["debt", debtId] });
            queryClient.invalidateQueries({ queryKey: ["customer"] });
            setIsSuccess(true);
            setTimeout(() => {
                setIsSuccess(false);
                onClose();
                form.reset();
            }, 2000);
        },
    });

    const onSubmit = (values: RepayFormValues) => {
        if (values.payment_amount > remainingAmount) {
            form.setError("payment_amount", { message: "Số tiền không được vượt quá dư nợ" });
            return;
        }
        mutation.mutate(values);
    };

    const handleQuickPay = (percent: number) => {
        const amount = Math.round(remainingAmount * percent);
        form.setValue("payment_amount", amount);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                {isSuccess ? (
                    <div className="py-12 flex flex-col items-center justify-center space-y-4">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircle2 className="w-10 h-10 text-green-600" />
                        </div>
                        <div className="text-xl font-bold text-slate-900">Thu tiền thành công!</div>
                        <p className="text-sm text-muted-foreground text-center px-8">
                            Hệ thống đã cập nhật công nợ và lịch sử thanh toán.
                        </p>
                    </div>
                ) : (
                    <>
                        <DialogHeader>
                            <DialogTitle>Thu tiền nợ</DialogTitle>
                            <DialogDescription>
                                Nhập số tiền và phương thức thanh toán để ghi nhận thu nợ.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <Label htmlFor="payment_amount">Số tiền thu</Label>
                                    <span className="text-xs text-muted-foreground">Còn nợ: <b>{new Intl.NumberFormat("vi-VN").format(remainingAmount)}đ</b></span>
                                </div>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="payment_amount"
                                        className="pl-9 text-lg font-bold"
                                        placeholder="0"
                                        {...form.register("payment_amount")}
                                    />
                                </div>
                                {form.formState.errors.payment_amount && (
                                    <p className="text-xs text-red-500 font-medium">{form.formState.errors.payment_amount.message}</p>
                                )}

                                <div className="flex gap-2 mt-2">
                                    <Button type="button" variant="outline" size="sm" className="flex-1 text-xs" onClick={() => handleQuickPay(0.25)}>25%</Button>
                                    <Button type="button" variant="outline" size="sm" className="flex-1 text-xs" onClick={() => handleQuickPay(0.5)}>50%</Button>
                                    <Button type="button" variant="outline" size="sm" className="flex-1 text-xs" onClick={() => handleQuickPay(1)}>100%</Button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="payment_method">Phương thức</Label>
                                    <Select
                                        defaultValue="CASH"
                                        onValueChange={(val) => form.setValue("payment_method", val)}
                                    >
                                        <SelectTrigger id="payment_method">
                                            <SelectValue placeholder="Chọn" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="CASH">Tiền mặt</SelectItem>
                                            <SelectItem value="BANK_TRANSFER">Chuyển khoản</SelectItem>
                                            <SelectItem value="MOMO">MoMo</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="reference_number">Tham chiếu</Label>
                                    <Input
                                        id="reference_number"
                                        placeholder="Mã GD..."
                                        {...form.register("reference_number")}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="notes">Ghi chú</Label>
                                <Textarea
                                    id="notes"
                                    placeholder="Ghi chú thu tiền..."
                                    className="resize-none"
                                    {...form.register("notes")}
                                />
                            </div>

                            <DialogFooter className="pt-4">
                                <Button type="button" variant="ghost" onClick={onClose} disabled={mutation.isPending}>
                                    Hủy
                                </Button>
                                <Button
                                    type="submit"
                                    className="bg-blue-600 hover:bg-blue-700 font-semibold"
                                    disabled={mutation.isPending}
                                >
                                    {mutation.isPending ? "Đang lưu..." : "Xác nhận thu tiền"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
