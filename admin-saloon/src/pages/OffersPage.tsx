import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { api } from "../services/api";

type Props = { user: any; onLogout: () => void };

export default function OffersPage({ user, onLogout }: Props) {
  const [activeTab, setActiveTab] = useState<"coupons" | "memberships" | "referral">("coupons");
  const [coupons, setCoupons] = useState<any[]>([]);
  const [memberships, setMemberships] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Coupon form
  const [couponForm, setCouponForm] = useState({ code: "", discount_type: "percent", discount_value: "", min_order: "", expiry_date: "", max_uses: "" });
  const [savingCoupon, setSavingCoupon] = useState(false);
  const [showCouponForm, setShowCouponForm] = useState(false);

  // Membership form
  const [memberForm, setMemberForm] = useState({ name: "", price: "", duration_days: "", benefits: "" });
  const [savingMember, setSavingMember] = useState(false);
  const [showMemberForm, setShowMemberForm] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [c, m] = await Promise.all([api.getCoupons(), api.getMemberships()]);
      setCoupons(c?.data || []);
      setMemberships(m?.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, [user]);

  const saveCoupon = async () => {
    setSavingCoupon(true);
    try {
      await api.createCoupon(couponForm);
      fetchAll();
      setShowCouponForm(false);
      setCouponForm({ code: "", discount_type: "percent", discount_value: "", min_order: "", expiry_date: "", max_uses: "" });
    } catch (e) { console.error(e); }
    setSavingCoupon(false);
  };

  const deactivateCoupon = async (id: string) => {
    await api.deactivateCoupon(id);
    setCoupons(prev => prev.map(c => c.id === id ? { ...c, active: false } : c));
  };

  const saveMembership = async () => {
    setSavingMember(true);
    try {
      await api.createMembership(memberForm);
      fetchAll();
      setShowMemberForm(false);
      setMemberForm({ name: "", price: "", duration_days: "", benefits: "" });
    } catch (e) { console.error(e); }
    setSavingMember(false);
  };

  return (
    <Layout user={user?.email || "Admin"} onLogout={onLogout}>
      <div className="page-root">
        <div className="page-header">
          <div>
            <h1 className="page-title">🎁 Offers & Promotions</h1>
            <p className="page-sub">Manage discount coupons, memberships and referral offers.</p>
          </div>
          <button onClick={fetchAll} className="btn-outline">🔄 Refresh</button>
        </div>

        <div className="tab-bar">
          {[["coupons", "🏷️ Coupons"], ["memberships", "💎 Memberships"], ["referral", "🔗 Referral"]] .map(([t, label]) => (
            <button key={t} onClick={() => setActiveTab(t as any)} className={`tab-btn ${activeTab === t ? "active" : ""}`}>
              {label}
            </button>
          ))}
        </div>

        {activeTab === "coupons" && (
          <div>
            <div style={{ marginBottom: 16, display: "flex", justifyContent: "flex-end" }}>
              <button className="btn-primary" onClick={() => setShowCouponForm(!showCouponForm)}>
                {showCouponForm ? "Cancel" : "+ Create Coupon"}
              </button>
            </div>

            {showCouponForm && (
              <div className="panel" style={{ marginBottom: 20 }}>
                <div className="panel-title">New Discount Coupon</div>
                <div className="form-grid-2">
                  {[
                    { label: "Coupon Code", key: "code", placeholder: "e.g. SAVE20" },
                    { label: "Discount Value", key: "discount_value", placeholder: "e.g. 20", type: "number" },
                    { label: "Min Order (₹)", key: "min_order", placeholder: "e.g. 500", type: "number" },
                    { label: "Max Uses", key: "max_uses", placeholder: "e.g. 100", type: "number" },
                    { label: "Expiry Date", key: "expiry_date", type: "date" },
                  ].map(f => (
                    <div key={f.key} className="form-group">
                      <label className="form-label">{f.label}</label>
                      <input
                        className="form-input"
                        type={f.type || "text"}
                        placeholder={f.placeholder}
                        value={couponForm[f.key as keyof typeof couponForm]}
                        onChange={e => setCouponForm(p => ({ ...p, [f.key]: e.target.value }))}
                      />
                    </div>
                  ))}
                  <div className="form-group">
                    <label className="form-label">Discount Type</label>
                    <select className="form-input" value={couponForm.discount_type} onChange={e => setCouponForm(p => ({ ...p, discount_type: e.target.value }))}>
                      <option value="percent">Percentage (%)</option>
                      <option value="flat">Flat (₹)</option>
                    </select>
                  </div>
                </div>
                <button className="btn-primary" onClick={saveCoupon} disabled={savingCoupon}>
                  {savingCoupon ? "Creating..." : "Create Coupon"}
                </button>
              </div>
            )}

            {loading ? <div className="panel-empty">Loading...</div> : coupons.length === 0 ? (
              <div className="panel-empty">No coupons yet. Create your first coupon above.</div>
            ) : (
              <div className="coupon-list">
                {coupons.map(c => (
                  <div key={c.id} className={`coupon-card ${!c.active ? "inactive" : ""}`}>
                    <div className="coupon-code">{c.code}</div>
                    <div className="coupon-meta">
                      <span>{c.discount_type === "percent" ? `${c.discount_value}% off` : `₹${c.discount_value} off`}</span>
                      {c.min_order && <span>· Min ₹{c.min_order}</span>}
                      {c.expiry_date && <span>· Expires {new Date(c.expiry_date).toLocaleDateString("en-IN")}</span>}
                      <span>· {c.used_count || 0}/{c.max_uses || "∞"} used</span>
                    </div>
                    {c.active ? (
                      <button className="btn-danger-sm" onClick={() => deactivateCoupon(c.id)}>Deactivate</button>
                    ) : (
                      <span className="badge-inactive">Inactive</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "memberships" && (
          <div>
            <div style={{ marginBottom: 16, display: "flex", justifyContent: "flex-end" }}>
              <button className="btn-primary" onClick={() => setShowMemberForm(!showMemberForm)}>
                {showMemberForm ? "Cancel" : "+ Create Plan"}
              </button>
            </div>

            {showMemberForm && (
              <div className="panel" style={{ marginBottom: 20 }}>
                <div className="panel-title">New Membership Plan</div>
                <div className="form-grid-2">
                  {[
                    { label: "Plan Name", key: "name", placeholder: "e.g. Gold Member" },
                    { label: "Price (₹)", key: "price", placeholder: "e.g. 999", type: "number" },
                    { label: "Duration (Days)", key: "duration_days", placeholder: "e.g. 30", type: "number" },
                  ].map(f => (
                    <div key={f.key} className="form-group">
                      <label className="form-label">{f.label}</label>
                      <input
                        className="form-input"
                        type={f.type || "text"}
                        placeholder={f.placeholder}
                        value={memberForm[f.key as keyof typeof memberForm]}
                        onChange={e => setMemberForm(p => ({ ...p, [f.key]: e.target.value }))}
                      />
                    </div>
                  ))}
                  <div className="form-group" style={{ gridColumn: "1/-1" }}>
                    <label className="form-label">Benefits (comma-separated)</label>
                    <textarea
                      className="form-input"
                      placeholder="e.g. 10% off all services, Free head massage, Priority booking"
                      rows={2}
                      value={memberForm.benefits}
                      onChange={e => setMemberForm(p => ({ ...p, benefits: e.target.value }))}
                    />
                  </div>
                </div>
                <button className="btn-primary" onClick={saveMembership} disabled={savingMember}>
                  {savingMember ? "Creating..." : "Create Plan"}
                </button>
              </div>
            )}

            {loading ? <div className="panel-empty">Loading...</div> : memberships.length === 0 ? (
              <div className="panel-empty">No membership plans yet.</div>
            ) : (
              <div className="membership-grid">
                {memberships.map(m => (
                  <div key={m.id} className="membership-card">
                    <div className="membership-name">💎 {m.name}</div>
                    <div className="membership-price">₹{m.price}<span style={{ fontSize: 13, fontWeight: 400, color: "var(--muted)" }}>/{m.duration_days} days</span></div>
                    <ul className="membership-benefits">
                      {(m.benefits || "").split(",").map((b: string, i: number) => (
                        <li key={i}>✓ {b.trim()}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "referral" && (
          <div className="panel">
            <div className="panel-title">🔗 Referral Program</div>
            <div className="referral-info">
              <div className="referral-icon">🎁</div>
              <h3>Referral Program Setup</h3>
              <p>Configure your referral offer so customers can earn rewards for bringing in new customers.</p>
              <div className="form-grid-2" style={{ marginTop: 20 }}>
                <div className="form-group">
                  <label className="form-label">Referrer Reward (₹)</label>
                  <input type="number" className="form-input" placeholder="e.g. 100" />
                </div>
                <div className="form-group">
                  <label className="form-label">Referee Discount (%)</label>
                  <input type="number" className="form-input" placeholder="e.g. 10" />
                </div>
              </div>
              <button className="btn-primary" style={{ marginTop: 12 }}>Save Referral Settings</button>
              <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 8 }}>
                Coming soon: Shareable referral links for each customer.
              </p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
