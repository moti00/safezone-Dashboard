const admin = require("firebase-admin");
const prompt = require("prompt-sync")(); // For getting user input from the command line

// **חשוב:** ודא שהנתיב לקובץ מפתח חשבון השירות שלך נכון!
const serviceAccount = require("./safezone-b4b32-firebase-adminsdk-fbsvc-c5db96a924.json"); // **החלף אם שם הקובץ שלך שונה**

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`,
  authDomain: `${serviceAccount.project_id}.firebaseapp.com`,
});

const db = admin.firestore();

// פונקציה לחישוב חסם תוחם (Bounding Box) מפוליגון
function calculateBoundingBox(geoPoints) {
  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;

  geoPoints.forEach((point) => {
    minLat = Math.min(minLat, point._latitude);
    maxLat = Math.max(maxLat, point._latitude);
    minLng = Math.min(minLng, point._longitude);
    maxLng = Math.max(maxLng, point._longitude);
  });

  return [
    new admin.firestore.GeoPoint(minLat, minLng), // דרום-מערב
    new admin.firestore.GeoPoint(minLat, maxLng), // דרום-מזרח
    new admin.firestore.GeoPoint(maxLat, maxLng), // צפון-מזרח
    new admin.firestore.GeoPoint(maxLat, minLng), // צפון-מערב
  ];
}

async function createCustomer() {
  // 1. בקשת פרטי לקוח מהמשתמש דרך שורת הפקודה
  const customerName = prompt("הזן שם לקוח (למשל, עיריית חיפה): ");
  let adminUsername = prompt("הזן שם משתמש מנהל לקוח (למשל, חיפה-admin): ");
  // ניקוי שם המשתמש - הסרת רווחים ותווים מיוחדים
  adminUsername = adminUsername.replace(/[^a-zA-Z0-9-_]/g, "");
  const adminPassword = generatePassword(); // פונקציה ליצירת סיסמה אקראית (בהמשך)

  // Get customer domain from user
  const defaultDomain = "safezone-app.com";
  let customerDomain = prompt(
    `הזן דומיין לקוח (או השאר ריק לשימוש ב-${defaultDomain}): `
  );
  if (!customerDomain) {
    customerDomain = defaultDomain;
  }

  // **חשוב:** בשלב הזה, אנחנו מדלגים על הגדרת פוליגון גיאוגרפי לאזור השיפוט דרך שורת הפקודה
  // ב-MVP, נגדיר את הפוליגון הגיאוגרפי של אזור השיפוט **ידנית** ב-Firestore Console לאחר הרצת הסקריפט.
  // בגרסאות מתקדמות יותר, נוסיף כלי לציור פוליגונים בשורת הפקודה או בממשק ווב.

  const jurisdictionPolygon = [
    // **פוליגון גיאוגרפי ריק ** זמני** - יש לעדכן ידנית ב-Firestore Console!
    new admin.firestore.GeoPoint(0, 0),
    new admin.firestore.GeoPoint(0, 0),
    new admin.firestore.GeoPoint(0, 0),
    new admin.firestore.GeoPoint(0, 0),
    new admin.firestore.GeoPoint(0, 0),
  ];
  const jurisdictionBoundingBox = calculateBoundingBox(jurisdictionPolygon);

  // 2. יצירת משתמש ב-Firebase Authentication
  let adminUserId;
  try {
    // יצירת משתמש חדש ב-Firebase Authentication
    const userRecord = await admin.auth().createUser({
      email: `${adminUsername}@${customerDomain}`,
      password: adminPassword,
      displayName: `${customerName} Admin`,
    });
    adminUserId = userRecord.uid;

    // Set custom claims
    await admin.auth().setCustomUserClaims(adminUserId, {
      role: "customer-admin",
      customerId: `customer-${adminUsername}`,
      customerDomain: customerDomain,
    });
    console.log(
      `משתמש Firebase Authentication נוצר בהצלחה עם UID: ${adminUserId}`
    );
  } catch (authError) {
    console.error("שגיאה ביצירת משתמש Firebase Authentication:", authError);
    // במקרה של שגיאה, ניצור מזהה מקומי כגיבוי
    adminUserId = `local-admin-${adminUsername}-${Date.now()}`;
    console.warn(`נוצר מזהה מקומי כגיבוי: ${adminUserId}`);
  }

  // 3. יצירת מסמך לקוח חדש באוסף "customers"
  const customersCollection = db.collection("customers");
  const customerDocRef = customersCollection.doc(`customer-${adminUsername}`); // שימוש בשם משתמש כמזהה לקוח - ייחודיות?
  await customerDocRef.set({
    name: customerName,
    jurisdictionArea: jurisdictionPolygon, // פוליגון ריק זמני
    boundingBox: jurisdictionBoundingBox, // חסם תוחם ריק זמני
    adminUserId: adminUserId, // קישור למשתמש Firebase Authentication
  });

  // 4. יצירת מפעיל מנהל לקוח ראשוני באוסף המשני "operators"
  const operatorsCollection = customerDocRef.collection("operators");
  const operatorDocRef = operatorsCollection.doc(adminUserId); // שימוש ב-UID כמזהה מפעיל
  await operatorDocRef.set({
    username: adminUsername,
    role: "customer-admin",
  });

  console.log(`לקוח חדש "${customerName}" נוצר בהצלחה!`);
  console.log(`שם משתמש מנהל לקוח: ${adminUsername}`);
  console.log(`סיסמת מנהל לקוח (זמנית): ${adminPassword}`); // **חשוב: להציג סיסמה רק פעם אחת!**
  console.log(`מזהה משתמש Firebase Authentication: ${adminUserId}`);
  console.log(
    `**חשוב:** יש לעדכן **ידנית** את הפוליגון הגיאוגרפי של אזור השיפוט עבור לקוח זה ב-Firestore Console (אוסף "customers", מסמך "customer-${adminUsername}", שדה "jurisdictionArea").`
  );

  return customerDocRef.id; // החזרת מזהה הלקוח החדש
}

// פונקציה ליצירת סיסמה אקראית (פשוטה)
function generatePassword() {
  const length = 12;
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}

createCustomer();
