"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { productsApi } from '@/lib/api/products';
import { usePosStore } from '@/store/posStore';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

import apiClient from '@/lib/apiClient';

export const PosSearchBar = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const addItem = usePosStore((state) => state.addItem);
    const customer = usePosStore((state) => state.customer);
    const updatePrice = usePosStore((state) => state.updatePrice);

    useEffect(() => {
        // ... existing effects ...
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (query.length > 1) {
                setIsLoading(true);
                try {
                    const data = await productsApi.list(query);
                    const products = data.items || [];
                    setResults(products);
                    setIsOpen(true);
                    setSelectedIndex(products.length > 0 ? 0 : -1);
                } catch (error) {
                    console.error('Search error:', error);
                } finally {
                    setIsLoading(false);
                }
            } else {
                setResults([]);
                setIsOpen(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === '/') {
                if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
                    e.preventDefault();
                    inputRef.current?.focus();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isOpen) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (selectedIndex >= 0 && results[selectedIndex]) {
                handleSelect(results[selectedIndex]);
            }
        } else if (e.key === 'Escape') {
            setIsOpen(false);
        }
    };

    const handleSelect = async (product: any) => {
        // Find default unit or first unit
        const selectedUnit = product.units?.find((u: any) => u.is_default) || product.units?.[0];

        if (!selectedUnit) {
            alert(`Sản phẩm "${product.name}" chưa được thiết lập đơn vị tính. Vui lòng cập nhật thông tin sản phẩm.`);
            return;
        }

        const unit = {
            id: selectedUnit.unit_id,
            name: selectedUnit.unit_name
        };

        // Price suggestion logic
        let priceToUse = product.base_price;
        if (customer) {
            try {
                const { data } = await apiClient.get(`/products/${product.id}/suggest-price?customer_id=${customer.id}`);
                if (data.suggested_price) {
                    priceToUse = data.suggested_price;
                    console.log(`Using suggested price for ${product.name}: ${priceToUse}`);
                }
            } catch (e) {
                console.error("Failed to fetch suggested price", e);
            }
        }

        // Add to cart with price
        addItem({ ...product, base_price: priceToUse }, unit);

        setQuery('');
        setIsOpen(false);
        inputRef.current?.focus();
    };

    return (
        <div className="relative w-full" ref={dropdownRef}>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    ref={inputRef}
                    placeholder="Tìm sản phẩm... (/)"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="pl-10 h-12 text-lg focus-visible:ring-indigo-500"
                    onFocus={() => query.length > 1 && setIsOpen(true)}
                />
                {isLoading && (
                    <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                )}
            </div>

            {isOpen && results.length > 0 && (
                <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-xl">
                    <div className="max-h-[300px] overflow-y-auto p-1">
                        {results.map((product, index) => (
                            <div
                                key={product.id}
                                className={cn(
                                    "flex items-center justify-between px-3 py-2 cursor-pointer rounded-sm text-sm transition-colors",
                                    selectedIndex === index ? "bg-indigo-600 text-white" : "hover:bg-accent"
                                )}
                                onClick={() => handleSelect(product)}
                                onMouseEnter={() => setSelectedIndex(index)}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 flex-shrink-0 rounded-md bg-slate-100 border overflow-hidden flex items-center justify-center">
                                        {product.image_url ? (
                                            <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="text-[10px] text-slate-400 font-bold">SP</div>
                                        )}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-medium">{product.name}</span>
                                        <span className={cn(
                                            "text-xs",
                                            selectedIndex === index ? "text-indigo-100" : "text-muted-foreground"
                                        )}>
                                            {product.product_code}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right flex flex-col items-end">
                                    <span className="font-semibold text-base">
                                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.base_price)}
                                    </span>
                                    <span className={cn(
                                        "text-[10px] font-bold",
                                        selectedIndex === index ? "text-indigo-100" : "text-slate-400"
                                    )}>
                                        Tồn: {product.available_quantity || 0}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            )}

            {isOpen && query.length > 1 && results.length === 0 && !isLoading && (
                <div className="absolute z-50 mt-2 w-full rounded-md border bg-popover p-4 text-center text-sm shadow-xl">
                    Không tìm thấy sản phẩm nào.
                </div>
            )}
        </div>
    );
};
