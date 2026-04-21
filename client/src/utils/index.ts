import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(amount: number, currency = 'MNT', locale = 'mn-MN'): string {
  if (currency === 'MNT') {
    return new Intl.NumberFormat('mn-MN', {
      style: 'decimal',
      maximumFractionDigits: 0,
    }).format(amount) + '₮';
  }
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
}

export function formatDate(dateStr: string, locale = 'en-US'): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric', month: 'short', day: 'numeric',
  }).format(new Date(dateStr));
}

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(dateStr);
}

export function effectivePrice(price: number, salePrice: number | null): number {
  return salePrice ?? price;
}

export function discountPercent(price: number, salePrice: number | null): number | null {
  if (!salePrice || salePrice >= price) return null;
  return Math.round((1 - salePrice / price) * 100);
}

export function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + '…';
}

export function groupSpecsByGroup(specs: Array<{ spec_group: string; spec_key: string; spec_value: string }>) {
  const grouped: Record<string, Array<{ key: string; value: string }>> = {};
  for (const spec of specs) {
    if (!grouped[spec.spec_group]) grouped[spec.spec_group] = [];
    grouped[spec.spec_group].push({ key: spec.spec_key, value: spec.spec_value });
  }
  return grouped;
}

export const ORDER_STATUS_COLORS: Record<string, string> = {
  pending:    'badge-warning',
  processing: 'badge-primary',
  shipped:    'badge-primary',
  delivered:  'badge-success',
  cancelled:  'badge-danger',
};

export const PAYMENT_STATUS_COLORS: Record<string, string> = {
  pending: 'badge-warning',
  paid:    'badge-success',
  failed:  'badge-danger',
  refunded:'badge-gray',
};

export function imgUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  if (url.startsWith("http")) return url;
  return (import.meta.env.VITE_API_URL || "") + url;
}

export function imgUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('http')) return url;
  return (import.meta.env.VITE_API_URL || '') + url;
}

export function imgUrl(url) {
  if (!url) return undefined;
  if (url.startsWith("http")) return url;
  return (import.meta.env.VITE_API_URL || "") + url;
}
