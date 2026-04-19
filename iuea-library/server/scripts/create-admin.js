'use strict';
/**
 * Creates (or resets) the superadmin account.
 * Usage:  node scripts/create-admin.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const ADMIN = {
  name:  'Super Admin',
  email: 'admin@iuea.ac.ug',
  password: 'Admin@IUEA2025!',
  role: 'admin',
};

async function main() {
  const uri = process.env.MONGODB_URI || process.env.DATABASE_URI;
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
  console.log('Connected:', mongoose.connection.host);

  // Load model after connection
  const User = require('../src/models/User');

  const passwordHash = await bcrypt.hash(ADMIN.password, 12);

  const user = await User.findOneAndUpdate(
    { email: ADMIN.email },
    {
      $set: {
        name:         ADMIN.name,
        email:        ADMIN.email,
        passwordHash,
        role:         ADMIN.role,
        isActive:     true,
        faculty:      'IT',
        preferredLanguages: ['English'],
      },
    },
    { upsert: true, new: true },
  );

  console.log('\n✅ Admin account ready');
  console.log('   Email   :', ADMIN.email);
  console.log('   Password:', ADMIN.password);
  console.log('   Role    :', user.role);
  console.log('   ID      :', user._id.toString());
  await mongoose.disconnect();
}

main().catch((err) => { console.error(err); process.exit(1); });
