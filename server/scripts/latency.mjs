// Measures API response times (proposal objective 7: p95 under 200 ms) against a running server.
// Usage: npm run latency -- [baseUrl] [runs]   e.g. npm run latency -- http://localhost:5000 30
// Signs in with the demo doctor account from the seed data; never point it at production credentials.
const base = (process.argv[2] || process.env.LATENCY_BASE_URL || 'http://localhost:5000').replace(/\/$/, '');
const runs = Number(process.argv[3] || 20);

const percentile = (sorted, p) => sorted[Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)];

async function timed(url, init) {
  const start = performance.now();
  const res = await fetch(url, init);
  await res.arrayBuffer();
  if (!res.ok) throw new Error(`${url} responded ${res.status}`);
  return performance.now() - start;
}

async function login() {
  const res = await fetch(`${base}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'dr.ahmed@medralink.com', password: 'doctor123' }),
  });
  if (!res.ok) throw new Error(`Login failed with ${res.status}; is the server seeded?`);
  return (await res.json()).data.token;
}

const token = await login();
const auth = { headers: { Authorization: `Bearer ${token}` } };
const endpoints = [
  ['GET /api/health', `${base}/api/health`, {}],
  ['GET /patients/pat-1', `${base}/api/v1/patients/pat-1`, auth],
  ['GET /patients/pat-1/timeline', `${base}/api/v1/patients/pat-1/timeline`, auth],
  ['GET /prescriptions', `${base}/api/v1/prescriptions`, auth],
  ['GET /appointments', `${base}/api/v1/appointments`, auth],
];

console.log(`Latency over ${runs} runs against ${base} (one warm-up call each)\n`);
console.log('endpoint'.padEnd(32) + 'p50 ms'.padStart(9) + 'p95 ms'.padStart(9) + 'max ms'.padStart(9));
let worstP95 = 0;
for (const [name, url, init] of endpoints) {
  await timed(url, init);
  const samples = [];
  for (let i = 0; i < runs; i += 1) samples.push(await timed(url, init));
  samples.sort((a, b) => a - b);
  const p95 = percentile(samples, 95);
  worstP95 = Math.max(worstP95, p95);
  console.log(name.padEnd(32) + percentile(samples, 50).toFixed(1).padStart(9) + p95.toFixed(1).padStart(9) + samples.at(-1).toFixed(1).padStart(9));
}
console.log(`\nWorst p95: ${worstP95.toFixed(1)} ms (target < 200 ms) ${worstP95 < 200 ? 'PASS' : 'OVER TARGET'}`);
