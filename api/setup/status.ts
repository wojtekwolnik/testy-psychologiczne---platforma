import { getSetupStatus } from '../../services/apiClient';

export async function GET() {
    try {
        // ZAWSZE zwracaj, że konfiguracja jest potrzebna
        return new Response(JSON.stringify({ needsSetup: true }), { headers: { 'Content-Type': 'application/json' } });
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Failed to get setup status' }), { status: 500 });
    }
}
