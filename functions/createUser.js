// Cloud Function to create a new user in Firebase Authentication
// and add them to the operators collection

const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Cloud Function to create a new user in Firebase Authentication
 * and add them to the operators collection
 *
 * @param {Object} data - The user data
 * @param {string} data.username - The username
 * @param {string} data.password - The password
 * @param {string} data.role - The user role (admin, viewer, customer-admin)
 * @param {string} data.phone - The user phone number (optional)
 * @param {string} data.customerId - The customer ID
 * @returns {Promise<Object>} The created user data
 */
exports.createUser = functions.https.onCall(async (data, context) => {
  // Check if the caller is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "המשתמש חייב להיות מחובר כדי לבצע פעולה זו"
    );
  }

  // Get the caller's custom claims
  const callerUid = context.auth.uid;
  const callerUser = await admin.auth().getUser(callerUid);
  const customClaims = callerUser.customClaims || {};

  // Check if the caller has permission to create users
  if (
    customClaims.role !== "customer-admin" &&
    customClaims.role !== "system-admin"
  ) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "אין לך הרשאות מספיקות ליצירת משתמשים"
    );
  }

  // Validate required fields
  if (!data.username || !data.password || !data.role || !data.customerDomain) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "חסרים שדות חובה: שם משתמש, סיסמה, תפקיד ודומיין לקוח"
    );
  }

  try {
    // Create email from username and customer domain
    const email = `${data.username}@${data.customerDomain}.com`;

    // Create the user in Firebase Authentication
    const userRecord = await admin.auth().createUser({
      email: email,
      password: data.password,
      displayName: data.username,
    });

    // Determine the customer ID
    // If the caller is a system admin, use the provided customer ID
    // Otherwise, use the caller's customer ID
    const customerId =
      customClaims.role === "system-admin"
        ? data.customerId
        : customClaims.customerId;

    // Set custom claims for the new user
    await admin.auth().setCustomUserClaims(userRecord.uid, {
      role: data.role,
      customerId: customerId,
    });

    // Add the user to the operators collection
    await admin
      .firestore()
      .collection("customers")
      .doc(customerId)
      .collection("operators")
      .doc(userRecord.uid)
      .set({
        username: data.username,
        role: data.role,
        phone: data.phone || null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: callerUid,
      });

    // Return the created user data
    return {
      success: true,
      uid: userRecord.uid,
      username: data.username,
      role: data.role,
    };
  } catch (error) {
    console.error("Error creating user:", error);
    throw new functions.https.HttpsError(
      "internal",
      `שגיאה ביצירת המשתמש: ${error.message}`
    );
  }
});
