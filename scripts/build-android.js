const { spawnSync } = require('child_process');
const path = require('path');

const androidDir = path.join(__dirname, '..', 'android');

const result =
  process.platform === 'win32'
    ? spawnSync('cmd.exe', ['/d', '/s', '/c', ['gradlew.bat', 'bundleRelease', 'assembleRelease', '--no-daemon'].join(' ')], {
        cwd: androidDir,
        env: process.env,
        stdio: 'inherit',
      })
    : spawnSync('bash', ['gradlew', 'bundleRelease', 'assembleRelease', '--no-daemon'], {
        cwd: androidDir,
        env: process.env,
        stdio: 'inherit',
      });

process.exit(result.status ?? 1);

