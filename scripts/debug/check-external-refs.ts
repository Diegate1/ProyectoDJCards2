const pkg = require('../dist/src/db/database');
const { getDatabase } = pkg;

async function checkExternalRefs() {
  const db = getDatabase();

  const result = await db.query(`
    SELECT 
      s.id, s.name, s.language,
      ser.source_code, ser.external_id, ser.external_code, ser.external_name
    FROM sets s
    LEFT JOIN set_external_refs ser ON s.id = ser.set_id
    WHERE s.language = 'ja'
    ORDER BY s.name
    LIMIT 30
  `);

  console.log('Sets Japoneses y sus referencias externas:\n');
  
  let currentSet = '';
  result.rows.forEach((row: any) => {
    if (row.name !== currentSet) {
      console.log(`\n📦 ${row.name}`);
      currentSet = row.name;
    }
    if (row.source_code) {
      console.log(`   ├─ ${row.source_code}: ${row.external_id} (${row.external_name})`);
    }
  });

  process.exit(0);
}

checkExternalRefs().catch(e => {
  console.error(e);
  process.exit(1);
});
