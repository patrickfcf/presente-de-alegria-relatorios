# Administração do aplicativo

Todos os perfis representam voluntários; o perfil controla responsabilidades e acesso.

| Perfil                | Pessoas                                                                                                     | Relatórios                                                             | Publicações                                           |
| --------------------- | ----------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------- |
| Administrador         | Cria/edita os outros quatro perfis; reenvia acesso; exclui acesso; vincula responsáveis e células           | Todas as células, downloads e indicadores                              | Controle administrativo completo                      |
| Líder de segmento     | Cria/edita seus coordenadores; consulta voluntários; substitui coordenador por voluntário da própria equipe | Consulta geral, pendências e comparações                               | Apenas leitura das publicações disponíveis            |
| Coordenador           | Cria/edita/desativa e reenvia acesso de seus voluntários                                                    | Envia e consulta relatórios das células autorizadas; registra presença | Apenas leitura                                        |
| Voluntário individual | Próprio perfil, sem edição de permissões                                                                    | Sem acesso                                                             | Eventos, calendário, notícias e ajudas públicas       |
| Comunicação e Eventos | Sem gestão de pessoas                                                                                       | Sem acesso a documentos, CPF ou assinatura                             | Cria/edita/publica/arquiva notícias, eventos e ajudas |

Escolher uma opção na tela inicial não altera o perfil. A permissão é sempre consultada no banco.

## Começar

1. Administrador cadastra instituições e células, usando a lista oficial da ONG.
2. Cadastra líderes de segmento e a equipe de Comunicação e Eventos.
3. Administrador ou líder de segmento cadastra coordenador: nome, e-mail, nome de palhaço, celular, líder de segmento responsável e célula.
4. Coordenador cadastra voluntários em **Minha equipe**. A célula é herdada do coordenador.
5. O cadastro envia um código por e-mail. Depois, cada pessoa solicita novo código em **Receber código**.

Não compartilhe códigos nem senhas. O reenvio de acesso envia um novo OTP e não encerra sessões existentes. Para bloquear alguém, desative o cadastro: os dados ficam inacessíveis mesmo com um token ainda válido.

## Trocar a coordenação

Administrador ou líder de segmento da equipe escolhe **Substituir coordenador**, seleciona um voluntário ativo da mesma equipe e confirma. O voluntário assume a coordenação e os vínculos; o coordenador anterior passa a voluntário. Os relatórios e nomes históricos permanecem como registrados.

Antes de desativar/excluir um responsável, reatribua os subordinados. **Excluir acesso** bloqueia o perfil e remove o acesso de autenticação, mantendo referências necessárias aos relatórios e à auditoria. Não é um comando de descarte de todos os dados pessoais.

## Registrar a visita

Uma visita é esperada por célula em cada mês ativo. A data efetiva vem do formulário, não do dia em que ele é enviado; isso permite registros retroativos desde o início de atividade da célula.

O coordenador registra cada voluntário ativo de sua equipe: presente, falta com justificativa válida ou falta sem justificativa válida. Não coletamos textos de justificativa, diagnósticos nem documentos médicos. A chamada usa a equipe vinculada no momento do envio; alterações retroativas de composição precisam de conferência administrativa.

Nome, função, CPF e assinatura do formulário são do profissional da instituição. O coordenador aparece como responsável pelo envio. Quantidades desconhecidas ficam vazias; zero significa nenhum. CPF e função são opcionais. O total incompleto é apresentado como subtotal, sem inventar dados.

Use assinatura na tela ou anexe a folha assinada. Arquivos: até três, 5 MB cada, PDF/JPG/PNG, até 20 páginas combinadas; fotos HEIC devem ser convertidas para JPG. O documento enviado deve estar legível e assinado. O sistema não verifica autenticidade de uma assinatura desenhada nem oferece certificação ICP-Brasil.

A chamada é interna; o PDF institucional segue o modelo de visita e não lista ausências de voluntários. Relatórios enviados são imutáveis na interface. Correções administrativas devem manter registro da versão original e do motivo; não editar o banco informalmente.

## Notícias e eventos

A Comunicação abre **Publicações**. Notícias têm título, texto e data; eventos têm título, descrição, local, início e término opcional. Horários são de Brasília. Notícias futuras são mostradas na data programada. Eventos publicados aparecem imediatamente, mesmo que ocorram no futuro. Rascunhos/arquivados são visíveis apenas a Comunicação e administradores.

## Privacidade e manutenção

A ONG deve definir contato de privacidade, prazo de retenção e procedimento de correção/descarte antes da operação. O aplicativo não apaga relatórios automaticamente. Downloads em aparelhos ficam sob responsabilidade de quem os baixou. Não use aparelhos compartilhados sem sair da conta.

Revisar usuários inativos regularmente; guardar exportações privadas com acesso restrito; testar restauração de backup conforme o plano contratado. Não habilitar planos pagos sem decisão explícita da ONG. Não compartilhar relatórios, CPFs, assinaturas ou exportações no GitHub.

## Publicações públicas e Ajudas

Eventos, Notícias, Calendário e Ajudas estão disponíveis sem login. O acesso a Minha célula, relatórios e gestão continua autenticado. A Comunicação e administradores são os únicos editores. Uma publicação marcada como publicada requer confirmação explícita de divulgação pública, inclusive contatos e informações de Pix.

- Notícias: categoria, resumo, texto e data/hora de publicação, com contato/link opcional.
- Eventos: categoria (encontro, beneficente, ação pontual ou formação), resumo, descrição, início/fim, local, contato público e link de inscrição. Calendário acessível pela aba Eventos.
- Ajudas: categoria (doação, Pix, arrecadação, rifa ou bingo), finalidade, orientações, publicação/prazo, contato e link oficial. Pix exige chave e nome do favorecido. Prefira chave aleatória ou CNPJ autorizado da ONG.

Use a prévia e confira os destinos dos links. Só URLs HTTPS sem credenciais são aceitas. Notícias e Ajudas futuras só ficam públicas na data indicada; eventos publicados aparecem imediatamente. Campanhas encerradas ficam no histórico mediante filtro e não exibem botões de participação ou Pix. Arquivar remove a publicação do feed.

O aplicativo apenas divulga campanhas; não processa pagamentos, confirma doações, vende números ou executa sorteios. Em rifas/bingos, o responsável deve fornecer regras, condições e contato, e conferir a adequação da ação antes de publicar. Não crie campanhas ou chaves de exemplo na produção.

## Nome do perfil e compatibilidade

O nome oficial é **Líder de segmento**. O identificador persistido `director` é mantido como chave técnica de compatibilidade em `profiles.role`, APIs, RLS e preferências de entrada existentes. Não é um sexto perfil. Alterar a denominação não amplia nem reduz permissões. `profiles.manager_id` continua ligando coordenadores ao líder de segmento e voluntários ao coordenador.

A migration `segment_leader_terminology` documenta essa correspondência no banco sem regravar perfis, vínculos ou auditoria histórica. As migrations antigas permanecem imutáveis.
