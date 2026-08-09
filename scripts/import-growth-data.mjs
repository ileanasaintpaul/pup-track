import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const SOURCE = 'WALTHAM Petcare Science Institute — Puppy Growth Charts';
const CHUNK_SIZE = 2000;

const [breedsPath, curvesPath] = process.argv.slice(2);
const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!breedsPath || !curvesPath) {
  fail('Usage : node scripts/import-growth-data.mjs <breeds.json> <waltham_curves.json>');
}
if (!url || !serviceKey) {
  fail('Renseigne SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY dans l\'environnement.');
}

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

const slugify = (name) =>
  name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');

function fail(message) {
  console.error(message);
  process.exit(1);
}

function readBreeds() {
  const raw = JSON.parse(readFileSync(breedsPath, 'utf8'));
  const seen = new Set();

  return raw.dog
    .filter((breed) => breed.breedSize && breed.defaultWeight)
    .map((breed) => ({
      slug: breed.breedId || slugify(breed.name),
      name: breed.name,
      size_band: breed.breedSize,
      adult_min_kg: breed.defaultWeight.minKg,
      adult_max_kg: breed.defaultWeight.maxKg,
      source: SOURCE,
    }))
    .filter((breed) => {
      if (seen.has(breed.slug)) return false;
      seen.add(breed.slug);
      return true;
    });
}

function readCurves() {
  const raw = JSON.parse(readFileSync(curvesPath, 'utf8'));
  const rows = [];

  for (const entry of Object.values(raw)) {
    const sex = entry.sex.toLowerCase();
    for (const [centile, series] of Object.entries(entry.centiles ?? {})) {
      for (const [ageWeeks, weightKg] of Object.entries(series)) {
        rows.push({
          size_band: entry.band,
          sex,
          age_weeks: Number(ageWeeks),
          centile: Number(centile),
          weight_kg: weightKg,
          source: SOURCE,
        });
      }
    }
  }

  return rows;
}

async function upsertAll(table, rows, conflictTarget) {
  for (let index = 0; index < rows.length; index += CHUNK_SIZE) {
    const chunk = rows.slice(index, index + CHUNK_SIZE);
    const { error } = await supabase.from(table).upsert(chunk, { onConflict: conflictTarget });
    if (error) fail(`${table} : ${error.message}`);
    process.stdout.write(`\r  ${table} : ${Math.min(index + CHUNK_SIZE, rows.length)}/${rows.length}`);
  }
  process.stdout.write('\n');
}

const breeds = readBreeds();
const curves = readCurves();

console.log(`${breeds.length} races, ${curves.length} points de courbe`);
await upsertAll('breeds', breeds, 'slug');
await upsertAll('growth_curves', curves, 'size_band,sex,age_weeks,centile');

const { count: breedCount } = await supabase.from('breeds').select('*', { count: 'exact', head: true });
const { count: curveCount } = await supabase.from('growth_curves').select('*', { count: 'exact', head: true });
console.log(`En base : ${breedCount} races, ${curveCount} points`);
