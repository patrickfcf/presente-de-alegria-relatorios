-- Terminology change only: preserve the role code and all existing permissions.
comment on column public.profiles.role is
  'Perfil de acesso: admin = Administrador; director = Líder de segmento; coordinator = Coordenador; volunteer = Voluntário individual; communications = Equipe de Comunicação e Eventos. director é uma chave técnica legada preservada por compatibilidade.';
comment on column public.profiles.manager_id is
  'Responsável hierárquico: coordenadores se vinculam ao Líder de segmento (role director); voluntários se vinculam ao coordenador. Permissões e histórico são preservados.';
