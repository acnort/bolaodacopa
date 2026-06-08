update competitions
set host = 'Canadá, Estados Unidos e México'
where id = 'world-cup-2026';

update teams
set name = data.name
from (
  values
    ('mex', 'México'),
    ('rsa', 'África do Sul'),
    ('kor', 'Coreia do Sul'),
    ('cze', 'República Tcheca'),
    ('can', 'Canadá'),
    ('bih', 'Bósnia e Herzegovina'),
    ('qat', 'Catar'),
    ('sui', 'Suíça'),
    ('bra', 'Brasil'),
    ('mar', 'Marrocos'),
    ('hai', 'Haiti'),
    ('sco', 'Escócia'),
    ('usa', 'Estados Unidos'),
    ('par', 'Paraguai'),
    ('aus', 'Austrália'),
    ('tur', 'Turquia'),
    ('ger', 'Alemanha'),
    ('cuw', 'Curaçao'),
    ('civ', 'Costa do Marfim'),
    ('ecu', 'Equador'),
    ('ned', 'Países Baixos'),
    ('jpn', 'Japão'),
    ('swe', 'Suécia'),
    ('tun', 'Tunísia'),
    ('bel', 'Bélgica'),
    ('egy', 'Egito'),
    ('irn', 'Irã'),
    ('nzl', 'Nova Zelândia'),
    ('esp', 'Espanha'),
    ('cpv', 'Cabo Verde'),
    ('ksa', 'Arábia Saudita'),
    ('uru', 'Uruguai'),
    ('fra', 'França'),
    ('sen', 'Senegal'),
    ('irq', 'Iraque'),
    ('nor', 'Noruega'),
    ('arg', 'Argentina'),
    ('alg', 'Argélia'),
    ('aut', 'Áustria'),
    ('jor', 'Jordânia'),
    ('por', 'Portugal'),
    ('cod', 'República Democrática do Congo'),
    ('uzb', 'Uzbequistão'),
    ('col', 'Colômbia'),
    ('eng', 'Inglaterra'),
    ('cro', 'Croácia'),
    ('gha', 'Gana'),
    ('pan', 'Panamá')
) as data(id, name)
where teams.id = data.id
  and teams.competition_id = 'world-cup-2026';
