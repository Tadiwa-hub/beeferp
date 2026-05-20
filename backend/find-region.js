import dns from 'dns';

const regions = [
  'eu-central-1',
  'us-east-1',
  'us-east-2',
  'us-west-1',
  'us-west-2',
  'ap-southeast-1',
  'ap-southeast-2',
  'ap-northeast-1',
  'ap-northeast-2',
  'ca-central-1',
  'eu-west-1',
  'eu-west-2',
  'eu-west-3',
  'sa-east-1',
];

console.log('Finding IPv4 connection pooler region for Supabase...');

regions.forEach((region) => {
  const host = `aws-0-${region}.pooler.supabase.com`;
  dns.lookup(host, (err, address) => {
    if (!err) {
      console.log(`✓ Region FOUND: ${region} resolves to IPv4 Address: ${address}`);
    }
  });
});
