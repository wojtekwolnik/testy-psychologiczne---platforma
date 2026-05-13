import '@testing-library/jest-dom';
import { execSync } from 'child_process';
import { beforeAll } from 'vitest';

beforeAll(() => {
    // Only push schema in test environment (against the dedicated test DB)
    if (process.env.DATABASE_URL?.includes('testy_psychologiczne_test')) {
        console.log('Running Prisma DB Push for test database...');
        execSync('npx prisma db push --skip-generate', { stdio: 'inherit' });
    }
});
