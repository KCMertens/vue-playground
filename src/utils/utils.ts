/**
 * Abbreviate a number, i.e. 3426 becomes 3,4K,
 * 2695798 becomes 2,6M, etc.
 * Undefined and Null will return empty string
 */
export function formatNumber(n: number|undefined|null): string {
    if (n == null) {
        return '';
    }

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
