# Índice da documentação

| Documento                                    | Quando consultar                             |
| -------------------------------------------- | -------------------------------------------- |
| [README](README.md)                          | Visão geral, execução e serviços             |
| [Arquitetura](architecture.md)               | Componentes e limites de confiança           |
| [Modelo técnico](docs/architecture.md)       | Banco, RLS, envio, arquivos e cache          |
| [Design](design.md)                          | Marca, padrões de interface e acessibilidade |
| [Testes](tests.md)                           | Checks, banco isolado e aceite manual        |
| [Fluxo de PR](docs/contributing-workflow.md) | Branches, revisão, merge e proteção          |
| [Deploy](docs/deployment.md)                 | Cloudflare, Supabase, Resend e rollback      |
| [Administração](docs/administration.md)      | Perfis, células, equipes e publicações       |
| [Segurança](docs/security.md)                | Controles, evidências e limitações           |
| [SEO](docs/seo.md)                           | URLs, sitemap, compartilhamento e indexação  |
| [Progresso](docs/progress.md)                | Histórico e pendências                       |
| [Contribuição](CONTRIBUTING.md)              | Preparação e escopo de mudanças              |
| [Política de segurança](SECURITY.md)         | Relato privado de vulnerabilidades           |
| [Agentes](AGENTS.md)                         | Regras obrigatórias para assistência por IA  |

## Manutenção

Atualizar a documentação no mesmo PR da mudança. Separar implementado, configurado e verificado. Mudanças de acesso exigem revisar a matriz de perfis; novos serviços exigem documentar ambiente, custo e segredos. Exemplos usam dados sintéticos. Não versionar capturas de contas, códigos de login ou relatórios reais.

Documentos de raiz orientam a leitura; detalhes operacionais ficam em `docs/`. Evitar cópias divergentes. A grafia canônica é `architecture.md`, `design.md`, `documents.md` e `tests.md`.
