import {
  authenticate,
  cors,
  response,
  HttpError,
  limitedBody,
  handleError,
} from "../_shared/http.ts";
import {
  normalizeReport,
  validateReport,
  UUID,
} from "../../../shared/report.ts";
import type { ReportInput } from "../../../shared/report.ts";
import { generateReportPdf, detectType } from "../../../shared/pdf.ts";
import type { Evidence } from "../../../shared/pdf.ts";
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST")
    return response({ error: "Método não permitido." }, 405);
  let cleanup: (() => Promise<void>) | undefined;
  try {
    const { db, profile, user } = await authenticate(req);
    if (!["admin", "coordinator"].includes(profile.role))
      throw new HttpError(
        403,
        "A diretoria tem acesso de consulta. O envio deve ser feito por um coordenador.",
      );
    const bytes = await limitedBody(req, 17 * 1024 * 1024);
    const form = await new Response(bytes, {
      headers: { "Content-Type": req.headers.get("Content-Type") || "" },
    }).formData();
    const id = String(form.get("id") || "");
    if (!UUID.test(id))
      throw new HttpError(400, "Identificador inválido. Reabra o formulário.");
    let input: ReportInput;
    try {
      input = JSON.parse(String(form.get("report")));
    } catch {
      throw new HttpError(400, "Formulário inválido.");
    }
    const errors = validateReport(input);
    if (Object.keys(errors).length)
      return response(
        { error: "Confira os campos indicados.", fields: errors },
        400,
      );
    input = normalizeReport(input);
    const files = form.getAll("evidence");
    if (files.length < 1 || files.length > 3)
      throw new HttpError(400, "Anexe de 1 a 3 arquivos assinados.");
    const evidence: Evidence[] = [];
    const hashes: string[] = [];
    let total = 0;
    const hash = async (b: Uint8Array) =>
      Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", b)))
        .map((n) => n.toString(16).padStart(2, "0"))
        .join("");
    for (const [i, file] of files.entries()) {
      if (
        !(file instanceof File) ||
        file.size < 20 ||
        file.size > 5 * 1024 * 1024
      )
        throw new HttpError(400, "Cada comprovante deve ter até 5 MB.");
      const b = new Uint8Array(await file.arrayBuffer());
      total += b.length;
      if (total > 15 * 1024 * 1024)
        throw new HttpError(413, "Anexe até 15 MB no total.");
      let type: Evidence["type"];
      try {
        type = detectType(b);
      } catch (e) {
        throw new HttpError(400, (e as Error).message);
      }
      evidence.push({
        bytes: b,
        type,
        label:
          input.signature_method === "canvas"
            ? "Assinatura do profissional"
            : `Comprovante ${i + 1}`,
      });
      hashes.push(await hash(b));
    }
    if (
      input.signature_method === "canvas" &&
      (evidence.length !== 1 ||
        evidence[0].type !== "image/png" ||
        evidence[0].bytes.length > 512000)
    )
      throw new HttpError(
        400,
        "Assinatura inválida. Limpe e assine novamente.",
      );
    const contentHash = await hash(
      new TextEncoder().encode(JSON.stringify({ input, hashes })),
    );
    const { data: r, error: reserveError } = await db.rpc("reserve_report", {
      p_actor: user.id,
      p_id: id,
      p_hash: contentHash,
      p_form: input,
    });
    if (reserveError) {
      const message = reserveError.message;
      throw new HttpError(
        message.includes("forbidden") ? 403 : 409,
        reserveError.code === "23505"
          ? "Já existe um relatório para esta célula, data e horário. Confira o histórico."
          : message.includes("submission_busy")
            ? "O envio anterior ainda está sendo processado. Aguarde dois minutos e tente novamente."
            : message.includes("idempotency_conflict")
              ? "Os dados mudaram após uma tentativa de envio. Volte ao início e confira o histórico antes de abrir um novo relatório."
              : message.includes("attendance") || message.includes("roster")
                ? "A equipe mudou ou a chamada está incompleta. Reabra o formulário e confira os voluntários."
                : message.includes("outside_reporting_period")
                  ? "A data está fora do período de atividade da célula. Solicite o ajuste à administração."
                  : "Não foi possível autorizar esse envio. Confira sua célula e a data da visita.",
      );
    }
    if (r.status === "submitted")
      return response({ id: r.id, submitted: true });
    const prefix = `${r.cell_id}/${r.id}/${r.lease_token}/`;
    const uploaded: string[] = [];
    cleanup = async () => {
      if (uploaded.length)
        await db.storage.from("visit-reports").remove(uploaded);
      await db
        .from("visit_reports")
        .update({ status: "failed", lease_until: null })
        .eq("id", id)
        .eq("lease_token", r.lease_token)
        .neq("status", "submitted");
    };
    let pdf: Uint8Array;
    try {
      pdf = await generateReportPdf(r, evidence);
    } catch (e) {
      throw new HttpError(400, (e as Error).message);
    }
    if (pdf.length > 15 * 1024 * 1024)
      throw new HttpError(
        413,
        "O relatório ficou muito grande. Reduza as fotos e tente novamente.",
      );
    const paths: string[] = [];
    for (const [i, item] of evidence.entries()) {
      const path =
        prefix +
        `original-${i + 1}.` +
        { "image/png": "png", "image/jpeg": "jpg", "application/pdf": "pdf" }[
          item.type
        ];
      const { error } = await db.storage
        .from("visit-reports")
        .upload(path, item.bytes, {
          contentType: item.type,
          upsert: false,
          cacheControl: "0",
        });
      if (error)
        throw new HttpError(
          503,
          "Não foi possível arquivar o comprovante. Tente novamente.",
        );
      uploaded.push(path);
      paths.push(path);
    }
    const pdfPath = prefix + "report.pdf";
    const { error: pdfError } = await db.storage
      .from("visit-reports")
      .upload(pdfPath, pdf, {
        contentType: "application/pdf",
        upsert: false,
        cacheControl: "0",
      });
    if (pdfError)
      throw new HttpError(
        503,
        "Não foi possível arquivar o PDF. Tente novamente.",
      );
    uploaded.push(pdfPath);
    const { error: finalError } = await db.rpc("finalize_report", {
      p_actor: user.id,
      p_id: id,
      p_lease: r.lease_token,
      p_pdf: pdfPath,
      p_files: paths,
      p_labels: evidence.map((e) => e.label),
    });
    if (finalError) {
      // A lost acknowledgement must never delete a successfully submitted report.
      const { data: check, error: checkError } = await db
        .from("visit_reports")
        .select("status")
        .eq("id", id)
        .single();
      if (checkError) {
        cleanup = undefined;
        throw new HttpError(
          503,
          "Não foi possível confirmar o envio. Confira o histórico antes de tentar novamente.",
        );
      }
      if (check.status !== "submitted")
        throw new HttpError(
          503,
          "Não foi possível finalizar. Aguarde dois minutos e tente novamente.",
        );
    }
    cleanup = undefined;
    return response({ id, submitted: true });
  } catch (error) {
    if (cleanup) await cleanup().catch(() => {});
    return handleError(error);
  }
});
