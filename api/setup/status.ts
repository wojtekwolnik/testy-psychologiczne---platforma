
import { getSetupStatus } from '../../services/apiService';

export async function GET() {
  try {
    const { needsSetup } = await getSetupStatus();
    return new Response(JSON.stringify({ needsSetup }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('[API /api/setup/status] Error:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}
