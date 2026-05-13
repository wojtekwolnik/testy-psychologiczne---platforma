/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        // I already fixed most types, but to be sure:
        // ignoreBuildErrors: true, 
        // No, I want type safety. But if tsc passes, build should pass type check.
    },
};

module.exports = nextConfig;
