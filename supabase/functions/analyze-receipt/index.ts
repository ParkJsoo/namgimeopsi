import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/heic']);
const maxReceiptImageBytes = 10 * 1024 * 1024;
const receiptImageBucket = 'receipt-images';

const fixtureCandidates = [
  { rawName: '신선란 10구', canonicalFoodName: '계란', quantity: 10, unit: 'piece', confidence: 0.98, needsReview: false },
  { rawName: '국산콩 부침두부', canonicalFoodName: '두부', quantity: 1, unit: 'piece', confidence: 0.96, needsReview: false },
  { rawName: '백설 진한참기름', canonicalFoodName: '참기름', quantity: 1, unit: 'piece', confidence: 0.62, needsReview: true },
];

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function markFailed(
  admin: ReturnType<typeof createClient>,
  scanId: string,
  errorCode: string,
) {
  await admin
    .from('scan_jobs')
    .update({ status: 'failed', error_code: errorCode, analyzed_at: new Date().toISOString() })
    .eq('id', scanId);
}

/**
 * 영수증 원본을 서버에서 다시 검증하는 분석 진입점이다.
 * OCR provider가 배포되기 전에는 명시적인 fixture 결과만 기록하며, 원본을 AI가 읽은 것처럼 표시하지 않는다.
 */
Deno.serve(async (request) => {
  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const url = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !anonKey || !serviceRoleKey) return json({ error: 'server_not_configured' }, 500);

  const authorization = request.headers.get('Authorization');
  if (!authorization) return json({ error: 'authentication_required' }, 401);

  const userClient = createClient(url, anonKey, {
    auth: { persistSession: false },
    global: { headers: { Authorization: authorization } },
  });
  const { data: authData, error: authError } = await userClient.auth.getUser();
  if (authError || !authData.user) return json({ error: 'authentication_required' }, 401);

  const admin = createClient(url, serviceRoleKey, { auth: { persistSession: false } });

  const requestBody = await request.json().catch(() => null) as { scanId?: unknown } | null;
  const scanId = typeof requestBody?.scanId === 'string' ? requestBody.scanId.trim() : '';
  if (!scanId) return json({ error: 'scan_id_required' }, 400);

  // Use the caller-scoped query for ownership. It exercises the same RLS rule
  // that protects scan jobs in the app, before privileged state transitions.
  const { data: scan, error: scanError } = await userClient
    .from('scan_jobs')
    .select('id, user_id, storage_path, mime_type, byte_size, status')
    .eq('id', scanId)
    .eq('user_id', authData.user.id)
    .maybeSingle();

  if (scanError) return json({ error: 'scan_lookup_failed' }, 500);
  if (!scan) return json({ error: 'scan_not_found' }, 404);
  if (scan.status === 'ready') return json({ id: scan.id, status: 'ready', analysisSource: 'fixture' });
  if (scan.status !== 'uploaded') return json({ error: 'scan_not_ready' }, 409);

  const { error: analyzingError } = await admin
    .from('scan_jobs')
    .update({ status: 'analyzing', error_code: null })
    .eq('id', scan.id)
    .eq('user_id', authData.user.id)
    .eq('status', 'uploaded');
  if (analyzingError) return json({ error: 'scan_state_update_failed' }, 500);

  const expectedPrefix = `${authData.user.id}/`;
  const fileName = scan.storage_path.slice(expectedPrefix.length);
  if (!scan.storage_path.startsWith(expectedPrefix) || !fileName) {
    await markFailed(admin, scan.id, 'invalid_storage_path');
    return json({ error: 'invalid_storage_path' }, 400);
  }

  const { data: files, error: storageError } = await admin.storage.from(receiptImageBucket).list(authData.user.id, { search: fileName });
  const storedFile = files?.find((file) => file.name === fileName);
  const storedMimeType = storedFile?.metadata?.mimetype as string | undefined;
  const storedByteSize = storedFile?.metadata?.size as number | undefined;
  if (storageError || !storedFile || !storedMimeType || !storedByteSize) {
    await markFailed(admin, scan.id, 'image_not_found');
    return json({ error: 'image_not_found' }, 400);
  }
  if (!allowedMimeTypes.has(storedMimeType) || storedMimeType !== scan.mime_type || storedByteSize !== scan.byte_size || storedByteSize > maxReceiptImageBytes) {
    await markFailed(admin, scan.id, 'invalid_image_metadata');
    return json({ error: 'invalid_image_metadata' }, 400);
  }

  const analyzedAt = new Date().toISOString();
  const { error: updateError } = await admin
    .from('scan_jobs')
    .update({
      status: 'ready',
      analysis_source: 'fixture',
      result: { provider: 'fixture', candidates: fixtureCandidates },
      analyzed_at: analyzedAt,
      error_code: null,
    })
    .eq('id', scan.id)
    .eq('user_id', authData.user.id);
  if (updateError) return json({ error: 'scan_update_failed' }, 500);

  return json({ id: scan.id, status: 'ready', analysisSource: 'fixture' });
});
