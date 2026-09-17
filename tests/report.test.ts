import { describe, it, expect } from "vitest";
import { validateReport, formatCpf, normalizeReport } from "../shared/report";
import type { ReportInput } from "../shared/report";
export const form: ReportInput = {
  cell_id: "11111111-1111-4111-8111-111111111111",
  visit_date: "2026-01-15",
  start_time: "10:00",
  end_time: "12:00",
  professional_name: "Profissional de teste",
  professional_role: "Responsável",
  professional_cpf: "",
  beneficiaries: 12,
  companions: null,
  local_team: 3,
  estimates: true,
  signature_method: "paper",
  accepted: true,
  attendance: [],
};
describe("validation at submission boundary", () => {
  it("accepts unknown quantities and optional CPF without inventing values", () =>
    expect(validateReport(form)).toEqual({}));
  it("rejects missing declaration, impossible/future dates and forged IDs", () => {
    expect(validateReport({ ...form, accepted: false }).accepted).toBeTruthy();
    expect(
      validateReport({ ...form, visit_date: "2026-02-30" }).visit_date,
    ).toBeTruthy();
    expect(
      validateReport({ ...form, visit_date: "2999-01-01" }).visit_date,
    ).toBeTruthy();
    expect(validateReport({ ...form, cell_id: "any" }).cell_id).toBeTruthy();
  });
  it("requires justified status for absence and rejects duplicate volunteers", () => {
    const attendance = [
      { volunteer_id: form.cell_id, status: "absent", justified: null },
    ];
    expect(validateReport({ ...form, attendance }).attendance).toBeTruthy();
    expect(
      validateReport({
        ...form,
        attendance: [{ ...attendance[0], justified: false }],
      }),
    ).toEqual({});
    expect(
      validateReport({
        ...form,
        attendance: [
          { ...attendance[0], justified: false },
          { ...attendance[0], justified: false },
        ],
      }).attendance,
    ).toBeTruthy();
  });
  it("strips extra client fields before hashing or persisting", () => {
    expect(
      normalizeReport({ ...form, role: "admin" } as ReportInput),
    ).not.toHaveProperty("role");
  });
  it("formats CPF progressively without inserting an early dash", () => {
    expect(formatCpf("1234")).toBe("123.4");
    expect(formatCpf("1234567")).toBe("123.456.7");
    expect(formatCpf("12345678900")).toBe("123.456.789-00");
  });
});
