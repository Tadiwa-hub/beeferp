import dns from 'dns';
import net from 'net';

const hostname = 'db.jlevzblbzfcpjubztyws.supabase.co';
const port = 5432;

console.log('🔍 Testing DNS resolution...\n');

// Test default resolver
dns.resolve(hostname, (err, addresses) => {
  if (err) {
    console.log('❌ Default resolver failed:', err.message);
  } else {
    console.log('✅ Default resolver found:', addresses);
  }
});

// Test IPv4 (A records)
dns.resolve4(hostname, (err, addresses) => {
  if (err) {
    console.log('❌ IPv4 (A) resolution failed:', err.message);
  } else {
    console.log('✅ IPv4 (A) found:', addresses);
  }
});

// Test IPv6 (AAAA records)
dns.resolve6(hostname, (err, addresses) => {
  if (err) {
    console.log('❌ IPv6 (AAAA) resolution failed:', err.message);
  } else {
    console.log('✅ IPv6 (AAAA) found:', addresses);
  }
});

// Test with custom DNS servers
console.log('\n🔍 Testing with custom DNS servers (1.1.1.1, 8.8.8.8)...\n');
const resolver = new dns.Resolver();
resolver.setServers(['1.1.1.1', '8.8.8.8']);

resolver.resolve4(hostname, (err, addresses) => {
  if (err) {
    console.log('❌ Custom DNS IPv4 resolution failed:', err.message);
  } else {
    console.log('✅ Custom DNS IPv4 found:', addresses);
  }
});

resolver.resolve6(hostname, (err, addresses) => {
  if (err) {
    console.log('❌ Custom DNS IPv6 resolution failed:', err.message);
  } else {
    console.log('✅ Custom DNS IPv6 found:', addresses);
  }
});

// Test TCP connection to port 5432
console.log(`\n🔗 Testing TCP connection to ${hostname}:${port}...\n`);
setTimeout(() => {
  const socket = new net.Socket();
  socket.setTimeout(5000);
  socket.connect(port, hostname, () => {
    console.log(`✅ Successfully connected to ${hostname}:${port}`);
    socket.destroy();
    process.exit(0);
  });
  socket.on('error', (err) => {
    console.log(`❌ Connection failed: ${err.message}`);
  });
  socket.on('timeout', () => {
    console.log(`❌ Connection timeout`);
    socket.destroy();
  });
}, 1500);
