// @vitest-environment jsdom
import { afterEach, it, expect, vi } from "vitest";
import { cleanup, render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { ReportForm } from "../src/components/ReportForm";
import { Registry } from "../src/components/Registry";
import { Entry } from "../src/components/Entry";
import type { Profile, Cell, Institution, Membership } from "../shared/report";
const api = vi.hoisted(() => ({
  invoke: vi.fn().mockResolvedValue({ id: "report-test" }),
  admin: vi.fn().mockResolvedValue({ ok: true }),
}));
vi.mock("../src/lib/api", () => ({ ...api, supabase: null }));
vi.mock("../src/components/Signature", () => ({
  Signature: () => <p>Canvas fixture</p>,
}));
const coordinator: Profile = {
  id: "11111111-1111-4111-8111-111111111111",
  display_name: "Coordenador Teste",
  email: "coord@example.invalid",
  role: "coordinator",
  active: true,
  clown_name: "Teste",
  phone: "+5511000000000",
  manager_id: "44444444-4444-4444-8444-444444444444",
  deleted_at: null,
};
const volunteer: Profile = {
  ...coordinator,
  id: "22222222-2222-4222-8222-222222222222",
  role: "volunteer",
  display_name: "Voluntário Teste",
  manager_id: coordinator.id,
};
const cell: Cell = {
  id: "33333333-3333-4333-8333-333333333333",
  name: "Célula Teste",
  institution_id: "55555555-5555-4555-8555-555555555555",
  active: true,
  expected_visits: 1,
  reporting_start: "2026-01-01",
  reporting_end: null,
};
const institution: Institution = {
  id: cell.institution_id,
  name: "Instituição Teste",
  active: true,
};
const memberships: Membership[] = [coordinator, volunteer].map((p) => ({
  profile_id: p.id,
  cell_id: cell.id,
  active: true,
  is_default: true,
}));
afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.clearAllMocks();
});
it("offers four entry choices without granting a role", async () => {
  render(<Entry />);
  expect(
    screen.getByRole("button", { name: /Equipe de Comunicação/ }),
  ).toBeInTheDocument();
  await userEvent.click(
    screen.getByRole("button", { name: "Voluntário individual" }),
  );
  expect(screen.getByLabelText("E-mail")).toBeInTheDocument();
  expect(api.admin).not.toHaveBeenCalled();
});
it("coordinators can edit and reset only their own volunteers", () => {
  render(
    <Registry
      profile={coordinator}
      profiles={[coordinator, volunteer]}
      cells={[cell]}
      institutions={[institution]}
      memberships={memberships}
      onRefresh={async () => {}}
    />,
  );
  expect(
    screen.getByRole("button", { name: /Cadastrar voluntário/ }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Reenviar acesso" }),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Excluir acesso" }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Substituir coordenador" }),
  ).not.toBeInTheDocument();
});
it("completes paper workflow with institutional professional and attendance, after review", async () => {
  const onSuccess = vi.fn();
  render(
    <ReportForm
      profile={coordinator}
      profiles={[coordinator, volunteer]}
      cells={[cell]}
      institutions={[institution]}
      memberships={memberships}
      onClose={() => {}}
      onSuccess={onSuccess}
    />,
  );
  fireEvent.change(screen.getByLabelText("Data da visita"), {
    target: { value: "2026-01-15" },
  });
  fireEvent.change(screen.getByLabelText("Horário inicial"), {
    target: { value: "10:00" },
  });
  fireEvent.change(screen.getByLabelText("Horário final"), {
    target: { value: "12:00" },
  });
  await userEvent.selectOptions(
    screen.getByLabelText(/Voluntário Teste/),
    "justified",
  );
  await userEvent.click(screen.getByRole("button", { name: "Continuar" }));
  await userEvent.type(
    screen.getByLabelText("Nome do profissional"),
    "Profissional da instituição",
  );
  await userEvent.type(
    screen.getByLabelText("Assistidos (Pacientes / Beneficiários)"),
    "12",
  );
  await userEvent.click(screen.getByRole("button", { name: "Continuar" }));
  await userEvent.click(screen.getByLabelText("Enviar documento assinado em papel"));
  const file = new File(["%PDF-synthetic"], "teste.pdf", {
    type: "application/pdf",
  });
  await userEvent.upload(screen.getByLabelText("Escolher comprovantes"), file);
  await userEvent.click(screen.getByRole("button", { name: "Continuar" }));
  expect(api.invoke).not.toHaveBeenCalled();
  expect(
    screen.getByText("Profissional da instituição", {
      exact: true,
      selector: "dd",
    }),
  ).toBeInTheDocument();
  await userEvent.click(screen.getByLabelText(/Conferi os dados/));
  await userEvent.click(screen.getByRole("button", { name: "Enviar relatório" }));
  await waitFor(() => expect(onSuccess).toHaveBeenCalledWith("report-test"));
  const submitted = JSON.parse(api.invoke.mock.calls[0][1].get("report"));
  expect(submitted.professional_name).toBe("Profissional da instituição");
  expect(submitted.attendance).toEqual([
    { volunteer_id: volunteer.id, status: "absent", justified: true },
  ]);
  expect(submitted.companions).toBeNull();
  expect(submitted.beneficiaries).toBe(12);
});
