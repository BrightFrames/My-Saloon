/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { api } from "../services/api";
import { Eye, EyeOff } from "lucide-react";

type Props = { user: any; onLogout: () => void };

export default function SettingsPage({ user, onLogout }: Props) {
  const [activeTab, setActiveTab] = useState<"bank" | "gst" | "notifications" | "password" | "preferences">("bank");

  // Bank Details
  const [bank, setBank] = useState({ account_name: "", account_number: "", ifsc_code: "", bank_name: "", branch: "" });
  const [savingBank, setSavingBank] = useState(false);
  const [bankMsg, setBankMsg] = useState("");

  // GST
  const [gst, setGst] = useState({ gstin: "", business_name: "", pan: "" });
  const [savingGst, setSavingGst] = useState(false);
  const [gstMsg, setGstMsg] = useState("");

  // Password
  const [pwForm, setPwForm] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });
  const [pwErrors, setPwErrors] = useState<{ old?: string; new?: string; confirm?: string; general?: string }>({});
  const [savingPw, setSavingPw] = useState(false);
  const [pwMsg, setPwMsg] = useState("");
  const [showOldPw, setShowOldPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  // Notification prefs
  const [notifPrefs, setNotifPrefs] = useState({ email_new_booking: true, email_cancellation: true, sms_new_booking: false, push_notifications: true });
  const [savingNotif, setSavingNotif] = useState(false);
  const [notifMsg, setNotifMsg] = useState("");

  // Business Prefs
  const [biz, setBiz] = useState({ currency: "INR", timezone: "Asia/Kolkata", language: "en" });
  const [savingBiz, setSavingBiz] = useState(false);
  const [bizMsg, setBizMsg] = useState("");

  const fetchSettings = async () => {
    try {
      const [bankRes, gstRes, notifRes, prefRes] = await Promise.allSettled([
        api.getBankDetails(), api.getGstDetails(), api.getNotifSettings(), api.getBizPrefs()
      ]);
      if (bankRes.status === "fulfilled" && bankRes.value?.data) setBank(bankRes.value.data);
      if (gstRes.status === "fulfilled"  && gstRes.value?.data)  setGst(gstRes.value.data);
      if (notifRes.status === "fulfilled" && notifRes.value?.data) setNotifPrefs(notifRes.value.data);
      if (prefRes.status === "fulfilled"  && prefRes.value?.data)  setBiz(prefRes.value.data);
    } catch (e) { console.error(e); }
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchSettings(); }, [user]);

  const saveBank = async () => {
    setSavingBank(true); setBankMsg("");
    try { await api.saveBankDetails(bank); setBankMsg("✅ Bank details saved successfully."); }
    catch (e: any) { setBankMsg("❌ " + (e.message || "Failed to save.")); }
    setSavingBank(false);
  };

  const saveGst = async () => {
    setSavingGst(true); setGstMsg("");
    try { await api.saveGstDetails(gst); setGstMsg("✅ GST details saved successfully."); }
    catch (e: any) { setGstMsg("❌ " + (e.message || "Failed to save.")); }
    setSavingGst(false);
  };

  const savePassword = async () => {
    setPwErrors({});
    setPwMsg("");
    const errors: typeof pwErrors = {};
    if (!pwForm.oldPassword) errors.old = "Current password is required.";
    if (!pwForm.newPassword) {
      errors.new = "New password is required.";
    } else if (pwForm.newPassword.length < 8) {
      errors.new = "Password must be at least 8 characters.";
    } else if (pwForm.newPassword === pwForm.oldPassword) {
      errors.new = "New password must be different from current password.";
    }
    if (!pwForm.confirmPassword) {
      errors.confirm = "Please confirm your new password.";
    } else if (pwForm.confirmPassword !== pwForm.newPassword) {
      errors.confirm = "Passwords do not match.";
    }
    if (Object.keys(errors).length > 0) { setPwErrors(errors); return; }

    setSavingPw(true);
    try {
      await api.changePassword({ oldPassword: pwForm.oldPassword, newPassword: pwForm.newPassword });
      setPwMsg("✅ Password changed successfully. Logging out...");
      setPwForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
      setTimeout(() => onLogout(), 2000);
    } catch (e: any) {
      setPwErrors({ general: e.message || "Failed to change password." });
    }
    setSavingPw(false);
  };

  const saveNotif = async () => {
    setSavingNotif(true); setNotifMsg("");
    try { await api.saveNotifSettings(notifPrefs); setNotifMsg("✅ Notification preferences saved."); }
    catch (e: any) { setNotifMsg("❌ " + (e.message || "Failed to save.")); }
    setSavingNotif(false);
  };

  const saveBiz = async () => {
    setSavingBiz(true); setBizMsg("");
    try { await api.saveBizPrefs(biz); setBizMsg("✅ Business preferences saved."); }
    catch (e: any) { setBizMsg("❌ " + (e.message || "Failed to save.")); }
    setSavingBiz(false);
  };

  const Toggle = ({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) => (
    <button
      onClick={() => onChange(!value)}
      style={{
        width: 44, height: 24, borderRadius: 12, border: "none",
        background: value ? "#7C5CFC" : "var(--border)",
        position: "relative", cursor: "pointer", transition: "background 0.2s",
      }}
    >
      <span style={{
        position: "absolute", top: 3, left: value ? 22 : 3,
        width: 18, height: 18, borderRadius: "50%", background: "#fff",
        transition: "left 0.2s", display: "block",
      }} />
    </button>
  );

  return (
    <Layout user={user?.email || "Admin"} onLogout={onLogout}>
      <div className="page-root">
        <div className="page-header">
          <div>
            <h1 className="page-title">⚙️ Settings</h1>
            <p className="page-sub">Manage your account, bank, GST, and preferences.</p>
          </div>
        </div>

        <div className="settings-layout">
          {/* Settings sidebar */}
          <div className="settings-nav">
            {([
              ["bank",         "🏦 Bank Details"],
              ["gst",          "🧾 GST Details"],
              ["notifications","🔔 Notifications"],
              ["password",     "🔒 Password"],
              ["preferences",  "🌐 Preferences"],
            ] as const).map(([t, label]) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`settings-nav-item ${activeTab === t ? "active" : ""}`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Settings content */}
          <div className="settings-content">

            {activeTab === "bank" && (
              <div className="settings-section">
                <h2 className="settings-title">🏦 Bank Details</h2>
                <p className="settings-desc">These details will be used for processing your payouts.</p>
                <div className="form-grid-2">
                  {[
                    { label: "Account Holder Name", key: "account_name", placeholder: "e.g. Rahul Sharma" },
                    { label: "Account Number", key: "account_number", placeholder: "e.g. 123456789012" },
                    { label: "IFSC Code", key: "ifsc_code", placeholder: "e.g. HDFC0001234" },
                    { label: "Bank Name", key: "bank_name", placeholder: "e.g. HDFC Bank" },
                    { label: "Branch", key: "branch", placeholder: "e.g. Koramangala, Bengaluru" },
                  ].map(f => (
                    <div key={f.key} className="form-group">
                      <label className="form-label">{f.label}</label>
                      <input className="form-input" placeholder={f.placeholder}
                        value={bank[f.key as keyof typeof bank]}
                        onChange={e => setBank(p => ({ ...p, [f.key]: e.target.value }))} />
                    </div>
                  ))}
                </div>
                {bankMsg && <div className={`alert-msg ${bankMsg.startsWith("✅") ? "success" : "error"}`}>{bankMsg}</div>}
                <button className="btn-primary" onClick={saveBank} disabled={savingBank}>
                  {savingBank ? "Saving..." : "Save Bank Details"}
                </button>
              </div>
            )}

            {activeTab === "gst" && (
              <div className="settings-section">
                <h2 className="settings-title">🧾 GST & Tax Details</h2>
                <p className="settings-desc">Your GST registration details for compliance and invoicing.</p>
                <div className="form-grid-2">
                  {[
                    { label: "GSTIN", key: "gstin", placeholder: "e.g. 29ABCDE1234F1Z5" },
                    { label: "Business Legal Name", key: "business_name", placeholder: "e.g. Sharma Salon Pvt Ltd" },
                    { label: "PAN Number", key: "pan", placeholder: "e.g. ABCDE1234F" },
                  ].map(f => (
                    <div key={f.key} className="form-group">
                      <label className="form-label">{f.label}</label>
                      <input className="form-input" placeholder={f.placeholder}
                        value={gst[f.key as keyof typeof gst]}
                        onChange={e => setGst(p => ({ ...p, [f.key]: e.target.value }))} />
                    </div>
                  ))}
                </div>
                {gstMsg && <div className={`alert-msg ${gstMsg.startsWith("✅") ? "success" : "error"}`}>{gstMsg}</div>}
                <button className="btn-primary" onClick={saveGst} disabled={savingGst}>
                  {savingGst ? "Saving..." : "Save GST Details"}
                </button>
              </div>
            )}

            {activeTab === "notifications" && (
              <div className="settings-section">
                <h2 className="settings-title">🔔 Notification Settings</h2>
                <p className="settings-desc">Choose how you'd like to be notified.</p>
                <div className="notif-settings-list">
                  {[
                    { key: "email_new_booking",  label: "Email on new booking",      desc: "Receive an email whenever a new booking is made." },
                    { key: "email_cancellation", label: "Email on cancellation",     desc: "Receive an email when a booking is cancelled." },
                    { key: "sms_new_booking",    label: "SMS on new booking",        desc: "Receive an SMS for new bookings (carrier rates may apply)." },
                    { key: "push_notifications", label: "Push notifications",        desc: "In-app real-time alerts for booking updates." },
                  ].map(({ key, label, desc }) => (
                    <div key={key} className="notif-toggle-row">
                      <div>
                        <div className="notif-toggle-label">{label}</div>
                        <div className="notif-toggle-desc">{desc}</div>
                      </div>
                      <Toggle
                        value={notifPrefs[key as keyof typeof notifPrefs] as boolean}
                        onChange={v => setNotifPrefs(p => ({ ...p, [key]: v }))}
                      />
                    </div>
                  ))}
                </div>
                {notifMsg && <div className={`alert-msg ${notifMsg.startsWith("✅") ? "success" : "error"}`}>{notifMsg}</div>}
                <button className="btn-primary" onClick={saveNotif} disabled={savingNotif}>
                  {savingNotif ? "Saving..." : "Save Preferences"}
                </button>
              </div>
            )}

            {activeTab === "password" && (
              <div className="settings-section" style={{ maxWidth: 440 }}>
                <h2 className="settings-title">🔒 Change Password</h2>
                <p className="settings-desc">Keep your account secure with a strong password (min. 8 characters).</p>

                {pwMsg && (
                  <div className={`alert-msg ${pwMsg.startsWith("✅") ? "success" : "error"}`} style={{ marginBottom: 16 }}>
                    {pwMsg}
                  </div>
                )}
                {pwErrors.general && (
                  <div className="alert-msg error" style={{ marginBottom: 16 }}>{pwErrors.general}</div>
                )}

                {/* Current Password */}
                <div className="form-group" style={{ marginBottom: 14 }}>
                  <label className="form-label">Current Password *</label>
                  <div style={{ position: "relative" }}>
                    <input
                      className="form-input"
                      type={showOldPw ? "text" : "password"}
                      placeholder="Enter current password"
                      value={pwForm.oldPassword}
                      onChange={e => setPwForm(p => ({ ...p, oldPassword: e.target.value }))}
                      style={{ paddingRight: 40 }}
                    />
                    <button type="button" onClick={() => setShowOldPw(v => !v)}
                      style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: 0 }}>
                      {showOldPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {pwErrors.old && <span style={{ color: "#EF4444", fontSize: 12, marginTop: 4, display: "block" }}>{pwErrors.old}</span>}
                </div>

                {/* New Password */}
                <div className="form-group" style={{ marginBottom: 14 }}>
                  <label className="form-label">New Password *</label>
                  <div style={{ position: "relative" }}>
                    <input
                      className="form-input"
                      type={showNewPw ? "text" : "password"}
                      placeholder="Min. 8 characters"
                      value={pwForm.newPassword}
                      onChange={e => setPwForm(p => ({ ...p, newPassword: e.target.value }))}
                      style={{ paddingRight: 40 }}
                    />
                    <button type="button" onClick={() => setShowNewPw(v => !v)}
                      style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: 0 }}>
                      {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {pwErrors.new && <span style={{ color: "#EF4444", fontSize: 12, marginTop: 4, display: "block" }}>{pwErrors.new}</span>}
                </div>

                {/* Confirm Password */}
                <div className="form-group" style={{ marginBottom: 20 }}>
                  <label className="form-label">Confirm New Password *</label>
                  <div style={{ position: "relative" }}>
                    <input
                      className="form-input"
                      type={showConfirmPw ? "text" : "password"}
                      placeholder="Re-enter new password"
                      value={pwForm.confirmPassword}
                      onChange={e => setPwForm(p => ({ ...p, confirmPassword: e.target.value }))}
                      style={{ paddingRight: 40 }}
                    />
                    <button type="button" onClick={() => setShowConfirmPw(v => !v)}
                      style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: 0 }}>
                      {showConfirmPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {pwErrors.confirm && <span style={{ color: "#EF4444", fontSize: 12, marginTop: 4, display: "block" }}>{pwErrors.confirm}</span>}
                </div>

                <button className="btn-primary" onClick={savePassword} disabled={savingPw}>
                  {savingPw ? "Changing..." : "🔐 Change Password"}
                </button>
              </div>
            )}

            {activeTab === "preferences" && (
              <div className="settings-section">
                <h2 className="settings-title">🌐 Business Preferences</h2>
                <p className="settings-desc">Configure your regional and business settings.</p>
                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Currency</label>
                    <select className="form-input" value={biz.currency} onChange={e => setBiz(p => ({ ...p, currency: e.target.value }))}>
                      <option value="INR">INR — Indian Rupee (₹)</option>
                      <option value="USD">USD — US Dollar ($)</option>
                      <option value="EUR">EUR — Euro (€)</option>
                      <option value="GBP">GBP — British Pound (£)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Timezone</label>
                    <select className="form-input" value={biz.timezone} onChange={e => setBiz(p => ({ ...p, timezone: e.target.value }))}>
                      <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                      <option value="America/New_York">America/New_York (EST)</option>
                      <option value="Europe/London">Europe/London (GMT)</option>
                      <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Language</label>
                    <select className="form-input" value={biz.language} onChange={e => setBiz(p => ({ ...p, language: e.target.value }))}>
                      <option value="en">English</option>
                      <option value="hi">Hindi</option>
                      <option value="mr">Marathi</option>
                    </select>
                  </div>
                </div>
                {bizMsg && <div className={`alert-msg ${bizMsg.startsWith("✅") ? "success" : "error"}`}>{bizMsg}</div>}
                <button className="btn-primary" onClick={saveBiz} disabled={savingBiz}>
                  {savingBiz ? "Saving..." : "Save Preferences"}
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
    </Layout>
  );
}
