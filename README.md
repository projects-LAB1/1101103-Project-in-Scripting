# คู่มือการทำระบบล็อกอินด้วย Google สำหรับ React Native โดยใช้ Supabase

## 1. ติดตั้งแพ็คเกจที่จำเป็น

เปิด Terminal และรันคำสั่งต่อไปนี้:

```bash
npm install expo-auth-session expo-web-browser @supabase/supabase-js @react-native-async-storage/async-storage
```

## 2. ตั้งค่า Google Cloud Console

1. เข้าไปที่ [Google Cloud Console](https://console.cloud.google.com)
2. สร้างโปรเจคใหม่หรือเลือกโปรเจคที่มีอยู่
3. ไปที่ "APIs & Services" > "OAuth consent screen"
   - เลือก User Type เป็น "External"
   - กรอกข้อมูลที่จำเป็น (ชื่อแอป, อีเมลผู้ติดต่อ)
   - เพิ่มขอบเขตที่จำเป็น (email, profile)
   - บันทึก
4. ไปที่ "APIs & Services" > "Credentials"
5. คลิก "Create Credentials" > "OAuth client ID"
   - เลือกประเภทเป็น "Web application"
   - ตั้งชื่อ เช่น "My App OAuth"
   - เพิ่ม Authorized redirect URIs:
     - `https://iabspnskcaiobwtfxxtv.supabase.co/auth/v1/callback`
     - `myproj://**`
   - คลิก "Create"
6. คัดลอก Client ID และ Client Secret เก็บไว้ใช้ในขั้นตอนถัดไป

## 3. ตั้งค่า Supabase

1. เข้าสู่ [Supabase Dashboard](https://app.supabase.com) และเลือกโปรเจค
2. ไปที่ "Authentication" > "Providers"
3. เปิดใช้งาน Google provider
4. กรอก Client ID และ Client Secret ที่ได้จาก Google Cloud Console
5. บันทึกการตั้งค่า

## 4. ตั้งค่าไฟล์ app.json

เปิดไฟล์ app.json และแก้ไขให้เป็นดังนี้:

```json
{
  "expo": {
    // ... ส่วนอื่นที่มีอยู่แล้ว
    "scheme": "myproj",
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.yourname.myproj"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.yourname.myproj"
    },
    "plugins": [
      "expo-auth-session"
    ]
  }
}
```

## 5. สร้างไฟล์ supabase.config.js

สร้างไฟล์ `supabase.config.js` ที่ root ของโปรเจค:

```javascript
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ใส่ URL และ Key จาก Supabase ของคุณ
const supabaseUrl = 'https://iabspnskcaiobwtfxxtv.supabase.co';
const supabaseAnonKey = 'YOUR_ANON_KEY';

// สร้าง Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

## 6. สร้างไฟล์ UserAuth.js

สร้างไฟล์ `models/UserAuth.js`:

```javascript
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabase.config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';

WebBrowser.maybeCompleteAuthSession();

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ตรวจสอบเซสชันที่ใช้งานอยู่
    checkSession();

    // สมัครรับการเปลี่ยนแปลงสถานะการยืนยันตัวตน
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);

      // บันทึกหรือลบเซสชัน
      if (session) {
        await AsyncStorage.setItem('supabase.session', JSON.stringify(session));
      } else {
        await AsyncStorage.removeItem('supabase.session');
      }
    });

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  const checkSession = async () => {
    try {
      // ตรวจสอบเซสชันที่มีอยู่ใน AsyncStorage
      const storedSession = await AsyncStorage.getItem('supabase.session');
      if (storedSession) {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        setUser(session?.user ?? null);
      }
    } catch (error) {
      console.error('Error checking session:', error);
    } finally {
      setLoading(false);
    }
  };

  // ฟังก์ชันล็อกอินด้วย Google
  const signInWithGoogle = async () => {
    try {
      const redirectUrl = AuthSession.makeRedirectUri({ 
        path: 'callback',
        preferLocalhost: true 
      });
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      
      if (error) throw error;

      // เปิดเบราว์เซอร์สำหรับการยืนยันตัวตน
      const result = await WebBrowser.openAuthSessionAsync(
        data?.url,
        redirectUrl
      );

      if (result.type === 'success') {
        // จัดการการยืนยันตัวตนที่สำเร็จ
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;
        
        if (sessionData?.session?.user) {
          // สร้าง/อัปเดตโปรไฟล์
          await supabase.from('profiles').upsert({
            user_id: sessionData.session.user.id,
            email: sessionData.session.user.email,
            name: sessionData.session.user.user_metadata?.full_name,
            avatar_url: sessionData.session.user.user_metadata?.avatar_url,
            updated_at: new Date(),
          });
        }

        return sessionData;
      }
      
      return null;
    } catch (error) {
      console.error('Google sign-in error:', error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    signInWithGoogle,
    // เพิ่มฟังก์ชันอื่นๆ ตามต้องการ
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const UserAuth = () => {
  return useContext(AuthContext);
};
```

## 7. แก้ไขหน้า Login

แก้ไขไฟล์ `screens/LoginScreen.js` ให้มีปุ่มล็อกอินด้วย Google:

```javascript
// ในส่วนของ imports เพิ่ม:
import { UserAuth } from '../models/UserAuth';

// ในส่วนของ component สร้าง state และเรียกใช้ hook:
const LoginScreen = ({ navigation }) => {
  const [googleLoading, setGoogleLoading] = useState(false);
  const { signInWithGoogle } = UserAuth();

  // เพิ่มฟังก์ชันสำหรับการล็อกอินด้วย Google
  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const data = await signInWithGoogle();
      if (data?.session?.access_token) {
        await AsyncStorage.setItem('@session_token', data.session.access_token);
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
      Alert.alert(
        "ล็อกอินด้วย Google ล้มเหลว",
        "เกิดข้อผิดพลาดขณะล็อกอินด้วย Google กรุณาลองอีกครั้ง"
      );
    } finally {
      setGoogleLoading(false);
    }
  };

  // ในส่วนของ return เพิ่มปุ่ม Google:
  return (
    // ...ส่วนอื่นๆ ของ component

    {/* ปุ่มล็อกอินด้วย Google */}
    <TouchableOpacity 
      style={[styles.socialButton, googleLoading && styles.disabledButton]}
      onPress={handleGoogleSignIn}
      disabled={googleLoading}
    >
      {googleLoading ? (
        <ActivityIndicator size="small" color="#DB4437" />
      ) : (
        <>
          <FontAwesome name="google" size={20} color="#DB4437" />
          <Text style={styles.socialButtonText}>Google</Text>
        </>
      )}
    </TouchableOpacity>

    // ...ส่วนอื่นๆ ของ component
  );
};
```

## 8. ใช้ AuthProvider ใน App.js

แก้ไขไฟล์ `App.js` ให้ครอบ component ด้วย AuthProvider:

```javascript
import { AuthProvider } from './models/UserAuth';

export default function App() {
  return (
    <AuthProvider>
      {/* ส่วนอื่นๆ ของแอป */}
    </AuthProvider>
  );
}
```

## 9. ทดสอบแอป

1. รันแอปด้วยคำสั่ง: `expo start`
2. เปิดแอปในอุปกรณ์จริงหรืออีมูเลเตอร์ที่มีบริการ Google
3. กดปุ่ม "Google" บนหน้าล็อกอิน
4. หากตั้งค่าถูกต้อง หน้าต่างเบราว์เซอร์จะเปิดขึ้นเพื่อให้ล็อกอินด้วยบัญชี Google
5. หลังจากล็อกอินสำเร็จ คุณจะถูกนำกลับมายังแอปและเข้าสู่ระบบโดยอัตโนมัติ

## การแก้ไขปัญหาที่พบบ่อย

1. **ปัญหา Redirect URL ไม่ถูกต้อง**
   - ตรวจสอบว่า URL scheme ใน app.json ตรงกับที่ตั้งค่าใน Google Cloud Console
   - ตรวจสอบว่าได้เพิ่ม `myproj://**` เป็น Authorized redirect URI ใน Google Cloud Console

2. **ปัญหาการเชื่อมต่อกับ Supabase**
   - ตรวจสอบว่า Supabase URL และ anon key ถูกต้อง
   - ตรวจสอบบันทึกใน Supabase Dashboard

3. **ปัญหาการล็อกอินล้มเหลว**
   - ตรวจสอบว่าได้เปิดใช้งาน Google provider ใน Supabase
   - ตรวจสอบว่า Client ID และ Client Secret ถูกต้อง

หากคุณยังพบปัญหา สามารถดูข้อมูลเพิ่มเติมได้ที่:
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Expo AuthSession Documentation](https://docs.expo.dev/versions/latest/sdk/auth-session/)