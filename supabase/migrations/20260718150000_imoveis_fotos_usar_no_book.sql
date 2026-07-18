-- Seleção de fotos usadas no Book: quando o imóvel tem mais de 6 fotos, a
-- equipe escolhe quais entram no book compacto em vez de sempre usar as
-- 6 primeiras por ordem. Default true para não quebrar imóveis já
-- cadastrados (continuam usando as 6 primeiras por ordem, como hoje).
alter table public.imoveis_fotos
  add column usar_no_book boolean not null default true;
