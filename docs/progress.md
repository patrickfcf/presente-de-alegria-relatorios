# Progresso — 17/09/2026

## Implementado

- Descoberta do formulário oficial e identidade visual; logo obtido no site da ONG.
- Repositório público e projeto Supabase gratuito em São Paulo.
- Esquema, RLS, bucket privado, hierarquia de cinco perfis e chamada mensal.
- Edge Functions de administração e envio/PDF implantadas.
- Entrada com escolha de participação, OTP, dashboard, formulário, assinatura/upload, revisão, histórico e download.
- Cadastros por responsabilidade, reenvio de acesso, desativação, exclusão de acesso e substituição da coordenação.
- Notícias, eventos e calendário; publicação restrita a Comunicação/administradores.
- PWA, ícones oficiais, instruções, QR condicionado à URL final e cache apenas de assets públicos.
- README, guias de administração/deploy/segurança, testes de lógica, interface, servidor e PDF.

- Repositório renomeado para `presentedealegria-app`; README com badges, MIT para código, guias CONTRIBUTING/SECURITY, AGENTS e três skills locais versionadas.

## Verificado

- TypeScript e build de produção.
- 25 testes automatizados aprovados: componentes, validação, cálculos, PDF e permissões de publicação.
- GitHub Actions: workflow Quality aprovado no commit `b4dd1f7`, com instalação, lint, testes e build de produção.
- Cinco migrations locais alinhadas ao histórico aplicado no Supabase.
- SQL real em transação revertida: isolamento entre células, arquivos privados, desativação, perfis, duplicação, retomada de falha, concorrência e troca de coordenação.
- PDF sintético renderizado e inspecionado; fonte incorporada para consistência.
- Security Advisor sem WARNING/ERROR; INFO intencional em auditoria privada sem política de cliente.

## Ainda pendente

1. Cloudflare Pages publicado pelo responsável; domínio `presentedealegria.app` conectado.
2. Configuração de Auth/SMTP/template OTP e primeiro administrador; teste real de entrega do e-mail.
3. Lista oficial de células/instituições e cadastro da equipe.
4. URL canônica `https://presentedealegria.app` no QR; atualizar configuração de URLs de Auth na ativação.
5. Aceite completo online, visual em tamanhos de telefone/desktop e instalação em iOS/Android. O navegador disponível não abre localhost; testes de componentes não substituem essa verificação.
6. Retenção e contato de privacidade definidos pela ONG.

Nenhum CPF real, assinatura real ou relatório de produção foi incluído no repositório. Dados dos testes SQL foram revertidos. Nenhuma pessoa foi convidada nem serviço pago habilitado.

## Evolução das publicações

Eventos, Notícias e Ajudas públicos; editor com categorias, resumo, contato, ação, prévia e confirmação pública. Campanhas com prazo, histórico e Pix com favorecido. Permissões SQL conferidas em transação revertida; suite de aplicação ampliada. Teste autenticado de publicação ainda depende do primeiro administrador/SMTP.

## Filtros e descoberta pública

Ordenação por primeira publicação nos eventos, busca/categoria/mês, opções cronológicas e estados sem resultados. Páginas públicas com URLs próprias, metadados sociais, sitemap, robots e página Sobre com participação/apoio. Configuração de Auth ainda pendente no painel: o print mostrou template padrão Magic Link e redirect localhost; template OTP e Site URL corretos estão documentados. Administrador inicial e três eventos/uma campanha já foram cadastrados; não versionar seus dados pessoais.

## Atualização de acesso por e-mail

O responsável confirmou a Site URL de produção e apresentou um e-mail recebido com OTP após configurar SMTP. Entrega do código confirmada; conclusão do login ainda depende de teste. O template `supabase/templates/magic-link.html` recebeu logo oficial, cores da marca, estrutura em tabelas, estilos inline e código selecionável compatível com 6–8 dígitos. A nova identidade visual está preparada no repositório e deve ser copiada para Magic Link no painel; não foi aplicada automaticamente nem testada em clientes de e-mail reais.

## Página inicial e Doação

Página inicial pública na raiz com apresentação breve e quatro cartões. Logo retorna ao início; menu continua com quatro itens, sem aba Início. Minha célula passa a `/#/minha-celula`, mantendo autenticação e permissões. Ajudas foi renomeada visualmente para Doação, preservando `/ajudas/` e os links compartilhados. Metadados e sitemap incluem a página inicial.

## Documentação e governança por PR

Documentação de arquitetura/design/testes/index, README com Resend/Cloudflare, template de PR, CODEOWNERS, Dependabot e Prettier preparados. CI passa a testar aplicação e banco Supabase descartável, com gate `verify`. Checks locais: 43 testes, lint (dois avisos preexistentes), build e auditoria runtime sem vulnerabilidades conhecidas. O banco isolado deve ser validado no runner GitHub porque este ambiente não tem Docker.

A proteção de `main` ainda depende de confirmação de identidade (sudo mode) no GitHub. Política proposta: PR obrigatório, `verify` verde, branch atualizada, conversas resolvidas, histórico linear, sem bypass de administradores, sem force push/exclusão. Não declarar ativa antes de confirmar a regra salva. Não foram alterados acessos de colaboradores, SMTP, banco de produção nem configurações pagas.
