"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import {
    User,
    Phone,
    Mail,
    MapPin,
    Receipt,
    ShoppingCart,
    ArrowLeft,
    Clock,
    CreditCard,
    Printer,
    Pencil,
    Save,
    X
} from "lucide-react";
import { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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

import apiClient from "@/lib/apiClient";
import { InvoicePrinter } from "@/components/pos/InvoicePrinter";

export default function CustomerDetailPage() {
    const params = useParams();
    const router = useRouter();
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const customerId = params.id;
    const [orderToPrint, setOrderToPrint] = useState<any>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editForm, setEditForm] = useState({
        full_name: "",
        phone: "",
        email: "",
        address: "",
        credit_limit: 0,
        customer_code: "",
        customer_type: "INDIVIDUAL"
    });

    const { data: customer, isLoading: customerLoading } = useQuery({
        queryKey: ["customers", customerId],
        queryFn: async () => {
            const { data } = await apiClient.get(`/customers/${customerId}`);
            return data;
        },
    });

    const { data: ordersResponse, isLoading: ordersLoading } = useQuery({
        queryKey: ["customers", customerId, "orders"],
        queryFn: async () => {
            const { data } = await apiClient.get("/orders", { params: { customer_id: customerId, page: 1, page_size: 100 } });
            return data;
        },
        enabled: !!customer,
    });

    const orders = ordersResponse?.items || [];

    const { data: debts, isLoading: debtsLoading } = useQuery({
        queryKey: ["customers", customerId, "debts"],
        queryFn: async () => {
            const { data } = await apiClient.get("/debts", { params: { customer_id: customerId } });
            return data.items;
        },
        enabled: !!customer,
    });

    useEffect(() => {
        if (customer) {
            setEditForm({
                full_name: customer.full_name || "",
                phone: customer.phone || "",
                email: customer.email || "",
                address: customer.address || "",
                credit_limit: customer.credit_limit || 0,
                customer_code: customer.customer_code || "",
                customer_type: customer.customer_type || "INDIVIDUAL"
            });
        }
    }, [customer]);

    const updateCustomerMutation = useMutation({
        mutationFn: async (updatedData: any) => {
            const { data } = await apiClient.put(`/customers/${customerId}`, updatedData);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["customers", customerId] });
            toast({
                title: "Thành công",
                description: "Đã cập nhật thông tin khách hàng",
            });
            setIsEditDialogOpen(false);
        },
        onError: (error: any) => {
            const errorDetail = error?.response?.data?.detail;
            const message = typeof errorDetail === 'string'
                ? errorDetail
                : typeof errorDetail === 'object'
                    ? JSON.stringify(errorDetail)
                    : "Không thể cập nhật thông tin";

            toast({
                title: "Lỗi",
                description: message,
                variant: "destructive",
            });
        }
    });

    const handleUpdateCustomer = (e: React.FormEvent) => {
        e.preventDefault();
        updateCustomerMutation.mutate(editForm);
    };

    if (customerLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-20 w-full" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Skeleton className="h-40 col-span-1" />
                    <Skeleton className="h-40 col-span-2" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/dashboard/customers">Khách hàng</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage>{customer?.full_name || "Chi tiết"}</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900">{customer?.full_name}</h2>
                    <p className="text-sm text-slate-500">Mã khách hàng: {customer?.customer_code}</p>
                </div>
                <div className="ml-auto flex gap-2">
                    <Badge className={customer?.is_active ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" : "bg-slate-100 text-slate-700 hover:bg-slate-100"}>
                        {customer?.is_active ? "Đang hoạt động" : "Ngừng hoạt động"}
                    </Badge>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Stats Cards */}
                <Card className="border shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                            Tổng chi tiêu
                            <ShoppingCart className="h-4 w-4 text-indigo-500" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900">
                            {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", minimumFractionDigits: 0 }).format(customer?.total_spent || 0)}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-tighter">
                            Dựa trên {customer?.order_count || 0} đơn hàng
                        </p>
                    </CardContent>
                </Card>

                <Card className="border shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                            Dư nợ hiện tại
                            <Receipt className="h-4 w-4 text-rose-500" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-rose-600">
                            {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", minimumFractionDigits: 0 }).format(customer?.total_debt || 0)}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-tighter">
                            Hạn mức nợ: {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", minimumFractionDigits: 0 }).format(customer?.credit_limit || 0)}
                        </p>
                    </CardContent>
                </Card>

                <Card className="border shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                            Lần cuối giao dịch
                            <Clock className="h-4 w-4 text-emerald-500" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900">
                            {customer?.last_order_date ? new Date(customer.last_order_date).toLocaleDateString('vi-VN') : "N/A"}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-tighter">
                            {customer?.last_order_date ? "Thanh toán gần nhất" : "Chưa có giao dịch"}
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Info Sidebar */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="border shadow-sm overflow-hidden text-sm">
                        <CardHeader className="bg-slate-50 border-b py-3 flex flex-row items-center justify-between space-y-0">
                            <CardTitle className="text-sm font-bold text-slate-700">Thông tin liên hệ</CardTitle>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                                onClick={() => setIsEditDialogOpen(true)}
                            >
                                <Pencil className="h-3.5 w-3.5" />
                            </Button>
                        </CardHeader>
                        <CardContent className="p-4 space-y-4">
                            <div className="flex items-start gap-3">
                                <Phone className="h-4 w-4 text-slate-400 mt-0.5" />
                                <div>
                                    <p className="text-slate-400 text-[10px] font-bold uppercase">Điện thoại</p>
                                    <p className="text-slate-900 font-medium">{customer?.phone || "N/A"}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Mail className="h-4 w-4 text-slate-400 mt-0.5" />
                                <div>
                                    <p className="text-slate-400 text-[10px] font-bold uppercase">Email</p>
                                    <p className="text-slate-900 font-medium">{customer?.email || "N/A"}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <MapPin className="h-4 w-4 text-slate-400 mt-0.5" />
                                <div>
                                    <p className="text-slate-400 text-[10px] font-bold uppercase">Địa chỉ</p>
                                    <p className="text-slate-900 font-medium">{customer?.address || "N/A"}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Tabs Main Content */}
                <div className="lg:col-span-3">
                    <Tabs defaultValue="orders" className="w-full">
                        <TabsList className="bg-white border p-1 h-12 w-full justify-start gap-2 mb-4">
                            <TabsTrigger value="orders" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 h-full px-6">
                                Đơn hàng ({orders?.length || 0})
                            </TabsTrigger>
                            <TabsTrigger value="debts" className="data-[state=active]:bg-rose-50 data-[state=active]:text-rose-700 h-full px-6">
                                Công nợ ({debts?.length || 0})
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="orders">
                            <Card className="border shadow-sm overflow-hidden">
                                <Table>
                                    <TableHeader className="bg-slate-50">
                                        <TableRow>
                                            <TableHead>Mã đơn</TableHead>
                                            <TableHead>Ngày</TableHead>
                                            <TableHead className="text-right">Tổng tiền</TableHead>
                                            <TableHead className="text-center">Trạng thái</TableHead>
                                            <TableHead className="text-right"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {ordersLoading ? (
                                            Array.from({ length: 3 }).map((_, i) => (
                                                <TableRow key={i}>
                                                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                                    <TableCell><Skeleton className="h-4 w-24 ml-auto" /></TableCell>
                                                    <TableCell><Skeleton className="h-6 w-20 mx-auto rounded-full" /></TableCell>
                                                    <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                                                </TableRow>
                                            ))
                                        ) : orders?.length > 0 ? (
                                            orders.map((order: any) => (
                                                <TableRow key={order.id}>
                                                    <TableCell className="font-mono text-xs font-bold text-slate-500">{order.order_code}</TableCell>
                                                    <TableCell className="text-slate-600">{new Date(order.order_date).toLocaleDateString('vi-VN')}</TableCell>
                                                    <TableCell className="text-right font-bold text-slate-900">
                                                        {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", minimumFractionDigits: 0 }).format(order.total_amount)}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <Badge variant={order.payment_status === "PAID" ? "success" : "warning"}>
                                                            {order.payment_status === "PAID" ? "Đã trả" : "Chưa trả hết"}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex gap-2 justify-end">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={async () => {
                                                                    // Fetch full order details for printing
                                                                    const { data } = await apiClient.get(`/orders/${order.id}`);
                                                                    setOrderToPrint(data);
                                                                }}
                                                                className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                                                            >
                                                                <Printer className="h-4 w-4 mr-1" />
                                                                In
                                                            </Button>
                                                            <Button variant="ghost" size="sm" onClick={() => router.push(`/dashboard/orders/${order.id}`)}>
                                                                Xem
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={5} className="h-32 text-center text-slate-400">
                                                    Chưa có đơn hàng nào
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </Card>
                        </TabsContent>

                        <TabsContent value="debts">
                            <Card className="border shadow-sm overflow-hidden">
                                <Table>
                                    <TableHeader className="bg-slate-50">
                                        <TableRow>
                                            <TableHead>Mã đơn</TableHead>
                                            <TableHead className="text-right">Dư nợ</TableHead>
                                            <TableHead className="text-right">Đã trả</TableHead>
                                            <TableHead className="text-right">Còn lại</TableHead>
                                            <TableHead className="text-center">Hạn nợ</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {debtsLoading ? (
                                            Array.from({ length: 3 }).map((_, i) => (
                                                <TableRow key={i}>
                                                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                                    <TableCell><Skeleton className="h-4 w-24 ml-auto" /></TableCell>
                                                    <TableCell><Skeleton className="h-4 w-24 ml-auto" /></TableCell>
                                                    <TableCell><Skeleton className="h-4 w-24 ml-auto" /></TableCell>
                                                    <TableCell><Skeleton className="h-6 w-20 mx-auto rounded-full" /></TableCell>
                                                </TableRow>
                                            ))
                                        ) : debts?.length > 0 ? (
                                            debts.map((debt: any) => (
                                                <TableRow key={debt.id}>
                                                    <TableCell className="font-mono text-xs font-bold text-slate-500">{debt.order_code}</TableCell>
                                                    <TableCell className="text-right font-medium text-slate-900">
                                                        {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", minimumFractionDigits: 0 }).format(debt.debt_amount)}
                                                    </TableCell>
                                                    <TableCell className="text-right text-emerald-600">
                                                        {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", minimumFractionDigits: 0 }).format(debt.paid_amount)}
                                                    </TableCell>
                                                    <TableCell className="text-right font-bold text-rose-600">
                                                        {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", minimumFractionDigits: 0 }).format(debt.remaining_amount)}
                                                    </TableCell>
                                                    <TableCell className="text-center text-slate-500">
                                                        {debt.due_date ? new Date(debt.due_date).toLocaleDateString('vi-VN') : "N/A"}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={5} className="h-32 text-center text-slate-400">
                                                    Không có khoản nợ nào
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>

            {/* Invoice Printer */}
            {orderToPrint && (
                <InvoicePrinter
                    order={orderToPrint}
                    onAfterPrint={() => setOrderToPrint(null)}
                    autoPrint={true}
                />
            )}

            {/* Edit Customer Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Chỉnh sửa thông tin khách hàng</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleUpdateCustomer} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="full_name">Họ và tên</Label>
                            <Input
                                id="full_name"
                                value={editForm.full_name}
                                onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Số điện thoại</Label>
                            <Input
                                id="phone"
                                value={editForm.phone}
                                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={editForm.email}
                                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="address">Địa chỉ</Label>
                            <Input
                                id="address"
                                value={editForm.address}
                                onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="credit_limit">Hạn mức nợ (VNĐ)</Label>
                            <Input
                                id="credit_limit"
                                type="number"
                                value={editForm.credit_limit}
                                onChange={(e) => setEditForm({ ...editForm, credit_limit: Number(e.target.value) })}
                            />
                        </div>
                        <DialogFooter className="pt-4">
                            <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                                Hủy
                            </Button>
                            <Button type="submit" disabled={updateCustomerMutation.isPending} className="bg-indigo-600 hover:bg-indigo-700">
                                {updateCustomerMutation.isPending ? "Đang lưu..." : "Lưu thay đổi"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
