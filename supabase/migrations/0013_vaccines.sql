create table public.vaccines (
  slug text primary key,
  name text not null,
  source_name text not null,
  diseases text,
  core boolean not null,
  booster_interval_months int check (booster_interval_months > 0),
  first_dose_min_weeks int check (first_dose_min_weeks >= 0),
  availability text,
  source text not null,
  sort_order int not null default 0
);

alter table public.health_events add column vaccine_slug text references public.vaccines (slug) on delete set null;

alter table public.vaccines enable row level security;

create policy "vaccines readable" on public.vaccines
  for select to authenticated using (true);

grant select on public.vaccines to authenticated;
grant select, insert, update, delete on public.vaccines to service_role;

insert into public.vaccines
  (slug, name, source_name, diseases, core, booster_interval_months, first_dose_min_weeks, availability, source, sort_order) values
  ('core-cdv-cav-cpv',
   'Vaccin cœur CHP',
   'Canine parvovirus-2 (MLV) + canine distemper virus (MLV or recombinant) + canine adenovirus-2 (MLV)',
   'Maladie de Carré, hépatite de Rubarth, parvovirose',
   true, 36, 6, null, 'WSAVA 2024', 10),
  ('rabies',
   'Rage',
   'Rabies (inactivated)',
   'Rage',
   true, 12, 12, 'Durée de protection de 1 ou 3 ans selon le produit ; la loi locale prime.', 'WSAVA 2024', 20),
  ('leptospirosis',
   'Leptospirose',
   'Leptospira spp. (killed bacterin)',
   'Leptospirose',
   true, 12, 8, 'Cœur dans les régions où la leptospirose est endémique, dont la France.', 'WSAVA 2024', 30),
  ('parainfluenza',
   'Parainfluenza',
   'Canine Parainfluenza Virus (CPiV, MLV, parenteral)',
   'Toux du chenil',
   false, 12, 6, null, 'WSAVA 2024', 40),
  ('bordetella-intranasal',
   'Bordetella intranasale ou orale',
   'Bordetella bronchiseptica (live avirulent bacteria, intranasal or oral)',
   'Toux du chenil',
   false, 12, 3, 'Une seule dose suffit. Ne jamais injecter ces vaccins.', 'WSAVA 2024', 50),
  ('bordetella-parenteral',
   'Bordetella injectable',
   'Bordetella bronchiseptica (killed bacterin, subunit or fimbrial antigen, parenteral)',
   'Toux du chenil',
   false, 12, 8, 'Deux doses pour la primo-vaccination.', 'WSAVA 2024', 60),
  ('lyme',
   'Maladie de Lyme',
   'Borrelia burgdorferi (killed whole bacterin or subunit OspA, parenteral)',
   'Borréliose de Lyme',
   false, 12, 8, 'Réservé aux chiens très exposés aux tiques. À refaire juste avant la saison des tiques.', 'WSAVA 2024', 70),
  ('leishmaniasis',
   'Leishmaniose',
   'Canine leishmaniosis (CanL, recombinant protein A2, LiESP or protein Q)',
   'Leishmaniose',
   false, 12, 16, 'Disponible en Europe du Sud et en Amérique latine. Ne remplace pas la protection antiparasitaire.', 'WSAVA 2024', 80),
  ('influenza',
   'Grippe canine',
   'Canine influenza virus (H3N8, H3N2 or bivalent; killed adjuvanted, parenteral)',
   'Grippe canine',
   false, 12, 6, 'Homologué aux États-Unis uniquement.', 'WSAVA 2024', 90),
  ('herpesvirus',
   'Herpèsvirus canin',
   'Canine herpesvirus-1 (CHV-1; subunit, parenteral)',
   'Herpèsvirose du nouveau-né',
   false, null, null, 'Destiné aux femelles gestantes : deux injections à répéter à chaque gestation.', 'WSAVA 2024', 100);
