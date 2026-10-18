 
const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/user');

async function ensureAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected');

    const email = '112233@gmail.com';
    const password = 'aone123';

    let admin = await User.findOne({ email });

    if (admin) {
      admin.role = 'admin';
      admin.password = password;
      admin.name = 'A-ONE Admin';

      await admin.save();
      console.log('Existing user updated to admin');
    } else {
      admin = new User({
        name: 'A-ONE Admin',
        email,
        password,
        role: 'admin',
      });

      await admin.save();
      console.log('Admin created successfully');
    }

    console.log('Admin email:', email);
    console.log('Admin password:', password);
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

ensureAdmin();
