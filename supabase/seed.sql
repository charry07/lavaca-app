-- ============================================================
-- La Vaca — Seed data for local development and testing
-- Run with: supabase db seed  (or supabase db reset --debug)
-- ============================================================

-- ── Users ────────────────────────────────────────────────────
insert into public.users (id, phone, display_name, username, document_id, email, created_at) values
  ('user-dev-001', '+573001234567', 'Anderson Charry',   'anderson.charry',   '1020304050', 'anderson@lavaca.dev',   now() - interval '60 days'),
  ('user-dev-002', '+573109876543', 'Carlos Romero',     'carlos.romero',     '9988776655', 'carlos@lavaca.dev',     now() - interval '55 days'),
  ('user-dev-003', '+573207654321', 'Maria Perez',       'maria.perez',       '1122334455', 'maria@lavaca.dev',      now() - interval '50 days'),
  ('user-dev-004', '+573305551234', 'Sofia Vargas',      'sofia.vargas',      '6677889900', 'sofia@lavaca.dev',      now() - interval '45 days'),
  ('user-dev-005', '+573403334444', 'Juan Molina',       'juan.molina',       '5544332211', 'juan@lavaca.dev',       now() - interval '40 days'),
  ('user-dev-006', '+573502221111', 'Valentina Rios',    'vale.rios',         '3344556677', 'valentina@lavaca.dev',  now() - interval '35 days'),
  ('user-dev-007', '+573601112222', 'Camilo Torres',     'camilo.torres',     '7788990011', 'camilo@lavaca.dev',     now() - interval '30 days'),
  ('user-dev-008', '+573709998888', 'Daniela Moreno',    'dani.moreno',       '2233445566', 'daniela@lavaca.dev',    now() - interval '20 days')
on conflict (id) do nothing;

-- ── Groups ───────────────────────────────────────────────────
insert into public.groups (id, name, icon, created_by, created_at) values
  ('group-parceros', 'Los Parceros',   '🤝', 'user-dev-001', now() - interval '45 days'),
  ('group-trabajo',  'Equipo Trabajo', '💼', 'user-dev-001', now() - interval '30 days')
on conflict (id) do nothing;

insert into public.group_members (group_id, user_id, created_at) values
  ('group-parceros', 'user-dev-001', now() - interval '45 days'),
  ('group-parceros', 'user-dev-002', now() - interval '45 days'),
  ('group-parceros', 'user-dev-003', now() - interval '44 days'),
  ('group-parceros', 'user-dev-004', now() - interval '43 days'),
  ('group-trabajo',  'user-dev-001', now() - interval '30 days'),
  ('group-trabajo',  'user-dev-005', now() - interval '30 days'),
  ('group-trabajo',  'user-dev-006', now() - interval '29 days'),
  ('group-trabajo',  'user-dev-007', now() - interval '28 days')
on conflict (group_id, user_id) do nothing;

-- ── Sessions ─────────────────────────────────────────────────
-- Session 1: Almuerzo El Corral — open, equal split, 4 people, 120.000 COP
insert into public.sessions (id, join_code, admin_id, total_amount, currency, split_mode, description, status, created_at) values
  ('sess-001', 'VACA-ALM1', 'user-dev-001', 120000, 'COP', 'equal', 'Almuerzo El Corral', 'open', now() - interval '2 hours')
on conflict (id) do nothing;

-- Session 2: Cena cumpleanos Sofia — open, roulette, 4 people, 350.000 COP
insert into public.sessions (id, join_code, admin_id, total_amount, currency, split_mode, description, status, created_at) values
  ('sess-002', 'VACA-CUM2', 'user-dev-004', 350000, 'COP', 'roulette', 'Cena cumpleanos Sofia', 'open', now() - interval '1 day')
on conflict (id) do nothing;

-- Session 3: Rumba viernes — closed, percentage split, 5 people, 480.000 COP
insert into public.sessions (id, join_code, admin_id, total_amount, currency, split_mode, description, status, created_at, closed_at) values
  ('sess-003', 'VACA-RMB3', 'user-dev-002', 480000, 'COP', 'percentage', 'Rumba viernes', 'closed', now() - interval '7 days', now() - interval '6 days')
on conflict (id) do nothing;

-- Session 4: Desayuno equipo — open, equal, 3 people, 95.000 COP
insert into public.sessions (id, join_code, admin_id, total_amount, currency, split_mode, description, status, created_at) values
  ('sess-004', 'VACA-DES4', 'user-dev-001', 95000, 'COP', 'equal', 'Desayuno equipo', 'open', now() - interval '3 hours')
on conflict (join_code) do nothing;

-- Session 5: Uber compartido — closed, equal, 3 people, 42.000 COP (historical)
insert into public.sessions (id, join_code, admin_id, total_amount, currency, split_mode, description, status, created_at, closed_at) values
  ('sess-005', 'VACA-UBR5', 'user-dev-003', 42000, 'COP', 'equal', 'Uber compartido aeropuerto', 'closed', now() - interval '14 days', now() - interval '14 days')
on conflict (id) do nothing;

-- ── Participants ──────────────────────────────────────────────
-- Session 1 — Almuerzo El Corral (equal: 30.000 c/u)
insert into public.participants (join_code, user_id, display_name, amount, status, joined_at) values
  ('VACA-ALM1', 'user-dev-001', 'Anderson Charry', 30000, 'confirmed', now() - interval '2 hours'),
  ('VACA-ALM1', 'user-dev-002', 'Carlos Romero',   30000, 'reported',  now() - interval '1 hour 50 min'),
  ('VACA-ALM1', 'user-dev-003', 'Maria Perez',     30000, 'pending',   now() - interval '1 hour 45 min'),
  ('VACA-ALM1', 'user-dev-004', 'Sofia Vargas',    30000, 'pending',   now() - interval '1 hour 40 min')
on conflict (join_code, user_id) do nothing;

-- Session 2 — Cena cumpleanos Sofia (roulette — Carlos paga todo)
insert into public.participants (join_code, user_id, display_name, amount, status, is_roulette_winner, is_roulette_coward, joined_at, paid_at) values
  ('VACA-CUM2', 'user-dev-004', 'Sofia Vargas',   87500, 'confirmed', false, false, now() - interval '1 day',         now() - interval '23 hours'),
  ('VACA-CUM2', 'user-dev-001', 'Anderson Charry',87500, 'confirmed', false, false, now() - interval '23 hours 50 min', now() - interval '23 hours'),
  ('VACA-CUM2', 'user-dev-002', 'Carlos Romero',  350000, 'confirmed', true, false, now() - interval '23 hours 45 min', now() - interval '22 hours'),
  ('VACA-CUM2', 'user-dev-005', 'Juan Molina',    0,      'confirmed', false, true,  now() - interval '23 hours 40 min', now() - interval '22 hours')
on conflict (join_code, user_id) do nothing;

-- Session 3 — Rumba viernes (closed, percentage: 40/30/15/10/5)
insert into public.participants (join_code, user_id, display_name, amount, percentage, status, joined_at, paid_at) values
  ('VACA-RMB3', 'user-dev-002', 'Carlos Romero',   192000, 40, 'confirmed', now() - interval '7 days', now() - interval '7 days'),
  ('VACA-RMB3', 'user-dev-001', 'Anderson Charry', 144000, 30, 'confirmed', now() - interval '7 days', now() - interval '6 days 23 hours'),
  ('VACA-RMB3', 'user-dev-006', 'Valentina Rios',   72000, 15, 'confirmed', now() - interval '7 days', now() - interval '6 days 22 hours'),
  ('VACA-RMB3', 'user-dev-003', 'Maria Perez',      48000, 10, 'confirmed', now() - interval '7 days', now() - interval '6 days 21 hours'),
  ('VACA-RMB3', 'user-dev-007', 'Camilo Torres',    24000,  5, 'confirmed', now() - interval '7 days', now() - interval '6 days 20 hours')
on conflict (join_code, user_id) do nothing;

-- Session 4 — Desayuno equipo (equal: ~31.666 c/u, redondeo)
insert into public.participants (join_code, user_id, display_name, amount, status, joined_at) values
  ('VACA-DES4', 'user-dev-001', 'Anderson Charry', 31667, 'confirmed', now() - interval '3 hours'),
  ('VACA-DES4', 'user-dev-005', 'Juan Molina',     31667, 'pending',   now() - interval '2 hours 50 min'),
  ('VACA-DES4', 'user-dev-006', 'Valentina Rios',  31666, 'pending',   now() - interval '2 hours 45 min')
on conflict (join_code, user_id) do nothing;

-- Session 5 — Uber compartido (closed, equal: 14.000 c/u)
insert into public.participants (join_code, user_id, display_name, amount, status, joined_at, paid_at) values
  ('VACA-UBR5', 'user-dev-003', 'Maria Perez',     14000, 'confirmed', now() - interval '14 days', now() - interval '14 days'),
  ('VACA-UBR5', 'user-dev-001', 'Anderson Charry', 14000, 'confirmed', now() - interval '14 days', now() - interval '14 days'),
  ('VACA-UBR5', 'user-dev-004', 'Sofia Vargas',    14000, 'confirmed', now() - interval '14 days', now() - interval '14 days')
on conflict (join_code, user_id) do nothing;

-- ── Feed events ───────────────────────────────────────────────
insert into public.feed_events (id, session_id, type, message, created_at) values
  ('feed-001', 'sess-002', 'roulette_winner', 'Carlos Romero giro la ruleta y le toco pagar todo en Cena cumpleanos Sofia', now() - interval '22 hours'),
  ('feed-002', 'sess-002', 'roulette_coward',  'Juan Molina escapo de la ruleta en Cena cumpleanos Sofia',                  now() - interval '22 hours'),
  ('feed-003', 'sess-003', 'session_closed',   'La mesa Rumba viernes fue cerrada. 480.000 COP divididos entre 5 personas', now() - interval '6 days'),
  ('feed-004', 'sess-003', 'fast_payer',       'Carlos Romero pago primero en Rumba viernes',                               now() - interval '7 days'),
  ('feed-005', 'sess-005', 'session_closed',   'La mesa Uber compartido aeropuerto fue cerrada. 42.000 COP entre 3',        now() - interval '14 days')
on conflict (id) do nothing;

insert into public.feed_event_users (event_id, user_id) values
  ('feed-001', 'user-dev-002'),
  ('feed-001', 'user-dev-004'),
  ('feed-002', 'user-dev-005'),
  ('feed-002', 'user-dev-004'),
  ('feed-003', 'user-dev-002'),
  ('feed-004', 'user-dev-002'),
  ('feed-005', 'user-dev-003')
on conflict (event_id, user_id) do nothing;
