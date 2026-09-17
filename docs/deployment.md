# Implantação e ativação

## Recursos existentes

- GitHub: https://github.com/patrickfcf/presente-de-alegria-relatorios
- Supabase: projeto **Presente de Alegria**, referência `rzlopgtfuutnuceaoroh`, São Paulo, organização Patrick Fonseca.
- SQL e Edge Functions `admin` e `submit-report` implantados; testes de RLS em transação revertida executados.
- Cloudflare Pages: **ainda não conectado**. O navegador de trabalho foi bloqueado pela verificação anti-bot do dashboard. Nenhum plano pago habilitado.

## Cloudflare Pages com GitHub

1. Em https://dash.cloudflare.com/, abra a conta desejada → **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**. A nomenclatura pode variar com a interface; escolha Pages com integração Git, não upload manual.
2. Se necessário, autorize a aplicação GitHub Cloudflare apenas para `patrickfcf/presente-de-alegria-relatorios`.
3. Nome do projeto: `presente-de-alegria-relatorios`; branch de produção: `main`.
4. Framework: **Vite** ou **None**; comando de build: `npm run build`; saída: `dist`; diretório raiz: repositório.
5. Variável de build `NODE_VERSION`: `24`.
6. Variáveis do aplicativo:

| Nome | Valor |
|---|---|
| `VITE_SUPABASE_URL` | `https://rzlopgtfuutnuceaoroh.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Copiar a chave **Publishable** em Supabase → Settings → API Keys |
| `VITE_PRODUCTION_URL` | URL HTTPS final exibida pelo Pages, sem caminho/hash |

A chave Publishable pode estar no frontend; **nunca usar Secret ou service_role**. Não copiar senhas/tokens para conversas, README ou GitHub.

7. Fazer o primeiro deploy. Se a URL final ainda não era conhecida, preencher `VITE_PRODUCTION_URL` e refazer o deploy. O QR de `#/instalar` passa a apontar para essa URL.
8. Confirmar builds automáticos em pushes de `main`. Build sem variáveis mostra uma página de preparação, nunca dados fictícios como se fossem reais.
9. Conferir headers de `public/_headers`, HTTPS, `/manifest.webmanifest`, `/sw.js` e `/icons/*`.

## Supabase Auth e e-mail

No projeto https://supabase.com/dashboard/project/rzlopgtfuutnuceaoroh:

1. **Authentication → Sign In / Providers**: manter Email habilitado; desativar criação pública de usuários e login anônimo. A criação de usuários ocorre via backend administrativo.
2. **Authentication → URL Configuration**: Site URL = URL final do Pages. Não permitir wildcards amplos em redirect URLs. O fluxo usa código, não depende de redirecionamento de magic link.
3. **Authentication → Email / SMTP Settings**: configurar remetente e SMTP autorizado da ONG. Inserir credenciais somente no painel. O serviço padrão do Supabase é limitado e não serve como confirmação de entrega a toda a equipe.
4. **Email Templates → Magic Link**: usar o template `supabase/templates/magic-link.html`, com `{{ .Token }}` visível e nome do aplicativo. Configurar assunto `Seu código de acesso · Presente de Alegria`.
5. Confirmar validade curta e limite de tentativas/reenvio do OTP no painel. O frontend tem espera de um minuto entre solicitações; o limite de segurança é o do servidor.
6. Manter `verify_jwt = true`: o cliente autenticado envia JWT de usuário em Authorization e chave publicável em apikey. O gateway atual suporta chaves assimétricas. Além disso, ambas as funções validam `auth.getUser` e perfil ativo antes de qualquer operação. Em caso de 401, verificar a sessão e os headers; não desligar autenticação como correção.

## Primeiro administrador

O app não permite autopromoção nem criação de administradores por formulário.

1. No painel Supabase **Authentication → Users → Add user**, criar a conta administrativa com o e-mail indicado pelo responsável da ONG. Usar o mecanismo de convite/criação do painel; nunca compartilhar senha ou código.
2. Em SQL Editor, executar este comando substituindo os dois valores **no painel**:

```sql
insert into public.profiles(id,display_name,email,role,active)
select id,'NOME DO ADMINISTRADOR',email,'admin',true
from auth.users where lower(email)=lower('EMAIL DO ADMINISTRADOR');
```

3. Confirmar que uma linha foi criada. Entrar no app com o código recebido por e-mail. Cadastrar instituições/células oficiais, diretores, coordenadores e Comunicação.
4. Não colocar o comando preenchido com dados reais em migrations ou no repositório.

## Aplicar atualizações de backend

Somente administradores técnicos. Autenticar Supabase CLI localmente sem colar tokens no chat. Conferir os comandos com `supabase --help`, vincular ao projeto e conferir a lista de migrations antes de `db push`.

As migrations já foram aplicadas por MCP. Seus identificadores remotos podem diferir dos timestamps locais; reconciliar a tabela de histórico pela correspondência de nomes antes do primeiro `db push`. **Não reaplicar o esquema inicial sobre o banco existente.**

Deploy das funções inclui arquivos `shared/`, `_shared/http.ts` e import map `supabase/functions/deno.json`. O fontkit e as fontes do PDF são dependências somente do servidor. Segredos são disponibilizados pelo Supabase, nunca por variáveis VITE.

## Aceite antes de convidar pessoas reais

- Administrador entra por código, cria diretor e Comunicação; diretor cria coordenador; coordenador cadastra voluntário.
- Voluntário entra e vê eventos/calendário, sem relatórios. Diretor/coordenador não publicam; Comunicação publica e não acessa documentos.
- Coordenador registra visita e chamada, preenche dados do profissional, assina na tela, revisa e envia.
- PDF contém logo, dados, totais, declaração e assinatura. Original e PDF são baixados.
- Repetir com documento assinado em papel; originais são anexados ao PDF e permanecem baixáveis separadamente.
- Diretor vê envio mensal; outra célula não lê o relatório nem o arquivo; conta desativada perde acesso.
- Trocar coordenação de uma equipe de teste; membros e histórico permanecem corretos.
- iPhone/Safari: compartilhar → adicionar à tela inicial. Android/Chrome: instalar/adicionar à tela inicial. Confirmar logo e abertura standalone em dispositivos reais.
- Verificar larguras 390px e 412px e desktop administrativo; foco, contraste, toque no canvas, logout e erro de conexão.
- QR Code deve abrir a URL final. Modo offline deve mostrar indisponibilidade e jamais fingir que um relatório foi enviado.

`npm test` cobre lógica, PDF e fluxo de componentes. `supabase/tests-security.sql` cobre permissões reais com fixtures revertidas. Essas verificações não substituem o aceite de instalação e autenticação em produção.
