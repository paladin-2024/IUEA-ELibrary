require('dotenv').config();

const app           = require('./app');
const connectDB     = require('./config/db');
const { initFirebase } = require('./config/firebase');

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();
  initFirebase();

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
  });
};

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
