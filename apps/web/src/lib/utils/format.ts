// Utility functions for formatting contract data

/**
 * Format a BigInt value to a human-readable string with decimals
 * @param value - BigInt value (usually in wei/smallest unit)
 * @param decimals - Number of decimals (default 18 for most tokens)
 * @param displayDecimals - Number of decimals to show in display (default 2)
 */
export function formatTokenAmount(
    value: bigint,
    decimals: number = 18,
    displayDecimals: number = 2
): string {
    const divisor = BigInt(10 ** decimals);
    const quotient = value / divisor;
    const remainder = value % divisor;

    if (displayDecimals === 0) {
        return quotient.toString();
    }

    const remainderStr = remainder.toString().padStart(decimals, '0');
    const decimalPart = remainderStr.slice(0, displayDecimals);

    return `${quotient}.${decimalPart}`;
}

/**
 * Format a BigInt value as USD currency
 */
export function formatUSD(value: bigint, decimals: number = 18): string {
    const formatted = formatTokenAmount(value, decimals, 2);
    return `$${Number(formatted).toLocaleString()}`;
}

/**
 * Format basis points to percentage
 */
export function formatBasisPoints(bps: number): string {
    return `${(bps / 100).toFixed(2)}%`;
}

/**
 * Format a timestamp to a readable date
 */
export function formatDate(timestamp: bigint): string {
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleDateString();
}

/**
 * Format a percentage with proper decimals
 */
export function formatPercentage(value: number, decimals: number = 2): string {
    return `${value.toFixed(decimals)}%`;
}

/**
 * Parse a string input to BigInt with decimals
 */
export function parseTokenAmount(value: string, decimals: number = 18): bigint {
    if (!value || value === '') return BigInt(0);

    const [whole, decimal = ''] = value.split('.');
    const paddedDecimal = decimal.padEnd(decimals, '0').slice(0, decimals);

    return BigInt(whole + paddedDecimal);
}

/**
 * Truncate an address for display
 */
export function truncateAddress(address: string, startChars: number = 6, endChars: number = 4): string {
    if (address.length <= startChars + endChars) return address;
    return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
} 