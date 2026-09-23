'use strict';

// One-off inspector: prints sheet names, row counts, header row, and a sample data
// row for each sheet in mechsheet.xls so the converter can be written accurately.

const path = require('path');
const XLSX = require('xlsx');
const paths = require('../../server/config/paths');

const XLS = path.join(paths.catalogDataRoot, 'source', 'mechsheet.xls');
const wb = XLSX.readFile(XLS);

console.log('Sheets:', JSON.stringify(wb.SheetNames));
for (const name of wb.SheetNames) {
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, defval: '' });
  console.log(`\n### ${name} - ${rows.length} rows, ${rows[0] ? rows[0].length : 0} cols`);
  console.log('header:', JSON.stringify(rows[0]));
  if (rows[1]) console.log('row1  :', JSON.stringify(rows[1]));
}
