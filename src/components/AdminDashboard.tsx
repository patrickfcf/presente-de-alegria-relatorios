import { useEffect, useState } from "react";
import type { Cell, Period, Profile, Report, Membership } from "../../shared/report";
import { attendanceTotal, monthLabel, todayBR } from "../../shared/report";
import { admin, rows, reportBlob, downloadBlob } from "../lib/api";
import { Icon } from "./Icon";
export function AdminDashboard({
  canPublish = false,
  cells,
  reports,
  profiles,
  memberships,
  onView,
  onNavigate,
}: {
  canPublish?: boolean;
  cells: Cell[];
  reports: Report[];
  profiles: Profile[];
  memberships: Membership[];
  onView: (r: Report) => void;
  onNavigate: (path: string) => void;
}) {
  const [month, setMonth] = useState(todayBR().slice(0, 7));
  const [periods, setPeriods] = useState<Period[]>([]);
  const [cellFilter, setCellFilter] = useState("");
  const [person, setPerson] = useState("");
  const [status, setStatus] = useState("all");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    void admin({ action: "ensure-periods", month: month + "-01" })
      .then(() => rows<Period>("report_periods"))
      .then((p) => {
        if (active) setPeriods(p.filter((v) => v.month.startsWith(month)));
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [month]);
  const monthReports = reports.filter((r) => r.visit_date.startsWith(month));
  const eligible = periods.filter(
    (p) =>
      (!cellFilter || p.cell_id === cellFilter) &&
      (!person ||
        memberships.some(
          (m) => m.profile_id === person && m.cell_id === p.cell_id && m.active,
        ) ||
        monthReports.some(
          (r) => r.created_by === person && r.cell_id === p.cell_id,
        )),
  );
  const list = eligible.map((p) => ({
    period: p,
    cell: cells.find((c) => c.id === p.cell_id),
    reports: monthReports.filter((r) => r.cell_id === p.cell_id),
  }));
  const complete = list.filter(
    (row) => row.reports.length >= row.period.expected_count,
  ).length;
  const visible = list.filter(
    (row) =>
      status === "all" ||
      (status === "sent"
        ? row.reports.length >= row.period.expected_count
        : row.reports.length < row.period.expected_count),
  );
  const filteredReports = visible
    .flatMap((r) => r.reports)
    .filter((r) => !person || r.created_by === person);
  const totals = filteredReports.map((r) =>
    attendanceTotal([r.beneficiaries, r.companions, r.local_team]),
  );
  const people = totals.reduce((sum, t) => sum + (t.value || 0), 0);
  const incomplete = totals.some((t) => !t.complete);
  async function downloadAll() {
    setBusy(true);
    setError("");
    try {
      const { zipSync } = await import("fflate");
      const files: Record<string, Uint8Array> = {};
      let total = 0;
      for (const r of filteredReports) {
        const b = await reportBlob(r.pdf_path);
        total += b.size;
        if (total > 100 * 1024 * 1024)
          throw new Error(
            "A seleção ultrapassa 100 MB. Filtre por célula e baixe em partes.",
          );
        files[
          `${r.cell_name.replace(/[^a-zA-Z0-9_-]/g, "_")}-${r.visit_date}-${r.id.slice(0, 8)}.pdf`
        ] = new Uint8Array(await b.arrayBuffer());
      }
      downloadBlob(
        new Blob([zipSync(files, { level: 0 })], { type: "application/zip" }),
        `relatorios-${month}.zip`,
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="eyebrow">ÁREA DA DIRETORIA</div>
      <h1>Visão dos encontros</h1>
      <p className="intro">Acompanhe os envios e o alcance das visitas.</p>
      <div className="admin-nav">
        <button className="secondary" onClick={() => onNavigate("/cadastros")}>
          <Icon name="users" />
          Cadastros
        </button>
        {canPublish && (
          <button className="secondary" onClick={() => onNavigate("/publicacoes")}>
            <Icon name="news" />
            Notícias e eventos
          </button>
        )}
      </div>
      <div className="filters card">
        <label>
          Mês
          <input
            type="month"
            required
            max={todayBR().slice(0, 7)}
            value={month}
            onChange={(e) => {
              if (e.target.value) setMonth(e.target.value);
            }}
          />
        </label>
        <label>
          Célula
          <select value={cellFilter} onChange={(e) => setCellFilter(e.target.value)}>
            <option value="">Todas as células</option>
            {cells.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Coordenador
          <select value={person} onChange={(e) => setPerson(e.target.value)}>
            <option value="">Todos</option>
            {profiles
              .filter((p) => p.role === "coordinator")
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.display_name}
                </option>
              ))}
          </select>
        </label>
        <label>
          Situação
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">Todas</option>
            <option value="sent">Enviado</option>
            <option value="pending">Pendente</option>
          </select>
        </label>
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {loading ? (
        <p role="status">Carregando o período…</p>
      ) : (
        <>
          <div className="stats">
            <div>
              <strong>{list.length}</strong>
              <span>Células</span>
            </div>
            <div>
              <strong>{complete}</strong>
              <span>Em dia</span>
            </div>
            <div>
              <strong>{list.length - complete}</strong>
              <span>Pendentes</span>
            </div>
            <div>
              <strong>{people.toLocaleString("pt-BR")}</strong>
              <span>{incomplete ? "Pessoas informadas*" : "Pessoas atendidas"}</span>
            </div>
          </div>
          <p className="small muted">
            Somatório dos atendimentos informados, sem deduplicar pessoas entre
            visitas.{" "}
            {incomplete ? "* Há relatórios com quantidades incompletas." : ""}
            {filteredReports.some((r) => r.estimates) ? " Inclui estimativas." : ""}
          </p>
          <div className="section-title">
            <h2>{monthLabel(month)}</h2>
            <button
              className="secondary"
              disabled={busy || !filteredReports.length}
              onClick={() => void downloadAll()}
            >
              <Icon name="download" size={18} />
              {busy ? "Preparando ZIP…" : "Baixar PDFs"}
            </button>
          </div>
          {!visible.length ? (
            <div className="empty card">
              <h3>Nenhuma célula neste filtro.</h3>
              <p>
                Cadastre as células e confira o início do período de prestação de
                contas.
              </p>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <caption className="sr-only">Situação mensal por célula</caption>
                <thead>
                  <tr>
                    <th>Célula</th>
                    <th>Envios</th>
                    <th>Situação</th>
                    <th>Atendimentos informados</th>
                    <th>Relatórios</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((row) => {
                    const n = row.reports.reduce(
                      (sum, r) =>
                        sum +
                        (attendanceTotal([
                          r.beneficiaries,
                          r.companions,
                          r.local_team,
                        ]).value || 0),
                      0,
                    );
                    return (
                      <tr key={row.period.id}>
                        <th scope="row">{row.cell?.name || "Célula"}</th>
                        <td>
                          {row.reports.length}/{row.period.expected_count}
                        </td>
                        <td>
                          <span
                            className={
                              "badge " +
                              (row.reports.length >= row.period.expected_count
                                ? "success"
                                : "warning")
                            }
                          >
                            {row.reports.length >= row.period.expected_count
                              ? "Enviado"
                              : "Pendente"}
                          </span>
                        </td>
                        <td>
                          {row.reports.length ? n.toLocaleString("pt-BR") : "—"}
                        </td>
                        <td>
                          {row.reports
                            .filter((r) => !person || r.created_by === person)
                            .map((r) => (
                              <button
                                key={r.id}
                                className="text-button"
                                onClick={() => onView(r)}
                              >
                                {r.visit_date.split("-").reverse().join("/")} ↗
                              </button>
                            ))}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </>
  );
}
