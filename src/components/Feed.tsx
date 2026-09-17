import { useState } from "react";
import type { Event, News } from "../../shared/report";
import { todayBR } from "../../shared/report";
import { Icon } from "./Icon";
const fmt = (date: string, options: Intl.DateTimeFormatOptions) =>
  new Date(date).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    ...options,
  });
export function NewsFeed({ news }: { news: News[] }) {
  const [open, setOpen] = useState<string | null>(null);
  const items = news
    .filter(
      (n) => n.status === "published" && new Date(n.published_at) <= new Date(),
    )
    .sort((a, b) => b.published_at.localeCompare(a.published_at));
  return (
    <>
      <div className="eyebrow">NOSSA ALEGRIA EM MOVIMENTO</div>
      <h1>Notícias</h1>
      <p className="intro">
        Novidades e recados para quem faz parte dessa história.
      </p>
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
            <h2>{n.title}</h2>
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
          </article>
        ))
      ) : (
        <div className="empty card">
          <Icon name="news" size={38} />
          <h2>As novidades chegam por aqui.</h2>
          <p>
            Quando a equipe de comunicação publicar um comunicado, você poderá
            acompanhar nesta página.
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
  const [month, setMonth] = useState(todayBR().slice(0, 7));
  const items = events
    .filter(
      (e) =>
        e.status === "published" &&
        (calendar
          ? new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Sao_Paulo" })
              .format(new Date(e.starts_at))
              .startsWith(month)
          : past || new Date(e.ends_at || e.starts_at) >= new Date()),
    )
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  return (
    <>
      <div className="eyebrow">ENCONTROS QUE APROXIMAM</div>
      <h1>{calendar ? "Calendário" : "Eventos"}</h1>
      <p className="intro">Veja o que vem por aí e faça parte.</p>
      <label hidden={!calendar}>
        Mês dos encontros
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
        />
      </label>
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
            <p className="preserve-lines">{e.description}</p>
          </article>
        ))
      ) : (
        <div className="empty card">
          <Icon name="calendar" size={38} />
          <h2>Novos encontros em breve.</h2>
          <p>
            A equipe de comunicação publicará aqui as datas, os horários e os
            locais dos próximos eventos.
          </p>
        </div>
      )}
    </>
  );
}
