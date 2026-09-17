export const siteOrigin = "https://presentedealegria.app";
export const publicPages = [
  { path: "/sobre", title: "Presente de Alegria — Eventos, notícias e como ajudar", heading: "Alegria que aproxima", description: "Acompanhe os encontros, notícias e campanhas do Presente de Alegria. Saiba como participar, apoiar nossas ações e espalhar alegria." },
  { path: "/eventos", title: "Eventos e ações voluntárias | Presente de Alegria", heading: "Eventos", description: "Confira datas, horários, locais e contatos dos eventos e ações voluntárias do Presente de Alegria. Encontre um encontro e saiba como participar." },
  { path: "/noticias", title: "Notícias e comunicados | Presente de Alegria", heading: "Notícias", description: "Acompanhe notícias, histórias, resultados e comunicados do Presente de Alegria. Fique por dentro das novidades da ONG." },
  { path: "/ajudas", title: "Como ajudar: doações e campanhas | Presente de Alegria", heading: "Ajudas", description: "Conheça as campanhas de apoio do Presente de Alegria. Veja como contribuir com doações, arrecadações e outras iniciativas pelos canais oficiais." },
  { path: "/instalar", title: "Instale o aplicativo no celular | Presente de Alegria", heading: "Presente de Alegria no seu celular", description: "Adicione o aplicativo Presente de Alegria à tela inicial do iPhone ou Android. Acompanhe eventos, notícias e campanhas sem precisar de uma loja de apps." },
];
export const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Presente de Alegria",
  url: siteOrigin + "/sobre/",
  inLanguage: "pt-BR",
  publisher: { "@type": "Organization", name: "Presente de Alegria", url: "https://presentedealegria.org.br/", logo: siteOrigin + "/logo.png" },
};
