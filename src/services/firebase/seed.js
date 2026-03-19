// src/services/firebase/seed.js
// Run this ONCE to create the first admin account
// After admin account is created, delete this file or never call it again

import { createUser } from './auth';

export const seedAdmin = async () => {
  try {
    await createUser(
      'admin@saapt.app',   // email now
      'admin123',
      {
        full_name: 'Super Admin',
        role: 'admin',
      }
    );
    console.log('✅ Admin account created successfully');
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
};