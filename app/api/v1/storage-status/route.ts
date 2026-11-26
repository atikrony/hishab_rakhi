import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/security';
import { checkPostgresConnection, isPostgresConfigured } from '@/lib/postgres';

/**
 * GET /api/v1/storage-status — tells a signed-in user whether data is being
 * saved permanently (Postgres) or only in temporary server memory/files.
 * Never returns connection strings or credentials.
 */
export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const serverless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
  const configured = isPostgresConfigured();
  const health = configured ? await checkPostgresConnection() : { connected: false };

  const permanent = configured && health.connected;
  return NextResponse.json({
    success: true,
    data: {
      storage: permanent ? 'postgres' : 'temporary',
      databaseConfigured: configured,
      databaseConnected: health.connected,
      serverless,
      warning: permanent
        ? null
        : serverless
          ? 'No reachable database: entries are kept only in temporary server memory and will be lost. Set DATABASE_URL to a hosted Postgres (e.g. Neon).'
          : 'Database not connected: using local files.',
    },
  });
}
