/**
 * Import x lists.xlsx → Railway MongoDB via the /api/xlists endpoint
 * Run: node scripts/import-xl.js https://x-deploy-production.up.railway.app
 */

const xlsx = require('xlsx');
const path = require('path');

const RAILWAY_URL = process.argv[2];
if (!RAILWAY_URL) {
  console.error('Usage: node scripts/import-xl.js <railway-url>');
  console.error('Example: node scripts/import-xl.js https://x-deploy-production.up.railway.app');
  process.exit(1);
}

const EXCEL_PATH = path.join(__dirname, '../../x lists.xlsx');
const BATCH_SIZE = 50;

function parseExcel() {
  const wb = xlsx.readFile(EXCEL_PATH);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const data = xlsx.utils.sheet_to_json(ws, { header: 1, defval: '' });

  const records = [];
  for (const row of data) {
    const xUrl = String(row[8] || '');
    if (!xUrl.includes('x.com')) continue;

    const username = xUrl.replace(/https?:\/\/(www\.)?x\.com\/?/, '').replace(/\/$/, '').split('/')[0].trim();
    if (!username) continue;

    records.push({
      username,
      xUrl,
      category: String(row[1] || '').trim() || undefined,
      walletAddress: String(row[6] || '').trim() || undefined,
      usdValue: String(row[5] || '').trim() || undefined,
    });
  }

  // Dedupe by username
  const seen = new Set();
  return records.filter(r => {
    if (seen.has(r.username)) return false;
    seen.add(r.username);
    return true;
  });
}

async function importBatch(batch) {
  const res = await fetch(`${RAILWAY_URL}/api/xlists`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(batch),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return res.json();
}

async function main() {
  console.log('Parsing Excel...');
  const records = parseExcel();
  console.log(`Found ${records.length} unique X accounts`);

  let totalInserted = 0;
  let totalMatched = 0;

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    process.stdout.write(`Importing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(records.length / BATCH_SIZE)}...`);
    const result = await importBatch(batch);
    totalInserted += result.inserted || 0;
    totalMatched += result.matched || 0;
    console.log(` ✓ (inserted: ${result.inserted}, matched: ${result.matched})`);
  }

  console.log(`\nDone! Total inserted: ${totalInserted}, already existed: ${totalMatched}`);
}

main().catch(err => { console.error('Error:', err.message); process.exit(1); });
