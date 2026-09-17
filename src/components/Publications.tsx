import { useState } from "react";
import type { News, Event } from "../../shared/report";
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
export function Publications({
  news,
  events,
  onRefresh,
}: {
  news: News[];
  events: Event[];
  onRefresh: () => Promise<void>;
}) {
  const [kind, setKind] = useState<"news" | "events">("news");
  const [edit, setEdit] = useState<News | Event | "new" | null>(null);
  const [notice, setNotice] = useState("");
  const list = kind === "news" ? news : events;
  return (
    <>
      <a className="text-button" href="#/">
        ← Início
      </a>
      <div className="eyebrow">EQUIPE DE COMUNICAÇÃO E EVENTOS</div>
      <h1>Notícias e eventos</h1>
      <p className="intro">Publique os recados e encontros da ONG.</p>
      <div className="segmented">
        <button
          aria-pressed={kind === "news"}
          onClick={() => {
            setKind("news");
            setEdit(null);
          }}
        >
          Notícias
        </button>
        <button
          aria-pressed={kind === "events"}
          onClick={() => {
            setKind("events");
            setEdit(null);
          }}
        >
          Eventos
        </button>
      </div>
      {notice && (
        <p role="status" className="success-text">
          {notice}
        </p>
      )}
      {edit ? (
        <Editor
          kind={kind}
          item={edit === "new" ? undefined : edit}
          onCancel={() => setEdit(null)}
          onSaved={async () => {
            setEdit(null);
            setNotice("Publicação salva com sucesso.");
            await onRefresh();
          }}
        />
      ) : (
        <>
          <button className="primary compact" onClick={() => setEdit("new")}>
            + {kind === "news" ? "Criar notícia" : "Criar evento"}
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
                        "published_at" in item
                          ? item.published_at
                          : item.starts_at,
                      ).replace("T", " ")}
                    </small>
                  </div>
                  <button className="secondary" onClick={() => setEdit(item)}>
                    Editar
                  </button>
                </div>
              ))
            ) : (
              <p>Nenhuma publicação. Crie a primeira para os voluntários.</p>
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
  kind: "news" | "events";
  item?: News | Event;
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
    item
      ? localDate("published_at" in item ? item.published_at : item.starts_at)
      : localDate(new Date().toISOString()),
  );
  const [end, setEnd] = useState(
    item && "ends_at" in item && item.ends_at ? localDate(item.ends_at) : "",
  );
  const [status, setStatus] = useState(item?.status || "draft");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function save() {
    setBusy(true);
    setError("");
    try {
      await admin({
        action: kind === "news" ? "save-news" : "save-event",
        id: item?.id,
        title,
        status,
        ...(kind === "news"
          ? { body: text, published_at: date + ":00-03:00" }
          : {
              description: text,
              location,
              starts_at: date + ":00-03:00",
              ends_at: end ? end + ":00-03:00" : null,
            }),
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
        {item ? "Editar" : "Criar"} {kind === "news" ? "notícia" : "evento"}
      </h2>
      <label>
        Título
        <input
          value={title}
          required
          minLength={3}
          maxLength={160}
          onChange={(e) => setTitle(e.target.value)}
        />
      </label>
      <label>
        {kind === "news" ? "Notícia" : "Descrição"}
        <textarea
          value={text}
          required
          maxLength={4000}
          rows={7}
          onChange={(e) => setText(e.target.value)}
        />
      </label>
      {kind === "events" && (
        <label>
          Local
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
        {kind === "news" ? "Data e hora da publicação" : "Início do evento"}
        <input
          type="datetime-local"
          required
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </label>
      {kind === "events" && (
        <label>
          Fim do evento <span className="optional">opcional</span>
          <input
            type="datetime-local"
            min={date}
            value={end}
            onChange={(e) => setEnd(e.target.value)}
          />
        </label>
      )}
      <p className="small muted">
        Horários de Brasília. Notícias com data futura ficam visíveis a partir
        dessa data.
      </p>
      <label>
        Situação
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as typeof status)}
        >
          <option value="draft">
            Rascunho — só Comunicação e administradores
          </option>
          <option value="published">
            Publicado — disponível aos voluntários
          </option>
          <option value="archived">
            Arquivado — oculto do público interno
          </option>
        </select>
      </label>
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
          {busy ? "Salvando…" : "Salvar publicação"}
        </button>
      </div>
    </form>
  );
}
