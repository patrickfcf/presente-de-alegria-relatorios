# Revisão de segurança

Revisão técnica em 17/09/2026. Não representa certificação legal ou garantia de ausência de falhas.

## Implementado e verificado

- RLS em todas as tabelas expostas; clientes têm somente SELECT. Visitantes anônimos leem apenas colunas editoriais de publicações liberadas; identificadores de autores/editores não estão incluídos. Toda escrita de negócio passa pelas funções autenticadas.
- Papéis e situação vêm de `profiles`, nunca de `user_metadata`, seleção de tela ou payload do cliente.
- Coordenadores leem documentos apenas de suas células. Voluntários e Comunicação não leem relatórios, presença, CPF ou assinaturas.
- Desativação consultada a cada operação e leitura de dados; não depende de renovar o JWT.
- Liderança de segmento não pode publicar; Comunicação não pode cadastrar usuários. Promoção/substituição exige administrador ou líder de segmento da equipe.
- Storage privado e política vinculada ao arquivo exato de relatório enviado; uploads e exclusões somente no servidor.
- Funções privilegiadas SQL são SECURITY INVOKER, com EXECUTE revogado de PUBLIC/anon/authenticated. Helpers de leitura SECURITY DEFINER ficam no esquema não exposto `private`, com search_path vazio e usuário autenticado obrigatório.
- Limites de corpo, arquivo, resolução e páginas. Tipo reconhecido pelos bytes; PDF gerado no servidor. PDFs anexados não são considerados validação criptográfica da assinatura.
- Estado processing/failed/submitted, prevenção de duplicação, concessão exclusiva e preservação dos arquivos em caso de confirmação de envio perdida.
- Sem credenciais de serviço no cliente, rastreadores ou conteúdo pessoal em logs; cabeçalhos CSP, anti-frame e no-referrer preparados para Cloudflare.
- Cache do service worker limitado a assets públicos. Rascunho local sem dados pessoais do profissional, assinatura, anexos ou chamada.

`supabase/tests-security.sql` passou no banco remoto usando dados sintéticos em transação revertida: isolamento de células/arquivos, cinco papéis, desativação com identidade existente, bloqueio de escrita direta/RPC, retry idempotente, duplicação, rejeição de lease nulo, troca da própria equipe e preservação do histórico.

Supabase Security Advisor: sem alertas WARNING/ERROR. Há INFO em `private.audit_events` por RLS sem política, intencional: nenhum cliente lê a auditoria; somente servidor. Referência: https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy

## Limites e pendências de lançamento

- Configurar SMTP, template OTP, desativar signup público e testar um login real.
- Testar integração completa em produção com contas de teste, inclusive JWT do projeto, PDF baixado, assinatura touch e instalação iOS/Android.
- Definir retenção, contato de privacidade, correções administrativas e recuperação de backup com a ONG.
- Conteúdo de anexos não passa por antivírus/OCR; usuários autorizados devem conferir origem e legibilidade. Nenhum anexo é renderizado como HTML no aplicativo.
- Operações usam perfil ativo além de Auth. Revogação de sessão no provedor não necessariamente invalida imediatamente JWT já emitido; para bloqueio imediato de dados, desativar o perfil.
- Exclusão de acesso preserva dados históricos. Pedidos de descarte devem seguir procedimento próprio e finalidade documental definida pela ONG.

Publicações abertas: `supabase/tests-publications.sql` verifica visitantes, rascunhos/agendamento, escrita direta negada, ocultação de autores e proteção de perfis/relatórios/arquivos, além de editor desativado. Fixtures sintéticas em transação revertida. Conteúdo publicado pode ser copiado por visitantes; arquivar não elimina cópias externas.

Revisão posterior: o Advisor reportou proteção contra senhas vazadas desativada em Auth. Não alterada automaticamente; o fluxo do aplicativo é OTP, mas a conta inicial foi criada com senha no painel. Avaliar as configurações e disponibilidade do plano antes de habilitar. Referência: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection. O trigger de data editorial é SECURITY INVOKER, não expõe RPC e os testes públicos continuam exigindo somente leitura anônima.
