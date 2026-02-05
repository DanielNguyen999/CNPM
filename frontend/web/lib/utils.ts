import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
}

export function formatDate(dateJson: string | Date): string {
  const date = new Date(dateJson);
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

export function getImageUrl(path: string | null | undefined): string {
  if (!path) return "";
  if (path.startsWith('http')) return path;

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  if (cleanPath.startsWith('/uploads')) {
    return `${baseUrl}${cleanPath}`;
  }

  return path;
}
