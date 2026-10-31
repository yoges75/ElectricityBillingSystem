const API = "/api/customers";
let editingCustomerId = null;

function showSection(sectionId) {
    document.querySelectorAll(".section").forEach(section => section.classList.remove("active"));
    document.querySelectorAll(".nav-link").forEach(button => button.classList.toggle("active", button.dataset.section === sectionId));
    document.getElementById(sectionId).classList.add("active");
    if (sectionId === "dashboard") loadDashboard();
    if (sectionId === "customers") loadCustomers();
}

function money(value) {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(Number(value || 0));
}
function safe(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({"&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"}[char]));
}
function setMessage(id, message, type = "") {
    const element = document.getElementById(id);
    element.textContent = message;
    element.className = "message" + (type ? " " + type : "");
}
async function apiRequest(url, options = {}) {
    const response = await fetch(url, { headers: { "Content-Type": "application/json", ...(options.headers || {}) }, ...options });
    if (!response.ok) {
        let message = "Request failed. Please try again.";
        try { const body = await response.json(); message = body.detail || body.message || body.error || body.title || message; }
        catch (_) { try { message = await response.text() || message; } catch (_) {} }
        throw new Error(message);
    }
    if (response.status === 204) return null;
    return response.json();
}

async function loadDashboard() {
    try {
        const customers = await apiRequest(API);
        const units = customers.reduce((sum, customer) => sum + Number(customer.unitsConsumed || 0), 0);
        const amount = customers.reduce((sum, customer) => sum + Number(customer.billAmount || 0), 0);
        document.getElementById("customerCount").textContent = customers.length;
        document.getElementById("unitCount").textContent = units.toLocaleString("en-IN", { maximumFractionDigits: 2 });
        document.getElementById("billTotal").textContent = money(amount);
        const recent = [...customers].sort((a, b) => Number(b.customerId) - Number(a.customerId)).slice(0, 5);
        document.getElementById("recentCustomers").innerHTML = recent.length ? recent.map(customer => `
            <tr><td><strong>#${safe(customer.customerId)}</strong></td><td>${safe(customer.name)}</td>
            <td>${Number(customer.unitsConsumed || 0).toLocaleString("en-IN")}</td><td><strong>${money(customer.billAmount)}</strong></td>
            <td><button class="action-btn" onclick="editCustomer(${Number(customer.customerId)})">Update</button></td></tr>`).join("") : '<tr><td colspan="5" class="empty">No customers yet. Generate your first bill.</td></tr>';
    } catch (error) {
        document.getElementById("recentCustomers").innerHTML = `<tr><td colspan="5" class="empty">${safe(error.message)} — check that the application and database are running.</td></tr>`;
    }
}

function renderCustomerRows(customers) {
    const body = document.getElementById("customerTable");
    if (!customers.length) {
        body.innerHTML = '<tr><td colspan="7" class="empty">No customers found.</td></tr>';
        return;
    }
    body.innerHTML = customers.map(customer => `
        <tr><td><strong>#${safe(customer.customerId)}</strong></td><td>${safe(customer.name)}</td>
        <td>${Number(customer.previousReading || 0).toLocaleString("en-IN")}</td>
        <td>${Number(customer.currentReading || 0).toLocaleString("en-IN")}</td>
        <td>${Number(customer.unitsConsumed || 0).toLocaleString("en-IN")}</td>
        <td><strong>${money(customer.billAmount)}</strong></td>
        <td><button class="action-btn" onclick="editCustomer(${Number(customer.customerId)})">Update</button></td></tr>`).join("");
}
async function loadCustomers() {
    try {
        const customers = await apiRequest(API);
        renderCustomerRows(customers);
        setMessage("searchMessage", `${customers.length} customer(s) found.`);
    } catch (error) {
        document.getElementById("customerTable").innerHTML = `<tr><td colspan="7" class="empty">${safe(error.message)}</td></tr>`;
        setMessage("searchMessage", "Could not load customers. Check the database connection.", "error");
    }
}
async function searchCustomer() {
    const id = document.getElementById("searchId").value.trim();
    if (!id) { setMessage("searchMessage", "Enter a customer ID to search.", "error"); return; }
    try {
        const customer = await apiRequest(`${API}/${encodeURIComponent(id)}`);
        renderCustomerRows([customer]);
        setMessage("searchMessage", "Customer found.", "success");
    } catch (error) {
        renderCustomerRows([]);
        setMessage("searchMessage", error.message, "error");
    }
}
async function editCustomer(id) {
    try {
        const customer = await apiRequest(`${API}/${id}`);
        editingCustomerId = id;
        document.getElementById("billHeading").textContent = "Update Customer Bill";
        document.getElementById("customerId").value = customer.customerId;
        document.getElementById("customerId").readOnly = true;
        document.getElementById("customerName").value = customer.name;
        document.getElementById("previousReading").value = customer.previousReading;
        document.getElementById("currentReading").value = customer.currentReading;
        document.getElementById("billSubmit").textContent = "Update & Recalculate Bill";
        updateUnitsPreview();
        setMessage("formMessage", "Editing the customer's latest bill. No billing history will be created.");
        showSection("billing");
    } catch (error) { alert(error.message); }
}
function resetBillForm() {
    editingCustomerId = null;
    document.getElementById("billForm").reset();
    document.getElementById("customerId").readOnly = false;
    document.getElementById("billHeading").textContent = "Generate New Bill";
    document.getElementById("billSubmit").textContent = "Calculate & Save Bill";
    document.getElementById("unitsPreview").textContent = "0";
    setMessage("formMessage", "");
}
function updateUnitsPreview() {
    const previous = Number(document.getElementById("previousReading").value || 0);
    const current = Number(document.getElementById("currentReading").value || 0);
    document.getElementById("unitsPreview").textContent = Math.max(0, current - previous).toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

document.getElementById("previousReading").addEventListener("input", updateUnitsPreview);
document.getElementById("currentReading").addEventListener("input", updateUnitsPreview);
document.getElementById("billForm").addEventListener("submit", async event => {
    event.preventDefault();
    const customer = {
        customerId: Number(document.getElementById("customerId").value),
        name: document.getElementById("customerName").value.trim(),
        previousReading: Number(document.getElementById("previousReading").value),
        currentReading: Number(document.getElementById("currentReading").value)
    };
    if (!customer.customerId || !customer.name) { setMessage("formMessage", "Enter a valid customer ID and name.", "error"); return; }
    if (customer.previousReading < 0 || customer.currentReading < customer.previousReading) {
        setMessage("formMessage", "Readings must be non-negative and current reading cannot be below previous reading.", "error"); return;
    }
    try {
        const url = editingCustomerId === null ? `${API}/bill` : `${API}/${editingCustomerId}/bill`;
        const method = editingCustomerId === null ? "POST" : "PUT";
        const saved = await apiRequest(url, { method, body: JSON.stringify(customer) });
        setMessage("formMessage", `Bill saved. ${saved.unitsConsumed} units used. Amount: ${money(saved.billAmount)}.`, "success");
        await loadDashboard();
        await loadCustomers();
        if (editingCustomerId !== null) {
            editingCustomerId = null;
            document.getElementById("customerId").readOnly = false;
            document.getElementById("billHeading").textContent = "Generate New Bill";
            document.getElementById("billSubmit").textContent = "Calculate & Save Bill";
        }
        document.getElementById("billForm").reset();
        document.getElementById("unitsPreview").textContent = "0";
    } catch (error) { setMessage("formMessage", error.message, "error"); }
});

loadDashboard();
