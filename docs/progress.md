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

1. Cloudflare Pages: navegador bloqueado em verificação anti-bot persistente. Não há site de produção publicado.
2. Configuração de Auth/SMTP/template OTP e primeiro administrador; teste real de entrega do e-mail.
3. Lista oficial de células/instituições e cadastro da equipe.
4. URL final em `VITE_PRODUCTION_URL`, QR e URLs de Auth.
5. Aceite completo online, visual em tamanhos de telefone/desktop e instalação em iOS/Android. O navegador disponível não abre localhost; testes de componentes não substituem essa verificação.
6. Retenção e contato de privacidade definidos pela ONG.

Nenhum CPF real, assinatura real ou relatório de produção foi incluído no repositório. Dados dos testes SQL foram revertidos. Nenhuma pessoa foi convidada nem serviço pago habilitado.
