import pg from 'pg';

const regions = ['eu-central-1', 'us-east-1', 'eu-west-2', 'ap-southeast-1', 'us-west-1'];
const { Client } = pg;

async function testRegions() {
  console.log('Testing regional Supabase IPv4 connection poolers (without sslmode override)...');
  
  for (const region of regions) {
    // Construct connection string for pooler (port 6543 is transaction pooler)
    const connStr = `postgresql://postgres.jlevzblbzfcpjubztyws:Tadiwa12%2312@aws-0-${region}.pooler.supabase.com:6543/postgres`;
    
    console.log(`Connecting to ${region} pooler...`);
    const client = new Client({
      connectionString: connStr,
      ssl: {
        rejectUnauthorized: false, // This will now take full effect!
      },
      connectionTimeoutMillis: 5000,
    });

    try {
      await client.connect();
      const res = await client.query('SELECT NOW()');
      console.log(`\n🎉 SUCCESS! Connected to Supabase IPv4 Pooler in region: ${region}!`);
      console.log('Query result:', res.rows[0]);
      await client.end();
      return; // Found it!
    } catch (err) {
      console.log(`✗ Connection to ${region} failed:`, err.message);
    }
  }
  
  console.log('\n❌ All tested regions failed. We may need to check other regions or verify credentials.');
}

testRegions();
