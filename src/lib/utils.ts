import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateOrderNumber(): string {
  return `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
}

// Format must match the redemption regex in Checkout.tsx: /^GC-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/
export function generateGiftCardCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const randSeg = () => {
    let out = "";
    for (let i = 0; i < 4; i++) {
      out += chars[Math.floor(Math.random() * chars.length)];
    }
    return out;
  };
  return `GC-${randSeg()}-${randSeg()}-${randSeg()}`;
}
