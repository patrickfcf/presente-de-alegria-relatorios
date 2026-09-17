import fontkit from "@pdf-lib/fontkit";
import { FONT_REGULAR, FONT_BOLD } from "./fonts.ts";
import { PDFDocument, rgb } from "pdf-lib";
import { DECLARATION, attendanceTotal } from "./report.ts";
import type { ReportInput } from "./report.ts";
import { LOGO_BASE64 } from "./brand.ts";
export type PdfReport = Omit<ReportInput, "accepted"> & {
  id: string;
  cell_name: string;
  institution_name: string;
  coordinator_name: string;
  created_at: string;
};
export type Evidence = {
  bytes: Uint8Array;
  type: "image/png" | "image/jpeg" | "application/pdf";
  label: string;
};
export function detectType(bytes: Uint8Array): Evidence["type"] {
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    if (bytes.length < 24) throw new Error("Imagem incompleta.");
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    if (view.getUint32(16) * view.getUint32(20) > 20000000)
      throw new Error("Reduza a resolução da foto para até 20 megapixels.");
    return "image/png";
  }
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff)
    return "image/jpeg";
  if (new TextDecoder().decode(bytes.slice(0, 5)) === "%PDF-")
    return "application/pdf";
  throw new Error(
    "Envie um PDF, JPG ou PNG válido. Converta fotos HEIC para JPG antes de enviar.",
  );
}
export async function generateReportPdf(
  r: PdfReport,
  evidence: Evidence[],
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const normal = await doc.embedFont(FONT_REGULAR, { subset: true });
  const bold = await doc.embedFont(FONT_BOLD, { subset: true });
  const page = doc.addPage([595.28, 841.89]);
  const purple = rgb(0.176, 0.114, 0.329);
  const gray = rgb(0.35, 0.35, 0.4);
  const logo = await doc.embedPng(LOGO_BASE64);
  page.drawImage(logo, { x: 42, y: 738, width: 162, height: 70.2 });
  const supported = new Set(normal.getCharacterSet());
  const text = (s: string, x: number, y: number, size = 10, strong = false) => {
    try {
      if ([...s].some((c) => !supported.has(c.codePointAt(0)!)))
        throw new Error("unsupported");
      page.drawText(s, {
        x,
        y,
        size,
        font: strong ? bold : normal,
        color: purple,
      });
    } catch {
      throw new Error(
        "Há um caractere não compatível com o PDF. Use letras, números e pontuação no cadastro e no formulário.",
      );
    }
  };
  const wrap = (
    s: string,
    x: number,
    y: number,
    width: number,
    size = 10,
    strong = false,
  ) => {
    const font = strong ? bold : normal;
    let line = "";
    let pos = y;
    for (const word of s.split(/\s+/).flatMap((word) => {
      const chunks: string[] = [];
      let part = "";
      for (const c of word) {
        if (font.widthOfTextAtSize(part + c, size) > width && part) {
          chunks.push(part);
          part = "";
        }
        part += c;
      }
      if (part) chunks.push(part);
      return chunks;
    })) {
      if (
        font.widthOfTextAtSize((line ? line + " " : "") + word, size) > width &&
        line
      ) {
        text(line, x, pos, size, strong);
        pos -= size * 1.45;
        line = word;
      } else line += (line ? " " : "") + word;
    }
    if (line) text(line, x, pos, size, strong);
    return pos - size * 1.45;
  };
  text("RELATÓRIO DE VISITA", 279, 783, 16, true);
  text("Documento de Controle Institucional", 279, 763, 10);
  page.drawLine({
    start: { x: 42, y: 728 },
    end: { x: 553, y: 728 },
    thickness: 1.5,
    color: purple,
  });
  const section = (title: string, y: number) => {
    page.drawRectangle({
      x: 42,
      y: y - 7,
      width: 511,
      height: 26,
      color: rgb(0.96, 0.94, 0.99),
    });
    text(title, 52, y + 1, 11, true);
  };
  section("1. INFORMAÇÕES DA VISITA", 699);
  wrap("Instituição: " + r.institution_name, 48, 668, 500, 11, true);
  wrap("Célula: " + r.cell_name, 48, 631, 500);
  text(
    "Data da visita: " + r.visit_date.split("-").reverse().join("/"),
    48,
    605,
    11,
  );
  text(
    "Horário: " + r.start_time.slice(0, 5) + " às " + r.end_time.slice(0, 5),
    335,
    605,
    11,
  );
  section("2. DADOS DO PROFISSIONAL DA INSTITUIÇÃO", 568);
  wrap("Nome: " + r.professional_name, 48, 537, 500, 11);
  wrap(
    "Função / Cargo: " + (r.professional_role || "Não informado"),
    48,
    500,
    500,
    11,
  );
  text("CPF: " + (r.professional_cpf || "Não informado"), 48, 463, 11);
  section("3. INDICADORES DE ATENDIMENTO", 426);
  const values = [r.beneficiaries, r.companions, r.local_team];
  const total = attendanceTotal(values);
  const labels = [
    "Assistidos (Pacientes / Beneficiários)",
    "Acompanhantes",
    "Equipe do Local (Funcionários / Profissionais)",
    total.complete
      ? "TOTAL DE PESSOAS ATENDIDAS NO DIA"
      : "SUBTOTAL INFORMADO (dados incompletos)",
  ];
  const quantities = [...values, total.value];
  labels.forEach((label, i) => {
    const y = 391 - i * 29;
    page.drawRectangle({
      x: 42,
      y: y - 8,
      width: 511,
      height: 29,
      borderColor: rgb(0.8, 0.78, 0.83),
      borderWidth: 0.5,
      ...(i === 3 ? { color: rgb(0.96, 0.94, 0.99) } : {}),
    });
    text(label, 50, y + 2, 9, i === 3);
    text(
      quantities[i] === null ? "Não informado" : String(quantities[i]),
      455,
      y + 2,
      10,
      i === 3,
    );
  });
  if (r.estimates) text("Quantidades declaradas como estimativas.", 48, 276, 9);
  wrap(DECLARATION, 48, 249, 500, 10);
  if (r.signature_method === "canvas") {
    if (evidence.length !== 1 || evidence[0].type !== "image/png")
      throw new Error("Assinatura inválida.");
    const signature = await doc.embedPng(evidence[0].bytes);
    const scaled = signature.scaleToFit(370, 79);
    page.drawImage(signature, {
      x: (595 - scaled.width) / 2,
      y: 121,
      width: scaled.width,
      height: scaled.height,
    });
    page.drawLine({
      start: { x: 112, y: 115 },
      end: { x: 484, y: 115 },
      color: gray,
      thickness: 0.7,
    });
    text("Assinatura do Profissional da Instituição", 181, 99, 10, true);
    text("Assinatura coletada na tela pelo coordenador.", 190, 83, 8);
  } else {
    text("COMPROVANTE ASSINADO EM PAPEL", 48, 180, 11, true);
    wrap(
      "O coordenador declarou que o documento original anexado está legível e assinado pelo profissional da instituição. Consulte as páginas seguintes e os arquivos originais.",
      48,
      158,
      500,
      10,
    );
  }
  text("Enviado por: " + r.coordinator_name, 48, 62, 8);
  text("Registro: " + r.id, 48, 46, 8);
  text(
    "Preparado em: " +
      new Date(r.created_at).toLocaleString("pt-BR", {
        timeZone: "America/Sao_Paulo",
      }),
    48,
    32,
    8,
  );
  if (r.signature_method === "paper") {
    let count = 0;
    for (const item of evidence) {
      if (item.type === "application/pdf") {
        let original: PDFDocument;
        try {
          original = await PDFDocument.load(item.bytes);
        } catch {
          throw new Error(
            "Não foi possível abrir o PDF. Verifique se ele não tem senha ou está corrompido.",
          );
        }
        count += original.getPageCount();
        if (count > 20)
          throw new Error(
            "Os comprovantes devem ter, ao todo, no máximo 20 páginas.",
          );
        for (const p of await doc.copyPages(
          original,
          original.getPageIndices(),
        ))
          doc.addPage(p);
      } else {
        const photo =
          item.type === "image/png"
            ? await doc.embedPng(item.bytes)
            : await doc.embedJpg(item.bytes);
        if (photo.width * photo.height > 20000000)
          throw new Error("Reduza a foto para até 20 megapixels.");
        if (++count > 20) throw new Error("Limite de páginas excedido.");
        const p = doc.addPage([595.28, 841.89]);
        const scaled = photo.scaleToFit(511, 735);
        p.drawText("COMPROVANTE ORIGINAL — " + String(count), {
          x: 42,
          y: 805,
          size: 10,
          font: bold,
          color: purple,
        });
        p.drawImage(photo, {
          x: (595 - scaled.width) / 2,
          y: 48 + (735 - scaled.height) / 2,
          ...scaled,
        });
      }
    }
  }
  doc.setTitle("Relatório de Visita — " + r.institution_name);
  doc.setAuthor("Presente de Alegria");
  doc.setSubject(r.id);
  return doc.save();
}
