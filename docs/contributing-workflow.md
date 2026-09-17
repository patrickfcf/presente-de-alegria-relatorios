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

## Atualizações de dependências

Dependabot verifica semanalmente e mantém até três PRs de versões npm e um de GitHub Actions abertos. Atualizações de segurança têm limite separado gerenciado pelo GitHub; esses limites não são uma promessa de no máximo quatro PRs no total.

- `react` reúne React, React DOM e os dois pacotes de tipos, inclusive em mudanças de versão principal. Devem ser testados juntos; nunca integrar somente metade da atualização.
- `development-tools` reúne atualizações menores e correções de ferramentas, excluindo os tipos do React.
- `runtime` reúne atualizações menores e correções das demais dependências de produção.
- `github-actions` reúne as Actions; revisar notas de versões principais, permissões e SHAs antes do merge.
- `@types/node` permanece na linha 24, correspondente ao runtime do projeto. Versões 25 ou superiores são ignoradas até uma migração coordenada do Node.
- Outras versões principais, como TypeScript 7, continuam em PRs separados e exigem revisão de compatibilidade. Check verde não substitui revisão.

As regras passam a valer depois do merge desta configuração na `main` e da execução do Dependabot. PRs antigos podem permanecer abertos durante a reorganização: confira os substitutos antes de encerrar os anteriores. Não integrar os PRs individuais de React #7/#8; aguardar o grupo conjunto. O PR #6 de tipos do Node 26 não corresponde ao runtime atual.

Não há auto-merge. Cada PR deve passar por `verify`, revisão do diff e autorização do mantenedor. Consulte a [referência oficial do Dependabot](https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-options-reference).

## Revisão de acessos

Mensalmente e ao sair alguém: revisar Collaborators, GitHub Apps, deploy keys, Secrets/Environments, membros do Cloudflare e Supabase, e chaves Resend. Conceder o mínimo necessário e remover acessos desnecessários mediante autorização. CI testa autorização do aplicativo; não audita automaticamente as contas externas.

## Recuperação

Correção urgente também usa PR e os mesmos checks. Para frontend, restaurar um deploy conhecido no Pages e abrir PR com a correção. Para banco, criar migration corretiva; não apagar histórico nem executar rollback destrutivo sem análise e autorização.
