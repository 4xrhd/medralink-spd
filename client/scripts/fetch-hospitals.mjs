// Downloads every hospital in Bangladesh from OpenStreetMap (Overpass API, free, no key) and
// writes a compact snapshot to public/data/hospitals-bd.json for the hospital search page.
// Run: node scripts/fetch-hospitals.mjs   (data (c) OpenStreetMap contributors, ODbL)
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const outFile = path.join(here, '..', 'public', 'data', 'hospitals-bd.json');

const SERVERS = [
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];
const QUERY =
  '[out:json][timeout:300];area["ISO3166-1"="BD"][admin_level=2]->.bd;' +
  '(nwr["amenity"="hospital"](area.bd);nwr["healthcare"="hospital"](area.bd););out center tags;';

async function download() {
  for (const server of SERVERS) {
    try {
      console.log(`Querying ${server} ...`);
      const res = await fetch(server, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'MedraLink-academic-project' },
        body: `data=${encodeURIComponent(QUERY)}`,
        signal: AbortSignal.timeout(320_000),
      });
      if (res.ok) return await res.json();
      console.warn(`  ${server} responded ${res.status}`);
    } catch (err) {
      console.warn(`  ${server} failed: ${err.message}`);
    }
  }
  throw new Error('All Overpass servers failed; try again later.');
}

const round = (n) => Math.round(n * 1e5) / 1e5;

/** Keeps only the tags the search page uses, so the file stays small. */
function compact(el) {
  const t = el.tags ?? {};
  const lat = el.lat ?? el.center?.lat;
  const lon = el.lon ?? el.center?.lon;
  if (!(t['name:en'] || t.name) || lat === undefined || lon === undefined) return null;
  const keep = ['name', 'name:en', 'addr:housenumber', 'addr:street', 'addr:suburb', 'addr:city', 'addr:full',
    'phone', 'contact:phone', 'website', 'contact:website', 'emergency', 'healthcare:speciality'];
  const tags = Object.fromEntries(keep.filter((k) => t[k]).map((k) => [k, t[k]]));
  return { type: el.type, id: el.id, lat: round(lat), lon: round(lon), tags };
}

const data = await download();
const elements = (data.elements ?? []).map(compact).filter(Boolean);
await mkdir(path.dirname(outFile), { recursive: true });
await writeFile(outFile, JSON.stringify({ generated: new Date().toISOString(), source: 'OpenStreetMap contributors (ODbL)', elements }));
console.log(`Saved ${elements.length} hospitals to ${path.relative(process.cwd(), outFile)}`);
