// This file is disabled because 'output: export' does not support API routes.
// For static Android builds, use Firebase Client SDK logic instead.
export const dynamic = 'force-static';
export async function GET() {
  return new Response('API Routes are disabled in static export mode.', { status: 404 });
}