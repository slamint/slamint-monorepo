#!/usr/bin/env node

const { spawnSync } = require('node:child_process');
const { resolve } = require('node:path');

const [,, serviceName, action, dockerfilePath = ''] = process.argv;

if (!serviceName || !action) {
  console.error('Usage: node tools/docker/manage-docker.js <service> <build|push> [dockerfile]');
  process.exit(1);
}

const registry = process.env.DOCKER_REGISTRY || 'ghcr.io';
const namespace = process.env.DOCKER_NAMESPACE || 'slamint';
const tag = process.env.TAG || 'latest';
const context = process.env.DOCKER_CONTEXT || resolve(__dirname, '..', '..');

const image = `${registry}/${namespace}/${serviceName}:${tag}`;

let command;
let args;

if (action === 'build') {
  const dockerfile = dockerfilePath ? ['-f', dockerfilePath] : [];
  command = 'docker';
  args = ['build', '-t', image, ...dockerfile, context];
} else if (action === 'push') {
  command = 'docker';
  args = ['push', image];
} else {
  console.error(`Unknown action "${action}". Expected "build" or "push".`);
  process.exit(1);
}

const result = spawnSync(command, args, { stdio: 'inherit' });

process.exit(result.status ?? 0);
