export type PublicationKind = "news" | "events" | "campaigns";
export const categories = {
  news: ["Comunicado", "Histórias", "Resultados", "Voluntariado"],
  events: ["Encontro", "Beneficente", "Ação pontual", "Formação"],
  campaigns: ["Doação", "Pix", "Arrecadação", "Rifa", "Bingo"],
} as const;
export type PublicationDetails = {
  category?: string;
  summary?: string;
  contact_name?: string;
  contact_url?: string;
  action_url?: string;
  action_label?: string;
  pix_key?: string;
  pix_beneficiary?: string;
};
export function safePublicUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "https:" && !u.username && !u.password;
  } catch {
    return false;
  }
}
export function eventContactUrl(value: string, event: { title: string; starts_at: string }): string {
  if (!safePublicUrl(value)) return value;
  const url = new URL(value);
  const direct = url.hostname === "wa.me" && /^\/\d+\/?$/.test(url.pathname);
  const send = ["api.whatsapp.com", "web.whatsapp.com"].includes(url.hostname)
    && url.pathname === "/send" && /^\d+$/.test(url.searchParams.get("phone") || "");
  if (!direct && !send) return value;
  const start = new Date(event.starts_at);
  if (Number.isNaN(start.getTime())) return value;
  const date = start.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", year: "numeric" });
  url.searchParams.set("text", `Olá! Vi o evento “${event.title}”, do dia ${date}, no aplicativo do Presente de Alegria e gostaria de saber mais informações sobre como participar. Pode me ajudar?`);
  return url.toString();
}
export function validateDetails(
  kind: PublicationKind,
  input: unknown,
): PublicationDetails {
  if (input === undefined) return {};
  if (!input || typeof input !== "object" || Array.isArray(input))
    throw new Error("Detalhes inválidos.");
  const limits = {
    category: 40,
    summary: 240,
    contact_name: 100,
    contact_url: 500,
    action_url: 500,
    action_label: 60,
    pix_key: 140,
    pix_beneficiary: 140,
  };
  const data: Record<string, string> = {};
  for (const [key, max] of Object.entries(limits)) {
    const value = (input as Record<string, unknown>)[key];
    if (value === undefined || value === "") continue;
    if (typeof value !== "string" || value.trim().length > max)
      throw new Error("Confira os campos complementares.");
    data[key] = value.trim();
  }
  if (
    data.category &&
    !(categories[kind] as readonly string[]).includes(data.category)
  )
    throw new Error("Categoria inválida.");
  for (const key of ["contact_url", "action_url"])
    if (data[key] && !safePublicUrl(data[key]))
      throw new Error("Use links completos com https://, sem credenciais.");
  if (
    (data.contact_name && !data.contact_url) ||
    (data.contact_url && !data.contact_name)
  )
    throw new Error("Informe nome e link do contato público.");
  if (data.action_url && !data.action_label)
    throw new Error("Informe o texto do botão de participação.");
  if (kind !== "campaigns" && (data.pix_key || data.pix_beneficiary))
    throw new Error("Pix só está disponível na área Doação.");
  if (
    (data.pix_key && !data.pix_beneficiary) ||
    (data.pix_beneficiary && !data.pix_key)
  )
    throw new Error("Informe a chave Pix e o nome do favorecido.");
  return data;
}
