/**
 * SafeZone App - Cloud Functions
 * 
 * This file exports all the Cloud Functions for the SafeZone app.
 * Each function is defined in its own file for better organization.
 */

// Import user management functions
const { createUser } = require('./createUser');
const { updateUser } = require('./updateUser');
const { deleteUser } = require('./deleteUser');

// Export all functions
exports.createUser = createUser;
exports.updateUser = updateUser;
exports.deleteUser = deleteUser;
