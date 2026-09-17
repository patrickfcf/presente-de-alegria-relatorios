// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import App from "../src/App";
vi.mock("../src/lib/api", () => ({
  configured: true,
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi
        .fn()
        .mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
  },
  rows: vi.fn(),
  admin: vi.fn(),
  publicRows: vi.fn().mockResolvedValue([]),
}));
afterEach(() => {
  cleanup();
  localStorage.removeItem("pda:entry");
  history.replaceState({}, "", "/");
});
it("opens the clean public events URL with crawlable navigation before login", async () => {
  history.replaceState({}, "", "/eventos");
  render(<App />);
  expect(
    await screen.findByRole("heading", { name: "Eventos", exact: true }),
  ).toBeVisible();
  expect(
    screen.getByRole("link", { name: "Notícias", exact: true }),
  ).toHaveAttribute("href", "/noticias/");
  expect(
    screen.getByRole("link", { name: "Minha célula", exact: true }),
  ).toHaveAttribute("href", "/#/minha-celula");
});
it("provides public participation and support links on the about page", () => {
  history.replaceState({}, "", "/sobre");
  render(<App />);
  expect(screen.getByRole("link", { name: "Quero ajudar" })).toHaveAttribute(
    "href",
    "/ajudas/",
  );
  expect(
    screen.getByRole("link", { name: "Participar de um evento" }),
  ).toHaveAttribute("href", "/eventos/");
});

it("introduces four areas at the root without adding a home menu item", () => {
  render(<App />);
  expect(
    screen.getByRole("heading", { name: "Alegria que aproxima." }),
  ).toBeVisible();
  expect(screen.getByRole("link", { name: /Acessar minha célula/ })).toHaveAttribute(
    "href",
    "/#/minha-celula",
  );
  const menu = within(screen.getByRole("navigation", { name: "Menu principal" }));
  expect(menu.getAllByRole("link")).toHaveLength(4);
  expect(menu.getByRole("link", { name: "Doação" })).toHaveAttribute(
    "href",
    "/ajudas/",
  );
  expect(menu.queryByRole("link", { name: "Início" })).not.toBeInTheDocument();
  expect(screen.queryByText("Quem é você no Presente?")).not.toBeInTheDocument();
});
it("keeps the cell entry behind login", async () => {
  history.replaceState({}, "", "/#/minha-celula");
  render(<App />);
  expect(
    await screen.findByRole("heading", { name: "Quem é você no Presente?" }),
  ).toBeVisible();
});
it("keeps donation campaigns public at their existing shared URL", async () => {
  history.replaceState({}, "", "/ajudas/");
  render(<App />);
  expect(await screen.findByRole("heading", { name: "Doação" })).toBeVisible();
});

it("recognizes an existing leader entry preference with the new official name", async () => {
  localStorage.setItem("pda:entry", "director");
  history.replaceState({}, "", "/#/minha-celula");
  render(<App />);
  expect(
    await screen.findByText("Líder de segmento", { exact: true }),
  ).toBeVisible();
  expect(screen.queryByText("Diretor de célula")).not.toBeInTheDocument();
});
