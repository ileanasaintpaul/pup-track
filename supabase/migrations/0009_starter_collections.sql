insert into public.skill_collections (slug, name, description, source, sort_order) values
  ('arrivee-chiot',
   'Arrivée du chiot',
   'Les fondations des premières semaines à la maison, dans l''ordre où les aborder.',
   'PupTrack',
   10),
  ('autour-du-rappel',
   'Autour du rappel',
   'Tout ce qui construit un rappel fiable, du nom jusqu''au retour malgré les distractions.',
   'PupTrack',
   20),
  ('vie-quotidienne',
   'Vie quotidienne',
   'Ce qui rend les journées simples : calme, panier, laisse, manipulations.',
   'PupTrack',
   30);

insert into public.skill_collection_items (collection_slug, skill_slug, position, start_age_weeks, note) values
  ('arrivee-chiot', 'nom', 1, 8, 'À travailler dès le premier jour, en récompensant chaque regard.'),
  ('arrivee-chiot', 'proprete', 2, 8, 'Sorties très fréquentes, après chaque sieste et chaque repas.'),
  ('arrivee-chiot', 'inhibition', 3, 8, 'Le jeu s''arrête dès que les dents serrent trop fort.'),
  ('arrivee-chiot', 'manipulation', 4, 8, 'Quelques secondes par jour, toujours en positif.'),
  ('arrivee-chiot', 'solitude', 5, 8, 'Absences très courtes au début, allongées progressivement.'),
  ('arrivee-chiot', 'panier', 6, 8, 'Le panier devient l''endroit où il choisit d''aller.'),
  ('arrivee-chiot', 'retour-au-calme', 7, 8, 'Après chaque jeu, marquer la redescente.'),
  ('arrivee-chiot', 'assis', 8, 8, 'La première position demandée, facile à récompenser.'),

  ('autour-du-rappel', 'nom', 1, 8, 'Sans réponse au nom, pas de rappel.'),
  ('autour-du-rappel', 'rappel', 2, 8, 'À la maison d''abord, sur quelques mètres.'),
  ('autour-du-rappel', 'assis', 3, 8, 'Utile pour fixer l''arrivée au pied.'),
  ('autour-du-rappel', 'pas-bouger', 4, 12, 'La distance se construit avec la stabilité.'),
  ('autour-du-rappel', 'marche-laisse', 5, 10, 'Le rappel en extérieur suppose une laisse détendue.'),
  ('autour-du-rappel', 'pas-toucher', 6, 12, 'Renoncer à une distraction, c''est déjà revenir.'),
  ('autour-du-rappel', 'lache', 7, 10, 'Revenir avec quelque chose en gueule, puis le rendre.'),

  ('vie-quotidienne', 'retour-au-calme', 1, 8, null),
  ('vie-quotidienne', 'panier', 2, 8, null),
  ('vie-quotidienne', 'marche-laisse', 3, 10, null),
  ('vie-quotidienne', 'manipulation', 4, 8, null),
  ('vie-quotidienne', 'couche', 5, 9, null),
  ('vie-quotidienne', 'solitude', 6, 8, null);

update public.skills set source = 'PupTrack' where source is null;
