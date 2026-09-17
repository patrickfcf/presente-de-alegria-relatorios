# Como contribuir

Este aplicativo simplifica relatórios de visitas, equipes e comunicação da ONG. Mudanças devem manter o fluxo curto e a interface em português do Brasil.

## Preparar o ambiente

Use Node.js 24 e npm. Clone o repositório seguindo o [README](README.md), execute `npm ci`, copie `.env.example` para `.env.local` e configure seu ambiente de desenvolvimento Supabase. Não use dados reais nem execute testes destrutivos em produção.

Crie uma branch com nome descritivo. Leia [AGENTS.md](AGENTS.md) e a documentação da área alterada antes de implementar. Para mudanças maiores de produto, descreva o problema em uma issue sem dados pessoais.

## Enviar uma alteração

1. Mantenha o PR focado em um problema e use commits descritivos, por exemplo `fix: preserve report retry after network failure`.
2. Adicione testes quando houver risco real de regressão em cálculos, validação, permissões, envio ou PDF; documentação simples não exige testes artificiais.
3. Para código, execute `npm run lint`, `npm test` e `npm run build`.
4. Para UI, verifique 390px, 412px e desktop, foco de teclado, labels, erros, toque e estados de carregamento. Para PWA, use o build via `npm run preview` e confira cache e instalação.
5. Para banco/permissões, adicione uma migration nova e valide isolamento e perfis em ambiente de teste com `supabase/tests-security.sql`. Não reescreva migrations já aplicadas.
6. Atualize os guias afetados. No PR, explique o problema, comportamento resultante, verificações executadas e limitações. Use apenas imagens com dados sintéticos.

Não inclua `.env`, tokens, credenciais SMTP, CPFs, assinaturas, anexos ou PDFs reais. Não copie logs com dados pessoais. Vulnerabilidades devem seguir [SECURITY.md](SECURITY.md).

## Produto e licenças

Preserve os cinco perfis, a separação entre coordenador e profissional da instituição e a distinção entre zero e quantidade desconhecida. Dependências novas precisam de finalidade clara e licença compatível. Contribua somente com material que você tem direito de compartilhar sob a [licença do projeto](LICENSE); a marca e os componentes de terceiros seguem [avisos próprios](THIRD_PARTY_NOTICES.md).

Revisão e aprovação cabem aos mantenedores. Não há SLA de revisão; mantenha a comunicação respeitosa e acessível a pessoas voluntárias.
