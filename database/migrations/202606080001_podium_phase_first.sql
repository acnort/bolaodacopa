update phases
set
  phase_order = 0,
  starts_at = '2026-04-01T15:00:00.000Z',
  ends_at = '2026-06-11T14:59:59.000Z'
where id = 'phase-podium'
  or slug = 'podio-final';

update prediction_rules
set
  opens_at = '2026-04-01T15:00:00.000Z',
  closes_at = '2026-06-11T14:59:59.000Z'
where phase_id in (
  select id
  from phases
  where id = 'phase-podium'
    or slug = 'podio-final'
);
