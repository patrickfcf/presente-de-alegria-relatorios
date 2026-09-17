import { createClient } from "@supabase/supabase-js";
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
export const configured = Boolean(url && key);
export const supabase = configured
  ? createClient(url!, key!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    })
  : null;
export async function invoke<T>(name: string, body: unknown): Promise<T> {
  if (!supabase) throw new Error("O aplicativo ainda não foi configurado.");
  const { data, error } = await supabase.functions.invoke<T>(name, {
    body: body as Record<string, unknown>,
  });
  if (error) {
    let message =
      "Não foi possível concluir. Verifique sua conexão e tente novamente.";
    try {
      const detail = await error.context?.json();
      if (detail?.error) message = detail.error;
    } catch {
      /* response unavailable */
    }
    throw new Error(message);
  }
  if (!data)
    throw new Error(
      "Resposta incompleta. Confira o histórico antes de enviar novamente.",
    );
  return data;
}
export const admin = (body: Record<string, unknown>) =>
  invoke<{ id?: string; ok?: boolean; email_sent?: boolean }>("admin", body);
export async function rows<T>(table: string, order?: string): Promise<T[]> {
  if (!supabase) throw new Error("Aplicativo não configurado.");
  const all: T[] = [];
  for (let offset = 0; ; offset += 500) {
    let q = supabase
      .from(table)
      .select("*")
      .range(offset, offset + 499);
    if (order) q = q.order(order, { ascending: false });
    else if (table === "cell_memberships")
      q = q
        .order("profile_id", { ascending: true })
        .order("cell_id", { ascending: true });
    else q = q.order("id", { ascending: true });
    const { data, error } = await q;
    if (error)
      throw new Error("Não foi possível carregar os dados. Tente novamente.");
    all.push(...(data as T[]));
    if (data.length < 500) break;
  }
  return all;
}
export async function reportBlob(path: string) {
  if (!supabase) throw new Error("Entre novamente.");
  const { data, error } = await supabase.storage
    .from("visit-reports")
    .download(path);
  if (error)
    throw new Error(
      "Não foi possível baixar o arquivo. Confira sua conexão e seu acesso à célula.",
    );
  return data;
}
export function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
export async function downloadFile(path: string, name: string) {
  downloadBlob(await reportBlob(path), name);
}
