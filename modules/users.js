import { mockData } from "./mockData.js";
import {
  fetchOperators,
  createOperator,
  updateOperator,
  deleteOperator,
} from "./firebaseUsers.js";

export function initializeUsers() {
  const createUserBtn = document.getElementById("create-user-btn");
  const userForm = document.getElementById("user-form");
  const userModal = document.getElementById("user-modal");
  const closeButtons = userModal.querySelectorAll(".close-btn, .modal-cancel");
  const copyPasswordBtn = document.getElementById("copy-password");
  const togglePasswordBtn = document.getElementById("toggle-user-password");
  const passwordField = document.getElementById("generated-password");

  // Store operators data
  let operators = [];

  // Fetch operators from Firebase and render the table
  const loadOperators = async () => {
    try {
      operators = await fetchOperators();
      renderUserTable();
    } catch (error) {
      console.error("Error loading operators:", error);
      // Show error message instead of using mock data
      alert("שגיאה בטעינת המשתמשים: " + error.message);
      operators = [];
      renderUserTable();
    }
  };

  const renderUserTable = () => {
    const usersTable = document.getElementById("users-table");
    usersTable.innerHTML = "";

    operators.forEach((user) => {
      const row = document.createElement("tr");

      const usernameCell = document.createElement("td");
      usernameCell.textContent = user.username;

      const roleCell = document.createElement("td");
      roleCell.textContent = user.role;

      const phoneCell = document.createElement("td");
      phoneCell.textContent = user.phone || "לא הוגדר";
      phoneCell.style.whiteSpace = "nowrap"; // Prevent phone number from wrapping

      const actionsCell = document.createElement("td");
      actionsCell.style.whiteSpace = "nowrap"; // Prevent actions from wrapping

      const editDeleteContainer = document.createElement("div");
      editDeleteContainer.style.display = "flex";

      const editBtn = document.createElement("button");
      editBtn.classList.add("btn", "btn-icon");
      editBtn.innerHTML =
        '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>';

      const deleteBtn = document.createElement("button");
      deleteBtn.classList.add("btn", "btn-icon");
      deleteBtn.innerHTML =
        '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>';

      editBtn.addEventListener("click", () => editUser(user));

      deleteBtn.addEventListener("click", () =>
        showConfirmDialog(
          "מחיקת משתמש",
          `האם אתה בטוח שברצונך למחוק את המשתמש "${user.username}"?`,
          () => deleteUser(user.id)
        )
      );

      // Add edit and delete buttons to their container
      editDeleteContainer.appendChild(editBtn);
      editDeleteContainer.appendChild(deleteBtn);
      editDeleteContainer.style.gap = "0.25rem";

      actionsCell.appendChild(editDeleteContainer);

      row.appendChild(usernameCell);
      row.appendChild(roleCell);
      row.appendChild(phoneCell);
      row.appendChild(actionsCell);

      usersTable.appendChild(row);
    });
  };

  const handleUserSubmit = async (e) => {
    e.preventDefault();

    const username = document.getElementById("new-username").value;
    const password = document.getElementById("generated-password").value;
    const phone = document.getElementById("new-phone").value;
    const role = document.getElementById("new-role").value;

    // Get customer domain from custom claims
    const currentUser = firebase.auth().currentUser;
    const idTokenResult = await currentUser.getIdTokenResult();
    const customerDomain = idTokenResult.claims.customerDomain;

    const editUserId = document.getElementById("edit-user-id").value;

    try {
      if (editUserId) {
        // Update existing operator in Firebase
        await updateOperator(editUserId, {
          username,
          role,
          phone,
        });
      } else {
        // Create new operator in Firebase
        await createOperator({
          username,
          role,
          password,
          phone,
        });
      }

      // Reload operators from Firebase
      await loadOperators();

      // Close the modal
      setTimeout(() => {
        document.getElementById("user-modal").classList.remove("active");
      }, 50);

      // Reset the form
      document.getElementById("user-form").reset();
      document.getElementById("edit-user-id").value = "";
      document.querySelector(".modal-header h2").textContent = "צור משתמש חדש";
    } catch (error) {
      console.error("Error saving operator:", error);
      alert(`שגיאה בשמירת המשתמש: ${error.message}`);
    }
  };

  const editUser = (user) => {
    document.getElementById("new-username").value = user.username;
    document.getElementById("new-phone").value = user.phone || "";
    document.getElementById("generated-password").value = ""; // Don't show password for security
    document.getElementById("edit-user-id").value = user.id;

    document.querySelector(".modal-header h2").textContent = "ערוך משתמש";
    document.getElementById("user-modal").classList.add("active");
  };

  const deleteUser = async (userId) => {
    try {
      // Delete operator from Firebase
      await deleteOperator(userId);
      // Reload operators from Firebase
      await loadOperators();
    } catch (error) {
      console.error("Error deleting operator:", error);
      alert(`שגיאה במחיקת המשתמש: ${error.message}`);
    }
  };

  const generateRandomPassword = () => {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let password = "";

    for (let i = 0; i < 10; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return password;
  };

  const showConfirmDialog = (title, message, onConfirm) => {
    const confirmDialog = document.getElementById("confirm-dialog");
    const confirmOkBtn = document.getElementById("confirm-ok");

    document.getElementById("confirm-title").textContent = title;
    document.getElementById("confirm-message").textContent = message;

    confirmOkBtn.onclick = () => {
      onConfirm();
      // Add a timeout to allow the animation to complete
      setTimeout(() => {
        confirmDialog.classList.remove("active");
      }, 50);
    };

    confirmDialog.classList.add("active");

    confirmDialog
      .querySelectorAll(".close-btn, .modal-cancel")
      .forEach((btn) => {
        btn.onclick = () => {
          // Add a timeout to allow the animation to complete
          setTimeout(() => {
            confirmDialog.classList.remove("active");
          }, 50);
        };
      });
  };

  // Handle toggle password visibility
  togglePasswordBtn.addEventListener("click", () => {
    if (passwordField.type === "password") {
      passwordField.type = "text";
      togglePasswordBtn.innerHTML = '<i class="fas fa-eye-slash"></i>';
    } else {
      passwordField.type = "password";
      togglePasswordBtn.innerHTML = '<i class="fas fa-eye"></i>';
    }
  });

  createUserBtn.addEventListener("click", () => {
    document.getElementById("user-form").reset();
    document.getElementById("edit-user-id").value = "";
    document.querySelector(".modal-header h2").textContent = "צור משתמש חדש";
    document.getElementById("generated-password").value =
      generateRandomPassword();
    userModal.classList.add("active");
  });

  closeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      // Add a timeout to allow the animation to complete
      setTimeout(() => {
        userModal.classList.remove("active");
      }, 50);
    });
  });

  copyPasswordBtn.addEventListener("click", () => {
    const passwordField = document.getElementById("generated-password");
    passwordField.select();
    document.execCommand("copy");
    copyPasswordBtn.innerHTML =
      '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>';
    setTimeout(() => {
      copyPasswordBtn.innerHTML =
        '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 0-2-2V4a2 2 0 0 0 2-2h9a2 2 0 0 0 2 2v1"></path></svg>';
    }, 2000);
  });

  userForm.addEventListener("submit", handleUserSubmit);

  // Load operators when the module initializes
  loadOperators();
}
