import { useState } from "react";
import type {
  Cell,
  Institution,
  Membership,
  Profile,
  Role,
} from "../../shared/report";
import { todayBR } from "../../shared/report";
import { admin } from "../lib/api";
import { Icon } from "./Icon";
type Props = {
  profile: Profile;
  profiles: Profile[];
  cells: Cell[];
  institutions: Institution[];
  memberships: Membership[];
  onRefresh: () => Promise<void>;
};
const roleNames: Record<Role, string> = {
  communications: "Equipe de Comunicação e Eventos",
  admin: "Administrador",
  director: "Diretor",
  coordinator: "Coordenador",
  volunteer: "Voluntário individual",
};
export function Registry(props: Props) {
  const { profile, profiles, cells, institutions, memberships, onRefresh } = props;
  const [kind, setKind] = useState<"people" | "cells" | "institutions">("people");
  const [edit, setEdit] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [action, setAction] = useState<{
    kind: "reset-login" | "delete-account" | "replace-coordinator";
    id: string;
  } | null>(null);
  const [successor, setSuccessor] = useState("");
  const [busy, setBusy] = useState(false);
  const targets = profiles.filter(
    (p) =>
      !p.deleted_at &&
      p.role !== "admin" &&
      p.id !== profile.id &&
      (profile.role !== "coordinator" ||
        (p.role === "volunteer" && p.manager_id === profile.id)),
  );
  const canEdit = (p: Profile) =>
    profile.role === "admin" ||
    (profile.role === "director" &&
      p.role === "coordinator" &&
      p.manager_id === profile.id) ||
    (profile.role === "coordinator" &&
      p.role === "volunteer" &&
      p.manager_id === profile.id);
  const canReplace = (p: Profile) =>
    p.role === "coordinator" &&
    p.active &&
    (profile.role === "admin" ||
      (profile.role === "director" && p.manager_id === profile.id));
  async function perform() {
    if (!action) return;
    setBusy(true);
    setError("");
    try {
      const result = await admin({
        action: action.kind,
        id: action.id,
        successor_id: successor,
      });
      setAction(null);
      setNotice(
        result.email_sent === false
          ? "O e-mail não pôde ser enviado. Confira o serviço de e-mail."
          : action.kind === "reset-login"
            ? "Novo código de acesso enviado."
            : action.kind === "delete-account"
              ? "Acesso excluído. Os registros históricos foram preservados."
              : "Coordenação transferida. A equipe e o histórico foram preservados.",
      );
      await onRefresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <a
        className="text-button"
        href={profile.role === "coordinator" ? "#/" : "#/admin"}
      >
        ← Voltar
      </a>
      <div className="eyebrow">TODOS SOMOS VOLUNTÁRIOS</div>
      <h1>
        {profile.role === "coordinator" ? "Minha equipe" : "Pessoas e células"}
      </h1>
      <p className="intro">
        Cada pessoa tem seu lugar. Organize os responsáveis e suas equipes.
      </p>
      <div className="segmented">
        <button
          aria-pressed={kind === "people"}
          onClick={() => {
            setKind("people");
            setEdit(null);
          }}
        >
          Pessoas
        </button>
        {profile.role === "admin" && (
          <>
            <button
              aria-pressed={kind === "cells"}
              onClick={() => {
                setKind("cells");
                setEdit(null);
              }}
            >
              Células
            </button>
            <button
              aria-pressed={kind === "institutions"}
              onClick={() => {
                setKind("institutions");
                setEdit(null);
              }}
            >
              Instituições
            </button>
          </>
        )}
      </div>
      {notice && (
        <p className="notice" role="status">
          {notice}
        </p>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {action && (
        <section className="card confirmation" aria-labelledby="action-title">
          <h2 id="action-title">
            {action.kind === "delete-account"
              ? "Excluir o acesso?"
              : action.kind === "reset-login"
                ? "Enviar novo acesso?"
                : "Substituir coordenador"}
          </h2>
          <p>
            <strong>{profiles.find((p) => p.id === action.id)?.display_name}</strong>
          </p>
          {action.kind === "delete-account" ? (
            <p>
              A pessoa perderá o acesso. Os relatórios e registros de presença serão
              preservados. Responsáveis precisam ter a equipe reatribuída primeiro.
            </p>
          ) : action.kind === "reset-login" ? (
            <p>
              Um novo código será enviado ao e-mail cadastrado. Não é necessário
              criar ou compartilhar uma senha.
            </p>
          ) : (
            <>
              <p>
                O voluntário escolhido assume a coordenação e toda a equipe. O
                coordenador atual passa a ser voluntário dessa equipe.
              </p>
              <label>
                Novo coordenador
                <select
                  value={successor}
                  onChange={(e) => setSuccessor(e.target.value)}
                >
                  <option value="">Selecione um voluntário da equipe</option>
                  {profiles
                    .filter(
                      (p) =>
                        p.active &&
                        !p.deleted_at &&
                        p.role === "volunteer" &&
                        p.manager_id === action.id,
                    )
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.display_name}
                      </option>
                    ))}
                </select>
              </label>
            </>
          )}
          <div className="form-actions">
            <button
              className="secondary"
              disabled={busy}
              onClick={() => {
                setAction(null);
                setError("");
              }}
            >
              Cancelar
            </button>
            <button
              className="primary"
              disabled={
                busy || (action.kind === "replace-coordinator" && !successor)
              }
              onClick={() => void perform()}
            >
              {busy ? "Processando…" : "Confirmar"}
            </button>
          </div>
        </section>
      )}
      {edit !== null ? (
        <RegistryEditor
          key={kind + edit}
          {...props}
          kind={kind}
          id={edit === "new" ? undefined : edit}
          onCancel={() => setEdit(null)}
          onSaved={async (message) => {
            setNotice(message);
            setEdit(null);
            await onRefresh();
          }}
        />
      ) : (
        <>
          <button
            className="primary compact"
            onClick={() => {
              setEdit("new");
              setNotice("");
              setAction(null);
            }}
          >
            +{" "}
            {kind === "people"
              ? profile.role === "coordinator"
                ? "Cadastrar voluntário"
                : "Cadastrar pessoa"
              : kind === "cells"
                ? "Cadastrar célula"
                : "Cadastrar instituição"}
          </button>
          <div className="card">
            {kind === "people" ? (
              targets.length ? (
                targets.map((p) => (
                  <div className="registry-row" key={p.id}>
                    <span className="list-icon">
                      <Icon name="users" />
                    </span>
                    <div>
                      <strong>{p.display_name}</strong>
                      <small>
                        {p.clown_name && p.clown_name + " · "}
                        {roleNames[p.role]}
                      </small>
                      <small>
                        {p.email} · {p.active ? "Ativo" : "Desativado"}
                      </small>
                      <small>
                        {
                          cells.find((c) =>
                            memberships.some(
                              (m) =>
                                m.profile_id === p.id &&
                                m.cell_id === c.id &&
                                m.is_default &&
                                m.active,
                            ),
                          )?.name
                        }
                        {p.manager_id
                          ? " · Responsável: " +
                            (profiles.find((v) => v.id === p.manager_id)
                              ?.display_name || "Vinculado")
                          : ""}
                      </small>
                      <div className="row wrap">
                        {canEdit(p) && (
                          <button
                            className="secondary"
                            onClick={() => {
                              setEdit(p.id);
                              setAction(null);
                            }}
                          >
                            Editar
                          </button>
                        )}
                        {p.active &&
                          (profile.role === "admin" ||
                            (profile.role === "coordinator" && canEdit(p))) && (
                            <button
                              className="text-button"
                              onClick={() =>
                                setAction({ kind: "reset-login", id: p.id })
                              }
                            >
                              Reenviar acesso
                            </button>
                          )}
                        {canReplace(p) && (
                          <button
                            className="text-button"
                            onClick={() => {
                              setSuccessor("");
                              setAction({
                                kind: "replace-coordinator",
                                id: p.id,
                              });
                            }}
                          >
                            Substituir coordenador
                          </button>
                        )}
                        {profile.role === "admin" && (
                          <button
                            className="text-button"
                            onClick={() =>
                              setAction({ kind: "delete-account", id: p.id })
                            }
                          >
                            Excluir acesso
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p>Nenhuma pessoa cadastrada nesta equipe.</p>
              )
            ) : kind === "cells" ? (
              cells.length ? (
                cells.map((c) => (
                  <div className="registry-row" key={c.id}>
                    <div>
                      <strong>{c.name}</strong>
                      <small>
                        {institutions.find((i) => i.id === c.institution_id)?.name} ·{" "}
                        {c.active ? "Ativa" : "Desativada"}
                      </small>
                    </div>
                    <button className="secondary" onClick={() => setEdit(c.id)}>
                      Editar
                    </button>
                  </div>
                ))
              ) : (
                <p>A lista oficial de células ainda não foi cadastrada.</p>
              )
            ) : institutions.length ? (
              institutions.map((i) => (
                <div className="registry-row" key={i.id}>
                  <div>
                    <strong>{i.name}</strong>
                    <small>{i.active ? "Ativa" : "Desativada"}</small>
                  </div>
                  <button className="secondary" onClick={() => setEdit(i.id)}>
                    Editar
                  </button>
                </div>
              ))
            ) : (
              <p>Nenhuma instituição cadastrada.</p>
            )}
          </div>
        </>
      )}
    </>
  );
}
function RegistryEditor({
  kind,
  id,
  profile,
  profiles,
  cells,
  institutions,
  memberships,
  onCancel,
  onSaved,
}: {
  kind: "people" | "cells" | "institutions";
  id?: string;
  onCancel: () => void;
  onSaved: (message: string) => Promise<void>;
} & Props) {
  const person = profiles.find((p) => p.id === id);
  const cell = cells.find((c) => c.id === id);
  const inst = institutions.find((i) => i.id === id);
  const [name, setName] = useState(
    kind === "people"
      ? person?.display_name || ""
      : kind === "cells"
        ? cell?.name || ""
        : inst?.name || "",
  );
  const [email, setEmail] = useState(person?.email || "");
  const [clown, setClown] = useState(person?.clown_name || "");
  const [phone, setPhone] = useState(person?.phone || "");
  const [role, setRole] = useState<Role>(
    person?.role || (profile.role === "coordinator" ? "volunteer" : "coordinator"),
  );
  const [manager, setManager] = useState(
    person?.manager_id || (profile.role === "admin" ? "" : profile.id),
  );
  const [active, setActive] = useState(
    kind === "people"
      ? (person?.active ?? true)
      : kind === "cells"
        ? (cell?.active ?? true)
        : (inst?.active ?? true),
  );
  const [cellId, setCellId] = useState(
    memberships.find((m) => m.profile_id === id && m.active && m.is_default)
      ?.cell_id ||
      cells.find((c) => c.active)?.id ||
      "",
  );
  const [institutionId, setInstitutionId] = useState(
    cell?.institution_id || institutions.find((i) => i.active)?.id || "",
  );
  const [start, setStart] = useState(
    cell?.reporting_start.slice(0, 7) || todayBR().slice(0, 7),
  );
  const [end, setEnd] = useState(cell?.reporting_end?.slice(0, 7) || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit() {
    setBusy(true);
    setError("");
    try {
      let payload: Record<string, unknown>;
      if (kind === "people") {
        let digits = phone.replace(/\D/g, "");
        if (digits.length === 10 || digits.length === 11) digits = "55" + digits;
        payload = {
          action: "save-profile",
          id,
          display_name: name,
          email,
          clown_name: clown,
          phone: digits ? "+" + digits : "",
          role,
          active,
          cell_id: cellId,
          manager_id: ["director", "communications"].includes(role) ? null : manager,
        };
      } else if (kind === "cells")
        payload = {
          action: "save-cell",
          id,
          name,
          institution_id: institutionId,
          active,
          reporting_start: start + "-01",
          reporting_end: end ? end + "-01" : null,
          expected_visits: 1,
        };
      else payload = { action: "save-institution", id, name, active };
      const result = await admin(payload);
      await onSaved(
        result.email_sent === false
          ? "Cadastro salvo. O e-mail de acesso não pôde ser enviado; confira a configuração de e-mail."
          : result.email_sent === true
            ? "Cadastro concluído. E-mail de acesso enviado."
            : "Cadastro atualizado com sucesso.",
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form
      className="card form-card"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <h2>{id ? "Editar cadastro" : "Novo cadastro"}</h2>
      <label>
        {kind === "people" ? "Nome completo" : "Nome"}
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          minLength={2}
          maxLength={kind === "institutions" ? 160 : 100}
          required
        />
      </label>
      {kind === "people" && (
        <>
          <label>
            E-mail
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={Boolean(id)}
              maxLength={254}
            />
          </label>
          <p className="small muted">
            O acesso será enviado ao e-mail cadastrado. A pessoa entra com um código,
            sem precisar memorizar senha.
          </p>
          {profile.role === "admin" && (
            <label>
              Perfil
              <select
                value={role}
                onChange={(e) => {
                  setRole(e.target.value as Role);
                  setManager("");
                }}
              >
                <option value="communications">Comunicação e Eventos</option>
                <option value="director">Diretor</option>
                <option value="coordinator">Coordenador</option>
                <option value="volunteer">Voluntário individual</option>
              </select>
            </label>
          )}
          <label>
            Nome de palhaço
            <input
              value={clown}
              required={["volunteer", "coordinator"].includes(role)}
              maxLength={100}
              onChange={(e) => setClown(e.target.value)}
            />
          </label>
          <label>
            Celular (com DDD)
            <input
              type="tel"
              value={phone}
              required={["volunteer", "coordinator"].includes(role)}
              maxLength={24}
              placeholder="(11) 99999-9999"
              onChange={(e) => setPhone(e.target.value)}
            />
          </label>
          {["volunteer", "coordinator"].includes(role) && (
            <label>
              {role === "coordinator"
                ? "Diretor responsável"
                : "Coordenador responsável"}
              <select
                value={manager}
                required
                disabled={profile.role !== "admin"}
                onChange={(e) => setManager(e.target.value)}
              >
                <option value="">Selecione o responsável</option>
                {profiles
                  .filter(
                    (p) =>
                      p.active &&
                      !p.deleted_at &&
                      p.role ===
                        (role === "coordinator" ? "director" : "coordinator") &&
                      p.id !== id,
                  )
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.display_name}
                    </option>
                  ))}
              </select>
            </label>
          )}
          {role === "coordinator" && (
            <label>
              Célula padrão
              <select
                value={cellId}
                required
                onChange={(e) => setCellId(e.target.value)}
              >
                <option value="" disabled>
                  Selecione uma célula
                </option>
                {cells
                  .filter((c) => c.active)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </label>
          )}
          {role === "volunteer" && (
            <p className="notice">
              A célula será a mesma do coordenador responsável.
            </p>
          )}
        </>
      )}
      {kind === "cells" && (
        <>
          <label>
            Instituição
            <select
              value={institutionId}
              required
              onChange={(e) => setInstitutionId(e.target.value)}
            >
              <option value="" disabled>
                Selecione uma instituição
              </option>
              {institutions
                .filter((i) => i.active || i.id === institutionId)
                .map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name}
                  </option>
                ))}
            </select>
          </label>
          <div className="two-columns">
            <label>
              Primeiro mês de relatórios
              <input
                type="month"
                required
                value={start}
                onChange={(e) => setStart(e.target.value)}
              />
            </label>
            <label>
              Último mês <span className="optional">se houver</span>
              <input
                type="month"
                min={start}
                value={end}
                onChange={(e) => setEnd(e.target.value)}
              />
            </label>
          </div>
          <p className="notice">
            Uma visita esperada por mês. O coordenador informa a data efetiva e a
            presença da equipe após cada visita.
          </p>
        </>
      )}
      <label className="check-label">
        <input
          type="checkbox"
          checked={active}
          onChange={(e) => {
            setActive(e.target.checked);
            if (kind === "cells" && !e.target.checked && !end)
              setEnd(todayBR().slice(0, 7));
          }}
        />
        {kind === "people" ? "Acesso ativo" : "Cadastro ativo"}
      </label>
      {!active && (
        <p className="small warning-text">
          O histórico será preservado. Para desativar um responsável, reatribua a
          equipe primeiro.
        </p>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <div className="form-actions">
        <button
          type="button"
          className="secondary"
          disabled={busy}
          onClick={onCancel}
        >
          Cancelar
        </button>
        <button className="primary" disabled={busy}>
          {busy
            ? "Salvando…"
            : !id && kind === "people"
              ? "Cadastrar e enviar acesso"
              : "Salvar cadastro"}
        </button>
      </div>
    </form>
  );
}
