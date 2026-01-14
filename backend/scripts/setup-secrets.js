#!/usr/bin/env node
/**
 * Cloudflare Secrets Setup Script
 * 
 * This script helps you configure all required secrets for the AI Portal backend.
 * It uses the Wrangler CLI to securely store secrets in Cloudflare.
 * 
 * Usage:
 *   node scripts/setup-secrets.js           # Interactive mode
 *   node scripts/setup-secrets.js --check   # Check which secrets are configured
 *   node scripts/setup-secrets.js --env     # Load from .env file
 * 
 * Required secrets:
 *   - OPENROUTER_API_KEY   : Access to 200+ AI models via OpenRouter
 *   - GEMINI_API_KEY       : Google Gemini, Imagen, Veo access
 *   - ANTHROPIC_API_KEY    : Claude models direct access
 *   - OPENAI_API_KEY       : GPT, DALL-E, Whisper, TTS access
 */

import { spawn } from 'child_process';
import { createInterface } from 'readline';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Secret definitions with descriptions and where to get them
const SECRETS = [
  {
    name: 'OPENROUTER_API_KEY',
    description: 'OpenRouter API key for unified access to 200+ AI models',
    url: 'https://openrouter.ai/keys',
    prefix: 'sk-or-',
    required: true
  },
  {
    name: 'GEMINI_API_KEY',
    description: 'Google Gemini API key for Gemini, Imagen, and Veo',
    url: 'https://aistudio.google.com/apikey',
    prefix: null,
    required: true
  },
  {
    name: 'ANTHROPIC_API_KEY',
    description: 'Anthropic API key for direct Claude access',
    url: 'https://console.anthropic.com/settings/keys',
    prefix: 'sk-ant-',
    required: false
  },
  {
    name: 'OPENAI_API_KEY',
    description: 'OpenAI API key for GPT, DALL-E, Whisper, TTS',
    url: 'https://platform.openai.com/api-keys',
    prefix: 'sk-',
    required: false
  }
];

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = '') {
  console.log(`${color}${message}${colors.reset}`);
}

function logHeader(message) {
  console.log('');
  log('═'.repeat(60), colors.cyan);
  log(` ${message}`, colors.bright + colors.cyan);
  log('═'.repeat(60), colors.cyan);
}

function logSection(message) {
  console.log('');
  log(`▸ ${message}`, colors.bright);
}

/**
 * Run wrangler command and return result
 */
function runWrangler(args) {
  return new Promise((resolve, reject) => {
    const proc = spawn('npx', ['wrangler', ...args], {
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true
    });
    
    let stdout = '';
    let stderr = '';
    
    proc.stdout.on('data', (data) => { stdout += data; });
    proc.stderr.on('data', (data) => { stderr += data; });
    
    proc.on('close', (code) => {
      resolve({ code, stdout, stderr });
    });
    
    proc.on('error', reject);
  });
}

/**
 * Set a secret using wrangler
 */
async function setSecret(name, value) {
  return new Promise((resolve, reject) => {
    const proc = spawn('npx', ['wrangler', 'secret', 'put', name], {
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true
    });
    
    let stderr = '';
    proc.stderr.on('data', (data) => { stderr += data; });
    
    // Write the secret value to stdin
    proc.stdin.write(value);
    proc.stdin.end();
    
    proc.on('close', (code) => {
      if (code === 0) {
        resolve(true);
      } else {
        resolve(false);
      }
    });
    
    proc.on('error', reject);
  });
}

/**
 * Prompt user for input (with optional hidden input for secrets)
 */
function prompt(question, hidden = false) {
  return new Promise((resolve) => {
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

/**
 * Check if wrangler is authenticated
 */
async function checkWranglerAuth() {
  const result = await runWrangler(['whoami']);
  return result.code === 0 && !result.stdout.includes('not authenticated');
}

/**
 * Load secrets from .env or .dev.vars file
 */
async function loadEnvFile() {
  const envPaths = [
    join(__dirname, '..', '.env'),
    join(__dirname, '..', '.dev.vars')
  ];
  
  for (const envPath of envPaths) {
    if (existsSync(envPath)) {
      const content = await readFile(envPath, 'utf-8');
      const secrets = {};
      
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        
        const match = trimmed.match(/^([A-Z_]+)=["']?(.+?)["']?$/);
        if (match) {
          secrets[match[1]] = match[2];
        }
      }
      
      return { path: envPath, secrets };
    }
  }
  
  return null;
}

/**
 * Interactive setup mode
 */
async function interactiveSetup() {
  logHeader('AI Portal Secrets Setup');
  
  log('\nThis script will help you configure the required API keys as Cloudflare secrets.', colors.dim);
  log('Secrets are securely stored in Cloudflare and never exposed in your code.\n', colors.dim);
  
  // Check wrangler auth
  logSection('Checking Wrangler authentication...');
  const isAuthed = await checkWranglerAuth();
  
  if (!isAuthed) {
    log('✗ Not authenticated with Cloudflare', colors.red);
    log('\nPlease run: npx wrangler login', colors.yellow);
    process.exit(1);
  }
  log('✓ Authenticated with Cloudflare', colors.green);
  
  // Process each secret
  let configured = 0;
  let skipped = 0;
  
  for (const secret of SECRETS) {
    logSection(`${secret.name}`);
    log(`  ${secret.description}`, colors.dim);
    log(`  Get your key at: ${secret.url}`, colors.blue);
    
    if (!secret.required) {
      log('  (Optional)', colors.yellow);
    }
    
    console.log('');
    const value = await prompt(`  Enter ${secret.name} (or press Enter to skip): `);
    
    if (!value) {
      log('  ⊘ Skipped', colors.yellow);
      skipped++;
      continue;
    }
    
    // Validate prefix if specified
    if (secret.prefix && !value.startsWith(secret.prefix)) {
      log(`  ⚠ Warning: Key doesn't start with expected prefix '${secret.prefix}'`, colors.yellow);
      const confirm = await prompt('  Continue anyway? (y/N): ');
      if (confirm.toLowerCase() !== 'y') {
        log('  ⊘ Skipped', colors.yellow);
        skipped++;
        continue;
      }
    }
    
    // Set the secret
    log('  Setting secret...', colors.dim);
    const success = await setSecret(secret.name, value);
    
    if (success) {
      log('  ✓ Secret configured successfully', colors.green);
      configured++;
    } else {
      log('  ✗ Failed to set secret', colors.red);
    }
  }
  
  // Summary
  logHeader('Setup Complete');
  log(`\n  Configured: ${configured}`, colors.green);
  log(`  Skipped:    ${skipped}`, colors.yellow);
  
  if (configured > 0) {
    log('\n✓ Secrets are now stored securely in Cloudflare.', colors.green);
    log('  They will be available to your Worker at runtime.\n', colors.dim);
  }
  
  if (skipped > 0) {
    log('\nTo configure skipped secrets later, run this script again', colors.dim);
    log('or use: npx wrangler secret put <SECRET_NAME>\n', colors.dim);
  }
}

/**
 * Load from env file mode
 */
async function envFileSetup() {
  logHeader('Loading Secrets from Environment File');
  
  const envData = await loadEnvFile();
  
  if (!envData) {
    log('\n✗ No .env or .dev.vars file found', colors.red);
    log('\nCreate one from the example:', colors.dim);
    log('  cp .dev.vars.example .dev.vars', colors.cyan);
    log('  # Then edit .dev.vars with your API keys\n', colors.dim);
    process.exit(1);
  }
  
  log(`\nFound: ${envData.path}`, colors.green);
  
  // Check wrangler auth
  logSection('Checking Wrangler authentication...');
  const isAuthed = await checkWranglerAuth();
  
  if (!isAuthed) {
    log('✗ Not authenticated with Cloudflare', colors.red);
    log('\nPlease run: npx wrangler login', colors.yellow);
    process.exit(1);
  }
  log('✓ Authenticated with Cloudflare', colors.green);
  
  // Set secrets from env file
  let configured = 0;
  let skipped = 0;
  
  for (const secret of SECRETS) {
    const value = envData.secrets[secret.name];
    
    if (!value || value.includes('your-') || value.includes('here')) {
      log(`⊘ ${secret.name}: Skipped (placeholder or empty)`, colors.yellow);
      skipped++;
      continue;
    }
    
    log(`Setting ${secret.name}...`, colors.dim);
    const success = await setSecret(secret.name, value);
    
    if (success) {
      log(`✓ ${secret.name}: Configured`, colors.green);
      configured++;
    } else {
      log(`✗ ${secret.name}: Failed`, colors.red);
    }
  }
  
  // Summary
  logHeader('Import Complete');
  log(`\n  Configured: ${configured}`, colors.green);
  log(`  Skipped:    ${skipped}`, colors.yellow);
  
  if (configured > 0) {
    log('\n✓ Secrets imported successfully.', colors.green);
  }
}

/**
 * Check mode - show which secrets are configured
 */
async function checkSecrets() {
  logHeader('Checking Configured Secrets');
  
  // Check wrangler auth
  const isAuthed = await checkWranglerAuth();
  
  if (!isAuthed) {
    log('\n✗ Not authenticated with Cloudflare', colors.red);
    log('Please run: npx wrangler login\n', colors.yellow);
    process.exit(1);
  }
  
  log('\nNote: Wrangler cannot list secret values for security reasons.', colors.dim);
  log('This check only verifies that secrets are set, not their values.\n', colors.dim);
  
  // List secrets
  const result = await runWrangler(['secret', 'list']);
  
  if (result.code !== 0) {
    log('✗ Failed to list secrets', colors.red);
    log(result.stderr, colors.red);
    process.exit(1);
  }
  
  const configuredSecrets = result.stdout
    .split('\n')
    .filter(line => line.includes('name'))
    .map(line => {
      const match = line.match(/"name":\s*"([^"]+)"/);
      return match ? match[1] : null;
    })
    .filter(Boolean);
  
  console.log('');
  for (const secret of SECRETS) {
    const isConfigured = configuredSecrets.includes(secret.name);
    const status = isConfigured ? '✓' : '✗';
    const color = isConfigured ? colors.green : (secret.required ? colors.red : colors.yellow);
    const reqText = secret.required ? ' (required)' : ' (optional)';
    
    log(`${status} ${secret.name}${reqText}`, color);
  }
  
  console.log('');
  const requiredMissing = SECRETS
    .filter(s => s.required && !configuredSecrets.includes(s.name))
    .map(s => s.name);
  
  if (requiredMissing.length > 0) {
    log(`⚠ Missing required secrets: ${requiredMissing.join(', ')}`, colors.yellow);
    log('\nRun this script without arguments to configure them:\n', colors.dim);
    log('  node scripts/setup-secrets.js\n', colors.cyan);
  } else {
    log('✓ All required secrets are configured\n', colors.green);
  }
}

// Main
async function main() {
  const args = process.argv.slice(2);
  
  try {
    if (args.includes('--check') || args.includes('-c')) {
      await checkSecrets();
    } else if (args.includes('--env') || args.includes('-e')) {
      await envFileSetup();
    } else if (args.includes('--help') || args.includes('-h')) {
      console.log(`
AI Portal Secrets Setup

Usage:
  node scripts/setup-secrets.js           Interactive setup
  node scripts/setup-secrets.js --check   Check configured secrets
  node scripts/setup-secrets.js --env     Load from .env/.dev.vars file
  node scripts/setup-secrets.js --help    Show this help

Required Secrets:
  OPENROUTER_API_KEY    Access to 200+ AI models via OpenRouter
  GEMINI_API_KEY        Google Gemini, Imagen, Veo access

Optional Secrets:
  ANTHROPIC_API_KEY     Claude models direct access
  OPENAI_API_KEY        GPT, DALL-E, Whisper, TTS access
`);
    } else {
      await interactiveSetup();
    }
  } catch (error) {
    log(`\n✗ Error: ${error.message}`, colors.red);
    process.exit(1);
  }
}

main();
