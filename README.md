# Presente de Alegria · App

<p align="center"><img src="public/logo.png" alt="Presente de Alegria" width="220" /></p>

[![Quality](https://img.shields.io/github/actions/workflow/status/patrickfcf/presentedealegria-app/ci.yml?branch=main&label=Quality)](https://github.com/patrickfcf/presentedealegria-app/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-6437D1)](LICENSE)
![React](https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![Supabase](https://img.shields.io/badge/Backend-Supabase-3ECF8E?logo=supabase&logoColor=white)
![Cloudflare Pages](https://img.shields.io/badge/Hosting-Cloudflare_Pages-F38020?logo=cloudflare&logoColor=white)
![Resend](https://img.shields.io/badge/Email-Resend-000000?logo=resend&logoColor=white)
![PWA](https://img.shields.io/badge/PWA-iOS%20%26%20Android-6437D1)

[Começar](#executar) · [Contribuir](CONTRIBUTING.md) · [Segurança](SECURITY.md) · [Publicar](docs/deployment.md) · [Administrar](docs/administration.md)

PWA para relatórios mensais de visita, equipes, notícias e eventos da ONG Presente de Alegria.

**Site publicado: [presentedealegria.app](https://presentedealegria.app).**

Páginas públicas, backend, primeiro administrador e envio de código por e-mail estão configurados. O responsável confirmou recebimento do OTP via Resend. O aceite completo de login → relatório → PDF, a instalação física e o cadastro oficial das células ainda precisam ser concluídos. A personalização do e-mail é aplicada no painel Supabase, não pelo deploy do site.

[Arquitetura](architecture.md) · [Design](design.md) · [Documentação](documents.md) · [Testes](tests.md) · [Fluxo de PR](docs/contributing-workflow.md)

## Executar

Node.js 24 e npm:

```sh
git clone https://github.com/patrickfcf/presentedealegria-app.git
cd presentedealegria-app
npm ci
cp .env.example .env.local
# Preencha somente URL e chave PUBLICÁVEL do Supabase.
npm run dev
npm test
npm run lint
npm run build
npm run format:check
```

`npm run preview` serve o build de produção, incluindo o service worker. O PWA exige HTTPS em produção. `npm run icons` regenera favicon, Apple touch icon e ícones Android a partir de `assets/branding/app-icon.jpg`, imagem fornecida pelo responsável. O logo do cabeçalho e do PDF é independente. As URLs dos ícones incluem o hash da imagem para renovar o cache.

## O que está incluído

- Entrada por código enviado ao e-mail cadastrado, sem cadastro público.
- Cinco perfis: administrador, diretor, coordenador, voluntário individual e Comunicação e Eventos.
- Hierarquia diretor → coordenador → voluntários; substituição de coordenador com preservação do histórico.
- Uma visita esperada por célula/mês; estrutura permite visitas adicionais sem reescrever o banco.
- Formulário em quatro passos: visita e chamada, profissional e indicadores, comprovação, revisão.
- CPF do profissional da instituição opcional; quantidades desconhecidas distintas de zero e identificação de estimativas.
- Assinatura na tela OU até três PDFs/JPGs/PNGs assinados em papel.
- PDF gerado no servidor, armazenado com os originais em bucket privado; download individual e ZIP mensal.
- Painel de pendências e comparação de células; filtros por mês, célula, coordenador e situação.
- Eventos, Notícias e Doação públicos, sem login; publicação restrita à Comunicação e administradores. Calendário mensal, contatos e links oficiais; campanhas com prazo e Pix opcional.
- Manifest, ícones oficiais, Apple touch icon, service worker, instruções de instalação e QR da URL configurada.

## Arquitetura

React + TypeScript + Vite → Supabase Auth/PostgreSQL/RLS/Storage/Edge Functions.
Cloudflare Pages publica a aplicação estática a partir de `main` no GitHub após merge de PR. Supabase envia códigos pelo SMTP do Resend. Não há servidor extra.

- `src/`: interface e integração com o Supabase.
- `shared/`: validação e geração de PDF compartilhadas com as funções.
- `supabase/migrations/`: esquema, permissões e operações transacionais.
- `supabase/functions/`: envio de relatórios e administração.
- `supabase/tests-security.sql`: testes reais de RLS/hierarquia dentro de transação revertida.
- `tests/`: validação, PDF e fluxo de interface.
- `scripts/build-pwa.mjs`: cache apenas do shell público, nunca de relatórios ou respostas da API.

Leia [implantação](docs/deployment.md), [administração](docs/administration.md), [arquitetura](docs/architecture.md), [segurança](docs/security.md) e [progresso](docs/progress.md).

## Configuração pública e segredos

O frontend recebe somente `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` e `VITE_PRODUCTION_URL`. A chave publicável não substitui RLS. Nunca incluir service role, senha de banco, tokens de CI ou dados pessoais no repositório público. As funções usam segredos fornecidos pelo ambiente do Supabase.

## Perfis e responsabilidades

Todos são voluntários; o perfil cadastrado determina as permissões. A escolha na primeira tela apenas orienta a navegação.

| Perfil                | Responsabilidade                                                         |
| --------------------- | ------------------------------------------------------------------------ |
| Administrador         | Gerencia acessos, células, equipes, relatórios e publicações             |
| Diretor de célula     | Gerencia seus coordenadores, consulta voluntários e acompanha relatórios |
| Coordenador de célula | Gerencia sua equipe, registra chamada e envia relatórios                 |
| Voluntário individual | Consulta eventos e calendário                                            |
| Comunicação e Eventos | Publica notícias e eventos; não acessa documentos das instituições       |

Veja os limites completos em [Administração](docs/administration.md). Nome, cargo, CPF e assinatura no relatório pertencem ao **profissional da instituição**; o coordenador é o responsável pelo envio.

## Desenvolvimento assistido por agentes

[AGENTS.md](AGENTS.md) registra as regras de produto, privacidade, validação e atualização de documentação. Há três skills versionadas em `.agents/skills/`, específicas para este projeto:

- `pda-react-pwa`: interface mobile, acessibilidade, instalação e cache público.
- `pda-supabase-reports`: permissões, hierarquia, envio idempotente e PDF privado.
- `pda-cloudflare-release`: build, variáveis públicas, implantação e aceite.

Em agentes com suporte a skills de repositório, invoque pelo nome; nos demais, peça a leitura do `SKILL.md` correspondente. Elas não exigem plugins pagos nem concedem acesso a serviços.

## Contribuições e segurança

Leia [CONTRIBUTING.md](CONTRIBUTING.md) antes de abrir um PR. Para vulnerabilidades, siga [SECURITY.md](SECURITY.md); não publique dados pessoais ou evidências sensíveis em issues. O badge Quality consulta o CI real; não representa certificação de segurança nem aceite de produção.

## Marca e licenças

Logo original da ONG: https://presentedealegria.org.br/wp-content/uploads/2023/09/marca-colorida.png, obtido em 17/09/2026. A marca pertence ao Presente de Alegria; seu uso neste projeto não concede licença de marca a terceiros. Cores de interface extraídas do site oficial: roxo `#6437D1`, roxo escuro `#2D1D54` e laranja `#FE5D37`.

O PDF inclui um subconjunto latino da fonte Noto Sans, SIL OFL 1.1, com licença em `licenses/NotoSans-OFL.txt`. A fonte é usada apenas no servidor; a interface usa fontes do sistema.

O código e a documentação originais são distribuídos sob a [licença MIT](LICENSE). A licença não concede direitos sobre o nome, logotipo ou marcas da ONG. Assets de terceiros preservam suas próprias licenças; veja [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## Publicações abertas

Eventos, Notícias, Doação e Calendário não exigem conta. Minha célula e a gestão de publicações exigem login. Rascunhos, arquivados e notícias/campanhas agendadas não são expostos. Contatos publicados são públicos: a equipe confirma a divulgação antes de salvar. A área Doação divulga campanhas e canais oficiais, sem processar pagamentos, vender números ou realizar sorteios.

### Descoberta e divulgação

Páginas públicas: [Sobre](https://presentedealegria.app/sobre), [Eventos](https://presentedealegria.app/eventos), [Notícias](https://presentedealegria.app/noticias) e [Doação](https://presentedealegria.app/ajudas). Metadados sociais, sitemap e limites de indexação estão em [SEO e divulgação](docs/seo.md).

## E-mails e hospedagem

| Serviço             | Configuração                                                                                                  |
| ------------------- | ------------------------------------------------------------------------------------------------------------- |
| Cloudflare Pages    | Branch `main`, Node 24, build `npm run build`, saída `dist`                                                   |
| Domínio de produção | `https://presentedealegria.app`                                                                               |
| Supabase Auth       | Site URL de produção e template Magic Link com `{{ .Token }}`                                                 |
| Resend SMTP         | `smtp.resend.com`, porta `465`, usuário `resend`; senha é uma API key de envio restrita ao domínio verificado |
| Remetente           | Presente de Alegria; endereço no domínio de envio verificado                                                  |

Guardar a credencial Resend somente no SMTP do Supabase e no gerenciador de segredos. Ela nunca é uma variável `VITE_*`. Preservar os registros de recebimento do iCloud ao configurar o domínio de envio. Ver [deploy](docs/deployment.md) para passos e limites.

## Mudanças por pull request

Criar branch → abrir PR → checks verdes → revisão do mantenedor → Squash and merge → deploy Pages. A proteção de `main` exige o check `verify`. O CI não tem segredos de produção. Dependabot abre propostas de atualização; agentes seguem [AGENTS.md](AGENTS.md). Leia a [política completa](docs/contributing-workflow.md).
