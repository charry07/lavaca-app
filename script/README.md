# Project Storage Scripts

This folder contains reusable scripts to create users, groups, sessions, and related records in Supabase Postgres.

## Folder structure

- `script/storage/00_create_10_users.sql`
- `script/storage/01_create_user.sql`
- `script/storage/02_create_group_and_members.sql`
- `script/storage/03_create_session_and_participants.sql`
- `script/storage/04_create_payment_account.sql`
- `script/storage/90_review_project_data.sql`
- `script/pre-review-checks.sh`

## Requirements

- `psql` available in your shell
- `DATABASE_URL` exported in your environment
- Optional helper from this repo: `scripts/load-env.sh`

Example:

```bash
./scripts/load-env.sh .env.cli.local
psql "$DATABASE_URL" -f script/storage/90_review_project_data.sql
```

## Create data workflows

### 1) Create user

To create the standard 10 demo users:

```bash
psql "$DATABASE_URL" -f script/storage/00_create_10_users.sql
```

```bash
psql "$DATABASE_URL" \
  -v user_id='user-custom-001' \
  -v phone='+573001111111' \
  -v display_name='New User' \
  -v username='new.user' \
  -v document_id='1000000001' \
  -v email='new.user@example.com' \
  -f script/storage/01_create_user.sql
```

### 2) Create group and members

```bash
psql "$DATABASE_URL" \
  -v group_id='group-custom-001' \
  -v group_name='Friends Group' \
  -v group_icon='FS' \
  -v created_by='user-custom-001' \
  -v member_ids='user-custom-001,user-dev-002,user-dev-003' \
  -f script/storage/02_create_group_and_members.sql
```

### 3) Create session and participants

```bash
psql "$DATABASE_URL" \
  -v session_id='sess-custom-001' \
  -v join_code='VACA-NEW1' \
  -v admin_id='user-custom-001' \
  -v total_amount='180000' \
  -v currency='COP' \
  -v split_mode='equal' \
  -v description='Lunch team' \
  -v status='open' \
  -v participant_ids='user-custom-001,user-dev-002,user-dev-003' \
  -v participant_names='New User,Carlos Romero,Maria Perez' \
  -v participant_amounts='60000,60000,60000' \
  -f script/storage/03_create_session_and_participants.sql
```

### 4) Add payment account for a user

```bash
psql "$DATABASE_URL" \
  -v user_id='user-custom-001' \
  -v method_type='nequi' \
  -v account_holder_name='New User' \
  -v bank_name='Nequi' \
  -v account_number='3001111111' \
  -v account_type='ahorros' \
  -v llave='3001111111' \
  -v phone='+573001111111' \
  -v document_id='1000000001' \
  -v notes='Main account' \
  -v is_preferred='true' \
  -f script/storage/04_create_payment_account.sql
```

## Review query

Run this query before demo/review to inspect data completeness and basic integrity:

```bash
psql "$DATABASE_URL" -f script/storage/90_review_project_data.sql
```

## Project checks before review

```bash
./script/pre-review-checks.sh
```
