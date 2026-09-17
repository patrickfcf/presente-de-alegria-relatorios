import { it, expect } from "vitest";
import { PDFDocument } from "pdf-lib";
import { readFileSync } from "node:fs";
import { generateReportPdf, detectType } from "../shared/pdf";
const data = {
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
  signature_method: "paper" as const,
  attendance: [],
  id: "22222222-2222-4222-8222-222222222222",
  cell_name: "Célula de teste",
  institution_name: "Instituição de teste",
  coordinator_name: "Coordenador de teste",
  created_at: "2026-01-15T15:00:00Z",
};
it("generates a formal cover and appends every original PDF page", async () => {
  const original = await PDFDocument.create();
  original.addPage();
  original.addPage();
  const bytes = await generateReportPdf(data, [
    {
      type: "application/pdf",
      bytes: await original.save(),
      label: "Documento",
    },
  ]);
  const result = await PDFDocument.load(bytes);
  expect(result.getPageCount()).toBe(3);
  expect(result.getSubject()).toBe(data.id);
  expect(result.getPage(0).getWidth()).toBeCloseTo(595.28);
});
it("embeds a PNG signature in the report and preserves official branding", async () => {
  const bytes = await generateReportPdf({ ...data, signature_method: "canvas" }, [
    {
      type: "image/png",
      bytes: readFileSync("public/logo.png"),
      label: "Synthetic image fixture",
    },
  ]);
  const result = await PDFDocument.load(bytes);
  expect(result.getPageCount()).toBe(1);
  expect(result.getAuthor()).toBe("Presente de Alegria");
  expect(bytes.byteLength).toBeGreaterThan(10000);
});
it("rejects disguised files, corrupt PDFs and documents beyond the page limit", async () => {
  expect(() => detectType(new TextEncoder().encode("<html>bad</html>"))).toThrow();
  await expect(
    generateReportPdf(data, [
      {
        type: "application/pdf",
        bytes: new Uint8Array([1, 2, 3]),
        label: "Bad",
      },
    ]),
  ).rejects.toThrow();
  const original = await PDFDocument.create();
  for (let i = 0; i < 21; i++) original.addPage();
  await expect(
    generateReportPdf(data, [
      { type: "application/pdf", bytes: await original.save(), label: "Long" },
    ]),
  ).rejects.toThrow("20 páginas");
});
