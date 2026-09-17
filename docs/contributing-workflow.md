# Fluxo de mudanças e proteção do repositório

## Uma alteração, uma branch, um PR

1. Atualize `main` com `git pull --ff-only`.
2. Crie `feat/assunto`, `fix/assunto`, `docs/assunto` ou `chore/assunto`.
3. Faça commits focados; PRs em andamento podem ser draft.
4. Execute `npm run format`, `npm run check` e, para banco, os testes SQL isolados.
5. Abra PR para `main` com motivo, comportamento, testes e limitações. Inclua migrations/deploy separado quando necessário.
6. Revise o diff completo, especialmente workflows, permissões, dependências e arquivos públicos. Resolva comentários.
7. Com `verify` verde e branch atualizada, o mantenedor faz **Squash and merge**. Exclua a branch de trabalho após o merge.
8. Cloudflare Pages publica `main`. Confira a URL de produção e o commit implantado. Banco/funções/templates de e-mail não são publicados pelo Pages.

## Política da main

Exigir PR, check `verify`, branch atualizada, conversas resolvidas e histórico linear. Bloquear force push e exclusão; aplicar também a administradores. Não exigir aprovação de uma segunda pessoa enquanto houver um único mantenedor, pois autores não podem aprovar o próprio PR. Quando houver outro mantenedor, exigir uma aprovação e invalidar aprovações antigas após alterações.

`CODEOWNERS` indica responsabilidade; não é uma barreira de segurança sozinho. Regras efetivas estão em Settings → Branches. Os arquivos do repositório não ativam proteção automaticamente. Nunca desativar uma regra para fazer um check vermelho passar.

## Automação segura

CI em runners hospedados pelo GitHub, com token somente leitura, checkout sem credenciais persistidas e Actions fixadas por SHA. Não usar `pull_request_target` para executar código de terceiros. Não fornecer segredos de produção a forks ou previews. Revisar o código antes de autorizar execução de workflows de contribuidores externos.

`verify` agrega formatação, lint, testes, build, auditoria de dependências de runtime e testes SQL em Supabase descartável. Um job com falha ou cancelado impede o gate. Dependabot propõe atualizações semanais; não há auto-merge. Novos agentes devem respeitar AGENTS.md e não podem aprovar o próprio trabalho nem alterar permissões por conta própria.

## Revisão de acessos

Mensalmente e ao sair alguém: revisar Collaborators, GitHub Apps, deploy keys, Secrets/Environments, membros do Cloudflare e Supabase, e chaves Resend. Conceder o mínimo necessário e remover acessos desnecessários mediante autorização. CI testa autorização do aplicativo; não audita automaticamente as contas externas.

## Recuperação

Correção urgente também usa PR e os mesmos checks. Para frontend, restaurar um deploy conhecido no Pages e abrir PR com a correção. Para banco, criar migration corretiva; não apagar histórico nem executar rollback destrutivo sem análise e autorização.
