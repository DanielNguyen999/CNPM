import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
    id: number;
    email: string;
    role: string;
    owner_id?: number;
    employee_id?: number;
    customer_id?: number;
    full_name: string;
    phone?: string;
    permissions?: string[];
}

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    login: (user: User, token: string) => void;
    logout: () => void;
    setUser: (user: User) => void;

    // RBAC Permission Methods
    isAdmin: () => boolean;
    isOwner: () => boolean;
    isEmployee: () => boolean;
    isCustomer: () => boolean;
    canEditCustomers: () => boolean;
    canDeleteCustomers: () => boolean;
    canEditProducts: () => boolean;
    canDeleteProducts: () => boolean;
    canEditUnits: () => boolean;
    canManageEmployees: () => boolean;
    canAdjustInventory: () => boolean;
    canAccessSettings: () => boolean;
    canViewReports: () => boolean;
    canDeleteOrders: () => boolean;
    setPermissions: (permissions: string[]) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            login: (user, token) => {
                localStorage.setItem('access_token', token);
                set({ user, token, isAuthenticated: true });
            },
            logout: () => {
                localStorage.removeItem('access_token');
                set({ user: null, token: null, isAuthenticated: false });
            },
            setUser: (user) => set({ user }),
            setPermissions: (permissions) => set((state) => ({
                user: state.user ? { ...state.user, permissions } : null
            })),

            // RBAC Permission Methods
            isAdmin: () => get().user?.role === 'ADMIN',
            isOwner: () => get().user?.role === 'OWNER',
            isEmployee: () => get().user?.role === 'EMPLOYEE',
            isCustomer: () => get().user?.role === 'CUSTOMER',

            // Customers: Only OWNER and ADMIN can CRUD
            canEditCustomers: () => {
                const role = get().user?.role;
                return role === 'OWNER' || role === 'ADMIN';
            },
            canDeleteCustomers: () => {
                const role = get().user?.role;
                return role === 'OWNER' || role === 'ADMIN';
            },

            // Products: Only OWNER can CRUD
            canEditProducts: () => {
                const user = get().user;
                if (user?.role === 'OWNER' || user?.role === 'ADMIN') return true;
                return user?.permissions?.includes('can_edit_products') || false;
            },
            canDeleteProducts: () => {
                const user = get().user;
                if (user?.role === 'OWNER' || user?.role === 'ADMIN') return true;
                return user?.permissions?.includes('can_edit_products') || false;
            },

            // Units: Only OWNER can CRUD
            canEditUnits: () => {
                const role = get().user?.role;
                return role === 'OWNER' || role === 'ADMIN';
            },

            // Employees: Only OWNER can manage
            canManageEmployees: () => {
                return get().user?.role === 'OWNER';
            },

            // Inventory: OWNER can do all, EMPLOYEE can IMPORT/EXPORT only
            canAdjustInventory: () => {
                const user = get().user;
                if (user?.role === 'OWNER' || user?.role === 'ADMIN') return true;
                return user?.permissions?.includes('can_adjust_inventory') || false;
            },

            // Settings: Only OWNER
            canAccessSettings: () => {
                return get().user?.role === 'OWNER';
            },

            canViewReports: () => {
                const user = get().user;
                if (user?.role === 'OWNER' || user?.role === 'ADMIN') return true;
                return user?.permissions?.includes('can_view_reports') || false;
            },

            canDeleteOrders: () => {
                const user = get().user;
                if (user?.role === 'OWNER' || user?.role === 'ADMIN') return true;
                return user?.permissions?.includes('can_delete_orders') || false;
            },
        }),
        {
            name: 'bizflow-auth',
        }
    )
);
