const express = require('express');
const bcrypt = require('bcrypt');
const User = require('./models/user');
const authRoutes = require('./routes/authRoutes');
const db = require('./config/db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use('/admin', authRoutes);

// Check if the connection is not already open before initializing
if (db.readyState !== 1) {
  db.once('open', async () => {
    console.log('Connected to MongoDB');

    // Create an admin user if not exists
    const adminUser = await User.findOne({ email: 'adminawesome@gmail.com' });
    if (!adminUser) {
      const hashedPassword = await bcrypt.hash('password', 10);
      await User.create({
        firstname: 'Admin',
        lastname: 'Admin',
        username: 'admin',
        email: 'adminawesome@gmail.com',
        password: hashedPassword,
      });
    }
  });

  // Additional code for registration endpoint
  app.post('/admin/register', async (req, res) => {
    // ... (same as before)
  });

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}
