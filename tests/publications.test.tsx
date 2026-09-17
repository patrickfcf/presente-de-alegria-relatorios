// @vitest-environment jsdom
import { afterEach, it, expect, vi } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { validateDetails } from "../shared/publications";
import { PublicFeed } from "../src/components/PublicFeed";
import { CampaignsFeed } from "../src/components/Feed";
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
