async function run() {
  try {
    console.log('No demo salon seed data is configured.');
    process.exit(0);
  } catch (err: any) {
    console.error('Insert-noida failed:', err.message || err);
    process.exit(1);
  }
}

run();
