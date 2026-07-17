# Deploy — Atma CRM em VPS própria (EasyPanel + Supabase self-hosted)

Este documento cobre **só o frontend do Atma CRM**. O Supabase self-hosted já
roda na mesma VPS via o template pronto do EasyPanel (`/etc/easypanel/projects/atma/supabase`)
— não há docker-compose do Supabase aqui, é só usar o que o EasyPanel já
provisiona.

## 1. Variáveis de ambiente do frontend

Só duas variáveis públicas apontam para o Supabase:

| Variável | Onde é usada | Exemplo |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `src/lib/supabase/client.ts`, `server.ts`, `src/proxy.ts` | `https://supabase.atmaimob.com.br` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | idem | a `anon key` da instância (Kong → `ANON_KEY`) |

Confirmado por grep em todo o `src/`: **nenhuma outra variável de Supabase é
lida no código**, e não há nenhuma URL `*.supabase.co` (cloud) fixada em
lugar nenhum — só essas duas variáveis, sempre apontando para a instância
self-hosted. `next.config.ts` inclusive deriva o host permitido de imagens
(`images.remotePatterns`) a partir de `NEXT_PUBLIC_SUPABASE_URL`, então
trocar essa variável já reconfigura o Next automaticamente.

**Pegadinha do Next.js**: variáveis `NEXT_PUBLIC_*` são embutidas no bundle do
client **no momento do build**, não em runtime. Isso significa que, no
Docker, elas precisam ser passadas como **build args**, não só como env vars
do container em produção (ver §3).

## 2. Aplicar as migrations na instância self-hosted

Sem editor SQL do painel cloud, as migrations deste projeto (`supabase/migrations/*.sql`)
são aplicadas via **Supabase CLI** apontando para a connection string da VPS.

### 2.1 Descobrir a connection string

O Postgres self-hosted roda atrás do pooler Supavisor, com um **tenant id**
próprio da instância (não é o `postgres` padrão):

```
postgresql://postgres.<TENANT_ID>:<SENHA>@<HOST>:5432/postgres
```

- `TENANT_ID`: variável `POOLER_TENANT_ID` no `.env` do Supabase no servidor.
- `SENHA`: `POSTGRES_PASSWORD` do mesmo `.env`.
- `HOST`: domínio público da instância (o mesmo de `NEXT_PUBLIC_SUPABASE_URL`,
  sem o `https://`).
- Porta `5432` precisa estar liberada no firewall da VPS para o IP de quem
  vai rodar a migration (ou usar túnel SSH).

Guarde essa string numa variável local `SUPABASE_DB_URL` (nunca versionada,
nunca colada em chat) — por exemplo num `.env.local` que já está no
`.gitignore`.

### 2.2 Aplicar

```bash
supabase db push --db-url "$SUPABASE_DB_URL"
```

**Se o pooler não tiver TLS habilitado** (comum em instâncias recém-criadas
via EasyPanel), `supabase db push` falha exigindo TLS. Nesse caso, aplique
cada migration manualmente e registre o histórico à mão — foi o caminho
usado para colocar este projeto no ar:

```bash
psql "$SUPABASE_DB_URL" -1 -v ON_ERROR_STOP=1 \
  -f supabase/migrations/<arquivo>.sql

psql "$SUPABASE_DB_URL" -c \
  "insert into supabase_migrations.schema_migrations (version, name)
   values ('<timestamp>', '<nome>') on conflict do nothing;"
```

Rode os arquivos em `supabase/migrations/` **em ordem cronológica pelo nome**
(o timestamp no início do arquivo já garante a ordem correta). Depois de
aplicar tudo, rode o seed do administrador uma única vez:

```bash
psql "$SUPABASE_DB_URL" \
  -v email='admin@suaempresa.com.br' \
  -v senha='<senha forte>' \
  -v nome='Nome do Administrador' \
  -f supabase/seeds/seed_admin.sql
```

**Segurança**: habilite TLS no Supavisor ou restrinja a porta 5432 no
firewall só ao(s) IP(s) de quem aplica migrations — hoje, sem TLS, a conexão
ao banco viaja sem criptografia pela internet.

## 3. Dockerfile (build standalone)

`next.config.ts` já tem `output: "standalone"`: o build gera um `server.js`
autocontido em `.next/standalone`, sem precisar do `node_modules` inteiro em
produção. O `Dockerfile` na raiz do projeto faz o build multi-stage
(`deps` → `builder` → `runner`), roda como usuário não-root e expõe a porta
`3000`.

### No EasyPanel

1. Criar um novo app do tipo **Dockerfile** (não "App" genérico), apontando
   para este repositório e o `Dockerfile` da raiz.
2. **Build Variables** (repassadas como `--build-arg` ao `docker build`) —
   necessárias para embutir a URL/chave no bundle do client (`lib/supabase/client.ts`):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. **Env vars de runtime — OBRIGATÓRIAS, não opcionais.** `src/proxy.ts`
   (middleware, roda em toda requisição) e `lib/supabase/server.ts` (Server
   Components) leem `process.env.NEXT_PUBLIC_SUPABASE_URL` **em tempo de
   execução no Node do container**, e isso é independente do valor embutido
   no bundle do client — o build-time embedding só afeta código que roda no
   navegador. Sem essas variáveis também configuradas como env vars normais
   de runtime no EasyPanel, o `proxy.ts` lança exceção em toda requisição e
   o app inteiro responde "Internal Server Error". Configure as mesmas duas
   variáveis nos dois lugares (Build Variables **e** env vars de runtime):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Porta do container: `3000`.
5. Domínio: aponte o domínio do CRM (ex. `crm.atmaimob.com.br`) para esse
   app no EasyPanel; ele cuida do proxy/TLS.

Teste local do build (sem Docker) antes de subir:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://supabase.atmaimob.com.br \
NEXT_PUBLIC_SUPABASE_ANON_KEY=... \
npm run build
```

## 4. Pontos de atenção do self-hosted antes do Auth funcionar de verdade

### 4.1 SMTP (e-mails do GoTrue)

O GoTrue (Auth) **não envia e-mail nenhum por padrão** sem SMTP configurado
no `.env` do Supabase no servidor — nem confirmação de cadastro, nem
recuperação de senha. Hoje o Atma CRM cria usuários direto via SQL
(`supabase/seeds/seed_admin.sql`), já com e-mail confirmado, então a
ausência de SMTP **não bloqueia o uso atual**. Mas antes de:

- adicionar um fluxo de "esqueci minha senha" na tela de login, ou
- deixar algum tipo de auto-cadastro público,

configure no `.env` do Supabase (seção `auth`/GoTrue):

```
SMTP_HOST=...
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
SMTP_SENDER_NAME=Atma CRM
SMTP_ADMIN_EMAIL=naoresponda@atmaimob.com.br
```

e reiniciar o container do `auth`. Sem isso, `supabase.auth.resetPasswordForEmail()`
retorna sucesso na API mas nenhum e-mail chega.

### 4.2 URL pública do Storage

Fotos de imóveis (Prompt 3), Book em PDF (Prompt 7) e Ficha de Captação
(Prompt 8) gravam URLs **absolutas** do Storage nos registros do banco
(`imoveis_fotos.url`, `imoveis_fichas_captacao.pdf_final_url`) via
`getPublicUrl()` do client Supabase — que monta a URL a partir de
`NEXT_PUBLIC_SUPABASE_URL`. Ou seja: **se essa variável apontar para
`localhost` ou um IP interno no momento em que algo for gerado/enviado, a
URL salva fica errada para sempre** (só corrige regravando o registro).
Sempre configure `NEXT_PUBLIC_SUPABASE_URL` com o **domínio público final**
antes de gerar dados de verdade — não só em produção, mas já em qualquer
ambiente de teste que vá persistir dados reais.

Buckets e sua visibilidade (todos criados pelas migrations deste repo):

| Bucket | Público | Motivo |
|---|---|---|
| `imoveis` | Sim | Fotos usadas em cards/detalhe/book — precisam abrir sem login |
| `leads` | Sim | Foto do lead no Kanban |
| `imoveis-fichas` | Sim | PDF da ficha de captação é compartilhado por WhatsApp/e-mail com o proprietário, que não é usuário do sistema |
| `imoveis-documentos` | **Não** | Documentos internos (matrícula, IPTU…) — acesso via URL assinada (`createSignedUrl`, expira em 60s) |

Confirme no Kong (`kong.yml` da instância) que a rota `/storage/v1/object/public/*`
está acessível sem `apikey` — é assim que o `next.config.ts` (`images.remotePatterns`)
e as tags `<img>` do Book conseguem carregar as fotos.
