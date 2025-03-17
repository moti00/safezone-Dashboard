// Firebase Users Module - Handles fetching and managing users from Firebase
import firebaseConfig from "../firebase-config.js";

// Initialize Firebase if not already initialized
if (!firebase.apps?.length) {
  firebase.initializeApp(firebaseConfig);
}

const db = firebase.firestore();

/**
 * Fetches operators for the current customer
 * @returns {Promise<Array>} Array of operator objects
 */
export async function fetchOperators() {
  try {
    // Get current user
    const currentUser = firebase.auth().currentUser;
    if (!currentUser) {
      console.error("No user is signed in");
      return [];
    }

    // Get user's custom claims to determine customer ID and role
    const idTokenResult = await currentUser.getIdTokenResult();
    const customerId = idTokenResult.claims.customerId;
    const userRole = idTokenResult.claims.role;

    if (!customerId) {
      console.error("User does not have a customer ID");
      return [];
    }

    // Fetch operators from the customer's operators subcollection
    const operatorsRef = db
      .collection("customers")
      .doc(customerId)
      .collection("operators");
    const snapshot = await operatorsRef.get();

    if (snapshot.empty) {
      console.log("No operators found");
      return [];
    }

    // Convert the snapshot to an array of operator objects
    const operators = [];
    snapshot.forEach((doc) => {
      operators.push({
        id: doc.id,
        username: doc.data().username,
        role: doc.data().role,
        phone: doc.data().phone || "לא הוגדר",
      });
    });

    return operators;
  } catch (error) {
    console.error("Error fetching operators:", error);
    return [];
  }
}

/**
 * Creates a new operator in Firebase using Cloud Function
 * @param {Object} operatorData - The operator data
 * @returns {Promise<string>} The ID of the created operator
 */
export async function createOperator(operatorData) {
  try {
    // Get current user
    const currentUser = firebase.auth().currentUser;
    if (!currentUser) {
      throw new Error("No user is signed in");
    }

    // Get user's custom claims to determine customer ID and role
    const idTokenResult = await currentUser.getIdTokenResult();
    const customerId = idTokenResult.claims.customerId;
    const userRole = idTokenResult.claims.role;

    // Check if user has permission to create operators
    if (userRole !== "customer-admin" && userRole !== "system-admin") {
      throw new Error("Insufficient permissions to create operators");
    }

    // Call the Cloud Function to create the user
    const createUserFunction = firebase.functions().httpsCallable("createUser");
    const result = await createUserFunction({
      username: operatorData.username,
      password: operatorData.password,
      role: operatorData.role,
      phone: operatorData.phone || null,
      customerId:
        userRole === "system-admin" ? operatorData.customerId : customerId,
      customerDomain: idTokenResult.claims.customerDomain,
    });

    return result.data.uid;
  } catch (error) {
    console.error("Error creating operator:", error);
    throw error;
  }
}

/**
 * Updates an existing operator in Firebase using Cloud Function
 * @param {string} operatorId - The ID of the operator to update
 * @param {Object} operatorData - The updated operator data
 * @returns {Promise<void>}
 */
export async function updateOperator(operatorId, operatorData) {
  try {
    // Get current user
    const currentUser = firebase.auth().currentUser;
    if (!currentUser) {
      throw new Error("No user is signed in");
    }

    // Get user's custom claims to determine customer ID and role
    const idTokenResult = await currentUser.getIdTokenResult();
    const customerId = idTokenResult.claims.customerId;
    const userRole = idTokenResult.claims.role;

    // Check if user has permission to update operators
    if (userRole !== "customer-admin" && userRole !== "system-admin") {
      throw new Error("Insufficient permissions to update operators");
    }

    // Call the Cloud Function to update the user
    const updateUserFunction = firebase.functions().httpsCallable("updateUser");
    await updateUserFunction({
      uid: operatorId,
      username: operatorData.username,
      role: operatorData.role,
      phone: operatorData.phone || null,
    });
  } catch (error) {
    console.error("Error updating operator:", error);
    throw error;
  }
}

/**
 * Deletes an operator from Firebase using Cloud Function
 * @param {string} operatorId - The ID of the operator to delete
 * @returns {Promise<void>}
 */
export async function deleteOperator(operatorId) {
  try {
    // Get current user
    const currentUser = firebase.auth().currentUser;
    if (!currentUser) {
      throw new Error("No user is signed in");
    }

    // Get user's custom claims to determine customer ID and role
    const idTokenResult = await currentUser.getIdTokenResult();
    const customerId = idTokenResult.claims.customerId;
    const userRole = idTokenResult.claims.role;

    // Check if user has permission to delete operators
    if (userRole !== "customer-admin" && userRole !== "system-admin") {
      throw new Error("Insufficient permissions to delete operators");
    }

    // Call the Cloud Function to delete the user
    const deleteUserFunction = firebase.functions().httpsCallable("deleteUser");
    await deleteUserFunction({
      uid: operatorId,
    });
  } catch (error) {
    console.error("Error deleting operator:", error);
    throw error;
  }
}
