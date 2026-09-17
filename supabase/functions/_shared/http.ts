import { createClient } from "npm:@supabase/supabase-js@2.116.0";
export const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Cache-Control": "no-store",
};
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export const response = (data: unknown, status = 200) =>
  Response.json(data, { status, headers: cors });
export async function authenticate(req: Request) {
  const header = req.headers.get("Authorization") || "";
  if (!header.startsWith("Bearer "))
    throw new HttpError(401, "Entre novamente para continuar.");
  const secretKeys = Deno.env.get("SUPABASE_SECRET_KEYS");
  const serviceKey = secretKeys
    ? JSON.parse(secretKeys).default
    : Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!serviceKey)
    throw new HttpError(503, "Serviço temporariamente indisponível.");
  const db = createClient(Deno.env.get("SUPABASE_URL")!, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await db.auth.getUser(header.slice(7));
  if (error || !data.user)
    throw new HttpError(401, "Sua sessão expirou. Entre novamente.");
  const { data: profile, error: profileError } = await db
    .from("profiles")
    .select("*")
    .eq("id", data.user.id)
    .eq("active", true)
    .maybeSingle();
  if (profileError || !profile)
    throw new HttpError(
      403,
      "Seu cadastro não está ativo. Entre em contato com a administração da ONG.",
    );
  return { db, profile, user: data.user };
}
export async function limitedBody(req: Request, max: number) {
  if (Number(req.headers.get("content-length") || 0) > max)
    throw new HttpError(413, "Os arquivos ultrapassam o limite permitido.");
  const reader = req.body?.getReader();
  if (!reader) throw new HttpError(400, "Envio vazio.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > max) {
      await reader.cancel();
      throw new HttpError(413, "Os arquivos ultrapassam o limite permitido.");
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  return bytes;
}
export function handleError(error: unknown) {
  if (error instanceof HttpError)
    return response({ error: error.message }, error.status);
  console.error("request_failed"); // Never log credentials or report contents.
  return response(
    {
      error:
        "Não foi possível concluir. Seus dados continuam na tela; tente novamente.",
    },
    500,
  );
}
