insert into competitions (id, name, edition, host)
values (
  'world-cup-2026',
  'Bolao da Copa',
  'FIFA World Cup 2026',
  'Canada, United States and Mexico'
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
  ('mex', 'world-cup-2026', 'world-cup-2026-group-a', 'Mexico', 'MEX', 'MEX'),
  ('rsa', 'world-cup-2026', 'world-cup-2026-group-a', 'South Africa', 'RSA', 'RSA'),
  ('kor', 'world-cup-2026', 'world-cup-2026-group-a', 'South Korea', 'KOR', 'KOR'),
  ('cze', 'world-cup-2026', 'world-cup-2026-group-a', 'Czech Republic', 'CZE', 'CZE'),
  ('can', 'world-cup-2026', 'world-cup-2026-group-b', 'Canada', 'CAN', 'CAN'),
  ('bih', 'world-cup-2026', 'world-cup-2026-group-b', 'Bosnia and Herzegovina', 'BIH', 'BIH'),
  ('qat', 'world-cup-2026', 'world-cup-2026-group-b', 'Qatar', 'QAT', 'QAT'),
  ('sui', 'world-cup-2026', 'world-cup-2026-group-b', 'Switzerland', 'SUI', 'SUI'),
  ('bra', 'world-cup-2026', 'world-cup-2026-group-c', 'Brazil', 'BRA', 'BRA'),
  ('mar', 'world-cup-2026', 'world-cup-2026-group-c', 'Morocco', 'MAR', 'MAR'),
  ('hai', 'world-cup-2026', 'world-cup-2026-group-c', 'Haiti', 'HAI', 'HAI'),
  ('sco', 'world-cup-2026', 'world-cup-2026-group-c', 'Scotland', 'SCO', 'SCO'),
  ('usa', 'world-cup-2026', 'world-cup-2026-group-d', 'United States', 'USA', 'USA'),
  ('par', 'world-cup-2026', 'world-cup-2026-group-d', 'Paraguay', 'PAR', 'PAR'),
  ('aus', 'world-cup-2026', 'world-cup-2026-group-d', 'Australia', 'AUS', 'AUS'),
  ('tur', 'world-cup-2026', 'world-cup-2026-group-d', 'Turkey', 'TUR', 'TUR'),
  ('ger', 'world-cup-2026', 'world-cup-2026-group-e', 'Germany', 'GER', 'GER'),
  ('cuw', 'world-cup-2026', 'world-cup-2026-group-e', 'Curacao', 'CUW', 'CUW'),
  ('civ', 'world-cup-2026', 'world-cup-2026-group-e', 'Ivory Coast', 'CIV', 'CIV'),
  ('ecu', 'world-cup-2026', 'world-cup-2026-group-e', 'Ecuador', 'ECU', 'ECU'),
  ('ned', 'world-cup-2026', 'world-cup-2026-group-f', 'Netherlands', 'NED', 'NED'),
  ('jpn', 'world-cup-2026', 'world-cup-2026-group-f', 'Japan', 'JPN', 'JPN'),
  ('swe', 'world-cup-2026', 'world-cup-2026-group-f', 'Sweden', 'SWE', 'SWE'),
  ('tun', 'world-cup-2026', 'world-cup-2026-group-f', 'Tunisia', 'TUN', 'TUN'),
  ('bel', 'world-cup-2026', 'world-cup-2026-group-g', 'Belgium', 'BEL', 'BEL'),
  ('egy', 'world-cup-2026', 'world-cup-2026-group-g', 'Egypt', 'EGY', 'EGY'),
  ('irn', 'world-cup-2026', 'world-cup-2026-group-g', 'Iran', 'IRN', 'IRN'),
  ('nzl', 'world-cup-2026', 'world-cup-2026-group-g', 'New Zealand', 'NZL', 'NZL'),
  ('esp', 'world-cup-2026', 'world-cup-2026-group-h', 'Spain', 'ESP', 'ESP'),
  ('cpv', 'world-cup-2026', 'world-cup-2026-group-h', 'Cape Verde', 'CPV', 'CPV'),
  ('ksa', 'world-cup-2026', 'world-cup-2026-group-h', 'Saudi Arabia', 'KSA', 'KSA'),
  ('uru', 'world-cup-2026', 'world-cup-2026-group-h', 'Uruguay', 'URU', 'URU'),
  ('fra', 'world-cup-2026', 'world-cup-2026-group-i', 'France', 'FRA', 'FRA'),
  ('sen', 'world-cup-2026', 'world-cup-2026-group-i', 'Senegal', 'SEN', 'SEN'),
  ('irq', 'world-cup-2026', 'world-cup-2026-group-i', 'Iraq', 'IRQ', 'IRQ'),
  ('nor', 'world-cup-2026', 'world-cup-2026-group-i', 'Norway', 'NOR', 'NOR'),
  ('arg', 'world-cup-2026', 'world-cup-2026-group-j', 'Argentina', 'ARG', 'ARG'),
  ('alg', 'world-cup-2026', 'world-cup-2026-group-j', 'Algeria', 'ALG', 'ALG'),
  ('aut', 'world-cup-2026', 'world-cup-2026-group-j', 'Austria', 'AUT', 'AUT'),
  ('jor', 'world-cup-2026', 'world-cup-2026-group-j', 'Jordan', 'JOR', 'JOR'),
  ('por', 'world-cup-2026', 'world-cup-2026-group-k', 'Portugal', 'POR', 'POR'),
  ('cod', 'world-cup-2026', 'world-cup-2026-group-k', 'DR Congo', 'COD', 'COD'),
  ('uzb', 'world-cup-2026', 'world-cup-2026-group-k', 'Uzbekistan', 'UZB', 'UZB'),
  ('col', 'world-cup-2026', 'world-cup-2026-group-k', 'Colombia', 'COL', 'COL'),
  ('eng', 'world-cup-2026', 'world-cup-2026-group-l', 'England', 'ENG', 'ENG'),
  ('cro', 'world-cup-2026', 'world-cup-2026-group-l', 'Croatia', 'CRO', 'CRO'),
  ('gha', 'world-cup-2026', 'world-cup-2026-group-l', 'Ghana', 'GHA', 'GHA'),
  ('pan', 'world-cup-2026', 'world-cup-2026-group-l', 'Panama', 'PAN', 'PAN')
on conflict (id) do update
set
  competition_id = excluded.competition_id,
  group_id = excluded.group_id,
  name = excluded.name,
  short_name = excluded.short_name,
  code = excluded.code;
