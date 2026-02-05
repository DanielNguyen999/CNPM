import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
    product_id: number;
    name: string;
    unit_id: number;
    unit_name: string;
    quantity: number;
    unit_price: number;
    line_total: number;
    allUnits?: any[]; // For unit selection
}

export interface SelectedCustomer {
    id: number;
    full_name: string;
    phone?: string;
}

interface PosState {
    items: CartItem[];
    customer: SelectedCustomer | null;
    paymentMethod: string;
    paidAmount: number;
    isDebt: boolean;
    notes: string;
    taxRate: number;
    discountAmount: number;

    // Actions
    addItem: (product: any, unit: any) => void;
    updateQty: (productId: number, quantity: number) => void;
    updateUnit: (productId: number, unit: any) => void;
    updatePrice: (productId: number, unitPrice: number) => void;
    removeItem: (productId: number) => void;
    clearCart: () => void;
    setCustomer: (customer: SelectedCustomer | null) => void;
    setPaymentMethod: (method: string) => void;
    setPaidAmount: (amount: number) => void;
    setIsDebt: (isDebt: boolean) => void;
    setNotes: (notes: string) => void;

    // Computed
    getSubtotal: () => number;
    getTotal: () => number;
}

export const usePosStore = create<PosState>()(
    persist(
        (set, get) => ({
            items: [],
            customer: null,
            paymentMethod: 'CASH',
            paidAmount: 0,
            isDebt: false,
            notes: '',
            taxRate: 10,
            discountAmount: 0,

            addItem: (product: any, unit: any) => {
                const { items } = get();
                const existingItem = items.find((i) => i.product_id === product.id);

                if (existingItem) {
                    const newQty = existingItem.quantity + 1;
                    set({
                        items: items.map((i) =>
                            i.product_id === product.id
                                ? { ...i, quantity: newQty, line_total: newQty * i.unit_price }
                                : i
                        ),
                    });
                } else {
                    const newItem: CartItem = {
                        product_id: product.id,
                        name: product.name,
                        unit_id: unit.id,
                        unit_name: unit.name,
                        quantity: 1,
                        unit_price: product.sell_price || product.base_price,
                        line_total: product.sell_price || product.base_price,
                        allUnits: product.units || [], // Store available units
                    };
                    set({ items: [...items, newItem] });
                }
            },

            updateQty: (productId: number, quantity: number) => {
                set((state) => ({
                    items: state.items.map((i) =>
                        i.product_id === productId
                            ? { ...i, quantity: quantity, line_total: quantity * i.unit_price }
                            : i
                    ),
                }));
            },

            updateUnit: (productId: number, unit: any) => {
                set((state) => ({
                    items: state.items.map((i) =>
                        i.product_id === productId
                            ? { ...i, unit_id: unit.id, unit_name: unit.name, unit_price: unit.price || i.unit_price, line_total: i.quantity * (unit.price || i.unit_price) }
                            : i
                    ),
                }));
            },

            updatePrice: (productId: number, unitPrice: number) => {
                set((state) => ({
                    items: state.items.map((i) =>
                        i.product_id === productId
                            ? { ...i, unit_price: unitPrice, line_total: i.quantity * unitPrice }
                            : i
                    ),
                }));
            },

            removeItem: (productId: number) => {
                set((state) => ({
                    items: state.items.filter((i) => i.product_id !== productId),
                }));
            },

            clearCart: () => {
                set({ items: [], customer: null, paidAmount: 0, isDebt: false, notes: '', discountAmount: 0 });
            },

            setCustomer: (customer: SelectedCustomer | null) => set({ customer }),

            setPaymentMethod: (paymentMethod: string) => set({ paymentMethod }),

            setPaidAmount: (paidAmount: number) => set({ paidAmount }),

            setIsDebt: (isDebt: boolean) => set({ isDebt }),

            setNotes: (notes: string) => set({ notes }),

            getSubtotal: () => {
                return get().items.reduce((sum, item) => sum + item.line_total, 0);
            },

            getTotal: () => {
                const subtotal = get().getSubtotal();
                const tax = subtotal * (get().taxRate / 100);
                return subtotal + tax - get().discountAmount;
            },
        }),
        {
            name: 'bizflow-pos',
        }
    )
);
