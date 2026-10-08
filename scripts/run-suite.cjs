const { spawnSync } = require('node:child_process');
const path = require('node:path');
const args = process.argv.slice(2);
// Environment switches are portable across PowerShell and Linux shells.
if (args.includes('--known-defects')) {
  process.env.INCLUDE_KNOWN_DEFECTS = '1';
  args.splice(args.indexOf('--known-defects'), 1);
}
if (args.includes('--cross-browser')) {
  process.env.CROSS_BROWSER = '1';
  args.splice(args.indexOf('--cross-browser'), 1);
}
const cli = path.join(path.dirname(require.resolve('playwright')), 'cli.js');
const result = spawnSync(process.execPath, [cli, 'test', ...args], {
  cwd: path.resolve(__dirname, '..'),
  stdio: 'inherit',
});
if (result.error) {
  console.error(result.error);
  process.exitCode = 1;
} else process.exitCode = result.status ?? 1;
