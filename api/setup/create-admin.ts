
import { createFirstAdminUser } from '../../../services/apiService';

export async function POST(request: Request) {
  try {
    const { email, password, setupKey } = await request.json();

    if (!email || !password || !setupKey) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const newUser = await createFirstAdminUser(email, password, setupKey);

    return new Response(JSON.stringify(newUser), {
      status: 201, // 201 Created
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[API /api/setup/create-admin] Error:', error);

    // Handle specific errors, e.g., invalid setup key
    if (error.message === 'Invalid setup key.' || error.message === 'An admin account already exists. Setup cannot proceed.') {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 403, // 403 Forbidden
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
