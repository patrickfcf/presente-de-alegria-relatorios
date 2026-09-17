# Testes e qualidade

## Verificações locais

```sh
npm ci
npm run format:check
npm run lint
npm test
npm run build
# Todos os checks acima:
npm run check
```

`npm run format` aplica Prettier a TypeScript, TSX, JavaScript, CSS, JSON, YAML, HTML e Markdown. SQL e assets não são reformatados. O lockfile é gerado pelo npm.

## Cobertura existente

| Área                                                | Evidência                                                                         |
| --------------------------------------------------- | --------------------------------------------------------------------------------- |
| Cálculos, campos, CPF e limites                     | Vitest em `tests/report.test.ts` e `src/lib/report.test.ts`                       |
| Formulário, assinatura/papel, equipe                | `tests/ui.test.tsx`, com mocks de serviços                                        |
| PDF                                                 | `tests/pdf.test.ts`, documentos sintéticos                                        |
| Função administrativa                               | `tests/edge-permissions.test.ts`: negar publicação e elevação de perfil indevidas |
| Publicações                                         | `tests/publications.test.tsx`: filtros, validação, Pix e texto WhatsApp           |
| Entrada pública e login                             | `tests/navigation.test.tsx`                                                       |
| RLS, arquivos, hierarquia, desativação, duplicações | `supabase/tests-security.sql`, banco real isolado                                 |
| Leitura pública, rascunhos e autor oculto           | `supabase/tests-publications.sql`, banco real isolado                             |

43 testes de aplicação passaram antes desta reorganização. Não usar contagem como substituto de cobertura de risco. Os testes de funções com mocks não comprovam RLS; os scripts SQL complementam essa camada.

## Banco descartável

Requer Docker em execução e a CLI Supabase fixada no lockfile:

```sh
npx supabase start -x studio,imgproxy,edge-runtime,logflare,vector,supavisor
npm run test:rls
npx supabase stop --no-backup
```

O start aplica migrations ao ambiente local. As fixtures SQL usam transação com rollback e interrompem na primeira falha. O script de teste usa apenas o container local de nome fixo; não recebe URL remota nem credenciais de produção. Não usar `--linked` ou reset remoto. Para reaplicar migrations do zero em ambiente local descartável, usar `npx supabase db reset --local --no-seed`.

## Gates no GitHub

O workflow Quality roda em PRs e em `main`. `quality` verifica formatação, lint, testes, TypeScript/build e vulnerabilidades altas/críticas nas dependências de runtime. `database` verifica migrations e RLS em containers descartáveis. `verify` exige sucesso dos dois jobs e é o check estável exigido pela proteção da branch.

Os jobs não precisam de segredos da ONG. Falha de download/registry também bloqueia; investigar e repetir a execução sem remover o gate. Dependabot propõe atualizações, sem merge automático. Dois avisos de lint sobre efeitos React já existiam; não são falhas novas nem são ocultados.

## Aceite manual

Conferir 390px, 412px e desktop; teclado, foco, erros legíveis, contraste, zoom e assinatura por toque. Validar login com código novo, fluxo completo de relatório/PDF e isolamento com duas contas de células distintas. Validar instalação real no Safari/iPhone e Chrome/Android. Conferir e-mail recebido, não apenas a prévia do Supabase. Seguir [deploy](docs/deployment.md) e registrar o que permanece pendente.

Não existe teste E2E automatizado completo em dispositivos físicos. CI verde não comprova entrega de SMTP, DNS, instalação móvel ou configurações atuais das contas externas.
