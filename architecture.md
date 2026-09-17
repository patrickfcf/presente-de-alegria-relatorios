# Arquitetura

Aplicativo web instalável da ONG Presente de Alegria, com páginas públicas e operação privada por célula.

| Componente                | Responsabilidade                                                              |
| ------------------------- | ----------------------------------------------------------------------------- |
| React + TypeScript + Vite | Interface móvel, formulários, navegação e validação imediata                  |
| Cloudflare Pages          | HTTPS, domínio `presentedealegria.app`, arquivos estáticos e deploy de `main` |
| Supabase Auth             | Identidade e código temporário por e-mail, somente contas cadastradas         |
| Resend via SMTP           | Entrega dos e-mails de autenticação enviados pelo Supabase                    |
| PostgreSQL + RLS          | Dados, autorização por perfil/célula e operações transacionais                |
| Edge Functions            | Administração, validação de envio, PDF e gravação de arquivos privados        |
| Storage privado           | Comprovantes originais e PDFs; leitura autorizada por relatório               |
| GitHub Actions            | Formatação, lint, testes, build, dependências e permissões no banco isolado   |

## Limites de confiança

Código e publicações liberadas são públicos. Dados de pessoas, relatórios, assinatura e CPF são privados. A chave publicável do Supabase identifica o projeto; não autoriza acesso. A sessão, o perfil ativo, os vínculos e as políticas RLS determinam o acesso. A escolha de perfil na interface não concede privilégios.

O navegador não recebe chaves de serviço nem credenciais SMTP. Toda escrita de negócio passa por funções autenticadas. O Resend não recebe relatórios; sua função é entregar os códigos de acesso.

## Navegação

`/` é a apresentação pública, sem item próprio no menu. O logo retorna ao início. `/#/minha-celula` contém a entrada privada; `/eventos/`, `/noticias/` e `/ajudas/` (Doação) são públicos. URLs internas usam hash; URLs editoriais têm HTML e metadados gerados no build. Não há SSR de publicações nem gateway de pagamentos.

## Detalhamento

- [Modelo de dados, transações, idempotência e cache](docs/architecture.md).
- [Design e acessibilidade](design.md).
- [Autorização e limites da revisão](docs/security.md).
- [Deploy e e-mail](docs/deployment.md).
- [Testes e aceite](tests.md).

Evitar infraestrutura adicional. Migrations e Edge Functions têm implantação separada do frontend. Uma reversão no Cloudflare não reverte dados nem funções do Supabase.
