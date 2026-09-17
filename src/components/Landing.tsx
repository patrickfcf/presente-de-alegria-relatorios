import { Icon } from "./Icon";

const areas = [
  { title: "Minha célula", description: "Acesse sua equipe, registre visitas e acompanhe os relatórios. Para pessoas cadastradas na ONG.", href: "/#/minha-celula", icon: "users", action: "Acessar minha célula" },
  { title: "Eventos", description: "Veja os próximos encontros e ações, com datas, locais e como participar.", href: "/eventos/", icon: "calendar", action: "Explorar eventos" },
  { title: "Notícias", description: "Fique por dentro das novidades, histórias e comunicados do Presente.", href: "/noticias/", icon: "news", action: "Ler notícias" },
  { title: "Doação", description: "Conheça as campanhas e as formas de apoiar o trabalho da ONG.", href: "/ajudas/", icon: "heart", action: "Quero contribuir" },
] as const;

export function Landing() {
  return <>
    <div className="eyebrow">PRESENTE EM CADA ENCONTRO</div>
    <h1>Alegria que aproxima.</h1>
    <p className="intro">Sua célula, nossos encontros e as novidades da ONG, em um só lugar.</p>
    <div className="welcome-grid">
      {areas.map(area => <a className="welcome-card" href={area.href} key={area.title}>
        <span className="welcome-icon"><Icon name={area.icon} size={26} /></span>
        <h2>{area.title}</h2>
        <p>{area.description}</p>
        <span className="welcome-action">{area.action}<Icon name="arrow" size={18} /></span>
      </a>)}
    </div>
    <p className="small muted">Eventos, Notícias e Doação são abertos a todos. O login é necessário apenas para acessar sua área na ONG.</p>
  </>;
}
