// Cloud Function to update an existing user in Firebase Authentication
// and update their information in the operators collection

const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Cloud Function to update an existing user in Firebase Authentication
 * and update their information in the operators collection
 *
 * @param {Object} data - The user data
 * @param {string} data.uid - The user ID to update
 * @param {string} data.username - The updated username
 * @param {string} data.role - The updated user role (admin, viewer, customer-admin)
 * @param {string} data.phone - The updated user phone number (optional)
 * @returns {Promise<Object>} The updated user data
 */
exports.updateUser = functions.https.onCall(async (data, context) => {
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

  // Check if the caller has permission to update users
  if (
    customClaims.role !== "customer-admin" &&
    customClaims.role !== "system-admin"
  ) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "אין לך הרשאות מספיקות לעדכון משתמשים"
    );
  }

  // Validate required fields
  if (!data.uid || !data.username || !data.role) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "חסרים שדות חובה: מזהה משתמש, שם משתמש ותפקיד"
    );
  }

  try {
    // Get the user's current data to check if they belong to the caller's customer
    const userToUpdate = await admin.auth().getUser(data.uid);
    const userClaims = userToUpdate.customClaims || {};

    // Determine the customer ID
    const callerCustomerId = customClaims.customerId;
    const userCustomerId = userClaims.customerId;

    // Check if the caller has permission to update this user
    // System admin can update any user, customer admin can only update users in their customer
    if (
      customClaims.role !== "system-admin" &&
      callerCustomerId !== userCustomerId
    ) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "אין לך הרשאות לעדכן משתמש זה"
      );
    }

    // Create email from username if username changed
    const email = `${data.username}@safezone.example.com`;

    // Update user in Firebase Authentication
    const updateAuthData = {
      displayName: data.username,
    };

    // Only update email if username changed
    if (userToUpdate.displayName !== data.username) {
      updateAuthData.email = email;
    }

    await admin.auth().updateUser(data.uid, updateAuthData);

    // Update custom claims if role changed
    if (userClaims.role !== data.role) {
      await admin.auth().setCustomUserClaims(data.uid, {
        role: data.role,
        customerId: userCustomerId, // Keep the same customer ID
        customerDomain: customClaims.customerDomain, // Keep the same customer domain
      });
    }

    // Update the user in the operators collection
    await admin
      .firestore()
      .collection("customers")
      .doc(userCustomerId)
      .collection("operators")
      .doc(data.uid)
      .update({
        username: data.username,
        role: data.role,
        phone: data.phone || null,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedBy: callerUid,
      });

    // Return the updated user data
    return {
      success: true,
      uid: data.uid,
      username: data.username,
      role: data.role,
    };
  } catch (error) {
    console.error("Error updating user:", error);
    throw new functions.https.HttpsError(
      "internal",
      `שגיאה בעדכון המשתמש: ${error.message}`
    );
  }
});
