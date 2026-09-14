export function json(data, status = 200, extra = {}) {
  const origin = process.env.CORS_ORIGIN || '*';
  const corsHeaders = {
    'Access-Control-Allow-Origin': origin,
    ...(origin !== '*' ? { 'Access-Control-Allow-Credentials': 'true' } : {})
  };
  return Response.json(data, { status, headers: { 'Cache-Control': 'no-store', ...corsHeaders, ...extra } });
}
export function ok(data, message = null) {
  return json({ success: true, ...(message ? { message } : {}), data });
}
export function fail(message, status = 400, details = undefined) {
  return json({ success: false, message, ...(details ? { details } : {}) }, status);
}
export async function body(request) {
  const type = request.headers.get('content-type') || '';
  if (type.includes('application/json')) return await request.json();
  if (type.includes('multipart/form-data')) return Object.fromEntries(await request.formData());
  return {};
}
