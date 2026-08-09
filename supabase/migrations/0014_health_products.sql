alter table public.vaccines rename to health_products;
alter table public.health_products add column type public.health_event_type not null default 'vaccine';
alter table public.health_products alter column core drop default;

alter table public.health_events rename column vaccine_slug to product_slug;

insert into public.health_products
  (slug, type, name, source_name, diseases, core, booster_interval_months, first_dose_min_weeks, availability, source, sort_order) values
  ('vermifuge',
   'deworming',
   'Vermifuge',
   'Anthelmintic treatment',
   'Vers ronds et vers plats',
   true, 3, 2,
   'Au moins quatre fois par an, jusqu''au rythme mensuel selon le mode de vie du chien.',
   'ESCCAP', 200),
  ('antiparasitaire-externe',
   'flea_tick',
   'Antiparasitaire externe',
   'Ectoparasiticide treatment',
   'Puces et tiques',
   true, 1, null,
   'La durée de protection dépend du produit : souvent un mois, parfois trois.',
   'ESCCAP', 210),
  ('visite-veterinaire',
   'vet_visit',
   'Visite vétérinaire',
   'Veterinary consultation',
   null,
   false, null, null, null, 'PupTrack', 300),
  ('bilan-annuel',
   'vet_visit',
   'Bilan de santé annuel',
   'Annual health check',
   null,
   false, 12, null, null, 'PupTrack', 310),
  ('autre-soin',
   'other',
   'Autre soin',
   'Other care',
   null,
   false, null, null, null, 'PupTrack', 400);
