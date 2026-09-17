---
name: pda-cloudflare-release
description: Prepare and verify Presente de Alegria releases on Cloudflare Pages with GitHub CI, public frontend configuration and Supabase activation.
---

# Publicação no Cloudflare Pages

Use `docs/deployment.md` como fonte das configurações e `docs/progress.md` para o estado real. A arquitetura escolhida é Pages com integração GitHub e backend Supabase; não migre para outro provedor ou Workers por iniciativa própria.

## Preparar

Confira branch/commit e CI. Build usa Node 24, `npm ci` e `npm run build`; pasta final `dist`. Veja `.github/workflows/ci.yml`. O repositório é `patrickfcf/presentedealegria-app`; o nome sugerido do Pages é `presentedealegria-app`, sujeito a disponibilidade.

Frontend recebe somente `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` e `VITE_PRODUCTION_URL`. São injetadas no build; mudá-las exige novo deploy. Nunca coloque Secret/service_role/SMTP em VITE. Não replique configurações de produção em previews sem avaliar o destino dos dados.

## Publicar e conferir

Use a URL final informada pelo provedor, não presuma que o nome sugerido está disponível. Ajuste URL de produção/QR e configuração Auth. Não ative recursos pagos. Se login ou verificação do painel bloquear, preserve o trabalho e dê instruções exatas ao responsável; não tente contornar a proteção.

Confira HTTPS, manifest, ícones, service worker e headers; faça smoke test das rotas, inclusive instalação. Mudanças no frontend não publicam automaticamente migrations ou Edge Functions: descreva separadamente cada implantação necessária.

Antes de considerar operacional, confira SMTP/template OTP/primeiro administrador e execute o aceite de `docs/deployment.md`: entrada, envio, PDF, visibilidade da diretoria e bloqueio entre células. Instalação em iPhone/Android e e-mail entregue precisam de evidência própria.

Registre commit, URL, verificações e pendências. Para problema de frontend, identifique o último deploy bom antes de rollback; rollback de Pages não reverte banco. Migrações exigem estratégia própria para preservar dados.
