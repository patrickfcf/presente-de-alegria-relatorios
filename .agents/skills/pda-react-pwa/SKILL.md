---
name: pda-react-pwa
description: Build and review the Presente de Alegria mobile React interface, report form, accessibility, install flow and public-shell caching.
---

# Interface React e PWA

Leia `src/App.tsx`, os componentes afetados e `src/App.css` antes de editar. Reuse padrões existentes; mantenha labels e mensagens em PT-BR. Evite adicionar framework ou biblioteca para uma interação simples.

## Fluxos que devem permanecer claros

- Entrada por perfil orienta navegação, mas não autoriza acesso. Preserve a navegação apropriada a cada papel.
- Formulário mantém visita/chamada, profissional/indicadores, comprovação e revisão. Erros devem apontar o campo e preservar dados em memória para nova tentativa.
- Assinatura é do profissional, com desfazer, limpar e confirmar; upload de documento assinado é alternativa. Valide toque real quando houver navegador/dispositivo disponível.
- Estados vazios, offline, carregando, falha e sucesso devem ser distintos. Não simule envio bem-sucedido sem confirmação do servidor.

## Mobile, acessibilidade e privacidade

Use controles semânticos com label, foco visível, erros associados e alvos confortáveis (aproximadamente 44px). Confira 390px, 412px e desktop; respeite redução de movimento e contraste. Não esconda informação apenas por cor. Use inputs de data/hora/quantidades adequados ao celular.

`src/lib/draft.ts` salva somente um subconjunto não sensível, por usuário e com expiração. Não acrescente nome/CPF do profissional, assinatura, anexos ou chamada ao armazenamento persistente de rascunho.

`public/manifest.webmanifest`, `src/lib/install.ts` e `scripts/build-pwa.mjs` governam instalação/cache. Cacheie somente assets públicos locais; nunca respostas Supabase, PDFs, URLs assinadas ou pedidos autenticados. Não force reload que destrua um formulário em andamento. Teste o service worker no build, não só no servidor Vite.

## Verificar

Execute os checks de código do AGENTS.md; complemente com testes de fluxo afetado. Para instalação, confira logo, standalone e instruções iPhone/Android. Diferencie conferência técnica de teste em aparelho real. Consulte `docs/deployment.md` para o aceite e `docs/architecture.md` para decisões existentes.
