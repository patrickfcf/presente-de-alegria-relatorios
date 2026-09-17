# Política de segurança

## Escopo e suporte

O projeto está em fase de ativação. Correções são mantidas na branch `main`; não há suporte separado a versões antigas nem auditoria independente certificada. Veja a [revisão técnica e suas limitações](docs/security.md).

## Relatar uma vulnerabilidade

Não abra uma issue pública com detalhes exploráveis, dados pessoais, tokens, relatórios ou assinaturas.

No GitHub, abra **Security → Advisories** e use **Report a vulnerability**, se esse recurso estiver disponível. Não presumimos que o relato privado esteja habilitado. Se o botão não aparecer, abra uma issue apenas com o título **Solicitação de contato privado de segurança**, sem detalhes técnicos sensíveis; aguarde o mantenedor fornecer um canal privado antes de compartilhar a evidência. Nenhum endereço de segurança dedicado foi definido ainda.

No canal privado, informe área afetada, commit/versão, impacto e reprodução mínima com contas e dados sintéticos. Remova segredos de capturas e logs. Não acesse documentos de terceiros para demonstrar a falha e não faça testes de carga na produção. Este documento não autoriza testes em contas ou infraestrutura da ONG.

Os mantenedores avaliarão o relato e combinarão a divulgação após a correção; não há SLA ou recompensa financeira prometidos.

## Credencial ou dado exposto

Interrompa o compartilhamento, avise o responsável por canal privado e revogue/rotacione a credencial no provedor. Remover o texto de um commit não revoga uma chave nem apaga cópias existentes. Não cole o valor exposto em issues. Alterações de histórico público precisam de coordenação com os mantenedores.

## Invariantes

- Perfis ativos e permissões são validados no backend; esconder um menu não protege dados.
- RLS e arquivos privados devem impedir acesso entre células não autorizadas.
- CPF, assinatura, chamada e relatórios não entram no cache do service worker nem em telemetria.
- Apenas configuração publicável entra em `VITE_*`; credenciais privilegiadas ficam no servidor.
- A assinatura desenhada ou digitalizada não equivale a certificação criptográfica.

Contato de privacidade, retenção e recuperação de backups devem ser definidos pela ONG antes do uso real; este documento não substitui esses procedimentos.
