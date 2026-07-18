-- Texto do Termo de Autorização e Aceite da Ficha de Captação, configurável
-- pelo Admin (com variáveis substituídas automaticamente na geração do PDF)
-- em vez de fixo no código. Espera-se uma única linha ativa (singleton).
create table public.fichas_captacao_configuracoes (
  id uuid primary key default gen_random_uuid(),
  titulo text not null default 'TERMO DE AUTORIZAÇÃO E ACEITE PARA INTERMEDIAÇÃO IMOBILIÁRIA',
  corpo text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  ativo boolean not null default true
);

create trigger set_updated_at before update on public.fichas_captacao_configuracoes
  for each row execute function public.set_updated_at();

alter table public.fichas_captacao_configuracoes enable row level security;

-- Leitura liberada a qualquer usuário autenticado: o texto não é sensível e
-- precisa ser lido por quem gera a ficha (qualquer um com permissão em
-- imoveis.editar), não só pelo admin que o edita.
create policy fichas_captacao_configuracoes_select
  on public.fichas_captacao_configuracoes for select
  to authenticated
  using (true);

-- Escrita restrita ao módulo "core" — mesma permissão que já controla
-- gestão de usuários/perfis, ou seja, só o admin (seed_admin.sql concede
-- core em todos os módulos).
create policy fichas_captacao_configuracoes_insert
  on public.fichas_captacao_configuracoes for insert
  to authenticated
  with check ((select tem_permissao('core', 'editar')));

create policy fichas_captacao_configuracoes_update
  on public.fichas_captacao_configuracoes for update
  to authenticated
  using ((select tem_permissao('core', 'editar')))
  with check ((select tem_permissao('core', 'editar')));

-- Seed com o texto atual (idêntico ao que já estava fixo no gerador), para
-- a ficha continuar exatamente igual até um admin editar pela tela.
insert into public.fichas_captacao_configuracoes (titulo, corpo)
values (
  'TERMO DE AUTORIZAÇÃO E ACEITE PARA INTERMEDIAÇÃO IMOBILIÁRIA',
  '1. AUTORIZAÇÃO DE INTERMEDIAÇÃO
O(a) PROPRIETÁRIO(A) acima qualificado(a) autoriza, de forma expressa, o CORRETOR/IMOBILIÁRIA a promover a oferta, divulgação, intermediação e negociação do imóvel descrito, podendo apresentar propostas, interagir com interessados e praticar os atos necessários à viabilização da venda/locação.

2. CIÊNCIA E CONCORDÂNCIA
O(a) PROPRIETÁRIO(A) declara estar ciente de que o CORRETOR/IMOBILIÁRIA atuará como intermediador do negócio, representando seus interesses exclusivamente no âmbito da intermediação imobiliária, não configurando transferência de propriedade ou poderes para assinatura de escritura/contrato definitivo.

3. COMISSÃO DE CORRETAGEM
O(a) PROPRIETÁRIO(A) concorda com o pagamento de comissão de corretagem no percentual de {{comissao_percentual}}% sobre o valor total da negociação, a ser paga no momento da concretização do negócio, independentemente de quem tenha apresentado o comprador/locatário, desde que haja participação do CORRETOR/IMOBILIÁRIA na intermediação.

4. NÃO EXCLUSIVIDADE / EXCLUSIVIDADE
(   ) Autorização sem exclusividade
(   ) Autorização com exclusividade
(Assinalar uma das opções)

5. DECLARAÇÕES FINAIS
O(a) PROPRIETÁRIO(A) declara que as informações prestadas são verdadeiras e que detém poderes legais para dispor do imóvel. Declara ainda que leu, compreendeu e concorda com todos os termos aqui estabelecidos.'
);
