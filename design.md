# Design do aplicativo

## Princípios

Português do Brasil, celular primeiro, tarefas curtas e linguagem acolhedora. A marca deve ser alegre e profissional. Usar os assets oficiais; nunca redesenhar o logo automaticamente.

| Token             | Uso                                                  |
| ----------------- | ---------------------------------------------------- |
| `#6437D1`         | Ações principais e foco da marca                     |
| `#2D1D54`         | Títulos e texto de destaque                          |
| `#FE5D37`         | Acento pontual, sem texto pequeno sobre fundo branco |
| `#FAF8FC`         | Fundo da aplicação                                   |
| `#FFFFFF`         | Cartões e campos                                     |
| Fontes do sistema | Interface rápida e legível; sem download extra       |

Fonte de verdade visual: `src/index.css`, `src/App.css` e componentes existentes. O PDF usa Noto Sans incorporada; o e-mail usa Arial/Helvetica, tabelas e estilos inline.

## Componentes e navegação

- Início: título breve, quatro cartões e links claros; não acrescentar quinta aba.
- Menu: Minha célula, Eventos, Notícias e Doação. Comunicação pode ver Publicações no primeiro item.
- Minha célula: identidade por código de e-mail, situação mensal e ação para preencher.
- Formulário: visita/chamada → profissional/indicadores → comprovação → revisão → confirmação.
- Comunicação: diferenciar rascunho, agendado, publicado e arquivado. Confirmar que contatos serão públicos.
- Eventos: data/horário de Brasília, local, contato e mensagem de WhatsApp preenchida, enviada somente pela pessoa.
- Doação: informação e links oficiais. Sem pagamento ou sorteio processado pelo app.

## Acessibilidade e estados

Usar HTML semântico, labels explícitos, foco visível e alvos de toque de pelo menos 44px. Campos devem explicar os erros em texto. Não representar enviado/pendente somente pela cor. Manter contraste WCAG AA para texto. Testar teclado, zoom e larguras 390px, 412px e desktop.

Prever carregamento, vazio, offline, erro recuperável e sucesso. Respeitar redução de movimento. Não apagar dados de formulário por reload automático do service worker. Zero e quantidade desconhecida são diferentes. CPF e assinatura pertencem ao profissional da instituição.

## Assets

`public/logo.png`: cabeçalho, PDF e e-mail. `assets/branding/app-icon.jpg`: origem autorizada dos ícones PWA; `npm run icons` regenera versões com hash. Licenças em [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

Para mudanças visuais, incluir no PR evidência com dados sintéticos e dizer quais tamanhos/dispositivos foram realmente testados. Não declarar instalação física com base apenas em screenshot.

## Tema automático

A interface acompanha a preferência claro/escuro do navegador ou sistema com `prefers-color-scheme`, inclusive quando ela muda com o app aberto. Não há configuração salva nem recarga do formulário. Sem preferência, o padrão é claro. Os tokens semânticos ficam em `src/index.css`; componentes usam esses tokens em `src/App.css`.

No escuro, o fundo é `#15111D`, cartões `#211B2C`, texto principal `#F3EDF9` e links/foco `#C4A5FF`. Os botões mantêm o roxo oficial com texto branco. `color-scheme` adapta controles nativos; metadados `theme-color` oferecem cores correspondentes aos navegadores compatíveis.

Logotipo, assinatura e QR Code preservam suas cores sobre branco. PDFs, e-mails e ícones não são invertidos. O manifest mantém as cores estáticas da marca como fallback: splash screens e barras do sistema dependem do suporte do navegador/SO e podem não acompanhar o tema.

Validação manual: alternar claro/escuro com uma página aberta; conferir início, feeds, filtros, login, administração, formulário, assinatura e instalação em larguras de 390, 412 e 1280 px. Confirmar legibilidade, foco, campos nativos e preservação dos dados digitados. Verificar também a PWA instalada em iOS e Android; simulação não substitui dispositivos físicos.
