"use client";

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ordersApi } from '@/lib/api/orders';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Plus, ShoppingCart, Calendar, ArrowRight, Loader2, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { OrderDetailDialog } from '@/components/orders/OrderDetailDialog';

export default function OrdersPage() {
  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [selectedOrder, setSelectedOrder] = React.useState<any>(null);

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders', debouncedSearch],
    queryFn: () => ordersApi.listOrders(0, 50, debouncedSearch),
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return <Badge className="bg-emerald-500 hover:bg-emerald-600">Đã thanh toán</Badge>;
      case 'PARTIAL':
        return <Badge className="bg-amber-500 hover:bg-amber-600">Thanh toán 1 phần</Badge>;
      case 'UNPAID':
      case 'DEBT':
        return <Badge variant="destructive">Chưa thanh toán</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Breadcrumb className="mb-2">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Đơn hàng</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Đơn hàng</h1>
          <p className="text-sm text-slate-500">Quản lý danh sách đơn hàng và trạng thái thanh toán.</p>
        </div>
        <Link href="/dashboard/pos">
          <Button className="bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-100">
            <Plus className="mr-2 h-4 w-4" /> Tạo đơn hàng mới
          </Button>
        </Link>
      </div>

      {/* Filter / Search */}
      <Card className="border-none shadow-sm bg-white">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Tìm kiếm mã đơn, khách hàng..."
              className="pl-9 bg-slate-50 border-slate-200"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card className="border shadow-sm overflow-hidden bg-white">
        <CardHeader className="py-4 px-6 border-b bg-slate-50/50">
          <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <ShoppingCart className="h-4 w-4 text-indigo-500" /> Danh sách đơn hàng gần đây
          </CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="font-semibold text-slate-600">Mã đơn</TableHead>
                <TableHead className="font-semibold text-slate-600">Khách hàng</TableHead>
                <TableHead className="font-semibold text-slate-600">Ngày tạo</TableHead>
                <TableHead className="text-right font-semibold text-slate-600">Tổng tiền</TableHead>
                <TableHead className="text-center font-semibold text-slate-600">Trạng thái</TableHead>
                <TableHead className="text-right font-semibold text-slate-600">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><div className="h-4 w-24 bg-slate-100 rounded animate-pulse" /></TableCell>
                    <TableCell><div className="h-4 w-32 bg-slate-100 rounded animate-pulse" /></TableCell>
                    <TableCell><div className="h-4 w-24 bg-slate-100 rounded animate-pulse" /></TableCell>
                    <TableCell className="text-right"><div className="h-4 w-20 bg-slate-100 rounded animate-pulse ml-auto" /></TableCell>
                    <TableCell className="text-center"><div className="h-6 w-20 bg-slate-100 rounded-full animate-pulse mx-auto" /></TableCell>
                    <TableCell className="text-right"><div className="h-8 w-8 bg-slate-100 rounded animate-pulse ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : orders && orders.length > 0 ? (
                orders.map((order: any) => (
                  <TableRow
                    key={order.id}
                    className="hover:bg-indigo-50/30 transition-colors cursor-pointer group"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <TableCell className="font-medium text-slate-900 group-hover:text-indigo-700 transition-colors">
                      #{order.order_code || order.order_id}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-700">{order.customer_name || 'Khách lẻ'}</span>
                        {order.customer_phone && <span className="text-xs text-slate-400">{order.customer_phone}</span>}
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-500 text-sm">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(order.created_at), 'dd/MM/yyyy HH:mm', { locale: vi })}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-bold text-slate-700">
                      {formatCurrency(order.total_amount)}
                    </TableCell>
                    <TableCell className="text-center">
                      {getStatusBadge(order.payment_status)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="hover:text-indigo-600 hover:bg-indigo-50">
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-40 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <ShoppingCart className="h-10 w-10 mb-2 opacity-20" />
                      <p>Chưa có đơn hàng nào.</p>
                      <Link href="/dashboard/pos" className="mt-2 text-indigo-600 hover:underline">
                        Tạo đơn hàng ngay
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <OrderDetailDialog
        order={selectedOrder}
        open={!!selectedOrder}
        onOpenChange={(open) => !open && setSelectedOrder(null)}
      />
    </div>
  );
}
