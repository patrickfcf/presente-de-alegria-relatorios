# Arquitetura e produto — Fase 1

## Evidências

Os três anexos foram inspecionados. Um contém o relatório oficial e o logotipo monocromático; os demais descrevem arquitetura e instalação por QR Code. Não foi fornecido manual de marca. O site oficial forneceu o logotipo colorido em resolução 1015×440 e a referência visual.

A preferência escrita do usuário por Vite + Cloudflare Pages prevalece sobre o exemplo Next.js + Vercel da imagem.

## Design system

Cores observadas no site oficial: roxo #6437D1, roxo escuro #2D1D54, laranja #FE5D37. Fundo claro, tipografia do sistema para leitura e carregamento rápido. Usar roxo em ações com texto branco; laranja decorativo ou com texto escuro após verificar contraste. Botões de pelo menos 48px, campos com fonte de pelo menos 16px. Estados sempre com texto, não apenas cor. Modo claro inicialmente.

## Mapa de páginas

| Página | Conteúdo |
| --- | --- |
| /entrar | E-mail e código, acesso somente por cadastro prévio |
| / | Saudação, célula/instituição, situação do mês e histórico |
| /relatorios/novo | Visita → profissional/indicadores → assinatura → revisão |
| /relatorios/:id | Recibo, dados imutáveis enviados e download autenticado |
| /admin | Mês, célula, coordenador e situação; exportação mensal |
| /admin/cadastros | Instituições, células, coordenadores e vínculos |
| /instalar | Instruções iPhone/Android e QR da URL de produção |
| /privacidade | Uso dos dados e contato da ONG, a definir |

## Modelo de dados proposto (ainda não migrado)

| Entidade | Campos e regras principais |
| --- | --- |
| profiles | id FK auth.users, display_name, role coordinator/admin, active, created_at; papel somente administrável por autoridade verificada |
| institutions | id, name, active |
| cells | id, name, institution_id, active, reporting_start_month |
| cell_memberships | profile_id, cell_id, active; vínculo explícito, sem acesso cruzado |
| report_periods | id, cell_id, month, expected_count padrão 1; unique(cell_id, month); histórico de expectativas preservado |
| visit_reports | id, period_id, cell_id, institution_id, created_by, idempotency_key, visit_date, start_time, end_time, professional_name, professional_role, cpf opcional, três contagens nullable, estimates boolean, declaration_version, signature_path, pdf_path, submitted_at, status, supersedes_id opcional |

Um período admite várias visitas, cada uma com UUID. O mês fica satisfeito quando o total de envios válidos alcança a expectativa registrada naquele período. Células que começaram depois do período não são tratadas como pendentes. Contagens e nomes históricos não mudam quando uma instituição é renomeada: guardar snapshot dos nomes no envio.

Impedir repetição da requisição por chave idempotente e impedir duplicação de célula/instituição/data/horário. Alertar no formulário quando houver outro envio no mês. Não impor unique(cell_id, month) em visit_reports.

## Formulário

Instituição e célula pré-carregadas. Data e horários nativos; horário final posterior ao inicial (visitas atravessando meia-noite ficam fora do primeiro escopo). Nome do profissional obrigatório; CPF opcional até a ONG confirmar necessidade. CPF informado deve passar dígitos verificadores. Quantidades inteiras >= 0; vazio significa desconhecido. Soma parcial rotulada; total definitivo somente quando as três contagens forem conhecidas. Estimativas devem ser explicitamente identificadas.

Assinatura desenhada com dedo/caneta, confirmação explícita, desfazer/limpar, redimensionamento que preserve traços. Alterações no conteúdo após assinar invalidam a assinatura e exigem nova confirmação. Declaração transcrita do papel. Não denominar certificado ICP-Brasil ou prometer aceitação jurídica do desenho.

## Envio/PDF

Validar autorização, vínculo ativo e dados no backend. Reservar relatório com chave idempotente, renderizar PDF com dados canônicos e assinatura, salvar arquivos privados e só então finalizar como enviado. Falhas não podem gerar um falso sucesso; permitir retomada idempotente e remover órfãos de modo controlado. PDF A4 com marca, título, seções, indicadores, declaração, assinatura, UUID e data do envio. Correção preserva original e relacionamento de substituição, sem overwrite silencioso.

## Auth

OTP por e-mail é a escolha inicial: menos suporte por esquecimento, não depende de um link abrir na mesma instância da PWA. Cadastro público desabilitado e shouldCreateUser:false. SMTP próprio é requisito de produção. Não usar o SMTP padrão como solução operacional. Rate limit e mensagens genéricas para evitar enumeração.

## PWA

Manifest com display standalone, scope /, ícones PNG 192/512, Apple touch 180, máscara somente se a composição mantiver a marca legível. Service worker cacheia somente shell e assets públicos versionados. Não cachear APIs, CPF, assinaturas ou PDFs. Limpar rascunho ao sair/enviar; persistir apenas campos não sensíveis de rascunho, por usuário/célula, prazo curto. Não prometer envio offline.

QR Code gerado apenas com a URL final HTTPS configurada; nunca usar localhost ou uma URL imaginada. Safari: Compartilhar → Adicionar à Tela de Início; Chrome Android: Instalar aplicativo/Adicionar à tela inicial. Detectar beforeinstallprompt quando disponível. Uso no navegador sempre possível.
