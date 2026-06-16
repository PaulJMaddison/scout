const [, , name, ...labelParts] = process.argv;

if (!name) {
  console.error('Usage: node scripts/require-env.mjs ENV_NAME [command label]');
  process.exit(2);
}

const label = labelParts.join(' ') || name;
const value = process.env[name] ?? '';
const enabled = value === '1' || value.toLowerCase() === 'true';

if (!enabled) {
  console.error(`${label} is opt-in. Set ${name}=1 to run this command.`);
  process.exit(1);
}
