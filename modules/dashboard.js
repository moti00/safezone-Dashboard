import { mockData } from "./mockData.js";

export function initializeDashboard() {
  const dashboardLink = document.querySelector(
    '.sidebar nav li[data-page="dashboard"]'
  );

  dashboardLink.addEventListener("click", () => {
    // אין צורך לעשות כלום כאשר לוחצים על לוח הבקרה
  });

  // Initialize on first load if dashboard is active
  if (document.getElementById("dashboard-page").classList.contains("active")) {
    // אין צורך לעשות כלום כאשר דף הדשבורד פעיל
  }
}
