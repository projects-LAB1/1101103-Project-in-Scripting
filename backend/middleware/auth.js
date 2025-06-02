import { admin } from '../firebase-config.js';

// Middleware สำหรับตรวจสอบ Firebase ID Token
export const verifyFirebaseToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'No token provided or invalid format' 
      });
    }

    const idToken = authHeader.split('Bearer ')[1];
    
    // ตรวจสอบว่าเป็น mock token หรือไม่
    if (idToken === 'mock-token' || idToken.startsWith('mock-')) {
      // Mock user สำหรับการทดสอบ
      req.user = {
        uid: 'mock-user-123',
        email: 'test@example.com',
        emailVerified: true,
        name: 'Test User',
        picture: null
      };
      console.log('Using mock authentication');
      return next();
    }
    
    // ตรวจสอบ token กับ Firebase (ถ้ามี admin app)
    if (admin.apps.length > 0) {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      
      // เพิ่มข้อมูลผู้ใช้ลงใน request object
      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        emailVerified: decodedToken.email_verified,
        name: decodedToken.name || decodedToken.display_name,
        picture: decodedToken.picture
      };
    } else {
      // ถ้าไม่มี Firebase Admin ให้ใช้ mock user
      req.user = {
        uid: 'mock-user-123',
        email: 'test@example.com',
        emailVerified: true,
        name: 'Test User',
        picture: null
      };
      console.log('Firebase Admin not available, using mock authentication');
    }
    
    next();
  } catch (error) {
    console.error('Error verifying Firebase token:', error);
    return res.status(401).json({ 
      error: 'Unauthorized', 
      message: 'Invalid or expired token' 
    });
  }
};

// Middleware สำหรับ endpoints ที่ไม่บังคับต้องมี token (optional auth)
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const idToken = authHeader.split('Bearer ')[1];
      
      // ตรวจสอบว่าเป็น mock token หรือไม่
      if (idToken === 'mock-token' || idToken.startsWith('mock-')) {
        req.user = {
          uid: 'mock-user-123',
          email: 'test@example.com',
          emailVerified: true,
          name: 'Test User',
          picture: null
        };
        return next();
      }
      
      // ตรวจสอบ token กับ Firebase (ถ้ามี admin app)
      if (admin.apps.length > 0) {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        
        req.user = {
          uid: decodedToken.uid,
          email: decodedToken.email,
          emailVerified: decodedToken.email_verified,
          name: decodedToken.name || decodedToken.display_name,
          picture: decodedToken.picture
        };
      }
    }
    
    next();
  } catch (error) {
    // ถ้า token ไม่ถูกต้อง ให้ผ่านไปได้แต่ไม่มีข้อมูล user
    next();
  }
}; 