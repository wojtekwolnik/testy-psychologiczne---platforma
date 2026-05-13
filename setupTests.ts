import '@testing-library/jest-dom';
import { execSync } from 'child_process';
import { beforeAll } from 'vitest';

beforeAll(() => {
    // Check if we are using the test db to avoid wiping dev.db
    if (process.env.DATABASE_URL?.includes('test.db')) {
        console.log('Running Prisma DB Push for test database...');
        execSync('npx prisma db push --skip-generate', { stdio: 'inherit' });
    }
});
