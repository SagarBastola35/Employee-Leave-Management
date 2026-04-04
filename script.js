// ===== DOM Elements =====
const employeesTbody = document.getElementById("employeesTbody");
const showAddEmployeeBtn = document.getElementById("showAddEmployeeBtn");
const employeeModal = document.getElementById("employeeModal");
const employeeForm = document.getElementById("employeeForm");
const empName = document.getElementById("empName");
const empEmail = document.getElementById("empEmail");
const empDept = document.getElementById("empDept");
const saveEmployeeBtn = document.getElementById("saveEmployeeBtn");
const employeeFormTitle = document.getElementById("employeeFormTitle");

// Leave Requests
const requestsTbody = document.getElementById("requestsTbody");
const showAddRequestBtn = document.getElementById("showAddRequestBtn");
const requestModal = document.getElementById("requestModal");
const requestForm = document.getElementById("requestForm");
const requestEmployee = document.getElementById("requestEmployee");
const leaveType = document.getElementById("leaveType");
const startDate = document.getElementById("startDate");
const endDate = document.getElementById("endDate");
const reason = document.getElementById("reason");
const saveRequestBtn = document.getElementById("saveRequestBtn");
const requestFormTitle = document.getElementById("requestFormTitle");

// Dashboard counters
const totalEmployeesSpan = document.getElementById("totalEmployees");
const pendingRequestsSpan = document.getElementById("pendingRequests");
const approvedRequestsSpan = document.getElementById("approvedRequests");
const rejectedRequestsSpan = document.getElementById("rejectedRequests");

// Theme
const themeToggle = document.getElementById("themeToggle");

// ===== Data Arrays =====
let employees = [];
let leaveRequests = [];

// ===== LocalStorage =====
function loadEmployees() {
  const stored = localStorage.getItem("leave_employees");
  if (stored) {
    try {
      employees = JSON.parse(stored);
    } catch (e) {
      employees = [];
    }
  } else {
    employees = [];
  }
}

function saveEmployees() {
  localStorage.setItem("leave_employees", JSON.stringify(employees));
}

function loadLeaveRequests() {
  const stored = localStorage.getItem("leave_requests");
  if (stored) {
    try {
      leaveRequests = JSON.parse(stored);
    } catch (e) {
      leaveRequests = [];
    }
  } else {
    leaveRequests = [];
  }
}

function saveLeaveRequests() {
  localStorage.setItem("leave_requests", JSON.stringify(leaveRequests));
}

// ===== Render Functions =====
function renderEmployees() {
  if (!employeesTbody) return;
  if (employees.length === 0) {
    employeesTbody.innerHTML =
      '<tr><td colspan="4" class="empty-msg">No employees yet. Click "Add Employee".</td></tr>';
    return;
  }
  employeesTbody.innerHTML = "";
  employees.forEach((emp) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${escapeHtml(emp.name)}</td>
      <td>${escapeHtml(emp.email)}</td>
      <td>${escapeHtml(emp.department)}</td>
      <td>
        <button class="btn-icon btn-edit" data-id="${emp.id}" data-action="editEmployee"><i class="fas fa-edit"></i></button>
        <button class="btn-icon btn-delete" data-id="${emp.id}" data-action="deleteEmployee"><i class="fas fa-trash-alt"></i></button>
      </td>
    `;
    employeesTbody.appendChild(row);
  });

  // Attach event listeners
  document.querySelectorAll('[data-action="editEmployee"]').forEach((btn) => {
    btn.addEventListener("click", () => editEmployee(parseInt(btn.dataset.id)));
  });
  document.querySelectorAll('[data-action="deleteEmployee"]').forEach((btn) => {
    btn.addEventListener("click", () =>
      deleteEmployee(parseInt(btn.dataset.id)),
    );
  });
}

function renderLeaveRequests() {
  if (!requestsTbody) return;
  if (leaveRequests.length === 0) {
    requestsTbody.innerHTML =
      '<tr><td colspan="7" class="empty-msg">No leave requests yet.</td></tr>';
    return;
  }
  requestsTbody.innerHTML = "";
  leaveRequests.forEach((req) => {
    const employee = employees.find((e) => e.id === req.employeeId);
    const employeeName = employee ? employee.name : "Unknown";
    const statusClass =
      req.status === "Pending"
        ? "status-pending"
        : req.status === "Approved"
          ? "status-approved"
          : "status-rejected";
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${escapeHtml(employeeName)}</td>
      <td>${escapeHtml(req.type)}</td>
      <td>${req.startDate}</td>
      <td>${req.endDate}</td>
      <td>${escapeHtml(req.reason || "-")}</td>
      <td><span class="status-badge ${statusClass}">${req.status}</span></td>
      <td>
        ${
          req.status === "Pending"
            ? `
          <button class="btn-icon btn-approve" data-id="${req.id}" data-action="approve"><i class="fas fa-check"></i></button>
          <button class="btn-icon btn-reject" data-id="${req.id}" data-action="reject"><i class="fas fa-times"></i></button>
        `
            : ""
        }
        <button class="btn-icon btn-delete" data-id="${req.id}" data-action="deleteRequest"><i class="fas fa-trash-alt"></i></button>
      </td>
    `;
    requestsTbody.appendChild(row);
  });

  // Attach action listeners
  document.querySelectorAll('[data-action="approve"]').forEach((btn) => {
    btn.addEventListener("click", () =>
      updateRequestStatus(parseInt(btn.dataset.id), "Approved"),
    );
  });
  document.querySelectorAll('[data-action="reject"]').forEach((btn) => {
    btn.addEventListener("click", () =>
      updateRequestStatus(parseInt(btn.dataset.id), "Rejected"),
    );
  });
  document.querySelectorAll('[data-action="deleteRequest"]').forEach((btn) => {
    btn.addEventListener("click", () =>
      deleteRequest(parseInt(btn.dataset.id)),
    );
  });
}

function updateDashboard() {
  totalEmployeesSpan.textContent = employees.length;
  const pending = leaveRequests.filter((r) => r.status === "Pending").length;
  const approved = leaveRequests.filter((r) => r.status === "Approved").length;
  const rejected = leaveRequests.filter((r) => r.status === "Rejected").length;
  pendingRequestsSpan.textContent = pending;
  approvedRequestsSpan.textContent = approved;
  rejectedRequestsSpan.textContent = rejected;
}

// ===== Employee CRUD =====
let editingEmployeeId = null;

function openEmployeeModal(employee = null) {
  if (employee) {
    editingEmployeeId = employee.id;
    empName.value = employee.name;
    empEmail.value = employee.email;
    empDept.value = employee.department;
    employeeFormTitle.textContent = "Edit Employee";
  } else {
    editingEmployeeId = null;
    employeeForm.reset();
    employeeFormTitle.textContent = "Add Employee";
  }
  employeeModal.style.display = "block";
}

function closeEmployeeModal() {
  employeeModal.style.display = "none";
  editingEmployeeId = null;
}

function saveEmployee(e) {
  e.preventDefault();
  const name = empName.value.trim();
  const email = empEmail.value.trim();
  const department = empDept.value.trim();
  if (!name || !email || !department) {
    alert("Please fill all fields.");
    return;
  }
  if (editingEmployeeId !== null) {
    // Update existing
    const index = employees.findIndex((e) => e.id === editingEmployeeId);
    if (index !== -1) {
      employees[index] = { ...employees[index], name, email, department };
    }
  } else {
    // Add new
    const newId = Date.now();
    employees.push({ id: newId, name, email, department });
  }
  saveEmployees();
  renderEmployees();
  updateDashboard();
  // Refresh employee dropdown in request form
  populateEmployeeDropdown();
  closeEmployeeModal();
}

function editEmployee(id) {
  const emp = employees.find((e) => e.id === id);
  if (emp) openEmployeeModal(emp);
}

function deleteEmployee(id) {
  if (
    confirm(
      "Delete this employee? All their leave requests will also be deleted.",
    )
  ) {
    employees = employees.filter((e) => e.id !== id);
    leaveRequests = leaveRequests.filter((r) => r.employeeId !== id);
    saveEmployees();
    saveLeaveRequests();
    renderEmployees();
    renderLeaveRequests();
    updateDashboard();
    populateEmployeeDropdown();
  }
}

// ===== Leave Request CRUD =====
let editingRequestId = null;

function openRequestModal(request = null) {
  if (request) {
    editingRequestId = request.id;
    requestEmployee.value = request.employeeId;
    leaveType.value = request.type;
    startDate.value = request.startDate;
    endDate.value = request.endDate;
    reason.value = request.reason || "";
    requestFormTitle.textContent = "Edit Request";
    saveRequestBtn.textContent = "Update Request";
  } else {
    editingRequestId = null;
    requestForm.reset();
    requestFormTitle.textContent = "New Leave Request";
    saveRequestBtn.textContent = "Submit Request";
    // Set default dates: today and tomorrow
    const today = new Date().toISOString().split("T")[0];
    const tomorrow = new Date(Date.now() + 86400000)
      .toISOString()
      .split("T")[0];
    startDate.value = today;
    endDate.value = tomorrow;
  }
  populateEmployeeDropdown();
  requestModal.style.display = "block";
}

function closeRequestModal() {
  requestModal.style.display = "none";
  editingRequestId = null;
}

function populateEmployeeDropdown() {
  requestEmployee.innerHTML = '<option value="">Select Employee</option>';
  employees.forEach((emp) => {
    const option = document.createElement("option");
    option.value = emp.id;
    option.textContent = emp.name;
    requestEmployee.appendChild(option);
  });
}

function saveLeaveRequest(e) {
  e.preventDefault();
  const employeeId = parseInt(requestEmployee.value);
  const type = leaveType.value;
  const start = startDate.value;
  const end = endDate.value;
  const reasonText = reason.value.trim();

  if (!employeeId || !type || !start || !end) {
    alert("Please fill all required fields.");
    return;
  }
  if (new Date(start) > new Date(end)) {
    alert("End date must be after start date.");
    return;
  }

  if (editingRequestId !== null) {
    // Update existing
    const index = leaveRequests.findIndex((r) => r.id === editingRequestId);
    if (index !== -1) {
      leaveRequests[index] = {
        ...leaveRequests[index],
        employeeId,
        type,
        startDate: start,
        endDate: end,
        reason: reasonText,
      };
    }
  } else {
    // Add new
    const newId = Date.now();
    leaveRequests.push({
      id: newId,
      employeeId,
      type,
      startDate: start,
      endDate: end,
      reason: reasonText,
      status: "Pending",
      submittedDate: new Date().toISOString(),
    });
  }
  saveLeaveRequests();
  renderLeaveRequests();
  updateDashboard();
  closeRequestModal();
}

function updateRequestStatus(id, newStatus) {
  const req = leaveRequests.find((r) => r.id === id);
  if (req) {
    req.status = newStatus;
    saveLeaveRequests();
    renderLeaveRequests();
    updateDashboard();
  }
}

function deleteRequest(id) {
  if (confirm("Delete this leave request?")) {
    leaveRequests = leaveRequests.filter((r) => r.id !== id);
    saveLeaveRequests();
    renderLeaveRequests();
    updateDashboard();
  }
}

// ===== Helper: Escape HTML =====
function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/[&<>]/g, function (m) {
    if (m === "&") return "&amp;";
    if (m === "<") return "&lt;";
    if (m === ">") return "&gt;";
    return m;
  });
}

// ===== Dark Mode =====
function initTheme() {
  const saved = localStorage.getItem("leave_theme");
  if (saved === "dark") {
    document.body.classList.add("dark");
    themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
  } else {
    document.body.classList.remove("dark");
    themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
  }
}

function toggleTheme() {
  if (document.body.classList.contains("dark")) {
    document.body.classList.remove("dark");
    localStorage.setItem("leave_theme", "light");
    themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
  } else {
    document.body.classList.add("dark");
    localStorage.setItem("leave_theme", "dark");
    themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
  }
}

// ===== Navigation Smooth Scroll & Active Link =====
function setupNav() {
  const links = document.querySelectorAll(".nav-links a");
  links.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const targetId = link.getAttribute("href").substring(1);
      const target = document.getElementById(targetId);
      if (target) {
        target.scrollIntoView({ behavior: "smooth" });
      }
      links.forEach((l) => l.classList.remove("active"));
      link.classList.add("active");
    });
  });
}

// ===== Modal Close Handlers =====
function closeModalOnOutsideClick(e, modal, closeFn) {
  if (e.target === modal) closeFn();
}

// ===== Initialization =====
function init() {
  loadEmployees();
  loadLeaveRequests();
  renderEmployees();
  renderLeaveRequests();
  updateDashboard();
  initTheme();
  setupNav();

  // Employee modal events
  showAddEmployeeBtn.addEventListener("click", () => openEmployeeModal());
  document
    .querySelectorAll('.close-modal[data-modal="employee"]')
    .forEach((btn) => {
      btn.addEventListener("click", closeEmployeeModal);
    });
  employeeForm.addEventListener("submit", saveEmployee);
  window.addEventListener("click", (e) =>
    closeModalOnOutsideClick(e, employeeModal, closeEmployeeModal),
  );

  // Request modal events
  showAddRequestBtn.addEventListener("click", () => openRequestModal());
  document
    .querySelectorAll('.close-modal[data-modal="request"]')
    .forEach((btn) => {
      btn.addEventListener("click", closeRequestModal);
    });
  requestForm.addEventListener("submit", saveLeaveRequest);
  window.addEventListener("click", (e) =>
    closeModalOnOutsideClick(e, requestModal, closeRequestModal),
  );

  themeToggle.addEventListener("click", toggleTheme);
}

init();
