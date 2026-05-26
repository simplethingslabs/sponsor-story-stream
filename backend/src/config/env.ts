/**
 * Environment variable validation.
 *
 * Hard requirements  → logged as errors and cause process.exit(1)
 * Soft requirements  → logged as warnings; the app starts but some
 *                      features (uploads, email) will be unavailable
 */

interface EnvVar {
  key: string;
  description: string;
  /** Values that look set but are still the .env.example placeholder */
  placeholders?: string[];
}

const HARD_REQUIRED: EnvVar[] = [
  { key: 'DATABASE_URL', description: 'PostgreSQL connection string' },
  { key: 'JWT_SECRET',   description: 'JWT signing secret' },
];

const SOFT_REQUIRED: EnvVar[] = [
  {
    key: 'CLOUDINARY_CLOUD_NAME',
    description: 'Cloudinary cloud name (file uploads)',
    placeholders: ['your-cloud-name'],
  },
  {
    key: 'CLOUDINARY_API_KEY',
    description: 'Cloudinary API key (file uploads)',
    placeholders: ['your-api-key'],
  },
  {
    key: 'CLOUDINARY_API_SECRET',
    description: 'Cloudinary API secret (file uploads)',
    placeholders: ['your-api-secret'],
  },
  {
    key: 'RESEND_API_KEY',
    description: 'Resend API key (transactional email)',
    placeholders: ['re_your_api_key'],
  },
  {
    key: 'FROM_EMAIL',
    description: 'Sender email address',
    placeholders: ['noreply@yourdomain.com'],
  },
];

function isMissingOrPlaceholder(key: string, placeholders: string[] = []): boolean {
  const val = process.env[key];
  if (!val) return true;
  return placeholders.includes(val);
}

/**
 * Validates all environment variables at startup.
 *
 * - Prints a clear report of what is and isn't configured.
 * - Exits with code 1 if any HARD_REQUIRED var is missing.
 * - Continues with a warning if SOFT_REQUIRED vars are missing.
 */
export function validateEnv(): void {
  const hardMissing: EnvVar[] = [];
  const softMissing: EnvVar[] = [];

  for (const v of HARD_REQUIRED) {
    if (isMissingOrPlaceholder(v.key, v.placeholders)) {
      hardMissing.push(v);
    }
  }

  for (const v of SOFT_REQUIRED) {
    if (isMissingOrPlaceholder(v.key, v.placeholders)) {
      softMissing.push(v);
    }
  }

  // Always print a startup summary
  const allChecked = [...HARD_REQUIRED, ...SOFT_REQUIRED];
  console.log('\n🔍 Environment check:');
  for (const v of allChecked) {
    const missing = isMissingOrPlaceholder(v.key, v.placeholders);
    const icon = missing ? '  ❌' : '  ✅';
    const label = missing ? `MISSING  — ${v.description}` : 'OK';
    console.log(`${icon}  ${v.key.padEnd(24)} ${label}`);
  }

  if (softMissing.length > 0) {
    console.warn('\n⚠️  Some optional services are not configured:');
    for (const v of softMissing) {
      console.warn(`   • ${v.key}: ${v.description}`);
    }
    console.warn('   These features will be unavailable until the vars are set.\n');
  }

  if (hardMissing.length > 0) {
    console.error('\n❌ Missing required environment variables:');
    for (const v of hardMissing) {
      console.error(`   • ${v.key}: ${v.description}`);
    }
    console.error('\n   Set these variables and restart the server.\n');
    process.exit(1);
  }
}
