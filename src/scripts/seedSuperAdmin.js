/**
 * Seed the first Super Admin account.
 *
 * Usage (from ca_hub_backend):
 *   npm run seed:superadmin
 *
 * Optional env overrides:
 *   SUPERADMIN_NAME, SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD, SUPERADMIN_MOBILE
 *
 * Idempotent — safe to re-run; skips if a superadmin with that email already exists.
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User.js';

const SEED = {
  name: process.env.SUPERADMIN_NAME || 'Super Admin',
  email: (process.env.SUPERADMIN_EMAIL || 'superadmin@cahub.local').toLowerCase(),
  password: process.env.SUPERADMIN_PASSWORD || 'SuperAdmin@123',
  mobile: process.env.SUPERADMIN_MOBILE || '',
};

const run = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI is not set. Add it to .env before seeding.');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log(`✓ Connected to MongoDB`);

  const existing = await User.findOne({ email: SEED.email });
  if (existing) {
    if (existing.role === 'superadmin') {
      console.log(`✓ Super Admin already exists: ${SEED.email}`);
      console.log('  Nothing to do.');
      await mongoose.disconnect();
      process.exit(0);
    }
    console.error(`❌ Email ${SEED.email} is already registered as role="${existing.role}".`);
    console.error('   Use a different SUPERADMIN_EMAIL or remove that user first.');
    await mongoose.disconnect();
    process.exit(1);
  }

  const anySuperAdmin = await User.findOne({ role: 'superadmin' });
  if (anySuperAdmin) {
    console.log(`✓ A Super Admin already exists (${anySuperAdmin.email}).`);
    console.log('  Skipping seed. Set SUPERADMIN_EMAIL to that account if you need to reset it manually.');
    await mongoose.disconnect();
    process.exit(0);
  }

  const user = await User.create({
    name: SEED.name,
    email: SEED.email,
    password: SEED.password,
    mobile: SEED.mobile || undefined,
    role: 'superadmin',
    isActive: true,
    mustChangePassword: false,
  });

  console.log('\n✅ Super Admin created successfully');
  console.log('─────────────────────────────────────');
  console.log(`  Name:     ${user.name}`);
  console.log(`  Email:    ${user.email}`);
  console.log(`  Password: ${SEED.password}`);
  console.log(`  Role:     ${user.role}`);
  console.log('─────────────────────────────────────');
  console.log('  Sign in at /login then open /super-admin');
  console.log('  Change this password after first login in production.\n');

  await mongoose.disconnect();
  process.exit(0);
};

run().catch(async (err) => {
  console.error('❌ Seed failed:', err.message);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore
  }
  process.exit(1);
});
