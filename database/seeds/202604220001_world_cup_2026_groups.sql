insert into competitions (id, name, edition, host)
values (
  'world-cup-2026',
  'Bolao da Copa',
  'FIFA World Cup 2026',
  'Canadá, Estados Unidos e México'
)
on conflict (id) do update
set
  name = excluded.name,
  edition = excluded.edition,
  host = excluded.host;

insert into competition_groups (id, competition_id, code, name, group_order)
values
  ('world-cup-2026-group-a', 'world-cup-2026', 'A', 'Grupo A', 1),
  ('world-cup-2026-group-b', 'world-cup-2026', 'B', 'Grupo B', 2),
  ('world-cup-2026-group-c', 'world-cup-2026', 'C', 'Grupo C', 3),
  ('world-cup-2026-group-d', 'world-cup-2026', 'D', 'Grupo D', 4),
  ('world-cup-2026-group-e', 'world-cup-2026', 'E', 'Grupo E', 5),
  ('world-cup-2026-group-f', 'world-cup-2026', 'F', 'Grupo F', 6),
  ('world-cup-2026-group-g', 'world-cup-2026', 'G', 'Grupo G', 7),
  ('world-cup-2026-group-h', 'world-cup-2026', 'H', 'Grupo H', 8),
  ('world-cup-2026-group-i', 'world-cup-2026', 'I', 'Grupo I', 9),
  ('world-cup-2026-group-j', 'world-cup-2026', 'J', 'Grupo J', 10),
  ('world-cup-2026-group-k', 'world-cup-2026', 'K', 'Grupo K', 11),
  ('world-cup-2026-group-l', 'world-cup-2026', 'L', 'Grupo L', 12)
on conflict (id) do update
set
  code = excluded.code,
  name = excluded.name,
  group_order = excluded.group_order;

insert into teams (id, competition_id, group_id, name, short_name, code)
values
  ('mex', 'world-cup-2026', 'world-cup-2026-group-a', 'México', 'MEX', 'MEX'),
  ('rsa', 'world-cup-2026', 'world-cup-2026-group-a', 'África do Sul', 'RSA', 'RSA'),
  ('kor', 'world-cup-2026', 'world-cup-2026-group-a', 'Coreia do Sul', 'KOR', 'KOR'),
  ('cze', 'world-cup-2026', 'world-cup-2026-group-a', 'República Tcheca', 'CZE', 'CZE'),
  ('can', 'world-cup-2026', 'world-cup-2026-group-b', 'Canadá', 'CAN', 'CAN'),
  ('bih', 'world-cup-2026', 'world-cup-2026-group-b', 'Bósnia e Herzegovina', 'BIH', 'BIH'),
  ('qat', 'world-cup-2026', 'world-cup-2026-group-b', 'Catar', 'QAT', 'QAT'),
  ('sui', 'world-cup-2026', 'world-cup-2026-group-b', 'Suíça', 'SUI', 'SUI'),
  ('bra', 'world-cup-2026', 'world-cup-2026-group-c', 'Brasil', 'BRA', 'BRA'),
  ('mar', 'world-cup-2026', 'world-cup-2026-group-c', 'Marrocos', 'MAR', 'MAR'),
  ('hai', 'world-cup-2026', 'world-cup-2026-group-c', 'Haiti', 'HAI', 'HAI'),
  ('sco', 'world-cup-2026', 'world-cup-2026-group-c', 'Escócia', 'SCO', 'SCO'),
  ('usa', 'world-cup-2026', 'world-cup-2026-group-d', 'Estados Unidos', 'USA', 'USA'),
  ('par', 'world-cup-2026', 'world-cup-2026-group-d', 'Paraguai', 'PAR', 'PAR'),
  ('aus', 'world-cup-2026', 'world-cup-2026-group-d', 'Austrália', 'AUS', 'AUS'),
  ('tur', 'world-cup-2026', 'world-cup-2026-group-d', 'Turquia', 'TUR', 'TUR'),
  ('ger', 'world-cup-2026', 'world-cup-2026-group-e', 'Alemanha', 'GER', 'GER'),
  ('cuw', 'world-cup-2026', 'world-cup-2026-group-e', 'Curaçao', 'CUW', 'CUW'),
  ('civ', 'world-cup-2026', 'world-cup-2026-group-e', 'Costa do Marfim', 'CIV', 'CIV'),
  ('ecu', 'world-cup-2026', 'world-cup-2026-group-e', 'Equador', 'ECU', 'ECU'),
  ('ned', 'world-cup-2026', 'world-cup-2026-group-f', 'Países Baixos', 'NED', 'NED'),
  ('jpn', 'world-cup-2026', 'world-cup-2026-group-f', 'Japão', 'JPN', 'JPN'),
  ('swe', 'world-cup-2026', 'world-cup-2026-group-f', 'Suécia', 'SWE', 'SWE'),
  ('tun', 'world-cup-2026', 'world-cup-2026-group-f', 'Tunísia', 'TUN', 'TUN'),
  ('bel', 'world-cup-2026', 'world-cup-2026-group-g', 'Bélgica', 'BEL', 'BEL'),
  ('egy', 'world-cup-2026', 'world-cup-2026-group-g', 'Egito', 'EGY', 'EGY'),
  ('irn', 'world-cup-2026', 'world-cup-2026-group-g', 'Irã', 'IRN', 'IRN'),
  ('nzl', 'world-cup-2026', 'world-cup-2026-group-g', 'Nova Zelândia', 'NZL', 'NZL'),
  ('esp', 'world-cup-2026', 'world-cup-2026-group-h', 'Espanha', 'ESP', 'ESP'),
  ('cpv', 'world-cup-2026', 'world-cup-2026-group-h', 'Cabo Verde', 'CPV', 'CPV'),
  ('ksa', 'world-cup-2026', 'world-cup-2026-group-h', 'Arábia Saudita', 'KSA', 'KSA'),
  ('uru', 'world-cup-2026', 'world-cup-2026-group-h', 'Uruguai', 'URU', 'URU'),
  ('fra', 'world-cup-2026', 'world-cup-2026-group-i', 'França', 'FRA', 'FRA'),
  ('sen', 'world-cup-2026', 'world-cup-2026-group-i', 'Senegal', 'SEN', 'SEN'),
  ('irq', 'world-cup-2026', 'world-cup-2026-group-i', 'Iraque', 'IRQ', 'IRQ'),
  ('nor', 'world-cup-2026', 'world-cup-2026-group-i', 'Noruega', 'NOR', 'NOR'),
  ('arg', 'world-cup-2026', 'world-cup-2026-group-j', 'Argentina', 'ARG', 'ARG'),
  ('alg', 'world-cup-2026', 'world-cup-2026-group-j', 'Argélia', 'ALG', 'ALG'),
  ('aut', 'world-cup-2026', 'world-cup-2026-group-j', 'Áustria', 'AUT', 'AUT'),
  ('jor', 'world-cup-2026', 'world-cup-2026-group-j', 'Jordânia', 'JOR', 'JOR'),
  ('por', 'world-cup-2026', 'world-cup-2026-group-k', 'Portugal', 'POR', 'POR'),
  ('cod', 'world-cup-2026', 'world-cup-2026-group-k', 'República Democrática do Congo', 'COD', 'COD'),
  ('uzb', 'world-cup-2026', 'world-cup-2026-group-k', 'Uzbequistão', 'UZB', 'UZB'),
  ('col', 'world-cup-2026', 'world-cup-2026-group-k', 'Colômbia', 'COL', 'COL'),
  ('eng', 'world-cup-2026', 'world-cup-2026-group-l', 'Inglaterra', 'ENG', 'ENG'),
  ('cro', 'world-cup-2026', 'world-cup-2026-group-l', 'Croácia', 'CRO', 'CRO'),
  ('gha', 'world-cup-2026', 'world-cup-2026-group-l', 'Gana', 'GHA', 'GHA'),
  ('pan', 'world-cup-2026', 'world-cup-2026-group-l', 'Panamá', 'PAN', 'PAN')
on conflict (id) do update
set
  competition_id = excluded.competition_id,
  group_id = excluded.group_id,
  name = excluded.name,
  short_name = excluded.short_name,
  code = excluded.code;
