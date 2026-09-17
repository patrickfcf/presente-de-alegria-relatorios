# Arquitetura e decisões

Frontend estático React/TypeScript/Vite em Cloudflare Pages; Supabase fornece Auth, PostgreSQL, Storage e duas Edge Functions. Sem Next.js ou servidor de hospedagem adicional.

## Modelo

| Tabela | Finalidade |
|---|---|
| institutions | Instituições atendidas |
| cells | Células cadastradas, instituição, período ativo e expectativa mensal (padrão 1) |
| profiles | Conta, nome, e-mail, nome de palhaço, celular, perfil, responsável hierárquico e situação |
| cell_memberships | Vínculos autorizados e célula padrão |
| report_periods | Expectativa da célula em um mês; preserva o valor histórico |
| visit_reports | Visita, profissional, indicadores, prova, estado de processamento, snapshots históricos e caminhos privados |
| report_attendance | Presença/falta, validade da justificativa e nomes históricos dos voluntários |
| news / events | Conteúdo interno, situação editorial e autores |
| private.audit_events | Operações relevantes, sem conteúdo dos formulários |

Diretor → coordenadores → voluntários é representado por `profiles.manager_id`; validação ocorre em operações transacionais exclusivas do servidor. A Comunicação é independente dessa árvore. O administrador inicial é provisionado fora do formulário público.

## Rotas

Rotas por hash evitam configuração extra de SPA e simplificam URLs no PWA:
`#/` entrada/home; `#/relatorios/novo`; `#/enviado/:id`; `#/eventos`; `#/calendario`; `#/noticias`; `#/admin`; `#/cadastros`; `#/publicacoes`; `#/instalar`; `#/privacidade`.

Voluntários veem Eventos/Calendário; Comunicação vê Publicações/Eventos; coordenadores e diretores têm Minha célula/Eventos/Notícias. O menu é apenas apresentação: RLS e funções aplicam a autorização.

## Envio e concorrência

`submit-report` valida a sessão e o perfil ativo, limita o corpo e os anexos, valida os campos e calcula um hash do conteúdo. `reserve_report` verifica célula/roster, registra a intenção e adquire uma concessão de processamento. O servidor gera PDF com pdf-lib, salva originais e PDF no Storage privado e finaliza o relatório por transação.

Um UUID do cliente garante repetição idempotente; a combinação célula/instituição/data/horário inicial impede a mesma visita duplicada. Múltiplas visitas no mês continuam possíveis. Registros em processamento não contam como enviados e seus arquivos não ficam acessíveis. A finalização só aceita arquivos da concessão correta.

O histórico guarda nomes da instituição, célula, coordenador e voluntários no momento do registro. A exclusão de acesso preserva esse histórico.

## Autenticação e offline

Código por e-mail evita senhas esquecidas e links abertos no navegador errado. Não há cadastro público. SMTP e template com `{{ .Token }}` são obrigatórios para operação real.

O PWA guarda apenas o shell público no cache. Nome/CPF/assinatura/anexos/chamada não entram no rascunho local; data, horários e quantidades expiram em sete dias e são removidos ao sair. Entrar, consultar dados e enviar exigem conexão. Não há fila automática de envios offline.
