# Presente de Alegria — Relatórios de Visita

PWA mobile-first para substituir o relatório de visita em papel da ONG.

> **Estado: fundação em desenvolvimento. Não pronto para coletar dados reais.**
> Projeto Supabase criado; banco, fluxos de relatório, PDF, administração e publicação ainda pendentes.

## Desenvolvimento

Requer Node.js 24 LTS e npm.

```sh
npm ci
cp .env.example .env.local
npm run dev
npm test
npm run build
```

A aplicação mostra uma página de preparação enquanto a configuração não está disponível. Não inclui dados pessoais de demonstração.

## Arquitetura

- React + TypeScript + Vite, interface em português brasileiro.
- Supabase Auth (código por e-mail), PostgreSQL com RLS e Storage privado.
- PDF gerado no backend com pdf-lib, nunca aceito como prova a partir de um PDF arbitrário enviado pelo cliente.
- Cloudflare Pages, build `npm run build`, diretório `dist`, Node 24.
- GitHub como origem do deploy automático. Sem Azure Pipelines necessário ao projeto.

Veja [docs/architecture.md](docs/architecture.md), [docs/security.md](docs/security.md) e [docs/progress.md](docs/progress.md).

## Variáveis públicas

Somente `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` e `VITE_PRODUCTION_URL` no frontend. A chave publishable é pública por design; a proteção dos dados depende de RLS. Nunca usar service role, secret key ou senha de banco em variáveis VITE, no código ou no GitHub.

## Identidade

Logotipo original obtido de https://presentedealegria.org.br/wp-content/uploads/2023/09/marca-colorida.png em 17/09/2026. Uso neste sistema solicitado pelo representante do projeto. A marca pertence à ONG; não há concessão de licença sobre a marca para outros projetos.

## Implantação planejada

1. Publicar este repositório no GitHub.
2. Aplicar e testar migrações e funções no novo projeto Supabase.
3. Configurar SMTP, login por código e conta administrativa inicial.
4. Cloudflare → Workers & Pages → Create application → Pages → Connect to Git.
5. Selecionar repositório, branch `main`, build `npm run build`, saída `dist`.
6. Configurar as três variáveis públicas, restringir URLs de autenticação à produção e atualizar o QR Code.
7. Executar todos os testes de aceite antes de convidar coordenadores.

Não habilitar planos pagos automaticamente.
