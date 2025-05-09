import * as crypto from 'crypto';
import { Request } from 'express';

/**
 * Generate a random token of specified length
 * @param length Length of the token
 * @returns Random token string
 */
export function generateRandomToken(length: number = 32): string {
  const buffer = crypto.randomBytes(Math.ceil(length / 2));
  return buffer.toString('hex').slice(0, length);
}

/**
 * Generate a shortened URL-friendly ID
 * Useful for creating short share links
 * @returns Short ID string
 */
export function generateShortId(): string {
  return Math.random().toString(36).substring(2, 10);
}

/**
 * Format a date in a human-readable format
 * @param date Date to format
 * @returns Formatted date string
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Format a number as currency
 * @param value Number to format
 * @returns Formatted currency string
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}

/**
 * Format a number with commas
 * @param value Number to format
 * @returns Formatted number string
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

/**
 * Get hostname from the request
 * @param req Express request object
 * @returns Hostname (e.g., "example.com")
 */
export function getHostname(req: any): string {
  return req.get('host') || 'localhost';
}

/**
 * Get the base URL including protocol from the request
 * @param req Express request object
 * @returns Base URL (e.g., "https://example.com")
 */
export function getBaseUrl(req: any): string {
  const protocol = req.headers['x-forwarded-proto'] || req.protocol;
  const host = getHostname(req);
  return `${protocol}://${host}`;
}

/**
 * Create a full URL for a share link
 * @param req Express request object
 * @param token Share token
 * @returns Full URL for the share link
 */
export function createShareUrl(req: any, token: string): string {
  const baseUrl = getBaseUrl(req);
  return `${baseUrl}/shared/${token}`;
}

/**
 * Helper function to get value or default
 * @param value Value to check
 * @param defaultValue Default value to return if value is null/undefined
 * @returns Value or default
 */
export function getValueOrDefault<T>(value: T | null | undefined, defaultValue: T): T {
  return value !== null && value !== undefined ? value : defaultValue;
}

/**
 * Calculate days until expiration
 * @param expiryDate Expiration date
 * @returns Number of days until expiration, or null if no expiry
 */
export function getDaysUntilExpiry(expiryDate: Date | null): number | null {
  if (!expiryDate) return null;
  
  const now = new Date();
  const diffTime = expiryDate.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Truncate a string if it exceeds a certain length
 * @param str String to truncate
 * @param maxLength Maximum length before truncation
 * @returns Truncated string with ellipsis if needed
 */
export function truncateString(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return `${str.substring(0, maxLength)}...`;
}