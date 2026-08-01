/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { api } from "../services/api";
import { motion, type Variants } from "framer-motion";
import {
  Gift,
  Tag,
  Award,
  Share2,
  Plus,
  RefreshCw,
  CheckCircle2,
  Sparkles
} from "lucide-react";
import "./pages.css";

type Props = { user: any; onLogout: () => void };

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
};

export default function OffersPage({ user, onLogout }: Props) {
  const [activeTab, setActiveTab] = useState<"coupons" | "memberships" | "seasonal" | "referral">("coupons");
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

  // eslint-disable-next-line react-hooks/set-state-in-effect
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
      <motion.div
        className="page-root"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div className="page-header" variants={itemVariants}>
          <div>
            <h1 className="page-title">
              <Gift size={26} style={{ color: "#EC4899" }} />
              Offers & Promotions
            </h1>
            <p className="page-sub">Manage discount coupons, VIP memberships, and referral incentives.</p>
          </div>
          <button onClick={fetchAll} className="btn-outline">
            <RefreshCw size={15} /> Refresh
          </button>
        </motion.div>

        <motion.div className="tab-bar" variants={itemVariants}>
          {[["coupons", "Coupons", Tag], ["memberships", "Memberships", Award], ["seasonal", "Seasonal Offers", Sparkles], ["referral", "Referral Setup", Share2]].map(([t, label, Icon]: any) => (
            <button key={t} onClick={() => setActiveTab(t)} className={`tab-btn ${activeTab === t ? "active" : ""}`}>
              <Icon size={15} /> {label}
            </button>
          ))}
        </motion.div>

        {activeTab === "coupons" && (
          <motion.div variants={itemVariants}>
            <div style={{ marginBottom: 16, display: "flex", justifyContent: "flex-end" }}>
              <button className="btn-add" onClick={() => setShowCouponForm(!showCouponForm)}>
                <Plus size={16} /> {showCouponForm ? "Cancel Form" : "Create Coupon"}
              </button>
            </div>

            {showCouponForm && (
              <div className="profile-card" style={{ marginBottom: 24, maxWidth: "100%" }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 16px 0", color: "var(--text-h)" }}>New Discount Coupon</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
                  <div className="form-group">
                    <label>Coupon Code</label>
                    <input
                      placeholder="e.g. SAVE20"
                      value={couponForm.code}
                      onChange={e => setCouponForm(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Discount Value</label>
                    <input
                      type="number"
                      placeholder="e.g. 20"
                      value={couponForm.discount_value}
                      onChange={e => setCouponForm(p => ({ ...p, discount_value: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Min Order (₹)</label>
                    <input
                      type="number"
                      placeholder="e.g. 500"
                      value={couponForm.min_order}
                      onChange={e => setCouponForm(p => ({ ...p, min_order: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Max Uses</label>
                    <input
                      type="number"
                      placeholder="e.g. 100"
                      value={couponForm.max_uses}
                      onChange={e => setCouponForm(p => ({ ...p, max_uses: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Expiry Date</label>
                    <input
                      type="date"
                      value={couponForm.expiry_date}
                      onChange={e => setCouponForm(p => ({ ...p, expiry_date: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Discount Type</label>
                    <select value={couponForm.discount_type} onChange={e => setCouponForm(p => ({ ...p, discount_type: e.target.value }))}>
                      <option value="percent">Percentage (%)</option>
                      <option value="flat">Flat Amount (₹)</option>
                    </select>
                  </div>
                </div>
                <div className="modal-actions">
                  <button className="btn-add" onClick={saveCoupon} disabled={savingCoupon}>
                    {savingCoupon ? "Creating..." : "Save Coupon"}
                  </button>
                </div>
              </div>
            )}

            {loading ? <div style={{ textAlign: "center", padding: 48, color: "var(--muted)" }}>Loading coupons...</div> : coupons.length === 0 ? (
              <div className="empty-state" style={{ padding: 48 }}>
                <Tag size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
                <h3>No discount coupons yet</h3>
                <p>Create promotional codes to boost appointments.</p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 18 }}>
                {coupons.map(c => (
                  <div key={c.id} className="stat-card" style={{ opacity: !c.active ? 0.6 : 1, position: "relative" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span className="badge" style={{ background: "rgba(124, 92, 252, 0.15)", color: "#7C5CFC", fontSize: 14, fontWeight: 800, padding: "4px 12px" }}>
                        {c.code}
                      </span>
                      {c.active ? (
                        <button className="btn-sm danger" onClick={() => deactivateCoupon(c.id)} style={{ fontSize: 11 }}>
                          Deactivate
                        </button>
                      ) : (
                        <span className="badge cancelled">Inactive</span>
                      )}
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: "#10B981", marginTop: 8 }}>
                      {c.discount_type === "percent" ? `${c.discount_value}% OFF` : `₹${c.discount_value} OFF`}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--muted)", display: "flex", flexDirection: "column", gap: 4, marginTop: 6 }}>
                      {c.min_order && <span>Min Order: ₹{c.min_order}</span>}
                      {c.expiry_date && <span>Expires: {new Date(c.expiry_date).toLocaleDateString("en-IN")}</span>}
                      <span>Redeemed: {c.used_count || 0} / {c.max_uses || "∞"}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "memberships" && (
          <motion.div variants={itemVariants}>
            <div style={{ marginBottom: 16, display: "flex", justifyContent: "flex-end" }}>
              <button className="btn-add" onClick={() => setShowMemberForm(!showMemberForm)}>
                <Plus size={16} /> {showMemberForm ? "Cancel Form" : "Create Plan"}
              </button>
            </div>

            {showMemberForm && (
              <div className="profile-card" style={{ marginBottom: 24, maxWidth: "100%" }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 16px 0", color: "var(--text-h)" }}>New Membership Plan</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
                  <div className="form-group">
                    <label>Plan Name</label>
                    <input
                      placeholder="e.g. VIP Gold Member"
                      value={memberForm.name}
                      onChange={e => setMemberForm(p => ({ ...p, name: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Price (₹)</label>
                    <input
                      type="number"
                      placeholder="e.g. 999"
                      value={memberForm.price}
                      onChange={e => setMemberForm(p => ({ ...p, price: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Duration (Days)</label>
                    <input
                      type="number"
                      placeholder="e.g. 30"
                      value={memberForm.duration_days}
                      onChange={e => setMemberForm(p => ({ ...p, duration_days: e.target.value }))}
                    />
                  </div>
                  <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                    <label>Benefits (comma-separated)</label>
                    <textarea
                      placeholder="e.g. 10% off all haircuts, Free head massage, Priority booking"
                      rows={2}
                      value={memberForm.benefits}
                      onChange={e => setMemberForm(p => ({ ...p, benefits: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="modal-actions">
                  <button className="btn-add" onClick={saveMembership} disabled={savingMember}>
                    {savingMember ? "Creating..." : "Save Plan"}
                  </button>
                </div>
              </div>
            )}

            {loading ? <div style={{ textAlign: "center", padding: 48, color: "var(--muted)" }}>Loading membership plans...</div> : memberships.length === 0 ? (
              <div className="empty-state" style={{ padding: 48 }}>
                <Award size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
                <h3>No membership plans yet</h3>
                <p>Create subscription packages for loyal customers.</p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 18 }}>
                {memberships.map(m => (
                  <div key={m.id} className="stat-card">
                    <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text-h)", display: "flex", alignItems: "center", gap: 8 }}>
                      <Award size={20} style={{ color: "#F59E0B" }} />
                      {m.name}
                    </div>
                    <div style={{ fontSize: 26, fontWeight: 900, color: "#7C5CFC", marginTop: 4 }}>
                      ₹{m.price} <span style={{ fontSize: 13, fontWeight: 500, color: "var(--muted)" }}>/ {m.duration_days} days</span>
                    </div>
                    <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
                      {(m.benefits || "").split(",").map((b: string, i: number) => (
                        <div key={i} style={{ fontSize: 13, color: "var(--text-h)", display: "flex", alignItems: "center", gap: 6 }}>
                          <CheckCircle2 size={13} style={{ color: "#10B981" }} />
                          {b.trim()}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "seasonal" && (
          <motion.div variants={itemVariants}>
            <div className="empty-state" style={{ padding: 48 }}>
              <Sparkles size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
              <h3>No seasonal offers connected yet</h3>
              <p>Seasonal promotions are not wired to a backend source, so this tab stays empty until that API is added.</p>
            </div>
          </motion.div>
        )}

        {activeTab === "referral" && (
          <motion.div className="profile-card" variants={itemVariants} style={{ maxWidth: "100%" }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 12px 0", color: "var(--text-h)", display: "flex", alignItems: "center", gap: 8 }}>
              <Share2 size={20} style={{ color: "#3B82F6" }} /> Customer Referral Incentives
            </h3>
            <p style={{ color: "var(--muted)", fontSize: 14 }}>
              Set rewards for existing customers who invite friends and family to book appointments.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 20 }}>
              <div className="form-group">
                <label>Referrer Reward (₹)</label>
                <input type="number" placeholder="e.g. 100" />
              </div>
              <div className="form-group">
                <label>Referee Discount (%)</label>
                <input type="number" placeholder="e.g. 10" />
              </div>
            </div>
            <div style={{ marginTop: 16 }}>
              <button className="btn-add">Save Settings</button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </Layout>
  );
}
