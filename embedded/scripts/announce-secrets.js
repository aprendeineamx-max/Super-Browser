// Warns or prepares secrets handling for builds.
// If BUSTER_SECRETS env is set, nothing else to do.
// If secrets.json exists, will be picked up by gulp build.
// If not, prints guidance.
const fs = require('node:fs');
const path = require('node:path');

const secretsJson = path.join(process.cwd(), 'secrets.json');

if (process.env.BUSTER_SECRETS) {
  console.log('BUSTER_SECRETS env detected.');
  process.exit(0);
}

if (fs.existsSync(secretsJson)) {
  console.log('secrets.json present, will be used for build.');
  process.exit(0);
}

console.warn(
  'Warning: secrets not provided. Copy secrets.json.example to secrets.json or set BUSTER_SECRETS env to include API keys.'
);
