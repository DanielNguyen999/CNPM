"use client";

import React from 'react';
import { Trash2, Plus, Minus } from 'lucide-react';
import { usePosStore } from '@/store/posStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

export const CartTable = () => {
    const { items, updateQty, updatePrice, updateUnit, removeItem } = usePosStore();

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            minimumFractionDigits: 0
        }).format(amount);
    };

    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-slate-50 border-2 border-dashed rounded-lg text-muted-foreground">
                <p>Giỏ hàng đang trống.</p>
                <p className="text-sm">Hãy tìm sản phẩm để thêm vào đơn hàng.</p>
            </div>
        );
    }

    return (
        <div className="overflow-hidden h-full">
            <Table>
                <TableHeader className="bg-slate-50">
                    <TableRow>
                        <TableHead className="w-[40%]">Sản phẩm</TableHead>
                        <TableHead className="w-[15%]">Đơn vị</TableHead>
                        <TableHead className="w-[20%] text-center">Số lượng</TableHead>
                        <TableHead className="w-[20%] text-right">Thành tiền</TableHead>
                        <TableHead className="w-[5%]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {items.map((item) => (
                        <TableRow key={item.product_id} className="hover:bg-slate-50/50">
                            <TableCell>
                                <div className="flex flex-col">
                                    <span className="font-medium text-slate-900">{item.name}</span>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Input
                                            type="number"
                                            value={item.unit_price}
                                            onChange={(e) => updatePrice(item.product_id, parseFloat(e.target.value) || 0)}
                                            className="h-7 w-24 text-xs"
                                        />
                                        <span className="text-[10px] text-muted-foreground italic">Đơn giá</span>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-1">
                                    {(item.allUnits && item.allUnits.length > 0) ? (
                                        <Select
                                            value={item.unit_id.toString()}
                                            onValueChange={(val) => {
                                                const unit = item.allUnits?.find(u => u.unit_id.toString() === val);
                                                if (unit) {
                                                    updateUnit(item.product_id, {
                                                        id: unit.unit_id,
                                                        name: unit.unit_name,
                                                        price: unit.unit_price
                                                    });
                                                }
                                            }}
                                        >
                                            <SelectTrigger className="h-8 w-24 text-xs">
                                                <SelectValue placeholder="Đơn vị" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {item.allUnits.map((u: any) => (
                                                    <SelectItem key={u.unit_id} value={u.unit_id.toString()}>
                                                        {u.unit_name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <span className="text-sm text-slate-700">{item.unit_name}</span>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center justify-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-7 w-7 rounded-full"
                                        onClick={() => updateQty(item.product_id, Math.max(0, item.quantity - 1))}
                                    >
                                        <Minus className="h-3 w-3" />
                                    </Button>
                                    <Input
                                        type="number"
                                        value={item.quantity}
                                        onChange={(e) => updateQty(item.product_id, parseFloat(e.target.value) || 0)}
                                        className="h-8 w-16 text-center text-sm font-medium"
                                    />
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-7 w-7 rounded-full"
                                        onClick={() => updateQty(item.product_id, item.quantity + 1)}
                                    >
                                        <Plus className="h-3 w-3" />
                                    </Button>
                                </div>
                            </TableCell>
                            <TableCell className="text-right font-semibold text-slate-900">
                                {formatCurrency(item.line_total)}
                            </TableCell>
                            <TableCell>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                                    onClick={() => removeItem(item.product_id)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
};
