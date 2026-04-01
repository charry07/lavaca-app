-- Seed 10 demo users
-- Usage:
--   psql "$DATABASE_URL" -f script/storage/00_create_10_users.sql

insert into public.users (id, phone, display_name, username, document_id, email, created_at) values
  ('user-dev-001', '+573001234567', 'Anderson Charry', 'anderson.charry', '1020304050', 'anderson@lavaca.dev', now() - interval '60 days'),
  ('user-dev-002', '+573109876543', 'Carlos Romero', 'carlos.romero', '9988776655', 'carlos@lavaca.dev', now() - interval '55 days'),
  ('user-dev-003', '+573207654321', 'Maria Perez', 'maria.perez', '1122334455', 'maria@lavaca.dev', now() - interval '50 days'),
  ('user-dev-004', '+573305551234', 'Sofia Vargas', 'sofia.vargas', '6677889900', 'sofia@lavaca.dev', now() - interval '45 days'),
  ('user-dev-005', '+573403334444', 'Juan Molina', 'juan.molina', '5544332211', 'juan@lavaca.dev', now() - interval '40 days'),
  ('user-dev-006', '+573502221111', 'Valentina Rios', 'vale.rios', '3344556677', 'valentina@lavaca.dev', now() - interval '35 days'),
  ('user-dev-007', '+573601112222', 'Camilo Torres', 'camilo.torres', '7788990011', 'camilo@lavaca.dev', now() - interval '30 days'),
  ('user-dev-008', '+573709998888', 'Daniela Moreno', 'dani.moreno', '2233445566', 'daniela@lavaca.dev', now() - interval '20 days'),
  ('user-dev-009', '+573800001111', 'Laura Gomez', 'laura.gomez', '4455667788', 'laura@lavaca.dev', now() - interval '18 days'),
  ('user-dev-010', '+573811112222', 'Mateo Ruiz', 'mateo.ruiz', '5566778899', 'mateo@lavaca.dev', now() - interval '15 days')
on conflict (id) do nothing;
