# Procedimento Operacional Padrão: Backup e Recuperação de Desastres (DRP)
## FlowLeads CRM by Grupo Mário Neto

Este documento estabelece o protocolo oficial de segurança, cópia de segurança (backup) e plano de recuperação de desastres (Disaster Recovery Plan) para a base de dados PostgreSQL hospedada no Supabase.

---

## 1. Arquitetura de Dados e Estratégia de Salvaguarda

O banco de dados do FlowLeads opera no schema isolado `flowleads` em instância gerenciada PostgreSQL no Supabase (AWS us-east-1).

### Objetivos de Resiliência:
- **RPO (Recovery Point Objective)**: Perda máxima tolerável de dados < 24 horas (ou contínua com WAL archiving).
- **RTO (Recovery Time Objective)**: Tempo de restabelecimento do serviço em caso de desastre < 15 minutos.

---

## 2. Níveis de Backup

### Nível 1: Snapshot Estruturado JSON (Execução Local / CLI)
Um script automatizado extrai integralmente todas as entidades relacionais (Organização, Usuários, Funis, Fases, Campos, Cards, Histórico, Checklists, Lojas, Vendedores e Campanhas) para arquivos versionados e datados:

```bash
# Execução manual ou via cronjob diário
node scripts/backup-db.mjs
```

Os arquivos de snapshot são gravados em `backups/flowleads-backup-<TIMESTAMP>.json` e protegidos pelo `.gitignore` para impedir vazamento acidental em repositórios remotos.

### Nível 2: Backups Nativos do Supabase (Cloud Physical Dump / WAL)
1. **Backups Diários Automáticos**: O Supabase realiza snapshots físicos automáticos diários retidos por 7 dias (plano Free/Pro).
2. **Point-In-Time Recovery (PITR)**: Em planos com PITR habilitado, é possível retornar o banco para qualquer segundo dos últimos 7 a 30 dias.
3. **Download de Dumps pelo Dashboard**:
   - Acesse o painel do Supabase -> **Database** -> **Backups**.
   - Localize o snapshot do dia desejado e clique em **Download**.

---

## 3. Procedimento de Restauração em Caso de Desastre

### Cenário A: Restauração a partir do Snapshot JSON
Caso haja exclusão inadvertida de registros de configuração ou cartões:
1. Execute o script de restauração ou injete os dados via Prisma:
```bash
node scripts/restore-db.mjs --file=backups/flowleads-backup-<TIMESTAMP>.json
```

### Cenário B: Restauração Completa via `pg_dump` / `psql` (Supabase CLI)
Caso seja necessário recriar a infraestrutura em um novo projeto Supabase:
1. Obtenha a URL direta do banco (`DIRECT_URL`).
2. Execute o comando de restauração oficial do PostgreSQL:
```bash
# Exportar backup completo do schema:
pg_dump "postgresql://postgres:[SENHA]@[HOST]:5432/postgres" --schema=flowleads --no-owner --no-acl > dump_flowleads.sql

# Restaurar em nova base:
psql "postgresql://postgres:[SENHA]@[NOVO_HOST]:5432/postgres" < dump_flowleads.sql
```
3. Reative o Row Level Security nas 25 tabelas:
```bash
node scripts/enable-supabase-rls.mjs
```

---

## 4. Checklist Pós-Restauração
Após qualquer restauração:
- [ ] Executar `node scripts/enable-supabase-rls.mjs` para garantir que as 25 tabelas permaneçam com RLS ativo.
- [ ] Testar login de supervisor e vendedor via `/auth/login`.
- [ ] Verificar a persistência de cards no Kanban (`/pipes/<id>`).
- [ ] Verificar integridade do painel de Metas (`/`).
