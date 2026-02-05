import apiClient from "../apiClient";
import { User } from "@/store/useAuthStore";

export interface EmployeeCreate {
    email: string;
    password: string;
    full_name: string;
    phone?: string;
    role: "EMPLOYEE";
}

export const usersApi = {
    createEmployee: async (data: EmployeeCreate) => {
        const response = await apiClient.post<User>("/users/employees", data);
        return response.data;
    },
    listEmployees: async () => {
        const response = await apiClient.get<User[]>("/users/employees");
        return response.data;
    },
    updateProfile: async (data: { full_name?: string; phone?: string }) => {
        const response = await apiClient.put<User>("/users/profile", data);
        return response.data;
    },
    getStoreInfo: async () => {
        const response = await apiClient.get("/users/store");
        return response.data;
    },
    updateStoreInfo: async (data: { business_name?: string; business_address?: string; tax_code?: string }) => {
        const response = await apiClient.put("/users/store", data);
        return response.data;
    }
};
