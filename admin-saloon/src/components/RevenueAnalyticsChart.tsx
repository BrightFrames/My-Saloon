/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, BarChart3, Download, FileSpreadsheet, FileText, User, Scissors, X } from "lucide-react";

export type RevenueChartPoint = {
  label?: string;
  month?: string;
  date?: string;
  name?: string;
  revenue: number;
  bookings?: number;
  average?: number;
  bookingDetails?: any[];
};

type Props = {
  data?: RevenueChartPoint[];
  trend_7d?: RevenueChartPoint[];
  trend_1m?: RevenueChartPoint[];
  trend_6m?: RevenueChartPoint[];
  trend_1y?: RevenueChartPoint[];
  analyticsSummary?: {
    todayRevenue?: number;
    weeklyRevenue?: number;
    monthlyRevenue?: number;
    yearlyRevenue?: number;
    totalRevenue?: number;
    bookingCount?: number;
    todayBookingCount?: number;
    activeBookingCount?: number;
    averageBookingValue?: number;
    highestRevenue?: number;
    lowestRevenue?: number;
    growthRate?: string;
    lastUpdated?: string;
  };
  breakdownTable?: any[];
  title?: string;
  subtitle?: string;
  height?: number;
  currencySymbol?: string;
  strokeColor?: string;
  onRangeChange?: (range: string) => void;
};

// STEP 12: Chart Hover Tooltip (Date, Revenue, Bookings, Average)
const CustomTooltip = ({ active, payload, currencySymbol = "₹" }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const val = Number(payload[0].value || 0);
    const label = data.label || data.month || data.date || "Date";
    const bookings = Number(data.bookings || (val > 0 ? 1 : 0));
    const avg = Number(data.average || (bookings > 0 ? Math.round(val / bookings) : 0));

    return (
      <div
        style={{
          background: "#FFFFFF",
          color: "#0F172A",
          padding: "14px 18px",
          borderRadius: "16px",
          boxShadow: "0 14px 40px rgba(0, 0, 0, 0.14)",
          fontWeight: 700,
          fontSize: "13px",
          border: "1px solid #E2E8F0",
          minWidth: "180px"
        }}
      >
        <div style={{ fontSize: "14px", fontWeight: 800, color: "#0F172A", marginBottom: "8px", borderBottom: "1px solid #F1F5F9", paddingBottom: "6px" }}>
          📅 {label}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", marginBottom: "4px" }}>
          <span style={{ color: "#64748B", fontWeight: 600 }}>Revenue:</span>
          <span style={{ color: "#6366F1", fontWeight: 800 }}>{currencySymbol}{val.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", marginBottom: "4px" }}>
          <span style={{ color: "#64748B", fontWeight: 600 }}>Bookings:</span>
          <span style={{ color: "#0F172A", fontWeight: 800 }}>{bookings}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
          <span style={{ color: "#64748B", fontWeight: 600 }}>Average:</span>
          <span style={{ color: "#10B981", fontWeight: 800 }}>{currencySymbol}{avg.toLocaleString()}</span>
        </div>
      </div>
    );
  }
  return null;
};

// STEP 14: Dynamic Y-Axis Scale Formatter
const formatYAxis = (value: number, currencySymbol: string) => {
  if (value === 0) return `${currencySymbol}0`;
  if (value >= 100000) return `${currencySymbol}${(value / 100000).toFixed(1)}L`;
  if (value >= 1000) return `${currencySymbol}${(value / 1000).toFixed(1)}k`;
  return `${currencySymbol}${value}`;
};

export default function RevenueAnalyticsChart({
  data = [],
  trend_7d,
  trend_1m,
  trend_6m,
  trend_1y,
  analyticsSummary,
  breakdownTable = [],
  title = "Revenue Analytics",
  subtitle = "Single Source of Truth backend live database aggregation.",
  height = 320,
  currencySymbol = "₹",
  strokeColor = "#6366F1",
  onRangeChange
}: Props) {
  const [selectedRange, setSelectedRange] = useState("1M");
  const [selectedDateModal, setSelectedDateModal] = useState<RevenueChartPoint | null>(null);

  // Compute active dataset for selected range (Today, 7D, 1M, 6M, 1Y)
  const activePoints = useMemo(() => {
    if (selectedRange === "Today") {
      if (trend_7d && trend_7d.length > 0) {
        return [trend_7d[trend_7d.length - 1]];
      }
    }
    if (selectedRange === "7D" && trend_7d && trend_7d.length > 0) return trend_7d;
    if (selectedRange === "1M" && trend_1m && trend_1m.length > 0) return trend_1m;
    if (selectedRange === "6M" && trend_6m && trend_6m.length > 0) return trend_6m;
    if ((selectedRange === "1Y" || selectedRange === "Year") && trend_1y && trend_1y.length > 0) return trend_1y;
    return data || [];
  }, [selectedRange, data, trend_7d, trend_1m, trend_6m, trend_1y]);

  const handleRangeClick = (range: string) => {
    setSelectedRange(range);
    if (onRangeChange) onRangeChange(range);
  };

  // STEP 21: Export Handlers (CSV, Excel, PDF)
  const exportCSV = () => {
    const rowsToExport = breakdownTable.length > 0 ? breakdownTable : activePoints;
    const headers = ["Date / Period", "Revenue (INR)", "Bookings", "Average Booking Value (INR)"];
    const csvRows = [
      headers.join(","),
      ...rowsToExport.map((row: any) => [
        `"${row.label || row.month || row.date || ''}"`,
        row.revenue || 0,
        row.bookings || 0,
        row.average || 0
      ].join(","))
    ];
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Revenue_Report_${selectedRange}_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  const exportExcel = () => {
    exportCSV(); // Downloads .csv formatted for Excel
  };

  const downloadPDF = () => {
    window.print();
  };

  // Extract Summary Statistics
  const todayRev = analyticsSummary?.todayRevenue ?? 0;
  const weeklyRev = analyticsSummary?.weeklyRevenue ?? 0;
  const monthlyRev = analyticsSummary?.monthlyRevenue ?? 0;
  const yearlyRev = analyticsSummary?.yearlyRevenue ?? 0;
  const avgVal = analyticsSummary?.averageBookingValue ?? 0;
  const highestRev = analyticsSummary?.highestRevenue ?? Math.max(...activePoints.map(p => p.revenue || 0), 0);
  const growthRate = analyticsSummary?.growthRate ?? "0%";
  const lastUpdated = analyticsSummary?.lastUpdated ?? new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });

  return (
    <div
      style={{
        background: "#FFFFFF",
        border: "1px solid #E2E8F0",
        borderRadius: "24px",
        padding: "24px 24px 24px 24px",
        boxShadow: "0 10px 30px rgba(0, 0, 0, 0.04)",
        color: "#0F172A",
        width: "100%",
        boxSizing: "border-box"
      }}
    >
      {/* STEP 16 & STEP 17: Top Bar with Live DB Data Badge & Time Filter Switches */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "16px",
          flexWrap: "wrap",
          gap: "12px"
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <h2
              style={{
                fontFamily: "Georgia, 'Times New Roman', serif",
                fontSize: "22px",
                fontWeight: "700",
                margin: 0,
                letterSpacing: "-0.02em",
                color: "#0F172A"
              }}
            >
              {title}
            </h2>

            {/* STEP 17: Live DB Data + Last Updated HH:MM AM/PM */}
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                background: "rgba(16, 185, 129, 0.1)",
                color: "#059669",
                fontSize: 12,
                fontWeight: 700,
                padding: "4px 12px",
                borderRadius: "14px",
                border: "1px solid rgba(16, 185, 129, 0.2)"
              }}
            >
              <TrendingUp size={13} /> Live DB Data • Last Updated {lastUpdated}
            </span>
          </div>
          <p
            style={{
              margin: "4px 0 0 0",
              fontSize: "13px",
              color: "#64748B",
              fontWeight: "400",
              lineHeight: "1.4"
            }}
          >
            {subtitle}
          </p>
        </div>

        {/* Action Controls & Filters */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          {/* STEP 21: Export Controls */}
          <div style={{ display: "flex", gap: "6px" }}>
            <button
              onClick={exportCSV}
              type="button"
              title="Export CSV"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                padding: "6px 12px",
                borderRadius: "10px",
                border: "1px solid #E2E8F0",
                background: "#F8FAFC",
                color: "#475569",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              <Download size={13} /> CSV
            </button>
            <button
              onClick={exportExcel}
              type="button"
              title="Export Excel"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                padding: "6px 12px",
                borderRadius: "10px",
                border: "1px solid #E2E8F0",
                background: "#F8FAFC",
                color: "#475569",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              <FileSpreadsheet size={13} /> Excel
            </button>
            <button
              onClick={downloadPDF}
              type="button"
              title="Download PDF"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                padding: "6px 12px",
                borderRadius: "10px",
                border: "1px solid #E2E8F0",
                background: "#F8FAFC",
                color: "#475569",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              <FileText size={13} /> PDF
            </button>
          </div>

          {/* Range Selector */}
          <div
            style={{
              display: "flex",
              background: "#F8FAFC",
              borderRadius: "12px",
              padding: "3px",
              border: "1px solid #E2E8F0"
            }}
          >
            {["Today", "7D", "1M", "6M", "1Y"].map((range) => (
              <button
                key={range}
                type="button"
                onClick={() => handleRangeClick(range)}
                style={{
                  background: selectedRange === range ? "#FFFFFF" : "transparent",
                  color: selectedRange === range ? "#0F172A" : "#64748B",
                  border: "none",
                  borderRadius: "9px",
                  padding: "4px 12px",
                  fontSize: "12px",
                  fontWeight: selectedRange === range ? "700" : "500",
                  cursor: "pointer",
                  boxShadow: selectedRange === range ? "0 2px 6px rgba(0,0,0,0.08)" : "none",
                  transition: "all 0.2s ease"
                }}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* STEP 16: Summary Bar Above Chart */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
          gap: "12px",
          marginBottom: "20px",
          background: "#F8FAFC",
          padding: "12px 16px",
          borderRadius: "16px",
          border: "1px solid #F1F5F9"
        }}
      >
        <div>
          <span style={{ fontSize: "11px", color: "#64748B", fontWeight: 600, textTransform: "uppercase" }}>Today</span>
          <div style={{ fontSize: "15px", fontWeight: 800, color: "#0F172A" }}>{currencySymbol}{todayRev.toLocaleString()}</div>
        </div>
        <div>
          <span style={{ fontSize: "11px", color: "#64748B", fontWeight: 600, textTransform: "uppercase" }}>Weekly</span>
          <div style={{ fontSize: "15px", fontWeight: 800, color: "#0F172A" }}>{currencySymbol}{weeklyRev.toLocaleString()}</div>
        </div>
        <div>
          <span style={{ fontSize: "11px", color: "#64748B", fontWeight: 600, textTransform: "uppercase" }}>Monthly</span>
          <div style={{ fontSize: "15px", fontWeight: 800, color: "#0F172A" }}>{currencySymbol}{monthlyRev.toLocaleString()}</div>
        </div>
        <div>
          <span style={{ fontSize: "11px", color: "#64748B", fontWeight: 600, textTransform: "uppercase" }}>Yearly</span>
          <div style={{ fontSize: "15px", fontWeight: 800, color: "#0F172A" }}>{currencySymbol}{yearlyRev.toLocaleString()}</div>
        </div>
        <div>
          <span style={{ fontSize: "11px", color: "#64748B", fontWeight: 600, textTransform: "uppercase" }}>Avg Booking</span>
          <div style={{ fontSize: "15px", fontWeight: 800, color: "#10B981" }}>{currencySymbol}{avgVal.toLocaleString()}</div>
        </div>
        <div>
          <span style={{ fontSize: "11px", color: "#64748B", fontWeight: 600, textTransform: "uppercase" }}>Peak Day</span>
          <div style={{ fontSize: "15px", fontWeight: 800, color: "#6366F1" }}>{currencySymbol}{highestRev.toLocaleString()}</div>
        </div>
        <div>
          <span style={{ fontSize: "11px", color: "#64748B", fontWeight: 600, textTransform: "uppercase" }}>Growth</span>
          <div style={{ fontSize: "15px", fontWeight: 800, color: "#059669" }}>{growthRate}</div>
        </div>
      </div>

      {/* Real Data Chart Container */}
      {activePoints.length === 0 ? (
        <div
          style={{
            height: height,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            color: "#94A3B8",
            fontSize: 14,
            gap: 8
          }}
        >
          <BarChart3 size={36} style={{ opacity: 0.3 }} />
          <span>No revenue records found in database for selected period</span>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart
            data={activePoints}
            margin={{ top: 16, right: 16, left: -5, bottom: 0 }}
            onClick={(e: any) => {
              if (e && e.activePayload && e.activePayload.length) {
                // STEP 13: Open Click Date Details Modal
                setSelectedDateModal(e.activePayload[0].payload);
              }
            }}
          >
            <defs>
              <linearGradient id="revenueAnalyticsRealGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={strokeColor} stopOpacity={0.35} />
                <stop offset="60%" stopColor={strokeColor} stopOpacity={0.08} />
                <stop offset="100%" stopColor={strokeColor} stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="4 4"
              vertical={false}
              stroke="#F1F5F9"
            />

            {/* STEP 15: X-Axis strictly ending today */}
            <XAxis
              dataKey={(d) => d.label || d.month || d.date || ""}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "#94A3B8" }}
              dy={8}
            />

            {/* STEP 14: Dynamic Y-Axis scale formatter */}
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "#94A3B8" }}
              tickFormatter={(val) => formatYAxis(val, currencySymbol)}
              dx={-6}
            />

            {/* STEP 12: Tooltip with date, revenue, bookings, average */}
            <Tooltip
              content={<CustomTooltip currencySymbol={currencySymbol} />}
              cursor={{ stroke: "#CBD5E1", strokeWidth: 1.5, strokeDasharray: "3 3" }}
            />

            <Area
              type="natural"
              dataKey="revenue"
              stroke={strokeColor}
              strokeWidth={3.5}
              fill="url(#revenueAnalyticsRealGrad)"
              style={{ cursor: "pointer" }}
              activeDot={{
                r: 7,
                fill: strokeColor,
                stroke: "#FFFFFF",
                strokeWidth: 3
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}

      {/* STEP 20: Revenue Breakdown Table below chart */}
      <div style={{ marginTop: "24px", paddingTop: "20px", borderTop: "1px solid #F1F5F9" }}>
        <h3 style={{ fontSize: "16px", fontWeight: 700, margin: "0 0 12px 0", color: "#0F172A" }}>
          📊 Revenue & Booking Breakdown ({selectedRange})
        </h3>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ background: "#F8FAFC", textAlign: "left", color: "#64748B" }}>
                <th style={{ padding: "10px 14px", borderRadius: "8px 0 0 8px", fontWeight: 700 }}>Date / Period</th>
                <th style={{ padding: "10px 14px", fontWeight: 700 }}>Revenue</th>
                <th style={{ padding: "10px 14px", fontWeight: 700 }}>Bookings</th>
                <th style={{ padding: "10px 14px", fontWeight: 700 }}>Average Booking</th>
                <th style={{ padding: "10px 14px", borderRadius: "0 8px 8px 0", textAlign: "right", fontWeight: 700 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {(breakdownTable.length > 0 ? breakdownTable : activePoints).map((row: any, idx: number) => {
                const rVal = Number(row.revenue || 0);
                const bVal = Number(row.bookings || (rVal > 0 ? 1 : 0));
                const aVal = Number(row.average || (bVal > 0 ? Math.round(rVal / bVal) : 0));
                const label = row.label || row.month || row.date || `Row ${idx + 1}`;
                return (
                  <tr key={idx} style={{ borderBottom: "1px solid #F1F5F9" }}>
                    <td style={{ padding: "12px 14px", fontWeight: 700, color: "#0F172A" }}>{label}</td>
                    <td style={{ padding: "12px 14px", fontWeight: 800, color: "#6366F1" }}>{currencySymbol}{rVal.toLocaleString()}</td>
                    <td style={{ padding: "12px 14px", fontWeight: 700, color: "#0F172A" }}>{bVal}</td>
                    <td style={{ padding: "12px 14px", fontWeight: 700, color: "#10B981" }}>{currencySymbol}{aVal.toLocaleString()}</td>
                    <td style={{ padding: "12px 14px", textAlign: "right" }}>
                      <button
                        onClick={() => setSelectedDateModal(row)}
                        type="button"
                        style={{
                          background: "#EEF2FF",
                          color: "#4F46E5",
                          border: "none",
                          borderRadius: "8px",
                          padding: "6px 12px",
                          fontSize: "12px",
                          fontWeight: 700,
                          cursor: "pointer"
                        }}
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* STEP 13: Click Date Modal for full booking details */}
      {selectedDateModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "20px"
          }}
          onClick={() => setSelectedDateModal(null)}
        >
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: "24px",
              padding: "28px",
              maxWidth: "540px",
              width: "100%",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              color: "#0F172A"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "20px", fontWeight: 800, color: "#0F172A" }}>
                  📅 {selectedDateModal.label || selectedDateModal.month || selectedDateModal.date} Details
                </h3>
                <span style={{ fontSize: "13px", color: "#64748B" }}>
                  Total Revenue: <strong style={{ color: "#6366F1" }}>{currencySymbol}{(selectedDateModal.revenue || 0).toLocaleString()}</strong> • {selectedDateModal.bookings || 1} Bookings
                </span>
              </div>
              <button
                onClick={() => setSelectedDateModal(null)}
                style={{ background: "#F1F5F9", border: "none", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Booking Details List */}
            <div style={{ maxHeight: "320px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "12px" }}>
              {(selectedDateModal.bookingDetails && selectedDateModal.bookingDetails.length > 0) ? (
                selectedDateModal.bookingDetails.map((b: any, index: number) => (
                  <div
                    key={index}
                    style={{
                      background: "#F8FAFC",
                      borderRadius: "16px",
                      padding: "14px 16px",
                      border: "1px solid #E2E8F0",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 800, fontSize: "14px", color: "#0F172A" }}>
                        <User size={14} style={{ display: "inline", marginRight: 4 }} /> {b.customerName}
                      </div>
                      <div style={{ fontSize: "12px", color: "#64748B", marginTop: 2 }}>
                        <Scissors size={12} style={{ display: "inline", marginRight: 4 }} /> {b.serviceName} • Stylist: {b.stylist}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "15px", fontWeight: 800, color: "#6366F1" }}>
                        {currencySymbol}{b.amount.toLocaleString()}
                      </div>
                      <span style={{ fontSize: "11px", fontWeight: 700, color: "#059669", background: "rgba(16, 185, 129, 0.1)", padding: "2px 8px", borderRadius: "8px" }}>
                        {b.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: "20px", textAlign: "center", color: "#64748B", background: "#F8FAFC", borderRadius: "14px" }}>
                  Total aggregated day revenue is <strong>{currencySymbol}{(selectedDateModal.revenue || 0).toLocaleString()}</strong>.
                </div>
              )}
            </div>

            <div style={{ marginTop: "20px", textAlign: "right" }}>
              <button
                onClick={() => setSelectedDateModal(null)}
                style={{
                  background: "#0F172A",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "12px",
                  padding: "10px 20px",
                  fontWeight: 700,
                  fontSize: "13px",
                  cursor: "pointer"
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
