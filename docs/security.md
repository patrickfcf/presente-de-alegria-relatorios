# Segurança planejada / gates de produção

Ainda não revisado em um banco implantado. Este documento não representa aprovação de segurança.

- RLS em toda tabela exposta. Usuários sem perfil ativo não leem nem escrevem dados.
- Papel administrativo não vem de user_metadata nem de valor enviado pelo cliente.
- Coordenador acessa somente células com vínculo ativo; teste também após desativação com token já emitido.
- Storage privado; acesso condicionado ao relatório e ao vínculo, sem listagem pública. Download autenticado preferido; links assinados, se usados, com expiração curta.
- Funções administrativas verificam usuário e papel antes de usar service role. Segredos somente no ambiente Supabase.
- Tabelas de relatórios enviados sem UPDATE/DELETE direto pelo cliente. Corrigir com histórico.
- Não incluir dados reais em repositório público, screenshots de CI, logs, fixtures ou analytics.
- Cabeçalhos de segurança e CSP compatível com Supabase; nenhuma dependência de trackers.
- Cache do service worker limitado a shell/assets. CPF e assinatura ficam apenas em memória até envio; rascunhos não sensíveis com expiração.
- Nome do profissional e assinatura necessários ao relatório; CPF opcional até confirmação da finalidade. Sem dados identificáveis de pacientes.
- ONG deve definir contato de privacidade, acesso administrativo, prazo de retenção e descarte antes do lançamento. Não inventar prazo legal nem executar exclusão automaticamente.
- Testar isolamento de duas células, conta inativa, usuário anônimo, tentativa de autopromoção e objetos Storage de outra célula.
- Registrar falhas operacionais com UUID/código, sem conteúdo de formulários ou tokens.
- Exportações mensais são privadas e iniciadas por administrador autenticado.
