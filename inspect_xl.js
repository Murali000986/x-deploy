const xlsx = require('xlsx');
const wb = xlsx.readFile('c:/Users/murali/Desktop/X_Chat_Bot/x lists.xlsx');
const ws = wb.Sheets[wb.SheetNames[0]];
const data = xlsx.utils.sheet_to_json(ws, { header: 1, defval: '' });

// Find all rows that have an X URL (column index 8 based on earlier inspection)
const xRows = data.filter(r => String(r[8] || '').includes('x.com'));
console.log('Rows with X URL:', xRows.length);

// Show column structure from a row with most data
const sample = xRows.slice(0, 5);
sample.forEach((r, i) => {
  const cols = r.map((c, j) => c !== '' ? `[${j}]=${JSON.stringify(String(c).substring(0,40))}` : '').filter(Boolean).join('\n    ');
  console.log(`\nSample ${i}:\n    ${cols}`);
});
