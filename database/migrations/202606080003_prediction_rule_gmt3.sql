update prediction_rules
set
  opens_at = '2026-04-01T15:00:00.000Z'
where opens_at = '2026-04-01T12:00:00.000Z';

update prediction_rules
set closes_at = case
  when phase_id = 'phase-groups' then '2026-07-01T02:59:59.000Z'
  when phase_id = 'phase-round-32' then '2026-07-05T02:59:59.000Z'
  when phase_id = 'phase-round-16' then '2026-07-09T02:59:59.000Z'
  when phase_id = 'phase-quarterfinals' then '2026-07-12T02:59:59.000Z'
  when phase_id = 'phase-semifinals' then '2026-07-17T02:59:59.000Z'
  when phase_id = 'phase-final' then '2026-07-20T02:59:59.000Z'
  when phase_id = 'phase-podium' then '2026-06-11T14:59:59.000Z'
  else closes_at
end
where
  (phase_id = 'phase-groups' and closes_at = '2026-06-30T23:59:59.000Z')
  or (phase_id = 'phase-round-32' and closes_at = '2026-07-04T23:59:59.000Z')
  or (phase_id = 'phase-round-16' and closes_at = '2026-07-08T23:59:59.000Z')
  or (phase_id = 'phase-quarterfinals' and closes_at = '2026-07-11T23:59:59.000Z')
  or (phase_id = 'phase-semifinals' and closes_at = '2026-07-16T23:59:59.000Z')
  or (phase_id = 'phase-final' and closes_at = '2026-07-19T23:59:59.000Z')
  or (phase_id = 'phase-podium' and closes_at = '2026-06-11T11:59:59.000Z');

update phases
set
  starts_at = case
    when id in (
      'phase-groups',
      'phase-round-32',
      'phase-round-16',
      'phase-quarterfinals',
      'phase-semifinals',
      'phase-final'
    ) then starts_at + interval '3 hours'
    when id = 'phase-podium' then '2026-04-01T15:00:00.000Z'
    else starts_at
  end,
  ends_at = case
    when id = 'phase-groups' then '2026-07-01T02:59:59.000Z'
    when id = 'phase-round-32' then '2026-07-05T02:59:59.000Z'
    when id = 'phase-round-16' then '2026-07-09T02:59:59.000Z'
    when id = 'phase-quarterfinals' then '2026-07-12T02:59:59.000Z'
    when id = 'phase-semifinals' then '2026-07-17T02:59:59.000Z'
    when id = 'phase-final' then '2026-07-20T02:59:59.000Z'
    when id = 'phase-podium' then '2026-06-11T14:59:59.000Z'
    else ends_at
  end
where
  (id = 'phase-groups' and starts_at = '2026-06-11T12:00:00.000Z')
  or (id = 'phase-round-32' and starts_at = '2026-07-01T12:00:00.000Z')
  or (id = 'phase-round-16' and starts_at = '2026-07-05T12:00:00.000Z')
  or (id = 'phase-quarterfinals' and starts_at = '2026-07-09T12:00:00.000Z')
  or (id = 'phase-semifinals' and starts_at = '2026-07-12T12:00:00.000Z')
  or (id = 'phase-final' and starts_at = '2026-07-17T12:00:00.000Z')
  or (id = 'phase-podium' and starts_at = '2026-04-01T12:00:00.000Z');
