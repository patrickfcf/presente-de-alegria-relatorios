import { useState } from "react";
import type { Campaign, Event, News } from "../../shared/report";
import { todayBR } from "../../shared/report";
import {
  safePublicUrl,
  categories,
  type PublicationDetails,
} from "../../shared/publications";
import { SharePage } from "./SharePage";
import { Icon } from "./Icon";
const fmt = (date: string, options: Intl.DateTimeFormatOptions) =>
  new Date(date).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    ...options,
  });
const monthBR = (date: string) => new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Sao_Paulo" }).format(new Date(date)).slice(0, 7);
const searchable = (value: string) => value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase("pt-BR");
function FeedFilters({ kind, search, setSearch, category, setCategory, month, setMonth, order, setOrder }: {
  kind: "news" | "events"; search: string; setSearch: (v: string) => void;
  category: string; setCategory: (v: string) => void; month: string; setMonth: (v: string) => void;
  order: string; setOrder: (v: string) => void;
}) {
  return <section aria-label="Filtros de publicações" className="feed-filters">
    <div className="filters">
      <label>Buscar<input type="search" value={search} placeholder={kind === "events" ? "Título ou local" : "Título ou texto"} onChange={e => setSearch(e.target.value)} /></label>
      <label>Categoria<select value={category} onChange={e => setCategory(e.target.value)}><option value="">Todas</option>{categories[kind].map(c => <option key={c}>{c}</option>)}</select></label>
      <label>{kind === "events" ? "Mês do evento" : "Mês da publicação"}<input type="month" value={month} onChange={e => setMonth(e.target.value)} /></label>
      <label>Ordenar por<select value={order} onChange={e => setOrder(e.target.value)}><option value="recent">Publicações mais recentes</option><option value="oldest">Publicações mais antigas</option>{kind === "events" && <><option value="upcoming">Data do evento: próximos primeiro</option><option value="latest">Data do evento: mais recentes primeiro</option></>}</select></label>
    </div>
    <button className="text-button" onClick={() => {setSearch(""); setCategory(""); setMonth(""); setOrder("recent");}}>Limpar filtros</button>
  </section>;
}
export function NewsFeed({ news }: { news: News[] }) {
  const [open, setOpen] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [month, setMonth] = useState("");
  const [order, setOrder] = useState("recent");
  const items = news
    .filter(
      (n) => n.status === "published" && new Date(n.published_at) <= new Date()
      && (!category || (n.details?.category || "Comunicado") === category)
      && (!month || monthBR(n.published_at) === month)
      && searchable(n.title + " " + n.body + " " + (n.details?.summary || "")).includes(searchable(search.trim())),
    )
    .sort((a, b) => (order === "oldest" ? 1 : -1) * (Date.parse(a.published_at) - Date.parse(b.published_at)) || a.id.localeCompare(b.id));
  return (
    <>
      <div className="eyebrow">NOSSA ALEGRIA EM MOVIMENTO</div>
      <h1>Notícias</h1>
      <SharePage path="/noticias" title="Notícias do Presente de Alegria" />
      <p className="intro">
        Novidades e recados para quem faz parte dessa história.
      </p>
      <FeedFilters kind="news" {...{search, setSearch, category, setCategory, month, setMonth, order, setOrder}} />
      <p role="status" className="small muted">{items.length} notícia(s)</p>
      {items.length ? (
        items.map((n) => (
          <article key={n.id} className="card news-card">
            <div className="news-date">
              <Icon name="news" size={18} />
              {fmt(n.published_at, {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </div>
            <span className="publication-tag">
              {n.details?.category || "Comunicado"}
            </span>
            <h2>{n.title}</h2>
            {n.details?.summary && <p className="intro">{n.details.summary}</p>}
            <p className={"preserve-lines " + (open === n.id ? "" : "clamp")}>
              {n.body}
            </p>
            <button
              className="text-button"
              aria-expanded={open === n.id}
              onClick={() => setOpen(open === n.id ? null : n.id)}
            >
              {open === n.id ? "Recolher" : "Ler comunicado"}
              <Icon name="arrow" size={18} />
            </button>
            <PublicationLinks details={n.details} />
          </article>
        ))
      ) : (
        <div className="empty card">
          <Icon name="news" size={38} />
          <h2>{search || category || month ? "Nenhuma notícia encontrada." : "As novidades chegam por aqui."}</h2>
          <p>
            {search || category || month ? "Tente outros filtros ou limpe a busca." : "Quando a equipe de comunicação publicar um comunicado, você poderá acompanhar nesta página."}
          </p>
        </div>
      )}
    </>
  );
}
export function EventsFeed({
  events,
  calendar = false,
}: {
  events: Event[];
  calendar?: boolean;
}) {
  const [past, setPast] = useState(false);
  const [month, setMonth] = useState(calendar ? todayBR().slice(0, 7) : "");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [order, setOrder] = useState(calendar ? "upcoming" : "recent");
  const items = events.filter(e => e.status === "published"
    && (calendar || past || new Date(e.ends_at || e.starts_at) >= new Date())
    && (!month || monthBR(e.starts_at) === month)
    && (!category || (e.details?.category || "Encontro") === category)
    && searchable(e.title + " " + e.location + " " + e.description).includes(searchable(search.trim())))
    .sort((a, b) => {
      const difference = order === "upcoming" || order === "latest"
        ? Date.parse(a.starts_at) - Date.parse(b.starts_at)
        : Date.parse(a.published_at || a.starts_at) - Date.parse(b.published_at || b.starts_at);
      return (order === "oldest" || order === "upcoming" ? 1 : -1) * difference
        || Date.parse(a.starts_at) - Date.parse(b.starts_at) || a.id.localeCompare(b.id);
    });
  return (
    <>
      <div className="eyebrow">ENCONTROS QUE APROXIMAM</div>
      <h1>{calendar ? "Calendário" : "Eventos"}</h1>
      <SharePage path="/eventos" title="Eventos do Presente de Alegria" />
      <p className="intro">Veja o que vem por aí e faça parte.</p>
      <p>
        <a
          className="text-button"
          href={calendar ? "/eventos" : "/#/calendario"}
        >
          {calendar ? "Ver próximos eventos" : "Ver calendário mensal"}
        </a>
      </p>
      <FeedFilters kind="events" {...{search, setSearch, category, setCategory, month, setMonth, order, setOrder}} />
      <p role="status" className="small muted">{items.length} evento(s)</p>
      <label hidden={calendar} className="check-label">
        <input
          type="checkbox"
          checked={past}
          onChange={(e) => setPast(e.target.checked)}
        />
        Mostrar também eventos anteriores
      </label>
      {items.length ? (
        items.map((e) => (
          <article className="card event-card" key={e.id}>
            <span className="publication-tag">
              {e.details?.category || "Encontro"}
            </span>
            <div className="event-top">
              <div className="date-tile">
                <strong>{fmt(e.starts_at, { day: "2-digit" })}</strong>
                <span>{fmt(e.starts_at, { month: "short" })}</span>
              </div>
              <div>
                <span className="small muted">
                  {fmt(e.starts_at, { weekday: "long", year: "numeric" })}
                </span>
                <h2>{e.title}</h2>
              </div>
            </div>
            <p className="event-meta">
              <Icon name="clock" size={18} />
              {fmt(e.starts_at, { hour: "2-digit", minute: "2-digit" })}
              {e.ends_at
                ? " – " +
                  fmt(e.ends_at, {
                    day: "2-digit",
                    month: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : ""}{" "}
              · Brasília
            </p>
            <p className="event-meta">
              <Icon name="pin" size={18} />
              {e.location}
            </p>
            {e.details?.summary && <p className="intro">{e.details.summary}</p>}
            <p className="preserve-lines">{e.description}</p>
            <PublicationLinks details={e.details} />
          </article>
        ))
      ) : (
        <div className="empty card">
          <Icon name="calendar" size={38} />
          <h2>{search || category || month ? "Nenhum evento encontrado." : "Novos encontros em breve."}</h2>
          <p>
            {search || category || month ? "Tente outros filtros ou limpe a busca." : "A equipe de comunicação publicará aqui as datas, os horários e os locais dos próximos eventos."}
          </p>
        </div>
      )}
    </>
  );
}

export function PublicationLinks({
  details,
  disabled = false,
}: {
  details?: PublicationDetails;
  disabled?: boolean;
}) {
  if (!details || disabled) return null;
  return (
    <div className="publication-links">
      {details.contact_name &&
        details.contact_url &&
        safePublicUrl(details.contact_url) && (
          <a
            className="secondary"
            href={details.contact_url}
            target="_blank"
            rel="noopener noreferrer"
          >
            Falar com {details.contact_name} ↗
          </a>
        )}
      {details.action_url && safePublicUrl(details.action_url) && (
        <a
          className="primary"
          href={details.action_url}
          target="_blank"
          rel="noopener noreferrer"
        >
          {details.action_label || "Saiba mais"} ↗
        </a>
      )}
    </div>
  );
}
function Pix({ details }: { details: PublicationDetails }) {
  const [notice, setNotice] = useState("");
  return (
    <div className="pix-box">
      <h3>Ajude via Pix</h3>
      <p>
        Favorecido: <strong>{details.pix_beneficiary}</strong>
      </p>
      <label>
        Chave Pix
        <input
          readOnly
          value={details.pix_key}
          onFocus={(e) => e.target.select()}
        />
      </label>
      <button
        className="secondary"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(details.pix_key!);
            setNotice("Chave copiada.");
          } catch {
            setNotice("Selecione e copie a chave acima.");
          }
        }}
      >
        Copiar chave Pix
      </button>
      <p className="small">
        Confira o nome do favorecido no seu banco antes de confirmar. O
        aplicativo não processa nem confirma pagamentos.
      </p>
      <p role="status">{notice}</p>
    </div>
  );
}
export function CampaignsFeed({ campaigns }: { campaigns: Campaign[] }) {
  const [now] = useState(() => Date.now());
  const [category, setCategory] = useState("Todas");
  const [ended, setEnded] = useState(false);
  const items = campaigns
    .filter(
      (c) =>
        c.status === "published" &&
        Date.parse(c.published_at) <= now &&
        (ended || !c.ends_at || Date.parse(c.ends_at) > now) &&
        (category === "Todas" || c.details?.category === category),
    )
    .sort((a, b) => b.published_at.localeCompare(a.published_at));
  return (
    <>
      <div className="eyebrow">CADA GESTO FAZ DIFERENÇA</div>
      <h1>Ajudas</h1>
      <SharePage path="/ajudas" title="Ajude o Presente de Alegria" />
      <p className="intro">
        Conheça as campanhas e escolha como apoiar o Presente de Alegria.
      </p>
      <label>
        Tipo de ajuda
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          {["Todas", "Doação", "Pix", "Arrecadação", "Rifa", "Bingo"].map(
            (c) => (
              <option key={c}>{c}</option>
            ),
          )}
        </select>
      </label>
      <label className="check-label">
        <input
          type="checkbox"
          checked={ended}
          onChange={(e) => setEnded(e.target.checked)}
        />
        Mostrar também campanhas encerradas
      </label>
      {items.length ? (
        items.map((c) => {
          const closed = !!c.ends_at && Date.parse(c.ends_at) <= now;
          return (
            <article className="card news-card" key={c.id}>
              <span className="publication-tag">
                {c.details?.category || "Doação"}
                {closed ? " · Encerrada" : ""}
              </span>
              <h2>{c.title}</h2>
              {c.details?.summary && (
                <p className="intro">{c.details.summary}</p>
              )}
              <p className="small muted">
                Publicado em{" "}
                {fmt(c.published_at, {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
              {c.ends_at && (
                <p>
                  Até{" "}
                  {fmt(c.ends_at, {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                  · Brasília
                </p>
              )}
              <p className="preserve-lines">{c.body}</p>
              <PublicationLinks details={c.details} disabled={closed} />
              {!closed && c.details?.pix_key && <Pix details={c.details} />}
            </article>
          );
        })
      ) : (
        <div className="empty card">
          <Icon name="heart" size={38} />
          <h2>Novas formas de ajudar em breve.</h2>
          <p>As campanhas publicadas pela Comunicação aparecerão aqui.</p>
        </div>
      )}
    </>
  );
}
