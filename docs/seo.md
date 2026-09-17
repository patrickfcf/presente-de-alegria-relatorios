# SEO e divulgação

Páginas públicas canônicas: `/`, `/sobre`, `/eventos`, `/noticias`, `/ajudas`, `/instalar`. Endereços antigos com hash continuam abrindo a página equivalente. A página inicial pública explica as quatro áreas. O aplicativo mantém a entrada privada em `/#/minha-celula` e as rotas internas por hash, sem indexação.

O build gera HTML por página com título/descrição únicos, canonical, Open Graph, Twitter Card, logo, introdução e navegação acessível antes do JavaScript. O conteúdo atualizado das publicações é carregado do Supabase: crawlers precisam renderizar JavaScript para ler os cards. Não se promete pré-renderização de cada notícia/evento nem resultados enriquecidos de Event. Schema.org WebSite/Organization descreve apenas fatos conhecidos. CSP autoriza somente o hash exato do JSON-LD; não habilita JavaScript inline arbitrário.

`/sitemap.xml` inclui somente páginas públicas; `/robots.txt` permite rastrear assets. `noindex` aplicado ao navegar para a área privada e cabeçalhos dos domínios Pages evitam indexação duplicada. URLs inexistentes retornam a página 404 do Pages. RLS continua responsável pela segurança; robots não controla acesso.

Publicações têm filtros e ordenação; eventos registram a primeira publicação, independentemente da data do encontro. Notícias usam a data editorial. Empates de eventos são resolvidos pela data do encontro e ID. O calendário começa pelo mês atual. Todas as datas exibidas usam Brasília.

## Comunicação

- Títulos específicos, resumos claros, datas corretas, local e contato autorizado.
- Eventos: instruções de participação e limite de vagas quando informado.
- Doação (URL `/ajudas/` preservada): finalidade, regras, prazo, responsável e link oficial. Atualizar/arquivar campanhas encerradas; não inventar resultados ou depoimentos.
- Compartilhar os links públicos, com prévias de marca e botão nativo/copiar link. Usar UTM nos links divulgados em campanhas quando houver uma ferramenta de medição aprovada; nunca colocar dados pessoais em parâmetros.
- `/sobre` oferece ações para participar, ajudar e conhecer o voluntariado oficial.

## Ativação externa pendente

O responsável deve verificar `presentedealegria.app` no Google Search Console (registro TXT fornecido pelo Google, quando necessário), enviar `https://presentedealegria.app/sitemap.xml` e inspecionar as páginas. Indexação e posição não são garantidas. Não criar ficha de endereço/local comercial sem informações verificadas da ONG.

Nenhum pixel, cookie de marketing, analytics, anúncio pago ou integração externa foi ativado. Métricas e consentimento devem ser escolhidos com a ONG; avaliar visitas, cliques em participação e apoio, sem enviar dados de relatórios. Preview de WhatsApp/redes pode manter cache até uma nova consulta da plataforma.

Referências: https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics e https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap.
