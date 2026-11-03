import { headers } from 'next/headers';

interface RateLimitEntry {
    timestamps: number[];
}

const buckets = new Map<string, RateLimitEntry>();

// Periodic cleanup to prevent memory growth
setInterval(() => {
    const now = Date.now();
    buckets.forEach((entry, key) => {
        entry.timestamps = entry.timestamps.filter((ts: number) => now - ts < 300_000);
        if (entry.timestamps.length === 0) {
            buckets.delete(key);
        }
    });
}, 120_000).unref?.();

export function getClientIp(): string {
    try {
        const hdrs = headers();
        const forwarded = hdrs.get('x-forwarded-for');
        if (forwarded) {
            return forwarded.split(',')[0].trim();
        }
        return hdrs.get('x-real-ip') || 'unknown-ip';
    } catch {
        return 'unknown-ip';
    }
}

export function checkRateLimit(bucketName: string, maxAttempts: number, windowMs: number): { allowed: boolean; retryAfterSeconds?: number } {
    const ip = getClientIp();
    const key = `${bucketName}:${ip}`;
    const now = Date.now();

    const entry = buckets.get(key) || { timestamps: [] };
    entry.timestamps = entry.timestamps.filter(ts => now - ts < windowMs);

    if (entry.timestamps.length >= maxAttempts) {
        const oldest = entry.timestamps[0];
        const retryAfterSeconds = Math.max(1, Math.ceil((windowMs - (now - oldest)) / 1000));
        buckets.set(key, entry);
        return { allowed: false, retryAfterSeconds };
    }

    entry.timestamps.push(now);
    buckets.set(key, entry);
    return { allowed: true };
}
