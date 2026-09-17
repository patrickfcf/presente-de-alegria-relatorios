import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import type { Session } from "@supabase/supabase-js";
import type {
  Attendance,
  Cell,
  Event,
  Institution,
  Membership,
  News,
  Period,
  Profile,
  Report,
} from "../shared/report";
import { todayBR } from "../shared/report";
import { configured, supabase, rows, admin } from "./lib/api";
import { clearAllDrafts } from "./lib/draft";
import { Icon } from "./components/Icon";
import { LogoutDialog } from "./components/LogoutDialog";
import { Entry } from "./components/Entry";
import { Home } from "./components/Home";
import { EventsFeed, NewsFeed } from "./components/Feed";
import "./App.css";
const ReportForm = lazy(() =>
  import("./components/ReportForm").then((m) => ({ default: m.ReportForm })),
);
const ReportDetail = lazy(() =>
  import("./components/ReportDetail").then((m) => ({
    default: m.ReportDetail,
  })),
);
const AdminDashboard = lazy(() =>
  import("./components/AdminDashboard").then((m) => ({
    default: m.AdminDashboard,
  })),
);
const Registry = lazy(() =>
  import("./components/Registry").then((m) => ({ default: m.Registry })),
);
const Publications = lazy(() =>
  import("./components/Publications").then((m) => ({
    default: m.Publications,
  })),
);
const Install = lazy(() =>
  import("./components/Install").then((m) => ({ default: m.Install })),
);
const EMPTY = {
  cells: [] as Cell[],
  institutions: [] as Institution[],
  memberships: [] as Membership[],
  periods: [] as Period[],
  reports: [] as Report[],
  profiles: [] as Profile[],
  news: [] as News[],
  events: [] as Event[],
  attendance: [] as Attendance[],
};
export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(!configured);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [data, setData] = useState(EMPTY);
  const [route, setRoute] = useState(location.hash.slice(1) || "/");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [offline, setOffline] = useState(!navigator.onLine);
  const [detail, setDetail] = useState<Report | null>(null);
  const [successId, setSuccessId] = useState("");
  const [logoutConfirm, setLogoutConfirm] = useState(false);
  const userId = session?.user.id;
  const request = useRef(0);
  const main = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!supabase) return;
    void supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setAuthReady(true);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setAuthReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);
  const refresh = useCallback(async () => {
    if (!userId || !supabase) return;
    const version = ++request.current;
    setLoading(true);
    setError("");
    try {
      const { data: p, error: pe } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();
      if (pe || !p)
        throw new Error(
          "Seu cadastro ainda não está ativo. Peça à diretoria para cadastrar seu e-mail e sua célula.",
        );
      if (["admin", "director", "coordinator"].includes(p.role))
        await admin({
          action: "ensure-periods",
          month: todayBR().slice(0, 7) + "-01",
        });
      const [
        cells,
        institutions,
        memberships,
        periods,
        reports,
        profiles,
        news,
        events,
        attendance,
      ] = await Promise.all([
        rows<Cell>("cells"),
        rows<Institution>("institutions"),
        rows<Membership>("cell_memberships"),
        rows<Period>("report_periods"),
        rows<Report>("visit_reports", "submitted_at"),
        rows<Profile>("profiles"),
        rows<News>("news", "published_at"),
        rows<Event>("events", "starts_at"),
        rows<Attendance>("report_attendance", "report_id"),
      ]);
      if (version === request.current) {
        setProfile(p as Profile);
        setData({
          cells,
          institutions,
          memberships,
          periods,
          reports,
          profiles,
          news,
          events,
          attendance,
        });
      }
    } catch (e) {
      if (version === request.current) {
        setError((e as Error).message);
        setProfile(null);
        setData(EMPTY);
      }
    } finally {
      if (version === request.current) setLoading(false);
    }
  }, [userId]);
  useEffect(() => {
    if (userId) void refresh();
    else {
      request.current++;
      setProfile(null);
      setData(EMPTY);
      setDetail(null);
    }
  }, [userId, refresh]);
  useEffect(() => {
    const change = () => {
      setRoute(location.hash.slice(1) || "/");
      setDetail(null);
      setSuccessId("");
      window.scrollTo({ top: 0, behavior: "instant" });
      main.current?.focus();
    };
    const online = () => setOffline(!navigator.onLine);
    window.addEventListener("hashchange", change);
    window.addEventListener("online", online);
    window.addEventListener("offline", online);
    return () => {
      window.removeEventListener("hashchange", change);
      window.removeEventListener("online", online);
      window.removeEventListener("offline", online);
    };
  }, []);
  useEffect(() => {
    if (!session) return;
    const visibility = () => {
      if (
        document.visibilityState === "visible" &&
        ["/", "/eventos", "/noticias", "/admin"].includes(route)
      )
        void refresh();
    };
    document.addEventListener("visibilitychange", visibility);
    return () => document.removeEventListener("visibilitychange", visibility);
  }, [session, refresh, route]);
  function navigate(path: string) {
    setDetail(null);
    setSuccessId("");
    if (route === path) {
      window.scrollTo({ top: 0 });
      return;
    }
    location.hash = path;
  }
  async function signout() {
    clearAllDrafts();
    request.current++;
    setData(EMPTY);
    setDetail(null);
    setProfile(null);
    setError("");
    setSession(null);
    setLogoutConfirm(false);
    navigate("/");
    await supabase?.auth.signOut({ scope: "local" });
  }
  async function submitted(id: string) {
    await refresh();
    navigate("/enviado/" + id);
  }
  const isDirector = profile && ["admin", "director"].includes(profile.role);
  const isAdminRoute = ["/admin", "/cadastros", "/publicacoes"].includes(route);
  const canPublish =
    profile && ["admin", "communications"].includes(profile.role);
  const isVolunteer = profile?.role === "volunteer";
  let content;
  if (route === "/instalar") content = <Install />;
  else if (route === "/privacidade")
    content = (
      <>
        <h1>Seus dados, com cuidado.</h1>
        <div className="card">
          <h2>Para que usamos as informações?</h2>
          <p>
            O Presente de Alegria utiliza os dados para registrar as visitas,
            arquivar os comprovantes assinados e acompanhar as atividades da
            ONG.
          </p>
          <p>
            Nome, cargo, CPF e assinatura do relatório pertencem ao profissional
            da instituição. O coordenador é identificado como responsável pelo
            envio. O CPF é opcional.
          </p>
          <p>
            Coordenadores acessam os relatórios das células autorizadas; a
            diretoria acompanha os relatórios da ONG. Notícias e eventos são
            internos.
          </p>
          <p>
            Rascunhos locais guardam apenas data, horários e quantidades por até
            7 dias. Dados do profissional, assinatura e anexos não são salvos no
            rascunho. Ao sair da conta, os rascunhos são removidos.
          </p>
          <p>
            Para corrigir informações, tratar de acesso ou solicitar
            esclarecimentos sobre retenção e privacidade, procure a diretoria do
            Presente de Alegria pelos canais habituais da ONG.
          </p>
        </div>
      </>
    );
  else if (!configured)
    content = (
      <div className="card">
        <h1>Estamos preparando esse espaço.</h1>
        <p>O aplicativo ainda não está configurado para receber relatórios.</p>
      </div>
    );
  else if (!authReady || loading)
    content = (
      <div className="loading" role="status">
        <span className="spinner" />
        Preparando seu espaço…
      </div>
    );
  else if (!session)
    content = (
      <>
        <div className="eyebrow">PRESENTE EM CADA ENCONTRO</div>
        <h1>
          Alegria que
          <br />
          aproxima.
        </h1>
        <p className="intro">
          Um espaço para a sua célula, os nossos encontros e tudo que acontece
          na ONG.
        </p>
        {route === "/eventos" || route === "/noticias" ? (
          <p className="notice">
            Entre para acompanhar{" "}
            {route === "/eventos" ? "os eventos" : "as notícias"} da ONG.
          </p>
        ) : null}
        <Entry />
      </>
    );
  else if (!profile)
    content = (
      <div className="card">
        <h1>Vamos concluir seu acesso.</h1>
        <p role="alert">{error}</p>
        <button className="primary" onClick={() => void refresh()}>
          Tentar novamente
        </button>
        <button className="text-button" onClick={() => setLogoutConfirm(true)}>
          Sair da conta
        </button>
      </div>
    );
  else if (
    (route === "/publicacoes" && !canPublish) ||
    (route === "/admin" && !isDirector) ||
    (route === "/cadastros" &&
      !["admin", "director", "coordinator"].includes(profile.role))
  )
    content = (
      <div className="card">
        <h1>Acesso restrito à diretoria</h1>
        <button className="primary" onClick={() => navigate("/")}>
          Voltar à minha célula
        </button>
      </div>
    );
  else if (
    profile.role === "communications" &&
    (route === "/" || route === "/publicacoes")
  )
    content = <Publications {...data} onRefresh={refresh} />;
  else if (
    isVolunteer &&
    (route === "/" || route === "/eventos" || route === "/calendario")
  )
    content = (
      <EventsFeed events={data.events} calendar={route === "/calendario"} />
    );
  else if (isVolunteer && route !== "/noticias")
    content = (
      <div className="card">
        <h1>Acompanhe os encontros da ONG</h1>
        <button className="primary" onClick={() => navigate("/eventos")}>
          Ver eventos
        </button>
      </div>
    );
  else if (route.startsWith("/enviado/")) {
    const submittedReport = data.reports.find((r) => r.id === route.slice(9));
    content = submittedReport ? (
      <ReportDetail
        report={submittedReport}
        attendance={data.attendance}
        success
        onClose={() => navigate("/")}
      />
    ) : (
      <div className="card">
        <h2>Confira seu histórico</h2>
        <p>
          O envio foi recebido. Atualize o histórico para visualizar o
          relatório.
        </p>
        <button className="primary" onClick={() => void refresh()}>
          Atualizar
        </button>
      </div>
    );
  } else if (detail)
    content = (
      <ReportDetail
        report={detail}
        attendance={data.attendance}
        success={successId === detail.id}
        onClose={() => {
          setDetail(null);
          setSuccessId("");
        }}
      />
    );
  else if (
    route === "/relatorios/novo" &&
    !["admin", "coordinator"].includes(profile.role)
  )
    content = <p>O envio é feito pelo coordenador responsável pela visita.</p>;
  else if (route === "/relatorios/novo")
    content = (
      <ReportForm
        profile={profile}
        {...data}
        onClose={() => navigate("/")}
        onSuccess={(id) => void submitted(id)}
      />
    );
  else if (route === "/eventos" || route === "/calendario")
    content = (
      <EventsFeed events={data.events} calendar={route === "/calendario"} />
    );
  else if (route === "/noticias") content = <NewsFeed news={data.news} />;
  else if (route === "/admin")
    content = (
      <AdminDashboard
        canPublish={Boolean(canPublish)}
        {...data}
        onView={setDetail}
        onNavigate={navigate}
      />
    );
  else if (route === "/cadastros")
    content = <Registry profile={profile} {...data} onRefresh={refresh} />;
  else if (route === "/publicacoes")
    content = <Publications {...data} onRefresh={refresh} />;
  else
    content = (
      <Home
        profile={profile}
        {...data}
        reports={
          profile.role === "coordinator"
            ? data.reports
            : data.reports.filter((r) =>
                data.memberships.some(
                  (m) =>
                    m.profile_id === profile.id &&
                    m.cell_id === r.cell_id &&
                    m.active,
                ),
              )
        }
        onCreate={() => navigate("/relatorios/novo")}
        onView={setDetail}
        onAdmin={() => navigate("/admin")}
      />
    );
  return (
    <>
      <a
        className="skip"
        href="#main"
        onClick={(e) => {
          e.preventDefault();
          main.current?.focus();
        }}
      >
        Ir para o conteúdo
      </a>
      <header className="app-header">
        <button
          className="brand-button"
          onClick={() => navigate("/")}
          aria-label="Presente de Alegria — início"
        >
          <img src="/logo.png" alt="Presente de Alegria" />
        </button>
        <div className="header-right">
          {profile && (
            <span className="avatar" aria-label={profile.display_name}>
              {profile.display_name.slice(0, 1)}
            </span>
          )}
          {session && (
            <button
              className="icon-button"
              aria-label="Sair da conta"
              onClick={() => setLogoutConfirm(true)}
            >
              <Icon name="logout" />
            </button>
          )}
        </div>
      </header>
      {offline && (
        <div className="offline" role="status">
          Você está sem conexão. É preciso estar online para entrar, enviar ou
          baixar relatórios.
        </div>
      )}
      <main
        id="main"
        tabIndex={-1}
        ref={main}
        className={isAdminRoute ? "wide" : ""}
      >
        <Suspense fallback={<p role="status">Carregando…</p>}>
          {content}
        </Suspense>
      </main>
      <footer>
        <span>
          Feito para quem espalha alegria <span className="heart">♥</span>
        </span>
        <div>
          <a href="#/instalar">Instalar aplicativo</a>
          <a href="#/privacidade">Privacidade</a>
          <a href="#/admin">Área da diretoria</a>
        </div>
      </footer>
      {route !== "/relatorios/novo" && (
        <nav className="bottom-nav" aria-label="Menu principal">
          {(profile?.role === "communications"
            ? ([
                { path: "/publicacoes", title: "Publicações", icon: "news" },
                { path: "/eventos", title: "Eventos", icon: "calendar" },
              ] as const)
            : isVolunteer
              ? ([
                  { path: "/eventos", title: "Eventos", icon: "heart" },
                  {
                    path: "/calendario",
                    title: "Calendário",
                    icon: "calendar",
                  },
                ] as const)
              : ([
                  { path: "/", title: "Minha célula", icon: "home" },
                  { path: "/eventos", title: "Eventos", icon: "calendar" },
                  { path: "/noticias", title: "Notícias", icon: "news" },
                ] as const)
          ).map((item) => (
            <button
              key={item.path}
              aria-current={route === item.path ? "page" : undefined}
              onClick={() => navigate(item.path)}
            >
              <Icon name={item.icon} />
              <span>{item.title}</span>
            </button>
          ))}
        </nav>
      )}
      {logoutConfirm && (
        <LogoutDialog
          onClose={() => setLogoutConfirm(false)}
          onConfirm={() => void signout()}
        />
      )}
    </>
  );
}
