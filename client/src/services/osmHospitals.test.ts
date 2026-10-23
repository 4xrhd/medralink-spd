import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  buildOverpassQuery,
  filterBySpecialty,
  geocodeAddress,
  isInBangladesh,
  matchesSpecialty,
  parseOverpassHospitals,
  searchHospitals,
  type OverpassElement,
} from './osmHospitals.js';

const DHAKA = { lat: 23.8103, lng: 90.4125 };

const el = (id: number, tags: Record<string, string>, lat = 23.8, lng = 90.41): OverpassElement => ({
  type: 'node',
  id,
  lat,
  lon: lng,
  tags: { amenity: 'hospital', ...tags },
});

describe('buildOverpassQuery', () => {
  it('asks for hospital nodes, ways and relations around the point with centres', () => {
    const q = buildOverpassQuery(DHAKA, 8000);
    expect(q).toContain('[out:json]');
    expect(q).toContain('nwr["amenity"="hospital"](around:8000,23.8103,90.4125)');
    expect(q).toContain('nwr["healthcare"="hospital"](around:8000,23.8103,90.4125)');
    expect(q).toContain('out center tags');
  });
});

describe('parseOverpassHospitals', () => {
  it('maps tags to results, sorted by distance, and skips unnamed or duplicate places', () => {
    const results = parseOverpassHospitals(
      {
        elements: [
          el(1, { name: 'Far Hospital', 'addr:street': 'Road 5', 'addr:city': 'Dhaka' }, 23.9, 90.5),
          el(2, { name: 'Near Hospital', phone: '+880 2 123', 'healthcare:speciality': 'cardiology;general' }, 23.811, 90.413),
          el(3, {}),
          { type: 'way', id: 4, center: { lat: 23.82, lon: 90.42 }, tags: { amenity: 'hospital', name: 'Way Hospital' } },
          el(2, { name: 'Near Hospital' }, 23.811, 90.413),
        ],
      },
      DHAKA
    );

    expect(results.map((h) => h.name)).toEqual(['Near Hospital', 'Way Hospital', 'Far Hospital']);
    expect(results[0].phone).toBe('+880 2 123');
    expect(results[0].specialities).toEqual(['cardiology', 'general']);
    expect(results[0].distanceKm).toBeLessThan(1);
    expect(results[2].address).toBe('Road 5, Dhaka');
    expect(results[1].placeId).toBe('way/4');
  });

  it('prefers the English name when available', () => {
    const [h] = parseOverpassHospitals({ elements: [el(9, { name: 'ঢাকা মেডিকেল', 'name:en': 'Dhaka Medical College Hospital' })] }, DHAKA);
    expect(h.name).toBe('Dhaka Medical College Hospital');
  });

  it('returns an empty list for a malformed response', () => {
    expect(parseOverpassHospitals({} as never, DHAKA)).toEqual([]);
  });
});

describe('matchesSpecialty', () => {
  const [tagged] = parseOverpassHospitals({ elements: [el(1, { name: 'City Hospital', 'healthcare:speciality': 'paediatrics' })] }, DHAKA);
  const [named] = parseOverpassHospitals({ elements: [el(2, { name: 'National Heart Foundation' })] }, DHAKA);
  const [emergency] = parseOverpassHospitals({ elements: [el(3, { name: 'General Hospital', emergency: 'yes' })] }, DHAKA);

  it('matches every hospital when no specialty is chosen', () => {
    expect(matchesSpecialty(named, '')).toBe(true);
  });

  it('matches on the OpenStreetMap speciality tag', () => {
    expect(matchesSpecialty(tagged, 'pediatrics')).toBe(true);
    expect(matchesSpecialty(tagged, 'cardiology')).toBe(false);
  });

  it('falls back to the hospital name', () => {
    expect(matchesSpecialty(named, 'cardiology')).toBe(true);
    expect(matchesSpecialty(named, 'eye')).toBe(false);
  });

  it('does not match a specialty word hidden inside another word', () => {
    const [accident] = parseOverpassHospitals({ elements: [el(4, { name: 'Accident Care Centre' })] }, DHAKA);
    expect(matchesSpecialty(named, 'ent')).toBe(false); // "Heart" contains "ear"
    expect(matchesSpecialty(accident, 'dental')).toBe(false); // "Accident" ends in "dent"
    const [neuro] = parseOverpassHospitals({ elements: [el(5, { name: 'Neurology Hospital' })] }, DHAKA);
    expect(matchesSpecialty(neuro, 'nephrology')).toBe(false); // "Neurology" contains "urolog"
  });

  it('treats emergency=yes as an emergency hospital', () => {
    expect(matchesSpecialty(emergency, 'emergency')).toBe(true);
  });
});

describe('network calls', () => {
  const LONDON = { lat: 51.5072, lng: -0.1276 };
  const ok = (body: unknown) => ({ ok: true, json: async () => body });

  afterEach(() => vi.unstubAllGlobals());

  it('uses the bundled snapshot inside Bangladesh and filters by specialty', async () => {
    const elements = [
      el(1, { name: 'Shishu Hospital' }, 23.811, 90.413),
      el(2, { name: 'Eye Hospital' }, 23.812, 90.414),
    ];
    const fetchMock = vi.fn().mockResolvedValue(ok({ elements }));
    vi.stubGlobal('fetch', fetchMock);
    const results = await searchHospitals(DHAKA, 'pediatrics');
    expect(results.map((h) => h.name)).toEqual(['Shishu Hospital']);
    expect(fetchMock.mock.calls[0][0]).toBe('/data/hospitals-bd.json');
  });

  it('filters an already loaded list without another request', () => {
    const all = parseOverpassHospitals({ elements: [el(1, { name: 'Heart Centre' }), el(2, { name: 'Eye Clinic Hospital' })] }, DHAKA);
    expect(filterBySpecialty(all, 'eye').map((h) => h.name)).toEqual(['Eye Clinic Hospital']);
    expect(filterBySpecialty(all, '')).toHaveLength(2);
  });

  it('queries Overpass outside Bangladesh and uses the first server that answers', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 429 })
      .mockResolvedValueOnce(ok({ elements: [el(1, { name: 'St Thomas Hospital' }, 51.4988, -0.1189)] }))
      .mockRejectedValueOnce(new Error('timeout'));
    vi.stubGlobal('fetch', fetchMock);
    const results = await searchHospitals(LONDON, '');
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(results.map((h) => h.name)).toEqual(['St Thomas Hospital']);
  });

  it('throws a friendly error when every Overpass server fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 429 }));
    await expect(searchHospitals(LONDON, '')).rejects.toThrow(/unavailable/i);
  });

  it('knows which points are in Bangladesh', () => {
    expect(isInBangladesh(DHAKA)).toBe(true);
    expect(isInBangladesh(LONDON)).toBe(false);
  });

  it('geocodeAddress returns the first match or null', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(ok([{ lat: '22.35', lon: '91.78' }])));
    expect(await geocodeAddress('Chattogram')).toEqual({ lat: 22.35, lng: 91.78 });

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(ok([])));
    expect(await geocodeAddress('nowhere-at-all')).toBeNull();
  });
});
