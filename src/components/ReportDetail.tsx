import { useState } from "react";
import type { Attendance, Report } from "../../shared/report";
import { attendanceTotal, formatCpf, DECLARATION } from "../../shared/report";
import { downloadFile } from "../lib/api";
import { Icon } from "./Icon";
export function ReportDetail({
  report: r,
  attendance = [],
  success,
  onClose,
}: {
  report: Report;
  attendance?: Attendance[];
  success?: boolean;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const total = attendanceTotal([r.beneficiaries, r.companions, r.local_team]);
  async function download(path: string, name: string) {
    setBusy(true);
    setError("");
    try {
      await downloadFile(path, name);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <button className="text-button" onClick={onClose}>
        ← Voltar
      </button>
      {success && (
        <div className="success-panel" role="status">
          <div className="round-icon green">
            <Icon name="check" size={32} />
          </div>
          <h1>
            Relatório enviado
            <br />
            com sucesso!
          </h1>
          <p>
            O documento foi arquivado e já está disponível para a liderança de
            segmento.
          </p>
        </div>
      )}
      <div className="card">
        <div className="row between">
          <span className="badge success">✓ Enviado</span>
          <span className="small muted">
            {r.visit_date.split("-").reverse().join("/")}
          </span>
        </div>
        <h2>{r.institution_name}</h2>
        <p>
          {r.cell_name} · {r.start_time.slice(0, 5)} às {r.end_time.slice(0, 5)}
        </p>
        <dl className="review">
          <dt>Profissional da instituição</dt>
          <dd>{r.professional_name}</dd>
          <dt>Função / Cargo</dt>
          <dd>{r.professional_role || "Não informado"}</dd>
          <dt>CPF do profissional</dt>
          <dd>
            {r.professional_cpf ? formatCpf(r.professional_cpf) : "Não informado"}
          </dd>
          <dt>Assistidos</dt>
          <dd>{r.beneficiaries ?? "Não informado"}</dd>
          <dt>Acompanhantes</dt>
          <dd>{r.companions ?? "Não informado"}</dd>
          <dt>Equipe do local</dt>
          <dd>{r.local_team ?? "Não informado"}</dd>
          <dt>{total.complete ? "Total de pessoas" : "Subtotal informado"}</dt>
          <dd>
            {total.value ?? "Não informado"}
            {r.estimates ? " (estimativa)" : ""}
          </dd>
          <dt>Enviado por</dt>
          <dd>{r.coordinator_name}</dd>
          <dt>Envio</dt>
          <dd>
            {new Date(r.submitted_at).toLocaleString("pt-BR", {
              timeZone: "America/Sao_Paulo",
            })}
          </dd>
        </dl>
        <h3 className="spaced">Chamada da equipe</h3>
        {attendance
          .filter((a) => a.report_id === r.id)
          .map((a) => (
            <p key={a.volunteer_id}>
              <strong>{a.volunteer_name}</strong> ·{" "}
              {a.status === "present"
                ? "Presente"
                : a.justified
                  ? "Falta justificada"
                  : "Falta sem justificativa válida"}
            </p>
          ))}
        <p className="declaration">{DECLARATION}</p>
        <button
          className="primary"
          disabled={busy}
          onClick={() =>
            void download(
              r.pdf_path,
              `relatorio-${r.visit_date}-${r.id.slice(0, 8)}.pdf`,
            )
          }
        >
          <Icon name="download" />
          {busy ? "Preparando…" : "Baixar relatório PDF"}
        </button>
        <h3 className="spaced">
          {r.signature_method === "canvas"
            ? "Assinatura original"
            : "Documentos originais assinados"}
        </h3>
        {r.file_paths.map((path, i) => (
          <button
            key={path}
            disabled={busy}
            className="file-link"
            onClick={() =>
              void download(
                path,
                `comprovante-${r.id.slice(0, 8)}-${i + 1}.${path.split(".").pop()}`,
              )
            }
          >
            <Icon name="file" />
            {r.file_labels[i] || `Comprovante ${i + 1}`}
            <Icon name="download" size={18} />
          </button>
        ))}
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <p className="small muted">Protocolo: {r.id}</p>
      </div>
    </>
  );
}
