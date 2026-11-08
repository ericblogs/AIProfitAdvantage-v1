import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

// This page is intentionally pinned to the separate APEP Certification QA project.
// Do not replace these values with the production APEP project credentials.
const SUPABASE_URL = "https://bivuicydbggfpsdtcziy.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_tt2ukEKWcNiMKhua3hkFtw_Rx0zy-rJ";
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
});

const $ = (id) => document.getElementById(id);
const loginPanel = $("login-panel");
const dashboard = $("dashboard");
const deniedPanel = $("access-denied");

function setMessage(node, message, type = "error") {
  node.textContent = message || "";
  node.className = "message" + (type === "success" ? " success" : "");
}
function safeErrorMessage(error, fallback = "Something went wrong. Please try again.") {
  // Keep implementation details out of the browser-facing interface.
  console.error("APEP Command Centre QA error:", error);
  const message = String(error?.message || "");
  if (/invalid login credentials|invalid email or password/i.test(message)) {
    return "The email address or password is incorrect. Please check and try again.";
  }
  if (/email not confirmed/i.test(message)) {
    return "This account's email address has not been confirmed. Contact the workspace administrator.";
  }
  if (/network|fetch failed|failed to fetch|load failed/i.test(message)) {
    return "We could not reach the QA service. Check your internet connection and try again.";
  }
  if (/JWT|token|session.*(expired|invalid)|not authenticated/i.test(message)) {
    return "Your sign-in session is no longer valid. Please sign in again.";
  }
  return fallback;
}
function showOnly(panel) {
  [loginPanel, dashboard, deniedPanel].forEach((item) => item.classList.add("hidden"));
  panel.classList.remove("hidden");
}
function make(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined && text !== null) node.textContent = String(text);
  return node;
}
function addPill(parent, text, tone = "") {
  const pill = make("span", "pill" + (tone ? " " + tone : ""), text);
  parent.appendChild(pill);
}
function clearAndEmpty(node, message) {
  node.replaceChildren(make("p", "empty", message));
}
function formatDate(value) {
  if (!value) return "No due date";
  const date = new Date(value + (String(value).length === 10 ? "T00:00:00" : ""));
  return Number.isNaN(date.getTime()) ? String(value) : new Intl.DateTimeFormat("en-NG", { dateStyle: "medium" }).format(date);
}
function formatPrice(value, currency = "NGN") {
  if (value === null || value === undefined || value === "") return "Price not recorded";
  try {
    return new Intl.NumberFormat("en-NG", { style: "currency", currency, maximumFractionDigits: 0 }).format(Number(value));
  } catch {
    return String(value) + " " + currency;
  }
}
function renderProducts(items) {
  const target = $("products-list");
  target.replaceChildren();
  $("product-count").textContent = items.length + " records";
  if (!items.length) return clearAndEmpty(target, "No products have been added yet.");
  items.forEach((item) => {
    const row = make("article", "record");
    row.appendChild(make("div", "record-title", item.title));
    const meta = make("div", "record-meta");
    addPill(meta, item.publication_status || "status not set", item.publication_status === "published" ? "good" : "warning");
    addPill(meta, item.promotion_status || "promotion not set");
    meta.appendChild(make("span", "", formatPrice(item.price_ngn, "NGN")));
    row.appendChild(meta);
    if (item.short_description) row.appendChild(make("p", "description", item.short_description));
    target.appendChild(row);
  });
}
function renderTasks(items) {
  const target = $("tasks-list");
  target.replaceChildren();
  if (!items.length) return clearAndEmpty(target, "No open tasks. Add tasks when the task workspace is enabled.");
  items.forEach((item) => {
    const row = make("article", "record");
    row.appendChild(make("div", "record-title", item.title));
    const meta = make("div", "record-meta");
    addPill(meta, item.priority || "medium", item.priority === "urgent" || item.priority === "high" ? "warning" : "");
    addPill(meta, (item.status || "not_started").replaceAll("_", " "));
    meta.appendChild(make("span", "", "Due: " + formatDate(item.due_date)));
    row.appendChild(meta);
    if (item.blocker) row.appendChild(make("p", "description", "Blocker: " + item.blocker));
    target.appendChild(row);
  });
}
function renderAlerts(items) {
  const target = $("alerts-list");
  target.replaceChildren();
  if (!items.length) return clearAndEmpty(target, "No open business alerts.");
  items.forEach((item) => {
    const row = make("article", "record");
    row.appendChild(make("div", "record-title", item.title));
    const meta = make("div", "record-meta");
    addPill(meta, item.severity || "info", item.severity === "critical" ? "critical" : item.severity === "warning" ? "warning" : "");
    addPill(meta, (item.status || "open").replaceAll("_", " "));
    row.appendChild(meta);
    if (item.description) row.appendChild(make("p", "description", item.description));
    target.appendChild(row);
  });
}
function renderKnowledge(items) {
  const target = $("knowledge-list");
  target.replaceChildren();
  if (!items.length) return clearAndEmpty(target, "No approved knowledge records found.");
  items.forEach((item) => {
    const row = make("article", "record");
    row.appendChild(make("div", "record-title", item.title));
    const meta = make("div", "record-meta");
    addPill(meta, item.category || "other");
    row.appendChild(meta);
    row.appendChild(make("p", "description", item.content));
    target.appendChild(row);
  });
}
function renderReports(items) {
  const target = $("reports-list");
  target.replaceChildren();
  if (!items.length) return clearAndEmpty(target, "No reports have been generated yet.");
  items.forEach((item) => {
    const row = make("article", "record");
    row.appendChild(make("div", "record-title", item.title));
    const meta = make("div", "record-meta");
    addPill(meta, (item.report_type || "custom").replaceAll("_", " "));
    meta.appendChild(make("span", "", "Generated " + formatDate(item.generated_at)));
    row.appendChild(meta);
    const content = item.report_content;
    if (content && typeof content === "object") {
      const summary = content.summary || content.executive_summary || "";
      if (typeof summary === "string" && summary) row.appendChild(make("p", "description", summary));
    }
    target.appendChild(row);
  });
}

async function loadDashboard(user) {
  $("connection-status").textContent = "Checking owner access";
  $("connection-status").className = "status-pill";

  // The profile lookup is the application-level role check. RLS remains the
  // actual data boundary for every subsequent table query.
  const { data: profile, error: profileError } = await supabase
    .from("apep_profiles")
    .select("id,full_name,role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) throw new Error("Could not verify the APEP profile: " + profileError.message);
  if (!profile || profile.role !== "owner") {
    $("denied-message").textContent = "Your signed-in account does not have the APEP owner role. Contact the workspace owner if you believe this is incorrect.";
    showOnly(deniedPanel);
    return;
  }

  $("welcome-copy").textContent = "Signed in as " + (profile.full_name || user.email || "APEP owner") + ". Your business information is shown below.";
  $("connection-status").textContent = "Securely connected";
  $("connection-status").className = "status-pill ok";

  const [products, tasks, alerts, knowledge, reports] = await Promise.all([
    supabase.from("apep_products").select("id,title,short_description,price_ngn,currency,publication_status,promotion_status,created_at").order("created_at", { ascending: false }).limit(20),
    supabase.from("apep_tasks").select("id,title,priority,status,due_date,blocker,created_at").not("status", "in", '("completed","cancelled")').order("due_date", { ascending: true, nullsFirst: false }).limit(10),
    supabase.from("apep_business_alerts").select("id,title,description,severity,status,created_at").eq("status", "open").order("created_at", { ascending: false }).limit(10),
    supabase.from("apep_knowledge_base").select("id,title,category,content,approved_at").eq("status", "approved").order("approved_at", { ascending: false }).limit(6),
    supabase.from("apep_ai_reports").select("id,title,report_type,report_content,generated_at").order("generated_at", { ascending: false }).limit(5)
  ]);

  const resultErrors = [products, tasks, alerts, knowledge, reports].filter((result) => result.error);
  if (resultErrors.length) {
    throw new Error("One or more dashboard data requests failed: " + resultErrors.map((result) => result.error.message).join("; "));
  }

  const productRows = products.data || [];
  const taskRows = tasks.data || [];
  const alertRows = alerts.data || [];
  const knowledgeRows = knowledge.data || [];
  const reportRows = reports.data || [];

  $("metric-products").textContent = String(productRows.length);
  $("metric-tasks").textContent = String(taskRows.length);
  $("metric-alerts").textContent = String(alertRows.length);
  $("metric-knowledge").textContent = String(knowledgeRows.length);

  renderProducts(productRows);
  renderTasks(taskRows);
  renderAlerts(alertRows);
  renderKnowledge(knowledgeRows);
  renderReports(reportRows);
  setMessage($("dashboard-message"), "Dashboard data refreshed from the QA database.", "success");
  showOnly(dashboard);
}

async function checkSession() {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    showOnly(loginPanel);
    setMessage($("login-message"), "Please sign in again. " + error.message);
    return;
  }
  if (!data.user) {
    showOnly(loginPanel);
    return;
  }
  try {
    await loadDashboard(data.user);
  } catch (error) {
    showOnly(loginPanel);
    setMessage($("login-message"), safeErrorMessage(error, "We could not restore your session. Please sign in again."));
  }
}

$("login-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = $("sign-in");
  button.disabled = true;
  button.textContent = "Signing in…";
  setMessage($("login-message"), "Checking your account…", "success");
  const email = $("email").value.trim();
  const password = $("password").value;
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (!data.user) {
      setMessage($("login-message"), "We could not confirm your sign-in. Please try again.");
      return;
    }
    await loadDashboard(data.user);
  } catch (error) {
    showOnly(loginPanel);
    setMessage($("login-message"), safeErrorMessage(error, "We could not sign you in. Please try again."));
  } finally {
    button.disabled = false;
    button.textContent = "Sign in securely";
  }
});

async function signOut() {
  await supabase.auth.signOut();
  $("password").value = "";
  setMessage($("login-message"), "", "success");
  showOnly(loginPanel);
}
$("sign-out").addEventListener("click", signOut);
$("denied-sign-out").addEventListener("click", signOut);
$("refresh").addEventListener("click", async () => {
  $("refresh").disabled = true;
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw new Error(error?.message || "Your session has expired. Please sign in again.");
    await loadDashboard(data.user);
  } catch (error) {
    setMessage($("dashboard-message"), safeErrorMessage(error, "We could not refresh the dashboard. Please try again."));
  } finally {
    $("refresh").disabled = false;
  }
});

supabase.auth.onAuthStateChange((event, session) => {
  if (event === "SIGNED_OUT" || !session) showOnly(loginPanel);
});
checkSession();