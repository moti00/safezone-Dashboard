// Cloud Function to delete an existing user from Firebase Authentication
// and remove them from the operators collection

const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
    admin.initializeApp();
}

/**
 * Cloud Function to delete an existing user from Firebase Authentication
 * and remove them from the operators collection
 * 
 * @param {Object} data - The user data
 * @param {string} data.uid - The user ID to delete
 * @returns {Promise<Object>} The result of the deletion
 */
exports.deleteUser = functions.https.onCall(async (data, context) => {
    // Check if the caller is authenticated
    if (!context.auth) {
        throw new functions.https.HttpsError(
            'unauthenticated',
            'המשתמש חייב להיות מחובר כדי לבצע פעולה זו'
        );
    }

    // Get the caller's custom claims
    const callerUid = context.auth.uid;
    const callerUser = await admin.auth().getUser(callerUid);
    const customClaims = callerUser.customClaims || {};

    // Check if the caller has permission to delete users
    if (customClaims.role !== 'customer-admin' && customClaims.role !== 'system-admin') {
        throw new functions.https.HttpsError(
            'permission-denied',
            'אין לך הרשאות מספיקות למחיקת משתמשים'
        );
    }

    // Validate required fields
    if (!data.uid) {
        throw new functions.https.HttpsError(
            'invalid-argument',
            'חסר מזהה משתמש למחיקה'
        );
    }

    try {
        // Get the user's current data to check if they belong to the caller's customer
        const userToDelete = await admin.auth().getUser(data.uid);
        const userClaims = userToDelete.customClaims || {};
        
        // Determine the customer ID
        const callerCustomerId = customClaims.customerId;
        const userCustomerId = userClaims.customerId;
        
        // Check if the caller has permission to delete this user
        // System admin can delete any user, customer admin can only delete users in their customer
        if (customClaims.role !== 'system-admin' && callerCustomerId !== userCustomerId) {
            throw new functions.https.HttpsError(
                'permission-denied',
                'אין לך הרשאות למחוק משתמש זה'
            );
        }

        // Delete the user from the operators collection first
        await admin.firestore()
            .collection('customers')
            .doc(userCustomerId)
            .collection('operators')
            .doc(data.uid)
            .delete();

        // Then delete the user from Firebase Authentication
        await admin.auth().deleteUser(data.uid);

        // Return success
        return {
            success: true,
            message: 'המשתמש נמחק בהצלחה'
        };
    } catch (error) {
        console.error('Error deleting user:', error);
        throw new functions.https.HttpsError(
            'internal',
            `שגיאה במחיקת המשתמש: ${error.message}`
        );
    }
});