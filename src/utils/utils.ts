/**
 * Abbreviate a number, i.e. 3426 becomes 3,4K,
 * 2695798 becomes 2,6M, etc.
 */
export function formatNumber(n: number): string {
    let unit = '';
    if (n >= 1e9) {
        n = Math.round(n / 1e8) / 10;
        unit = 'B';
    } else if (n >= 1e6) {
        n = Math.round(n / 1e5) / 10;
        unit = 'M';
    } else if (n >= 1e3) {
        n = Math.round(n / 1e2) / 10;
        unit = 'K';
    }
    return String(n).replace(/\./, ',') + unit;
}
