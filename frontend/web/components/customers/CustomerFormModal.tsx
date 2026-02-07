"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    Dialog,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";
import { DraggableDialogContent } from "@/components/ui/DraggableDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { customersApi, Customer } from "@/lib/api/customers";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const customerSchema = z.object({
    customer_code: z.string().default("AUTO"),
    full_name: z.string().min(2, "Tên phải ít nhất 2 ký tự"),
    phone: z.string().min(10, "Số điện thoại phải ít nhất 10 số"),
    email: z.string().email("Email không hợp lệ"),
    address: z.string().optional(),
    customer_type: z.string().default("INDIVIDUAL"),
    tax_code: z.string().optional(),
    credit_limit: z.coerce.number().min(0).default(0),
});

type CustomerFormValues = z.infer<typeof customerSchema>;

interface CustomerFormModalProps {
    customer?: Customer;
    isOpen: boolean;
    onClose: () => void;
}

export default function CustomerFormModal({
    customer,
    isOpen,
    onClose
}: CustomerFormModalProps) {
    const queryClient = useQueryClient();
    const isEdit = !!customer;

    const form = useForm<CustomerFormValues>({
        resolver: zodResolver(customerSchema),
        defaultValues: {
            customer_code: "AUTO",
            full_name: "",
            phone: "",
            email: "",
            address: "",
            customer_type: "INDIVIDUAL",
            tax_code: "",
            credit_limit: 0,
        },
    });

    useEffect(() => {
        if (customer) {
            form.reset({
                customer_code: customer.customer_code,
                full_name: customer.full_name,
                phone: customer.phone || "",
                email: customer.email || "",
                address: customer.address || "",
                customer_type: customer.customer_type,
                tax_code: customer.tax_code || "",
                credit_limit: customer.credit_limit,
            });
        } else {
            form.reset({
                customer_code: "AUTO",
                full_name: "",
                phone: "",
                email: "",
                address: "",
                customer_type: "INDIVIDUAL",
                tax_code: "",
                credit_limit: 0,
            });
        }
    }, [customer, form, isOpen]);

    const mutation = useMutation({
        mutationFn: (values: CustomerFormValues) =>
            isEdit && customer?.id
                ? customersApi.update(customer.id, values)
                : customersApi.create(values),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["customers"] });
            if (isEdit) queryClient.invalidateQueries({ queryKey: ["customer", customer?.id] });

            const { notifications } = require("@/lib/notifications");
            notifications.success(
                "Thành công",
                isEdit ? "Đã cập nhật thông tin khách hàng" : "Đã thêm khách hàng mới"
            );

            onClose();
            form.reset();
        },
        onError: (error: any) => {
            const { notifications } = require("@/lib/notifications");
            const errorMsg = error.response?.data?.detail || "Có lỗi xảy ra. Vui lòng thử lại.";
            notifications.error("Lỗi", errorMsg);
        }
    });

    const onSubmit = (values: CustomerFormValues) => {
        mutation.mutate(values);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DraggableDialogContent
                className="sm:max-w-[500px]"
                title={isEdit ? "Cập nhật khách hàng" : "Thêm khách hàng mới"}
            >
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="customer_code">Mã khách hàng</Label>
                            <Input
                                id="customer_code"
                                disabled={isEdit}
                                placeholder="Để trống để tự sinh"
                                {...form.register("customer_code")}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="customer_type">Loại khách hàng</Label>
                            <Select
                                defaultValue={form.getValues("customer_type")}
                                onValueChange={(val) => form.setValue("customer_type", val)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn loại" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="INDIVIDUAL">Cá nhân</SelectItem>
                                    <SelectItem value="BUSINESS">Doanh nghiệp</SelectItem>
                                    <SelectItem value="VIP">Khách VIP</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="full_name">Họ tên <span className="text-red-500">*</span></Label>
                        <Input id="full_name" placeholder="Ví dụ: Nguyễn Văn A" {...form.register("full_name")} />
                        {form.formState.errors.full_name && (
                            <p className="text-xs text-red-500">{form.formState.errors.full_name.message}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="phone">Số điện thoại <span className="text-red-500">*</span></Label>
                            <Input id="phone" placeholder="090..." {...form.register("phone")} />
                            {form.formState.errors.phone && (
                                <p className="text-xs text-red-500">{form.formState.errors.phone.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
                            <Input id="email" type="email" placeholder="abc@gmail.com" {...form.register("email")} />
                            {form.formState.errors.email && (
                                <p className="text-xs text-red-500">{form.formState.errors.email.message}</p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="address">Địa chỉ</Label>
                        <Input id="address" placeholder="Số nhà, đường, phường..." {...form.register("address")} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="tax_code">Mã số thuế</Label>
                            <Input id="tax_code" placeholder="MST (nếu có)" {...form.register("tax_code")} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="credit_limit">Hạn mức nợ</Label>
                            <Input id="credit_limit" type="number" {...form.register("credit_limit")} />
                        </div>
                    </div>

                    <DialogFooter className="pt-4">
                        <Button type="button" variant="ghost" onClick={onClose} disabled={mutation.isPending}>
                            Hủy
                        </Button>
                        <Button type="submit" className="bg-primary" disabled={mutation.isPending}>
                            {mutation.isPending ? "Đang lưu..." : isEdit ? "Cập nhật" : "Tạo khách hàng"}
                        </Button>
                    </DialogFooter>
                </form>
            </DraggableDialogContent>
        </Dialog>
    );
}
