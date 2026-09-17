import { useState } from "react";
import type { News, Event, Campaign } from "../../shared/report";
import {
  categories,
  validateDetails,
  type PublicationDetails,
  type PublicationKind,
} from "../../shared/publications";
import { admin } from "../lib/api";
const localDate = (iso: string) =>
  new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  })
    .format(new Date(iso))
    .replace(" ", "T");
const titles = { news: "Notícias", events: "Eventos", campaigns: "Ajudas" };
type Item = News | Event | Campaign;
export function Publications({
  news,
  events,
  campaigns,
  onRefresh,
}: {
  news: News[];
  events: Event[];
  campaigns: Campaign[];
  onRefresh: () => Promise<void>;
}) {
  const [kind, setKind] = useState<PublicationKind>("news");
  const [edit, setEdit] = useState<Item | "new" | null>(null);
  const [notice, setNotice] = useState("");
  const list = { news, events, campaigns }[kind];
  return (
    <>
      <a className="text-button" href="#/">
        ← Início
      </a>
      <div className="eyebrow">COMUNICAÇÃO E EVENTOS</div>
      <h1>Publicações</h1>
      <p className="intro">
        Notícias, encontros e formas de ajudar, abertos a todas as pessoas.
      </p>
      <div className="segmented">
        {(Object.keys(titles) as PublicationKind[]).map((k) => (
          <button
            key={k}
            aria-pressed={kind === k}
            onClick={() => {
              setKind(k);
              setEdit(null);
              setNotice("");
            }}
          >
            {titles[k]}
          </button>
        ))}
      </div>
      {notice && <p role="status">{notice}</p>}
      {edit ? (
        <Editor
          key={kind + (edit === "new" ? "new" : edit.id)}
          kind={kind}
          item={edit === "new" ? undefined : edit}
          onCancel={() => setEdit(null)}
          onSaved={async () => {
            await onRefresh();
            setEdit(null);
            setNotice("Publicação salva com sucesso.");
          }}
        />
      ) : (
        <>
          <button className="primary compact" onClick={() => setEdit("new")}>
            + Criar publicação
          </button>
          <div className="card">
            {list.length ? (
              list.map((item) => (
                <div className="registry-row" key={item.id}>
                  <div>
                    <strong>{item.title}</strong>
                    <small>
                      {item.status === "draft"
                        ? "Rascunho"
                        : item.status === "archived"
                          ? "Arquivado"
                          : "Publicado"}{" "}
                      ·{" "}
                      {localDate(
                        "starts_at" in item
                          ? item.starts_at
                          : item.published_at,
                      ).replace("T", " ")}
                    </small>
                  </div>
                  <button className="secondary" onClick={() => setEdit(item)}>
                    Editar
                  </button>
                </div>
              ))
            ) : (
              <p>Nenhuma publicação nesta categoria.</p>
            )}
          </div>
        </>
      )}
    </>
  );
}
function Editor({
  kind,
  item,
  onCancel,
  onSaved,
}: {
  kind: PublicationKind;
  item?: Item;
  onCancel: () => void;
  onSaved: () => Promise<void>;
}) {
  const [title, setTitle] = useState(item?.title || "");
  const [text, setText] = useState(
    item ? ("body" in item ? item.body : item.description) : "",
  );
  const [location, setLocation] = useState(
    item && "location" in item ? item.location : "",
  );
  const [date, setDate] = useState(
    localDate(
      item
        ? "starts_at" in item
          ? item.starts_at
          : item.published_at
        : new Date().toISOString(),
    ),
  );
  const [end, setEnd] = useState(
    item && "ends_at" in item && item.ends_at ? localDate(item.ends_at) : "",
  );
  const [status, setStatus] = useState(item?.status || "draft");
  const [details, setDetails] = useState<PublicationDetails>(
    item?.details || { category: categories[kind][0] },
  );
  const [confirmed, setConfirmed] = useState(false);
  const [preview, setPreview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const field = (key: keyof PublicationDetails, value: string) => {
    setDetails((d) => ({ ...d, [key]: value }));
    setConfirmed(false);
  };
  const iso = date + ":00-03:00";
  const payload = {
    title,
    status,
    ...(kind === "events"
      ? {
          description: text,
          location,
          starts_at: iso,
          ends_at: end ? end + ":00-03:00" : null,
        }
      : {
          body: text,
          published_at: iso,
          ...(kind === "campaigns"
            ? { ends_at: end ? end + ":00-03:00" : null }
            : {}),
        }),
  };
  async function save() {
    setBusy(true);
    setError("");
    try {
      const checked = validateDetails(kind, details);
      await admin({
        action:
          kind === "news"
            ? "save-news"
            : kind === "events"
              ? "save-event"
              : "save-campaign",
        id: item?.id,
        ...payload,
        details: checked,
        public_confirmed: confirmed,
      });
      await onSaved();
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
        void save();
      }}
    >
      <h2>
        {item ? "Editar" : "Criar"} · {titles[kind]}
      </h2>
      <p className="notice">
        Ao publicar, qualquer pessoa poderá ler este conteúdo, sem login. Use
        apenas contatos e informações autorizados para divulgação.
      </p>
      <label>
        Título
        <input
          required
          minLength={3}
          maxLength={160}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </label>
      <label>
        Categoria
        <select
          value={details.category || categories[kind][0]}
          onChange={(e) => field("category", e.target.value)}
        >
          {categories[kind].map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </label>
      <label>
        Resumo <span className="optional">opcional</span>
        <textarea
          maxLength={240}
          rows={2}
          value={details.summary || ""}
          onChange={(e) => field("summary", e.target.value)}
        />
      </label>
      <label>
        {kind === "news"
          ? "Texto da notícia"
          : kind === "events"
            ? "Descrição e orientações para participar"
            : "Finalidade e como ajudar"}
        <textarea
          required
          maxLength={4000}
          rows={7}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </label>
      {kind === "campaigns" && (
        <p className="small muted">
          Informe o destino da ajuda e as condições da campanha. Para rifa ou
          bingo, inclua data, local, regras e contato do organizador. Este
          espaço divulga a ação; não vende números nem realiza sorteios.
        </p>
      )}
      {kind === "events" && (
        <label>
          Local ou endereço do encontro
          <input
            required
            minLength={2}
            maxLength={200}
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </label>
      )}
      <label>
        {kind === "events" ? "Início do evento" : "Data e hora da publicação"}
        <input
          required
          type="datetime-local"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </label>
      {kind !== "news" && (
        <label>
          {kind === "events" ? "Fim do evento" : "Prazo da campanha"}{" "}
          <span className="optional">opcional</span>
          <input
            type="datetime-local"
            min={date}
            value={end}
            onChange={(e) => setEnd(e.target.value)}
          />
        </label>
      )}
      <p className="small muted">
        Horários de Brasília. Notícias e Ajudas com publicação futura ficam
        ocultas até a data indicada. Eventos publicados aparecem imediatamente.
      </p>
      <fieldset>
        <legend>
          Contato público <span className="optional">opcional</span>
        </legend>
        <label>
          Nome da equipe ou pessoa
          <input
            maxLength={100}
            value={details.contact_name || ""}
            onChange={(e) => field("contact_name", e.target.value)}
          />
        </label>
        <label>
          Link de contato (https://)
          <input
            type="url"
            placeholder="https://wa.me/55…"
            maxLength={500}
            value={details.contact_url || ""}
            onChange={(e) => field("contact_url", e.target.value)}
          />
        </label>
      </fieldset>
      <fieldset>
        <legend>
          Botão de participação <span className="optional">opcional</span>
        </legend>
        <label>
          Texto do botão
          <input
            placeholder={
              kind === "events" ? "Inscrever-se" : "Saiba como ajudar"
            }
            maxLength={60}
            value={details.action_label || ""}
            onChange={(e) => field("action_label", e.target.value)}
          />
        </label>
        <label>
          Link oficial (https://)
          <input
            type="url"
            maxLength={500}
            value={details.action_url || ""}
            onChange={(e) => field("action_url", e.target.value)}
          />
        </label>
      </fieldset>
      {kind === "campaigns" && (
        <fieldset>
          <legend>
            Pix <span className="optional">opcional</span>
          </legend>
          <p className="small">
            Use a chave oficial autorizada para divulgação, preferencialmente
            aleatória ou CNPJ da ONG.
          </p>
          <label>
            Chave Pix
            <input
              maxLength={140}
              value={details.pix_key || ""}
              onChange={(e) => field("pix_key", e.target.value)}
            />
          </label>
          <label>
            Nome do favorecido no banco
            <input
              maxLength={140}
              value={details.pix_beneficiary || ""}
              onChange={(e) => field("pix_beneficiary", e.target.value)}
            />
          </label>
        </fieldset>
      )}
      <label>
        Situação
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as typeof status);
            setConfirmed(false);
          }}
        >
          <option value="draft">
            Rascunho — só Comunicação e administradores
          </option>
          <option value="published">
            Publicado — visível a qualquer pessoa
          </option>
          <option value="archived">Arquivado — oculto do público</option>
        </select>
      </label>
      <button
        type="button"
        className="secondary"
        aria-expanded={preview}
        onClick={() => setPreview((v) => !v)}
      >
        {preview ? "Fechar prévia" : "Visualizar prévia"}
      </button>
      {preview && (
        <article className="publication-preview">
          <p className="small">Prévia · {details.category}</p>
          <h3>{title || "Título da publicação"}</h3>
          {details.summary && <p>{details.summary}</p>}
          <p>
            {date.replace("T", " ")} · Brasília
            {end ? " · Até " + end.replace("T", " ") : ""}
          </p>
          {location && kind === "events" && <p>{location}</p>}
          <p className="preserve-lines">{text}</p>
          {details.contact_name && <p>Contato: {details.contact_name}</p>}
          {details.action_label && <p>Botão: {details.action_label}</p>}
          {details.pix_key && (
            <p>
              Pix: {details.pix_key} · Favorecido: {details.pix_beneficiary}
            </p>
          )}
        </article>
      )}
      {status === "published" && (
        <label className="check-label">
          <input
            type="checkbox"
            required
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
          />
          Revisei o conteúdo, os contatos e os dados de participação e autorizo
          sua divulgação pública.
        </label>
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
            : status === "published"
              ? "Salvar publicação pública"
              : "Salvar"}
        </button>
      </div>
    </form>
  );
}
