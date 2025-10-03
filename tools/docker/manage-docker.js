#!/usr/bin/env node

const { spawnSync } = require('node:child_process');
const { resolve } = require('node:path');
const { existsSync, readFileSync } = require('node:fs');

const [,, serviceName, action, dockerfilePath = ''] = process.argv;

if (!serviceName || !action) {
  console.error('Usage: node tools/docker/manage-docker.js <service> <build|push> [dockerfile]');
  process.exit(1);
}

const registry = process.env.DOCKER_REGISTRY || 'ghcr.io';
const namespace = process.env.DOCKER_NAMESPACE || 'slamint';
const context = process.env.DOCKER_CONTEXT || resolve(__dirname, '..', '..');

let version = process.env.VERSION;
let buildNumber = process.env.BUILD_NUMBER || process.env.GITHUB_RUN_NUMBER;

const releaseEnvPath = resolve(context, 'release.env');
if (!version && existsSync(releaseEnvPath)) {
  const envContent = readFileSync(releaseEnvPath, 'utf-8');
  const match = envContent.match(/^VERSION\s*=\s*(.+)$/m);
  if (match) {
    version = match[1].trim();
  }
}

if (!version) {
  version = '0.0.0';
}

if (!buildNumber) {
  buildNumber = 'local';
}

const tag = process.env.TAG || `${version}.${buildNumber}`;
const includeLatest = process.env.INCLUDE_LATEST !== 'false';
const latestTagName = process.env.LATEST_TAG || 'latest';

const imageBase = `${registry}/${namespace}/${serviceName}`;
const tags = [tag];
if (includeLatest && latestTagName && latestTagName !== tag) {
  tags.push(latestTagName);
}

const buildTagsArgs = tags.flatMap((t) => ['-t', `${imageBase}:${t}`]);

let command;
let args;

if (action === 'build') {
  const dockerfile = dockerfilePath ? ['-f', dockerfilePath] : [];
  command = 'docker';
  args = ['build', ...buildTagsArgs, ...dockerfile, context];
} else if (action === 'push') {
  command = 'docker';
  args = ['push', `${imageBase}:${tag}`];
} else {
  console.error(`Unknown action "${action}". Expected "build" or "push".`);
  process.exit(1);
}

const result = spawnSync(command, args, { stdio: 'inherit' });

if (result.status === 0 && action === 'push' && tags.length > 1) {
  for (let i = 1; i < tags.length; i += 1) {
    const t = tags[i];
    const pushResult = spawnSync('docker', ['push', `${imageBase}:${t}`], { stdio: 'inherit' });
    if (pushResult.status !== 0) {
      process.exit(pushResult.status ?? 1);
    }
  }
}

process.exit(result.status ?? 0);
