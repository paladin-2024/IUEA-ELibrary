// Global env vars needed by all tests before any module is required
process.env.JWT_SECRET      = 'iuea-test-secret-32chars-minimum!!';
process.env.NODE_ENV        = 'test';
process.env.PORT            = '5001';
process.env.MONGODB_URI     = 'mongodb://localhost:27017/iuea_test';
process.env.DATABASE_URI    = 'mongodb://localhost:27017/iuea_test';
process.env.GOOGLE_CLIENT_ID = 'test-google-client-id';
process.env.SMTP_USER       = 'test@iuea.ac.ug';
process.env.SMTP_PASS       = 'test-pass';
process.env.CLIENT_WEB_URL  = 'http://localhost:5173';
process.env.R2_BUCKET_NAME  = '';  // intentionally empty → dev fallback
process.env.FIREBASE_PROJECT_ID   = 'test-project';
process.env.FIREBASE_CLIENT_EMAIL = 'test@test-project.iam.gserviceaccount.com';
process.env.FIREBASE_PRIVATE_KEY  = '-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEA0Z3VS5JJcds3xHn/ygWep4PAtEsDgjMUzSELAMFRxVIkPH01\n-----END RSA PRIVATE KEY-----\n';
