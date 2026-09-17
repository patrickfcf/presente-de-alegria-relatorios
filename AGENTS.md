# Instruções para agentes

## Projeto

`presentedealegria-app` é uma PWA React + TypeScript + Vite, com Supabase e Cloudflare Pages. Priorize simplicidade, português do Brasil, dispositivos móveis e a identidade visual existente. Consulte `docs/progress.md` para distinguir implementado, verificado e pendente; não apresente preparação como produção funcionando.

## Skills do repositório

Leia apenas a skill relacionada à tarefa, antes de alterar a área:

| Trabalho | Skill |
|---|---|
| UI, formulários, assinatura, acessibilidade, manifest e service worker | `.agents/skills/pda-react-pwa/SKILL.md` |
| Schema, RLS, equipes, funções, uploads e PDF | `.agents/skills/pda-supabase-reports/SKILL.md` |
| CI, variáveis, hospedagem e validação de release | `.agents/skills/pda-cloudflare-release/SKILL.md` |

Skills são instruções versionadas, não permissões de acesso nem dependências de plugins. Se a ferramenta não as descobrir automaticamente, leia o caminho indicado. Não instale ferramentas extras sem necessidade da tarefa.

## Regras de produto

- Os cinco perfis são voluntários. A opção escolhida na entrada não concede permissões; use perfil ativo do banco.
- Coordenador preenche/envia; dados e assinatura do profissional pertencem à instituição.
- Célula vem de cadastro/vínculo, nunca texto livre. Uma visita é esperada por mês ativo, com suporte a visitas adicionais.
- Quantidade vazia significa desconhecida, não zero. Chamada distingue presente, falta justificada e falta sem justificativa válida.
- Preserve hierarquia, histórico e regras em `docs/administration.md`. Diretores/coordenadores não publicam; Comunicação não acessa relatórios.

## Trabalho e validação

Inspecione o diff e o estado do git; preserve alterações de terceiros. Use Node 24, npm e o lockfile. Para alterações de código, rode `npm run lint`, `npm test`, `npm run build`. Acrescente apenas testes que protejam comportamento relevante. Para documentação, confira links, comandos e coerência com o código.

Não declare testes de navegador, instalação física ou entrega de e-mail como executados sem evidência. Informe bloqueios e o que permanece pendente. Atualize README/guias quando configuração, permissões ou comportamento mudarem. Commits devem ser focados; publique somente no escopo autorizado.

## Segurança e operações

Leia `SECURITY.md` e `docs/security.md` para mudanças sensíveis. Nunca versionar dados reais, credenciais, `.env`, relatórios ou assinaturas. Não enfraqueça RLS, JWT ou validação de perfil para corrigir um erro. Não habilite custos, apague recursos importantes ou altere segurança da conta sem autorização específica. Use dados sintéticos e ambiente de teste; migrations existentes já foram aplicadas.

## Marca

Preserve o logo e as cores oficiais; não redesenhe a marca por iniciativa própria. Código MIT; marca e fontes seguem `THIRD_PARTY_NOTICES.md`.
