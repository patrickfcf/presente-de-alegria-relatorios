---
name: pda-supabase-reports
description: Implement or review Presente de Alegria Supabase permissions, volunteer hierarchy, monthly reports, private uploads and PDF generation.
---

# Supabase e relatórios privados

Leia `docs/architecture.md`, `docs/administration.md`, `docs/security.md` e as migrations/funções afetadas. Use a matriz de perfis existente para avaliar acesso, incluindo leitura, escrita e Storage.

## Invariantes de autorização

Perfil e atividade vêm de `profiles`, não de metadata editável nem da escolha inicial do cliente. Preserve o isolamento das células para coordenadores, o escopo de gestão da diretoria, e a ausência de acesso a documentos para voluntários/Comunicação. Administração privilegiada exige checagem explícita no servidor.

RLS protege leituras; escritas de negócio usam Edge Functions autenticadas e operações SQL restritas. Não exponha RPC privilegiada, service role ou bypass no frontend. Alteração de role precisa ser conferida também com JWT já emitido; desativação deve bloquear acesso sem esperar novo login.

## Envio, chamada e PDF

Preserve idempotência, proteção contra duplicidade e concorrência, estados processing/failed/submitted e recuperação de falhas. Uma repetição após perda da resposta não pode duplicar relatório nem destruir arquivos válidos. Mudanças em dados após falha precisam poder ser reenviadas.

Campos do profissional não são os do coordenador. Quantidade desconhecida permanece nula. Chamada é interna e não entra no PDF institucional. Documento assinado em papel deve ser preservado junto ao PDF; validação por extensão apenas não basta. Respeite limites existentes de bytes, páginas e resolução.

Use `shared/report.ts` e `shared/pdf.ts`; PDF no servidor com fonte incorporada e logo existente. Não registre CPF, assinatura, conteúdo de arquivos ou tokens em logs. Downloads usam Storage privado com autorização.

## Mudanças e verificação

Adicione migrations novas; não reaplique as já executadas nem altere histórico silenciosamente. Antes de executar SQL remoto, identifique projeto e ambiente; use fixtures sintéticas, transação revertida e escopo autorizado. Teste anon, perfis distintos, outra célula, usuário desativado, chamadas diretas e arquivos, não apenas o menu.

Execute os testes relevantes em `tests/` e `supabase/tests-security.sql` em ambiente apropriado. Para alterações do PDF, gere um exemplo sintético e inspecione layout, assinatura, totais e acentos. Atualize a documentação de permissões e registre limites de verificação.
