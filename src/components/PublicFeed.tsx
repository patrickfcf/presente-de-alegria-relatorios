import { useEffect, useState } from "react";
import { publicRows } from "../lib/api";
import { EventsFeed, NewsFeed, CampaignsFeed } from "./Feed";
import type { Campaign, Event, News } from "../../shared/report";
export function PublicFeed({ route }: { route: string }) {
  const [items, setItems] = useState<(Campaign | Event | News)[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);
  const kind =
    route === "/noticias"
      ? "news"
      : route === "/ajudas"
        ? "campaigns"
        : "events";
  const refresh = () => {
    setLoading(true);
    setError("");
    setItems([]);
    setRetry((v) => v + 1);
  };
  useEffect(() => {
    let active = true;
    void publicRows<Campaign | Event | News>(kind)
      .then((data) => {
        if (active) setItems(data);
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
  }, [kind, retry]);
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        setLoading(true);
        setError("");
        setRetry((v) => v + 1);
      }
    };
    window.addEventListener("online", onVisible);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("online", onVisible);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);
  if (loading) return <p role="status">Carregando publicações…</p>;
  if (error)
    return (
      <div className="card">
        <h1>Vamos tentar novamente?</h1>
        <p role="alert">{error}</p>
        <button className="primary" onClick={refresh}>
          Tentar novamente
        </button>
      </div>
    );
  return kind === "news" ? (
    <NewsFeed news={items as News[]} />
  ) : kind === "campaigns" ? (
    <CampaignsFeed campaigns={items as Campaign[]} />
  ) : (
    <EventsFeed events={items as Event[]} calendar={route === "/calendario"} />
  );
}
