const jwt   = require('jsonwebtoken');
const prisma = require('../config/prisma');

const authGuard = async (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer '))
    return res.status(401).json({ message: 'No token provided.' });

  const token = auth.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user    = await prisma.user.findUnique({
      where:  { id: decoded.id },
      select: {
        id: true, name: true, email: true, role: true, isActive: true,
        faculty: true, avatar: true, preferredLanguages: true,
        readingGoal: true, fcmToken: true, fcmTokenMobile: true, fcmTokenWeb: true,
      },
    });
    if (!user || !user.isActive)
      return res.status(401).json({ message: 'User not found or inactive.' });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
};

module.exports = authGuard;
