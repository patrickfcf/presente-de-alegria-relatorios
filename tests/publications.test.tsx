// @vitest-environment jsdom
import { afterEach, it, expect, vi } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { validateDetails } from "../shared/publications";
import { PublicFeed } from "../src/components/PublicFeed";
import { CampaignsFeed, EventsFeed, NewsFeed } from "../src/components/Feed";
const api = vi.hoisted(() => ({ publicRows: vi.fn() }));
vi.mock("../src/lib/api", () => api);
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
it("rejects unsafe links and incomplete Pix details", () => {
  expect(() =>
    validateDetails("events", { action_url: "javascript:alert(1)" }),
  ).toThrow();
  expect(() => validateDetails("campaigns", { pix_key: "test-key" })).toThrow();
  expect(() => validateDetails("news", { contact_name: "Equipe" })).toThrow();
  expect(
    validateDetails("campaigns", {
      pix_key: "test-key",
      pix_beneficiary: "ONG Teste",
    }),
  ).toMatchObject({ pix_key: "test-key" });
});
it.each([
  ["/eventos", "events"],
  ["/noticias", "news"],
  ["/ajudas", "campaigns"],
])("loads %s anonymously", async (route, table) => {
  api.publicRows.mockResolvedValue([]);
  render(<PublicFeed route={route} />);
  expect(await screen.findByText(/em breve|novidades chegam/)).toBeVisible();
  expect(api.publicRows).toHaveBeenCalledWith(table);
  expect(screen.queryByText(/Entre para/)).not.toBeInTheDocument();
});
it("distinguishes network failure from an empty feed and supports retry", async () => {
  api.publicRows
    .mockRejectedValueOnce(new Error("Conexão indisponível"))
    .mockResolvedValueOnce([]);
  render(<PublicFeed route="/ajudas" />);
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Conexão indisponível",
  );
  fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
  expect(
    await screen.findByText("Novas formas de ajudar em breve."),
  ).toBeVisible();
});
it("hides draft and scheduled campaigns and removes participation from ended campaigns", () => {
  const base = {
    id: "a",
    title: "Campanha ativa",
    body: "Texto",
    published_at: "2020-01-01T00:00:00Z",
    ends_at: null,
    status: "published" as const,
    details: { pix_key: "synthetic", pix_beneficiary: "ONG Teste" },
  };
  render(
    <CampaignsFeed
      campaigns={[
        base,
        { ...base, id: "b", title: "Rascunho", status: "draft" },
        {
          ...base,
          id: "c",
          title: "Futura",
          published_at: "2099-01-01T00:00:00Z",
        },
        {
          ...base,
          id: "d",
          title: "Encerrada",
          ends_at: "2020-02-01T00:00:00Z",
        },
      ]}
    />,
  );
  expect(screen.queryByText("Rascunho")).not.toBeInTheDocument();
  expect(screen.queryByText("Futura")).not.toBeInTheDocument();
  expect(screen.queryByText("Encerrada")).not.toBeInTheDocument();
  fireEvent.click(screen.getByLabelText("Mostrar também campanhas encerradas"));
  expect(screen.getByText("Encerrada")).toBeVisible();
  expect(
    screen.getAllByRole("button", { name: "Copiar chave Pix" }),
  ).toHaveLength(1);
});

it("sorts events by publication and filters category, month and accent-insensitive location", () => {
  const base = { description: "Visita", location: "São Paulo", starts_at: "2099-10-01T12:00:00Z", ends_at: null, status: "published" as const, details: { category: "Ação pontual" } };
  render(<EventsFeed events={[
    {...base, id: "a", title: "Antigo", published_at: "2020-01-01T00:00:00Z"},
    {...base, id: "b", title: "Novo", published_at: "2021-01-01T00:00:00Z", starts_at: "2099-11-01T12:00:00Z"},
    {...base, id: "c", title: "Rascunho", status: "draft"},
  ]} />);
  expect(screen.getAllByRole("article")[0]).toHaveTextContent("Novo");
  fireEvent.change(screen.getByLabelText("Ordenar por"), {target: {value: "upcoming"}});
  expect(screen.getAllByRole("article")[0]).toHaveTextContent("Antigo");
  fireEvent.change(screen.getByLabelText("Buscar"), {target: {value: "sao paulo"}});
  expect(screen.getAllByRole("article")).toHaveLength(2);
  fireEvent.change(screen.getByLabelText("Mês do evento"), {target: {value: "2099-11"}});
  expect(screen.getAllByRole("article")).toHaveLength(1);
  fireEvent.change(screen.getByLabelText("Categoria"), {target: {value: "Formação"}});
  expect(screen.getByText("Nenhum evento encontrado.")).toBeVisible();
  fireEvent.click(screen.getByRole("button", {name: "Limpar filtros"}));
  expect(screen.getAllByRole("article")).toHaveLength(2);
});
it("filters news by publication month and keeps scheduled news private", () => {
  const base = {body: "Texto", status: "published" as const, details: {category: "Resultados"}};
  render(<NewsFeed news={[
    {...base, id: "a", title: "Antiga", published_at: "2020-01-01T12:00:00Z"},
    {...base, id: "b", title: "Nova", published_at: "2020-02-01T12:00:00Z"},
    {...base, id: "c", title: "Agendada", published_at: "2099-02-01T12:00:00Z"},
  ]} />);
  expect(screen.getAllByRole("article")[0]).toHaveTextContent("Nova");
  fireEvent.change(screen.getByLabelText("Mês da publicação"), {target: {value: "2020-01"}});
  expect(screen.getAllByRole("article")).toHaveLength(1);
  expect(screen.queryByText("Agendada")).not.toBeInTheDocument();
});

it("prefills event WhatsApp links using the Brasília date and preserves the contact", async () => {
  const { eventContactUrl } = await import('../shared/publications');
  const event = { title: 'Encontro & Alegria', starts_at: '2026-10-18T01:00:00Z' };
  const result = new URL(eventContactUrl('https://wa.me/5511000000000?text=antigo', event));
  expect(result.pathname).toBe('/5511000000000');
  expect(result.searchParams.get('text')).toBe('Olá! Vi o evento “Encontro & Alegria”, do dia 17/10/2026, no aplicativo do Presente de Alegria e gostaria de saber mais informações sobre como participar. Pode me ajudar?');
  const api = new URL(eventContactUrl('https://api.whatsapp.com/send?phone=5511000000000', event));
  expect(api.searchParams.get('phone')).toBe('5511000000000');
  expect(api.searchParams.get('text')).toBe(result.searchParams.get('text'));
  for (const url of ['https://example.org/contato', 'https://chat.whatsapp.com/exemplo', 'https://wa.me.evil.invalid/5511000000000']) {
    expect(eventContactUrl(url, event)).toBe(url);
  }
});
