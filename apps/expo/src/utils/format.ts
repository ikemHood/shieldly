// Utility functions for formatting contract data in React Native

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
    const number = Number(formatted);
    return `$${number.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

/**
 * Format a timestamp to a readable date and time
 */
export function formatDateTime(timestamp: bigint): string {
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
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

/**
 * Format policy status for display
 */
export function formatPolicyStatus(status: number): string {
    const statusMap = {
        0: 'Draft',
        1: 'Active',
        2: 'Expired',
        3: 'Paused'
    };
    return statusMap[status as keyof typeof statusMap] || 'Unknown';
}

/**
 * Format claim status for display
 */
export function formatClaimStatus(status: number): string {
    const statusMap = {
        0: 'Pending',
        1: 'Approved',
        2: 'Rejected',
        3: 'Paid'
    };
    return statusMap[status as keyof typeof statusMap] || 'Unknown';
}

/**
 * Format user status for display
 */
export function formatUserStatus(status: number): string {
    const statusMap = {
        0: 'Inactive',
        1: 'Active',
        2: 'Banned'
    };
    return statusMap[status as keyof typeof statusMap] || 'Unknown';
}

/**
 * Calculate days remaining until expiry
 */
export function getDaysUntilExpiry(expiryTimestamp: bigint): number {
    const now = Date.now() / 1000;
    const expiry = Number(expiryTimestamp);
    const diffInSeconds = expiry - now;
    return Math.max(0, Math.ceil(diffInSeconds / (24 * 60 * 60)));
}

/**
 * Check if a policy is expired
 */
export function isPolicyExpired(expiryTimestamp: bigint): boolean {
    const now = Date.now() / 1000;
    const expiry = Number(expiryTimestamp);
    return expiry < now;
}

/**
 * Format time remaining in a human-readable format
 */
export function formatTimeRemaining(expiryTimestamp: bigint): string {
    const days = getDaysUntilExpiry(expiryTimestamp);

    if (days === 0) {
        return 'Expires today';
    } else if (days === 1) {
        return '1 day remaining';
    } else if (days < 30) {
        return `${days} days remaining`;
    } else {
        const months = Math.floor(days / 30);
        const remainingDays = days % 30;
        if (months === 1) {
            return remainingDays > 0 ? `1 month, ${remainingDays} days remaining` : '1 month remaining';
        } else {
            return remainingDays > 0 ? `${months} months, ${remainingDays} days remaining` : `${months} months remaining`;
        }
    }
}

/**
 * Convert felt252 to string (for trigger descriptions and details)
 */
export function felt252ToString(felt: string): string {
    try {
        // Remove 0x prefix if present
        const hex = felt.startsWith('0x') ? felt.slice(2) : felt;

        // Convert hex to bytes
        const bytes = [];
        for (let i = 0; i < hex.length; i += 2) {
            bytes.push(parseInt(hex.substr(i, 2), 16));
        }

        // Convert bytes to string, removing null bytes
        return String.fromCharCode(...bytes.filter(b => b !== 0));
    } catch (error) {
        console.warn('Failed to convert felt252 to string:', error);
        return felt;
    }
} 