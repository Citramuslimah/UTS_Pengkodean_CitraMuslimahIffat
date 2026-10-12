// Isi URL dan anon key Supabase agar aplikasi menyimpan data ke PostgreSQL.
// Jangan pernah menaruh service_role key di kode frontend.
const SUPABASE_URL = "";
const SUPABASE_ANON_KEY = "";

const accounts = [
  { code: "1110", name: "Kas di Bank BCA" }, { code: "1120", name: "Kas Kecil (Petty Cash)" },
  { code: "2110", name: "Hutang Dagang" }, { code: "2120", name: "Biaya yang Masih Harus Dibayar" },
  { code: "5110", name: "Beban Pembelian Barang Dagang" }, { code: "5210", name: "Beban Gaji & Upah Karyawan" },
  { code: "5220", name: "Beban Sewa Toko / Gudang" }, { code: "5230", name: "Beban Utilitas" },
  { code: "5240", name: "Beban Pemeliharaan & Perbaikan" }, { code: "5310", name: "Beban Perlengkapan Toko" }
];
const storageKey = "ledger-voucher-demo-v1";
const today = new Date();
const dateString = (date) => new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
const money = (value) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(value) || 0);
const escapeHTML = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
const makeId = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
let rows = [
  { id: makeId(), account_code: "5230", line_memo: "Internet bulan berjalan", debit: 1200000, credit: 0 },
  { id: makeId(), account_code: "1110", line_memo: "Transfer BCA Giro", debit: 0, credit: 1200000 },
  { id: makeId(), account_code: "", line_memo: "", debit: 0, credit: 0 }
];
let vouchers = [];
let auditEntries = [];
let supabaseClient = null;
let editingVoucherId = null;
let noticeTimer;
const elements = {
  form: document.querySelector("#voucher-form"), voucherNo: document.querySelector("#voucher-no"),
  txDate: document.querySelector("#tx-date"), description: document.querySelector("#description"),
  rows: document.querySelector("#journal-rows"), notice: document.querySelector("#notice"),
  postButton: document.querySelector("#post-button"), draftButton: document.querySelector("#draft-button"),
  connection: document.querySelector("#connection-status")
};

function loadLocalData() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || "{}");
    vouchers = Array.isArray(saved.vouchers) ? saved.vouchers : [];
    auditEntries = Array.isArray(saved.audit) ? saved.audit : [];
  } catch (error) { console.warn("Data demo tidak dapat dibaca:", error); vouchers = []; auditEntries = []; }
}
function saveLocalData() { localStorage.setItem(storageKey, JSON.stringify({ vouchers, audit: auditEntries })); }
function showNotice(message, isError = false) {
  clearTimeout(noticeTimer);
  elements.notice.textContent = message;
  elements.notice.classList.toggle("is-error", isError);
  elements.notice.hidden = false;
  noticeTimer = setTimeout(() => { elements.notice.hidden = true; }, 5000);
}
function renderRows() {
  elements.rows.innerHTML = rows.map((row, index) => `
    <tr data-row-id="${escapeHTML(row.id)}">
      <td><select class="account-select" data-field="account_code" aria-label="Akun baris ${index + 1}" required><option value="">Pilih akun...</option>${accounts.map((account) => `<option value="${account.code}" ${row.account_code === account.code ? "selected" : ""}>${account.code} · ${escapeHTML(account.name)}</option>`).join("")}</select></td>
      <td class="account-name">${row.account_code ? escapeHTML(accounts.find((account) => account.code === row.account_code)?.name || "") : `<span class="account-placeholder">Pilih akun...</span>`}</td>
      <td><input class="memo-input" data-field="line_memo" aria-label="Keterangan baris ${index + 1}" placeholder="Keterangan" value="${escapeHTML(row.line_memo)}"></td>
      <td><input class="amount-input" data-field="debit" aria-label="Debit baris ${index + 1}" type="number" min="0" step="100" value="${escapeHTML(row.debit)}"></td>
      <td><input class="amount-input" data-field="credit" aria-label="Kredit baris ${index + 1}" type="number" min="0" step="100" value="${escapeHTML(row.credit)}"></td>
      <td><button class="remove-row" type="button" data-remove="${escapeHTML(row.id)}" aria-label="Hapus baris ${index + 1}" title="Hapus baris">×</button></td>
    </tr>`).join("");
  elements.rows.querySelectorAll("[data-remove]").forEach((button) => {
    button.addEventListener("click", () => {
      if (rows.length <= 2) { showNotice("Minimal harus ada dua baris jurnal.", true); return; }
      rows = rows.filter((row) => row.id !== button.dataset.remove);
      renderRows();
    });
  });
  updateBalance();
}
function getValidation() {
  const totals = rows.reduce((sum, row) => { sum.debit += Math.round(Number(row.debit) || 0); sum.credit += Math.round(Number(row.credit) || 0); return sum; }, { debit: 0, credit: 0 });
  const difference = Math.abs(totals.debit - totals.credit);
  const validRows = rows.filter((row) => row.account_code && (Number(row.debit) > 0 || Number(row.credit) > 0)).length;
  const header = Boolean(elements.voucherNo.value.trim() && elements.txDate.value && elements.description.value.trim());
  const accountsValid = rows.length >= 2 && rows.every((row) => accounts.some((account) => account.code === row.account_code));
  const amounts = rows.every((row) => { const debit = Number(row.debit) || 0; const credit = Number(row.credit) || 0; return debit >= 0 && credit >= 0 && !(debit > 0 && credit > 0); });
  const balanced = difference === 0 && totals.debit > 0;
  return { ...totals, difference, header, rowsValid: validRows >= 2, accountsValid, amounts, balanced };
}
function setCheck(name, valid) {
  const item = document.querySelector(`[data-check="${name}"]`);
  item.classList.toggle("is-valid", valid);
  item.querySelector(".check-icon").textContent = valid ? "✓" : "•";
}
function updateBalance() {
  const result = getValidation();
  document.querySelector("#total-debit").textContent = money(result.debit);
  document.querySelector("#total-credit").textContent = money(result.credit);
  document.querySelector("#difference").textContent = money(result.difference);
  document.querySelector("#balance-label").textContent = result.balanced ? "Balanced" : "Not Balanced";
  document.querySelector("#balance-badge").classList.toggle("is-balanced", result.balanced);
  document.querySelector("#difference-line").classList.toggle("is-balanced", result.balanced);
  document.querySelector("#imbalance-warning").hidden = result.balanced;
  setCheck("header", result.header); setCheck("rows", result.rowsValid); setCheck("accounts", result.accountsValid);
  setCheck("amounts", result.amounts); setCheck("balanced", result.balanced);
  elements.postButton.disabled = !(result.header && result.rowsValid && result.accountsValid && result.amounts && result.balanced);
}
function getFormPayload(status) {
  const result = getValidation();
  if (!result.header) throw new Error("Nomor voucher, tanggal, dan deskripsi wajib diisi.");
  if (status === "POSTED" && !(result.rowsValid && result.accountsValid && result.amounts && result.balanced)) throw new Error("Voucher hanya dapat diposting jika semua akun valid dan total debit sama dengan kredit.");
  return {
    voucher_no: elements.voucherNo.value.trim(), tx_date: elements.txDate.value,
    description: elements.description.value.trim(),
    rows: rows.map((row) => ({ account_code: row.account_code, account_name: accounts.find((account) => account.code === row.account_code)?.name || "", line_memo: row.line_memo.trim(), debit: Math.round(Number(row.debit) || 0), credit: Math.round(Number(row.credit) || 0) })),
    total_amount: result.debit, status, created_at: new Date().toISOString()
  };
}
function addLocalAudit(action, voucher, detail) { auditEntries.unshift({ id: makeId(), action, voucher_no: voucher.voucher_no, detail, created_at: new Date().toISOString() }); }
async function createVoucher(status) {
  let payload;
  try { payload = getFormPayload(status); } catch (error) { showNotice(error.message, true); return; }
  elements.postButton.disabled = true; elements.draftButton.disabled = true;
  try {
    if (supabaseClient) {
      const rpcName = editingVoucherId ? "update_draft_voucher" : "create_voucher";
      const rpcArgs = {
        p_voucher_no: payload.voucher_no,
        p_tx_date: payload.tx_date,
        p_description: payload.description,
        p_rows: payload.rows,
        p_status: status
      };
      if (editingVoucherId) rpcArgs.p_voucher_id = editingVoucherId;
      const { error } = await supabaseClient.rpc(rpcName, rpcArgs);
      if (error) throw error;
      showNotice(`Voucher ${payload.voucher_no} ${editingVoucherId ? "diperbarui" : "tersimpan"} di Supabase sebagai ${status}.`);
      await refreshCloudData();
    } else {
      if (editingVoucherId) {
        const existing = vouchers.find((voucher) => String(voucher.id) === editingVoucherId);
        if (!existing || existing.status !== "DRAFT") throw new Error("Hanya draft yang dapat diubah.");
        Object.assign(existing, payload, { id: existing.id, updated_at: new Date().toISOString() });
        addLocalAudit("UPDATE", existing, `Draft diperbarui dengan status ${status}.`);
        if (status === "POSTED") addLocalAudit("POST", existing, "Draft diposting dan dikunci di ledger.");
        showNotice(`Voucher ${payload.voucher_no} berhasil diperbarui sebagai ${status}.`);
      } else {
        payload.id = makeId(); payload.created_by = "mode-demo";
        vouchers.unshift(payload); addLocalAudit("CREATE", payload, `Voucher dibuat dengan status ${status}.`);
        showNotice(`Voucher ${payload.voucher_no} tersimpan di browser sebagai ${status}.`);
      }
      saveLocalData(); renderRecords();
    }
    editingVoucherId = null;
    resetForm();
  } catch (error) { showNotice(error.message || "Voucher gagal disimpan.", true); }
  finally { elements.draftButton.disabled = false; updateBalance(); }
}
function resetForm() {
  elements.voucherNo.value = nextVoucherNumber(); elements.txDate.value = dateString(new Date()); elements.description.value = "";
  rows = [{ id: makeId(), account_code: "", line_memo: "", debit: 0, credit: 0 }, { id: makeId(), account_code: "", line_memo: "", debit: 0, credit: 0 }];
  document.querySelector("#form-title").textContent = "Entri Kas Keluar Baru";
  elements.draftButton.textContent = "Simpan sebagai Draft";
  renderRows();
}
function nextVoucherNumber() { return `KK-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`; }
function formatDate(value) {
  if (!value) return "Tanggal tidak tersedia";
  const date = new Date(value.length === 10 ? `${value}T00:00:00` : value);
  return Number.isNaN(date.getTime()) ? String(value) : new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(date);
}
function formatTimestamp(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Waktu tidak tersedia" : new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(date);
}
function renderRecords() {
  document.querySelector("#voucher-count").textContent = vouchers.length;
  document.querySelector("#list-count").textContent = `Total: ${vouchers.length} Transaksi`;
  document.querySelector("#audit-count").textContent = `${auditEntries.length} aktivitas`;
  document.querySelector("#voucher-list").innerHTML = vouchers.length ? vouchers.map((voucher) => {
    const posted = voucher.status === "POSTED"; const id = escapeHTML(voucher.id);
    const actions = posted
      ? "<span class=\"record-meta\">Terkunci di Ledger (gunakan jurnal pembalik)</span>"
      : `<button class="small-action" type="button" data-edit="${id}">Edit Draft</button><button class="small-action" type="button" data-post="${id}">Post Transaksi</button><button class="small-action is-danger" type="button" data-delete="${id}">Hapus Draft</button>`;
    return `<article class="record-card"><div><p class="record-title">${escapeHTML(voucher.voucher_no)}</p><p class="record-date">${escapeHTML(formatDate(voucher.tx_date))}</p><span class="status-tag ${posted ? "is-posted" : "is-draft"}"><span class="status-dot"></span>${posted ? "POSTED" : "DRAFT"}</span></div><p class="record-description">${escapeHTML(voucher.description)}</p><div><div class="record-amount">${money(voucher.total_amount)}</div><div class="record-actions">${actions}</div></div></article>`;
  }).join("") : `<div class="empty-state">Belum ada voucher tersimpan. Mulai dengan mengisi formulir entri.</div>`;
  document.querySelector("#audit-list").innerHTML = auditEntries.length ? auditEntries.map((entry) => `<div class="audit-entry"><span class="audit-action">${escapeHTML(entry.action || "UPDATE")}</span><span class="audit-detail"><strong>${escapeHTML(entry.voucher_no || "Voucher")}</strong> · ${escapeHTML(entry.detail || "Perubahan dicatat.")}</span><time class="audit-time">${escapeHTML(formatTimestamp(entry.created_at))}</time></div>`).join("") : `<div class="empty-state">Belum ada aktivitas audit.</div>`;
}
async function refreshCloudData() {
  const [{ data: voucherData, error: voucherError }, { data: auditData, error: auditError }] = await Promise.all([
    supabaseClient.from("vouchers").select("*, voucher_lines(*)").order("created_at", { ascending: false }),
    supabaseClient.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(100)
  ]);
  if (voucherError) throw voucherError; if (auditError) throw auditError;
  vouchers = (voucherData || []).map((voucher) => ({ ...voucher, total_amount: Number(voucher.total_amount) }));
  auditEntries = (auditData || []).map((entry) => ({
    ...entry,
    voucher_no: entry.new_data?.voucher_no || entry.old_data?.voucher_no || entry.record_id,
    action: `${entry.action} · ${entry.table_name}`,
    detail: entry.new_data?.description || entry.old_data?.description || "Perubahan data voucher"
  }));
  renderRecords();
}
async function updateVoucherStatus(id, action) {
  const voucher = vouchers.find((item) => String(item.id) === String(id)); if (!voucher) return;
  try {
    if (supabaseClient) {
      const rpcName = action === "POSTED" ? "post_draft_voucher" : "delete_draft_voucher";
      const { error } = await supabaseClient.rpc(rpcName, { p_voucher_id: id }); if (error) throw error;
      await refreshCloudData();
    } else if (action === "POSTED") {
      if (voucher.status === "POSTED") return;
      const lines = voucher.rows || [];
      const debit = lines.reduce((sum, row) => sum + Number(row.debit || 0), 0);
      const credit = lines.reduce((sum, row) => sum + Number(row.credit || 0), 0);
      const validLines = lines.length >= 2 && lines.every((row) => {
        const rowDebit = Number(row.debit) || 0;
        const rowCredit = Number(row.credit) || 0;
        return accounts.some((account) => account.code === row.account_code)
          && rowDebit >= 0 && rowCredit >= 0
          && !(rowDebit > 0 && rowCredit > 0)
          && (rowDebit > 0 || rowCredit > 0);
      });
      if (!validLines || debit <= 0 || debit !== credit) throw new Error("Draft belum memenuhi semua syarat akun dan zero-discrepancy.");
      voucher.status = "POSTED"; addLocalAudit("POST", voucher, "Draft diposting dan dikunci di ledger."); saveLocalData(); renderRecords();
    } else {
      if (voucher.status === "POSTED") throw new Error("Voucher posted tidak dapat dihapus.");
      vouchers = vouchers.filter((item) => String(item.id) !== String(id)); addLocalAudit("DELETE", voucher, "Draft dihapus."); saveLocalData(); renderRecords();
    }
    showNotice(action === "POSTED" ? "Voucher berhasil diposting." : "Draft voucher berhasil dihapus.");
  } catch (error) { showNotice(error.message || "Perubahan status gagal.", true); }
}
function editVoucher(id) {
  const voucher = vouchers.find((item) => String(item.id) === String(id));
  if (!voucher || voucher.status !== "DRAFT") { showNotice("Hanya draft yang dapat diubah.", true); return; }
  editingVoucherId = String(voucher.id);
  elements.voucherNo.value = voucher.voucher_no || "";
  elements.txDate.value = voucher.tx_date || dateString(new Date());
  elements.description.value = voucher.description || "";
  rows = (voucher.rows || voucher.voucher_lines || []).map((line) => ({
    id: makeId(), account_code: line.account_code || "", line_memo: line.line_memo || "",
    debit: Number(line.debit) || 0, credit: Number(line.credit) || 0
  }));
  if (rows.length < 2) rows.push({ id: makeId(), account_code: "", line_memo: "", debit: 0, credit: 0 });
  document.querySelector("#form-title").textContent = "Edit Draft Voucher";
  elements.draftButton.textContent = "Perbarui Draft";
  renderRows();
  activateTab("entry");
}
function activateTab(name) {
  document.querySelectorAll(".tab").forEach((tab) => tab.classList.toggle("is-active", tab.dataset.tab === name));
  document.querySelectorAll(".tab-panel").forEach((panel) => { panel.hidden = panel.id !== `panel-${name}`; });
}
function handleRowInput(event) {
  const tr = event.target.closest("tr[data-row-id]"); const field = event.target.dataset.field; if (!tr || !field) return;
  const row = rows.find((item) => item.id === tr.dataset.rowId); if (!row) return;
  row[field] = field === "debit" || field === "credit" ? (event.target.value === "" ? "" : Number(event.target.value)) : event.target.value;
  if (field === "account_code") {
    const account = accounts.find((item) => item.code === row.account_code);
    const nameCell = tr.querySelector(".account-name");
    nameCell.textContent = account?.name || "Pilih akun...";
    nameCell.classList.toggle("account-placeholder", !account);
  }
  if (field === "debit" && Number(row.debit) > 0) row.credit = 0;
  if (field === "credit" && Number(row.credit) > 0) row.debit = 0;
  if (field === "debit" || field === "credit") tr.querySelector(`[data-field="${field === "debit" ? "credit" : "debit"}"]`).value = row[field === "debit" ? "credit" : "debit"];
  updateBalance();
}
function initialize() {
  elements.voucherNo.value = nextVoucherNumber(); elements.txDate.value = dateString(today); loadLocalData();
  elements.voucherNo.value = "KK-2026-1002";
  elements.txDate.value = "2026-10-12";
  elements.description.value = "Pembayaran langganan internet dan utilitas gerai cabang utama";
  if (SUPABASE_URL && SUPABASE_ANON_KEY && window.supabase?.createClient) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    elements.connection.classList.add("is-cloud"); elements.connection.querySelector("span:last-child").textContent = "Supabase";
    refreshCloudData().catch((error) => showNotice(`Supabase belum dapat diakses: ${error.message}`, true));
  }
  renderRows(); renderRecords();
  document.querySelectorAll(".tab").forEach((tab) => tab.addEventListener("click", () => activateTab(tab.dataset.tab)));
  document.querySelector("#add-row").addEventListener("click", () => { rows.push({ id: makeId(), account_code: "", line_memo: "", debit: 0, credit: 0 }); renderRows(); });
  elements.rows.addEventListener("input", handleRowInput); elements.rows.addEventListener("change", handleRowInput);
  elements.form.addEventListener("input", updateBalance); elements.form.addEventListener("submit", (event) => { event.preventDefault(); createVoucher("POSTED"); });
  elements.draftButton.addEventListener("click", () => createVoucher("DRAFT"));
  document.querySelector("#voucher-list").addEventListener("click", (event) => {
    const editButton = event.target.closest("[data-edit]");
    const postButton = event.target.closest("[data-post]"); const deleteButton = event.target.closest("[data-delete]");
    if (editButton) editVoucher(editButton.dataset.edit);
    if (postButton) updateVoucherStatus(postButton.dataset.post, "POSTED");
    if (deleteButton) updateVoucherStatus(deleteButton.dataset.delete, "DELETE");
  });
}
initialize();
