import { v4 as uuidv4 } from 'uuid';

export function generateUniqueId(prefix: string = ''): string {
  return `${prefix}${uuidv4()}`;
}

export function generateLeadNumber(): string {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `LD${timestamp.slice(-6)}${random}`;
}

export function generateOrderNumber(): string {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `ORD${timestamp.slice(-6)}${random}`;
}

export function generateSaleId(): string {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `SL${timestamp.slice(-6)}${random}`;
}

export function generatePaymentId(): string {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `PAY${timestamp.slice(-6)}${random}`;
}

export function generateTargetId(): string {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `TGT${timestamp.slice(-6)}${random}`;
}

export function generateActivityId(): string {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `ACT${timestamp.slice(-6)}${random}`;
}

export function generateFileId(): string {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `FILE${timestamp.slice(-6)}${random}`;
}

export function generateFollowupId(): string {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `FU${timestamp.slice(-6)}${random}`;
}

export function generateProductId(): string {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `PROD${timestamp.slice(-6)}${random}`;
}

// Fix missing function that was referenced in orders/new/page.tsx
export function generateVendorId(): string {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `VND${timestamp.slice(-6)}${random}`;
}