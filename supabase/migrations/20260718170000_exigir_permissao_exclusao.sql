-- A policy de UPDATE de imoveis/leads/parceiros/proprietarios já existia e
-- checa só 'editar' — como o soft-delete deste projeto é um UPDATE
-- (ativo=false), não um DELETE físico, a permissão "excluir" (distinta de
-- "editar" em core_permissoes) nunca era realmente exigida: qualquer editor
-- já conseguia "excluir" via API. Este trigger fecha a lacuna, disparando
-- só quando o registro está sendo desativado (ativo passa de true a false).
create or replace function public.exigir_permissao_exclusao()
returns trigger
language plpgsql
as $$
begin
  if old.ativo = true and new.ativo = false then
    if not tem_permissao(TG_ARGV[0], 'excluir') then
      raise exception 'Sem permissão para excluir neste módulo';
    end if;
  end if;
  return new;
end;
$$;

create trigger exigir_permissao_exclusao before update on public.imoveis
  for each row execute function public.exigir_permissao_exclusao('imoveis');

create trigger exigir_permissao_exclusao before update on public.leads
  for each row execute function public.exigir_permissao_exclusao('leads');

create trigger exigir_permissao_exclusao before update on public.parceiros
  for each row execute function public.exigir_permissao_exclusao('parceiros');

create trigger exigir_permissao_exclusao before update on public.proprietarios
  for each row execute function public.exigir_permissao_exclusao('proprietarios');
