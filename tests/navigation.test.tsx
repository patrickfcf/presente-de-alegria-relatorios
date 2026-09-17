// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import App from "../src/App";
vi.mock("../src/lib/api", () => ({ configured: true, supabase: null, rows: vi.fn(), admin: vi.fn(), publicRows: vi.fn().mockResolvedValue([]) }));
afterEach(() => { cleanup(); history.replaceState({}, "", "/"); });
it("opens the clean public events URL with crawlable navigation before login", async () => {
  history.replaceState({}, "", "/eventos");
  render(<App />);
  expect(await screen.findByRole("heading", {name: "Eventos", exact: true})).toBeVisible();
  expect(screen.getByRole("link", {name: "Notícias", exact: true})).toHaveAttribute("href", "/noticias/");
  expect(screen.getByRole("link", {name: "Minha célula", exact: true})).toHaveAttribute("href", "/#/");
});
it("provides public participation and support links on the about page", () => {
  history.replaceState({}, "", "/sobre");
  render(<App />);
  expect(screen.getByRole("link", {name: "Quero ajudar"})).toHaveAttribute("href", "/ajudas/");
  expect(screen.getByRole("link", {name: "Participar de um evento"})).toHaveAttribute("href", "/eventos/");
});
