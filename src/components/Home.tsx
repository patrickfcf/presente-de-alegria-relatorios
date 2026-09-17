import type {
  Cell,
  Membership,
  Period,
  Profile,
  Report,
} from "../../shared/report";
import { monthLabel, todayBR } from "../../shared/report";
import { readDraft } from "../lib/draft";
import { Icon } from "./Icon";
export function Home({
  profile,
  cells,
  memberships,
  periods,
  reports,
  onCreate,
  onView,
  onAdmin,
}: {
  profile: Profile;
  cells: Cell[];
  memberships: Membership[];
  periods: Period[];
  reports: Report[];
  onCreate: () => void;
  onView: (r: Report) => void;
  onAdmin: () => void;
}) {
  const ownCells = cells.filter((c) =>
    memberships.some(
      (m) => m.profile_id === profile.id && m.active && m.cell_id === c.id,
    ),
  );
  const mainCell =
    ownCells.find((c) =>
      memberships.some(
        (m) =>
          m.profile_id === profile.id && m.cell_id === c.id && m.is_default,
      ),
    ) || ownCells[0];
  const month = todayBR().slice(0, 7);
  const current = reports.filter((r) => r.visit_date.startsWith(month));
  const expected = periods.filter(
    (p) =>
      p.month.startsWith(month) && ownCells.some((c) => c.id === p.cell_id),
  );
  const complete =
    expected.length > 0 &&
    expected.every(
      (p) =>
        current.filter((r) => r.cell_id === p.cell_id).length >=
        p.expected_count,
    );
  const draft = readDraft(profile.id);
  return (
    <>
      <div className="eyebrow">BOM TER VOCÊ POR AQUI</div>
      <h1>
        Olá, {profile.display_name.split(" ")[0]}{" "}
        <span className="wave" aria-hidden="true">
          ☀
        </span>
      </h1>
      <p className="intro">
        {mainCell ? (
          <>
            Sua presença faz a diferença na célula{" "}
            <strong>{mainCell.name}</strong>.
          </>
        ) : (
          "Vamos levar mais alegria para perto."
        )}
      </p>
      {["admin", "director"].includes(profile.role) && (
        <button className="director-banner" onClick={onAdmin}>
          <span>
            <strong>Área da diretoria</strong>
            <small>Relatórios e equipes</small>
          </span>
          <Icon name="arrow" />
        </button>
      )}
      {(mainCell || profile.role === "coordinator") && (
        <section className={"month-card " + (complete ? "complete" : "")}>
          <div className="row between">
            <div className="eyebrow">SEU RELATÓRIO DO MÊS</div>
            <Icon name="file" size={26} />
          </div>
          <h2>{monthLabel(month)}</h2>
          <span className={"badge " + (complete ? "success" : "warning")}>
            {complete ? "✓ Enviado" : "◷ Pendente"}
          </span>
          <p>
            {complete
              ? "Obrigado por registrar esse encontro! Os relatórios estão no seu histórico."
              : mainCell
                ? "Depois da visita, reserve alguns minutos para registrar o atendimento."
                : "A diretoria ainda precisa vincular uma célula ao seu cadastro."}
          </p>
          {mainCell && (
            <button className="primary" onClick={onCreate}>
              {draft
                ? "Continuar rascunho"
                : complete
                  ? "Registrar outra visita"
                  : "Preencher relatório"}
              <Icon name="arrow" />
            </button>
          )}
        </section>
      )}
      {profile.role === "coordinator" && (
        <a className="director-banner" href="#/cadastros">
          <span>
            <strong>Minha equipe</strong>
            <small>Cadastrar e gerenciar voluntários</small>
          </span>
          <Icon name="users" />
        </a>
      )}
      <div className="section-title">
        <h2>Seus relatórios</h2>
        <span className="small muted">{reports.length} enviado(s)</span>
      </div>
      {!reports.length ? (
        <div className="empty card">
          <Icon name="file" size={34} />
          <h3>Seu primeiro encontro começa aqui.</h3>
          <p>Os relatórios enviados aparecerão neste espaço.</p>
        </div>
      ) : (
        <div className="report-list">
          {reports.map((r) => (
            <button key={r.id} className="report-row" onClick={() => onView(r)}>
              <span className="list-icon">
                <Icon name="file" />
              </span>
              <span>
                <strong>{monthLabel(r.visit_date)}</strong>
                <small>
                  {r.cell_name} · {r.visit_date.split("-").reverse().join("/")}
                </small>
              </span>
              <span className="report-status">
                Enviado <Icon name="arrow" size={17} />
              </span>
            </button>
          ))}
        </div>
      )}
      <div className="gentle-note">
        <Icon name="heart" size={20} />
        <p>Menos papel. Mais tempo para estar presente.</p>
      </div>
    </>
  );
}
