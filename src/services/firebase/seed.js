// src/services/firebase/seed.js
// Run this ONCE to create the first admin account
// After admin account is created, delete this file or never call it again

import { createUser } from './auth';

export const seedAdmin = async () => {
  try {
    await createUser(
      'admin',        // username — login with this
      'admin123',     // password — change this after first login
      {
        full_name: 'Super Admin',
        email:     'admin@saapt.app',
        phone:     '',
        role:      'admin',
      }
    );
    console.log('✅ Admin account created successfully');
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
};