#!/usr/bin/env node
/**
 * Create Admin User Script
 *
 * This script generates the KV commands to create an initial admin user.
 * Run with: node scripts/create-admin.js <username> <email> <password>
 *
 * Then copy the output and run it with wrangler:
 * npx wrangler kv put --namespace-id=2c3ee1f2bc814ca7b2e0759397135228 "user:<id>" '<json>'
 */

// PBKDF2 settings (must match crypto.js)
const PBKDF2_ITERATIONS = 100000;
const SALT_LENGTH = 16;
const HASH_LENGTH = 32;

function bufferToHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToBuffer(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

function generateSalt() {
  const salt = new Uint8Array(SALT_LENGTH);
  crypto.getRandomValues(salt);
  return bufferToHex(salt);
}

async function hashPassword(password, salt) {
  const encoder = new TextEncoder();

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: hexToBuffer(salt),
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256'
    },
    keyMaterial,
    HASH_LENGTH * 8
  );

  return bufferToHex(derivedBits);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 3) {
    console.log('Usage: node scripts/create-admin.js <username> <email> <password>');
    console.log('');
    console.log('Example: node scripts/create-admin.js admin admin@example.com MySecurePassword123');
    process.exit(1);
  }

  const [username, email, password] = args;

  // Validate inputs
  if (username.length < 3) {
    console.error('Error: Username must be at least 3 characters');
    process.exit(1);
  }

  if (!email.includes('@')) {
    console.error('Error: Invalid email address');
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('Error: Password must be at least 8 characters');
    process.exit(1);
  }

  // Generate user data
  const id = crypto.randomUUID();
  const salt = generateSalt();
  const hash = await hashPassword(password, salt);
  const now = new Date().toISOString();

  const user = {
    id,
    username,
    email: email.toLowerCase(),
    passwordHash: hash,
    passwordSalt: salt,
    status: 'admin',
    role: 'admin',
    created_at: now,
    updated_at: now,
    last_login: null,
    settings: { theme: 'light' }
  };

  // Write user data to a temporary file instead of logging sensitive data
  const userJson = JSON.stringify(user);
  const fs = await import('fs/promises');
  const path = await import('path');
  const tempFile = path.join(process.cwd(), `admin-user-${id}.json`);
  await fs.writeFile(tempFile, userJson, 'utf-8');

  // Get KV namespace ID from env or use default
  const kvNamespaceId = process.env.KV_NAMESPACE_ID || '2c3ee1f2bc814ca7b2e0759397135228';

  console.log('');
  console.log('=== Admin User Created ===');
  console.log(`Username: ${username}`);
  console.log(`Email: ${email}`);
  console.log(`User ID: ${id}`);
  console.log('');
  console.log(`User data (including password hash) written to: ${tempFile}`);
  console.log('');
  console.log('IMPORTANT: Delete this file after importing to KV!');
  console.log('');
  console.log('Run the following commands to add the admin user to KV:');
  console.log('');
  console.log('# Add user data (reads from file to avoid logging sensitive data)');
  if (process.platform === 'win32') {
    console.log(`$content = Get-Content "${tempFile}" -Raw; npx wrangler kv put --namespace-id=${kvNamespaceId} "user:${id}" $content`);
  } else {
    console.log(`npx wrangler kv put --namespace-id=${kvNamespaceId} "user:${id}" "$(cat '${tempFile}')"`);
  }
  console.log('');
  console.log('# Add username index');
  console.log(`npx wrangler kv put --namespace-id=${kvNamespaceId} "username:${username.toLowerCase()}" "${id}"`);
  console.log('');
  console.log('# Add email index');
  console.log(`npx wrangler kv put --namespace-id=${kvNamespaceId} "email:${email.toLowerCase()}" "${id}"`);
  console.log('');
  console.log('# Delete the temporary file after import');
  if (process.platform === 'win32') {
    console.log(`Remove-Item "${tempFile}"`);
  } else {
    console.log(`rm '${tempFile}'`);
  }
}

main().catch(console.error);
