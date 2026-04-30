"use client";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import axios from "axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const MapComponent = dynamic(() => import("./components/Map"), { ssr: false });
const API = "http://localhost:8000";

const RISK_COLORS: Record<string, string> = {
  critical: "#ef4444",
  high: "#f97316",
  medium: "#f59e0b",
  low: "#10b981",
};

const S = {
  app: {
    display: "flex",
    flexDirection: "column" as const,
    height: "100vh",
    background: "#080c14",
    fontFamily: "'Space Grotesk', sans-serif",
    color: "#e2e8f0",
    overflow: "hidden",
  },
  header: {
    background: "#0d1425",
    borderBottom: "1px solid #1a2540",
    flexShrink: 0,
  },
  headerTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 24px",
  },
  logo: { display: "flex", alignItems: "center", gap: 12 },
  logoIcon: {
    width: 36,
    height: 36,
    background: "linear-gradient(135deg,#06b6d4,#3b82f6)",
    borderRadius: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 18,
  },
  logoTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: "#f1f5f9",
    letterSpacing: "-0.3px",
  },
  logoSub: {
    fontSize: 10,
    color: "#475569",
    fontFamily: "'JetBrains Mono',monospace",
    letterSpacing: "0.05em",
  },
  statPills: { display: "flex", gap: 12 },
  statPill: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    background: "#131c30",
    border: "1px solid #1e2d4a",
    borderRadius: 8,
    padding: "6px 14px",
  },
  statVal: {
    fontFamily: "'JetBrains Mono',monospace",
    fontSize: 18,
    fontWeight: 700,
  },
  statLbl: {
    fontSize: 9,
    color: "#475569",
    letterSpacing: "0.08em",
    marginTop: 1,
  },
  liveBadge: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 11,
    fontFamily: "'JetBrains Mono',monospace",
    color: "#10b981",
    background: "#10b98115",
    border: "1px solid #10b98130",
    borderRadius: 6,
    padding: "6px 12px",
  },
  liveDot: { width: 7, height: 7, background: "#10b981", borderRadius: "50%" },
  tabs: { display: "flex", borderTop: "1px solid #1a2540" },
  tab: (active: boolean) =>
    ({
      padding: "10px 20px",
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: "0.06em",
      color: active ? "#06b6d4" : "#475569",
      borderBottom: active ? "2px solid #06b6d4" : "2px solid transparent",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: 6,
      transition: "all 0.15s",
      background: "transparent",
      border: "none",
    }) as React.CSSProperties,
  body: { display: "flex", flex: 1, overflow: "hidden" },
  sidebar: {
    width: 268,
    flexShrink: 0,
    background: "#0a1020",
    borderRight: "1px solid #1a2540",
    display: "flex",
    flexDirection: "column" as const,
    overflow: "hidden",
  },
  sectionLabel: {
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: "0.12em",
    color: "#334155",
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "12px 14px 8px",
  },
  sectionBar: { width: 3, height: 12, background: "#06b6d4", borderRadius: 2 },
  formGrid: {
    padding: "0 12px 12px",
    display: "flex",
    flexDirection: "column" as const,
    gap: 6,
  },
  formRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 },
  inp: {
    background: "#060a12",
    border: "1px solid #1a2540",
    borderRadius: 6,
    padding: "7px 10px",
    fontSize: 11,
    color: "#94a3b8",
    fontFamily: "'JetBrains Mono',monospace",
    width: "100%",
    outline: "none",
  },
  deployBtn: {
    margin: "0 12px 12px",
    background: "linear-gradient(135deg,#06b6d420,#3b82f620)",
    border: "1px solid #06b6d440",
    color: "#06b6d4",
    borderRadius: 7,
    padding: "9px",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.08em",
    cursor: "pointer",
    width: "calc(100% - 24px)",
  },
  shipCard: (active: boolean) => ({
    background: active ? "#06b6d408" : "#060a12",
    border: `1px solid ${active ? "#06b6d460" : "#1a2540"}`,
    borderRadius: 8,
    padding: "10px 12px",
    marginBottom: 6,
    cursor: "pointer",
    transition: "all 0.15s",
  }),
  trackNo: {
    fontSize: 12,
    fontWeight: 700,
    fontFamily: "'JetBrains Mono',monospace",
    color: "#e2e8f0",
  },
  progressWrap: {
    height: 2,
    background: "#1a2540",
    borderRadius: 1,
    overflow: "hidden",
    marginTop: 6,
  },
  progressFill: (w: string, color: string) => ({
    height: "100%",
    width: w,
    background: `linear-gradient(90deg,${color},#3b82f6)`,
    borderRadius: 1,
    transition: "width 0.8s ease",
  }),
  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column" as const,
    overflow: "hidden",
  },
  statusBar: {
    background: "#0a1020",
    borderTop: "1px solid #1a2540",
    padding: "10px 24px",
    display: "flex",
    gap: 28,
    flexShrink: 0,
  },
  statusItem: { display: "flex", flexDirection: "column" as const },
  statusLbl: {
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: "0.1em",
    color: "#334155",
    marginBottom: 2,
  },
  statusVal: {
    fontSize: 13,
    fontWeight: 700,
    fontFamily: "'JetBrains Mono',monospace",
  },
  content: { flex: 1, overflowY: "auto" as const, padding: 24 },
  contentTitle: {
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: "0.08em",
    marginBottom: 20,
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  titleBar: { width: 3, height: 18, borderRadius: 2 },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4,1fr)",
    gap: 12,
    marginBottom: 24,
  },
  statCard: (border: string) => ({
    background: "#0a1020",
    border: `1px solid ${border}`,
    borderRadius: 8,
    padding: "16px",
    textAlign: "center" as const,
  }),
  statCardVal: {
    fontFamily: "'JetBrains Mono',monospace",
    fontSize: 28,
    fontWeight: 700,
  },
  statCardLbl: {
    fontSize: 9,
    color: "#475569",
    letterSpacing: "0.1em",
    marginTop: 4,
  },
  chartsGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
  chartCard: {
    background: "#0a1020",
    border: "1px solid #1a2540",
    borderRadius: 8,
    padding: 16,
  },
  chartTitle: {
    fontSize: 10,
    color: "#475569",
    letterSpacing: "0.1em",
    marginBottom: 12,
  },
  alertCard: (sev: string) => ({
    background:
      sev === "critical"
        ? "#ef444408"
        : sev === "high"
          ? "#f9731608"
          : "#f59e0b08",
    border: `1px solid ${sev === "critical" ? "#ef444425" : sev === "high" ? "#f9731625" : "#f59e0b25"}`,
    borderRadius: 8,
    padding: "14px 16px",
    marginBottom: 10,
  }),
  table: { width: "100%", borderCollapse: "collapse" as const },
  th: {
    textAlign: "left" as const,
    padding: "10px 14px",
    fontSize: 9,
    color: "#334155",
    letterSpacing: "0.1em",
    fontWeight: 700,
    borderBottom: "1px solid #1a2540",
    background: "#060a12",
  },
  td: { padding: "12px 14px", borderBottom: "1px solid #1a2540", fontSize: 12 },
};

export default function Home() {
  const [shipments, setShipments] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [location, setLocation] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<string>("map");
  const [loading, setLoading] = useState(false);
  const [time, setTime] = useState(new Date());
  const [news, setNews] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any>(null);
  const [anomalies, setAnomalies] = useState<any>(null);
  const [weather, setWeather] = useState<any>(null);
  const [useDropdown, setUseDropdown] = useState(true);
  const [form, setForm] = useState({
    tracking_number: "",
    origin_city: "",
    origin_lat: "",
    origin_lon: "",
    destination_city: "",
    destination_lat: "",
    destination_lon: "",
    scheduled_departure: "",
    scheduled_arrival: "",
    carrier_name: "",
    vehicle_type: "truck",
    cargo_weight_kg: "",
    cargo_value_usd: "",
  });

  useEffect(() => {
    fetchAll();
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!selected) return;
    const i = setInterval(async () => {
      await axios.post(
        `${API}/api/tracking/simulate/${selected.tracking_number}`,
      );
      fetchLocation(selected.tracking_number);
      fetchShipments();
      fetchAlerts();
    }, 3000);
    return () => clearInterval(i);
  }, [selected]);

  const fetchAll = () => {
    fetchShipments();
    fetchAlerts();
    fetchSuppliers();
    fetchNews();
  };
  const fetchShipments = async () => {
    const r = await axios.get(`${API}/api/shipments/`);
    setShipments(r.data.shipments);
  };
  const fetchAlerts = async () => {
    const r = await axios.get(`${API}/api/tracking/alerts`);
    setAlerts(r.data);
  };
  const fetchSuppliers = async () => {
    const r = await axios.get(`${API}/api/suppliers/`);
    setSuppliers(r.data);
  };
  const fetchLocation = async (tn: string) => {
    const r = await axios.get(`${API}/api/tracking/location/${tn}`);
    setLocation(r.data);
  };
  const fetchNews = async () => {
    try {
      // Try real NewsAPI from frontend (works in browser)
      const r = await axios.get(
        `https://newsapi.org/v2/everything?q=fuel+prices+India+OR+supply+chain+disruption+OR+port+strike+India&language=en&sortBy=publishedAt&pageSize=8&apiKey=265835a672f444baaf4492e756470b21`,
      );
      if (r.data.articles?.length > 0) {
        setNews(
          r.data.articles
            .filter((a: any) => a.title !== "[Removed]")
            .map((a: any) => ({
              title: a.title,
              source: a.source.name,
              url: a.url,
              published: a.publishedAt,
              description: a.description?.slice(0, 150) || "",
              impact: classifyImpact(a.title),
              category: classifyCategory(a.title),
            })),
        );
      } else {
        fetchNewsFallback();
      }
    } catch {
      fetchNewsFallback();
    }
  };

  const fetchNewsFallback = async () => {
    const r = await axios.get(`${API}/api/intelligence/news`);
    setNews(r.data);
  };

  const classifyImpact = (title: string) => {
    const t = title.toLowerCase();
    if (
      [
        "strike",
        "blockade",
        "flood",
        "disaster",
        "accident",
        "robbery",
        "attack",
      ].some((w) => t.includes(w))
    )
      return "critical";
    if (
      ["delay", "disruption", "shortage", "increase", "rise", "surge"].some(
        (w) => t.includes(w),
      )
    )
      return "high";
    if (["warning", "alert", "concern", "risk"].some((w) => t.includes(w)))
      return "medium";
    return "low";
  };

  const classifyCategory = (title: string) => {
    const t = title.toLowerCase();
    if (["fuel", "diesel", "petrol", "oil", "crude"].some((w) => t.includes(w)))
      return "FUEL";
    if (
      ["port", "ship", "vessel", "container", "cargo"].some((w) =>
        t.includes(w),
      )
    )
      return "PORT";
    if (
      ["weather", "rain", "flood", "storm", "cyclone"].some((w) =>
        t.includes(w),
      )
    )
      return "WEATHER";
    if (
      ["traffic", "accident", "highway", "road", "expressway"].some((w) =>
        t.includes(w),
      )
    )
      return "TRAFFIC";
    if (["robbery", "theft", "security", "crime"].some((w) => t.includes(w)))
      return "SECURITY";
    return "MARKET";
  };
  const fetchAnomalies = async (tn: string) => {
    try {
      const r = await axios.get(`${API}/api/intelligence/anomalies/${tn}`);
      setAnomalies(r.data);
    } catch {}
  };
  const fetchRoutes = async (s: any) => {
    try {
      const r = await axios.post(`${API}/api/intelligence/routes`, {
        origin_lat: s.origin_lat || 19.076,
        origin_lon: s.origin_lon || 72.8777,
        dest_lat: s.destination_lat || 28.6139,
        dest_lon: s.destination_lon || 77.209,
        vehicle_type: "truck",
      });
      setRoutes(r.data);
    } catch {}
  };
  const fetchWeather = async (
    originLat: number,
    originLon: number,
    destLat: number,
    destLon: number,
  ) => {
    try {
      const [originRes, destRes] = await Promise.all([
        axios.get(
          `https://api.open-meteo.com/v1/forecast?latitude=${originLat}&longitude=${originLon}&current=temperature_2m,precipitation,windspeed_10m,weathercode&timezone=Asia/Kolkata`,
        ),
        axios.get(
          `https://api.open-meteo.com/v1/forecast?latitude=${destLat}&longitude=${destLon}&current=temperature_2m,precipitation,windspeed_10m,weathercode&timezone=Asia/Kolkata`,
        ),
      ]);
      const parseWeather = (data: any) => {
        const curr = data.current;
        const code = curr.weathercode;
        let condition = "Clear",
          risk = 0.05;
        if (code >= 80) {
          condition = "Heavy Rain";
          risk = 0.4;
        } else if (code >= 60) {
          condition = "Rain";
          risk = 0.25;
        } else if (code >= 40) {
          condition = "Foggy";
          risk = 0.2;
        } else if (code >= 20) {
          condition = "Drizzle";
          risk = 0.1;
        }
        if (curr.windspeed_10m > 50) {
          condition += " + Strong Winds";
          risk += 0.15;
        }
        return {
          condition,
          temperature_c: curr.temperature_2m,
          precipitation_mm: curr.precipitation,
          windspeed_kmh: curr.windspeed_10m,
          risk_score: Math.min(risk, 0.95),
        };
      };
      setWeather({
        origin_weather: parseWeather(originRes.data),
        destination_weather: parseWeather(destRes.data),
        overall_risk: Math.max(
          parseWeather(originRes.data).risk_score,
          parseWeather(destRes.data).risk_score,
        ),
        source: "Open-Meteo (Real-time)",
      });
    } catch (e) {
      console.log("Weather failed", e);
    }
  };
  const createShipment = async () => {
    if (!form.tracking_number) return;
    setLoading(true);
    try {
      await axios.post(`${API}/api/shipments/`, {
        ...form,
        origin_lat: parseFloat(form.origin_lat),
        origin_lon: parseFloat(form.origin_lon),
        destination_lat: parseFloat(form.destination_lat),
        destination_lon: parseFloat(form.destination_lon),
        cargo_weight_kg: parseFloat(form.cargo_weight_kg),
        cargo_value_usd: parseFloat(form.cargo_value_usd),
      });
      fetchShipments();
      setForm({
        tracking_number: "",
        origin_city: "",
        origin_lat: "",
        origin_lon: "",
        destination_city: "",
        destination_lat: "",
        destination_lon: "",
        scheduled_departure: "",
        scheduled_arrival: "",
        carrier_name: "",
        vehicle_type: "truck",
        cargo_weight_kg: "",
        cargo_value_usd: "",
      });
    } catch {
      alert("Error");
    }
    setLoading(false);
  };

  const headerStats = [
    {
      label: "ACTIVE",
      value: shipments.filter((s) => s.status === "in_transit").length,
      color: "#06b6d4",
    },
    {
      label: "DELIVERED",
      value: shipments.filter((s) => s.status === "delivered").length,
      color: "#10b981",
    },
    {
      label: "HIGH RISK",
      value: shipments.filter((s) =>
        ["critical", "high"].includes(s.risk_level),
      ).length,
      color: "#ef4444",
    },
    { label: "ALERTS", value: alerts.length, color: "#f59e0b" },
    { label: "ML ACCURACY", value: "84%", color: "#a78bfa" },
  ];

  const tabs = [
    { key: "map", icon: "◎", label: "TRACKING" },
    { key: "analytics", icon: "▦", label: "ANALYTICS" },
    {
      key: "alerts",
      icon: "⚠",
      label: `ALERTS${alerts.length > 0 ? ` (${alerts.length})` : ""}`,
    },
    { key: "suppliers", icon: "⬡", label: "SUPPLIERS" },
    { key: "compliance", icon: "✓", label: "COMPLIANCE" },
    { key: "intelligence", icon: "⚡", label: "INTELLIGENCE" },
  ];

  return (
    <div style={S.app}>
      {/* HEADER */}
      <header style={S.header}>
        <div style={S.headerTop}>
          <div style={S.logo}>
            <div style={S.logoIcon}>🛡</div>
            <div>
              <div style={S.logoTitle}>SupplyGuard AI</div>
              <div style={S.logoSub}>SUPPLY CHAIN RISK INTELLIGENCE</div>
            </div>
          </div>
          <div style={S.statPills}>
            {headerStats.map((s, i) => (
              <div key={i} style={S.statPill}>
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: s.color,
                    flexShrink: 0,
                  }}
                />
                <div>
                  <div style={{ ...S.statVal, color: s.color }}>{s.value}</div>
                  <div style={S.statLbl}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={S.liveBadge} suppressHydrationWarning={true}>
              <div
                style={{
                  ...S.liveDot,
                  animation: "blink 1.5s ease-in-out infinite",
                }}
              />
              LIVE • {time.toLocaleTimeString()}
            </div>
            <a
              href="/driver"
              target="_blank"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 11,
                fontFamily: "'JetBrains Mono',monospace",
                color: "#f59e0b",
                background: "#f59e0b15",
                border: "1px solid #f59e0b30",
                borderRadius: 6,
                padding: "6px 12px",
                textDecoration: "none",
                fontWeight: 700,
                letterSpacing: "0.06em",
              }}
            >
              🚛 DRIVER PORTAL
            </a>
          </div>
        </div>
        <div style={S.tabs}>
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              style={{
                ...S.tab(activeTab === t.key),
                fontFamily: "'Space Grotesk',sans-serif",
              }}
            >
              <span>{t.icon}</span> {t.label}
            </button>
          ))}
        </div>
      </header>

      {/* BODY */}
      <div style={S.body}>
        {/* SIDEBAR */}
        <aside style={S.sidebar}>
          <div style={{ borderBottom: "1px solid #1a2540" }}>
            <div style={S.sectionLabel}>
              <div style={S.sectionBar} />
              NEW SHIPMENT
            </div>
            <div style={S.formGrid}>
              {/* Tracking Number */}
              <input
                style={{ ...S.inp }}
                placeholder="TRACKING NO."
                value={form.tracking_number}
                onChange={(e) =>
                  setForm({ ...form, tracking_number: e.target.value })
                }
              />

              {/* Toggle */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    fontSize: 9,
                    color: "#475569",
                    letterSpacing: "0.08em",
                  }}
                >
                  CITY SELECTION
                </span>
                <button
                  onClick={() => setUseDropdown(!useDropdown)}
                  style={{
                    fontSize: 9,
                    color: "#06b6d4",
                    background: "#06b6d410",
                    border: "1px solid #06b6d430",
                    borderRadius: 4,
                    padding: "2px 8px",
                    cursor: "pointer",
                  }}
                >
                  {useDropdown ? "MANUAL" : "DROPDOWN"}
                </button>
              </div>

              {/* City dropdowns or manual input */}
              {useDropdown ? (
                <div style={S.formRow}>
                  {(["origin", "destination"] as const).map((type) => (
                    <select
                      key={type}
                      style={{ ...S.inp, cursor: "pointer" }}
                      onChange={(e) => {
                        const cities: Record<
                          string,
                          { lat: number; lon: number }
                        > = {
                          Mumbai: { lat: 19.076, lon: 72.8777 },
                          Delhi: { lat: 28.6139, lon: 77.209 },
                          Chennai: { lat: 13.0827, lon: 80.2707 },
                          Bangalore: { lat: 12.9716, lon: 77.5946 },
                          Hyderabad: { lat: 17.385, lon: 78.4867 },
                          Pune: { lat: 18.5204, lon: 73.8567 },
                          Kolkata: { lat: 22.5726, lon: 88.3639 },
                          Ahmedabad: { lat: 23.0225, lon: 72.5714 },
                          Jaipur: { lat: 26.9124, lon: 75.7873 },
                          Nagpur: { lat: 21.1458, lon: 79.0882 },
                          Surat: { lat: 21.1702, lon: 72.8311 },
                          Lucknow: { lat: 26.8467, lon: 80.9462 },
                          Chandigarh: { lat: 30.7333, lon: 76.7794 },
                          Bhopal: { lat: 23.2599, lon: 77.4126 },
                          Indore: { lat: 22.7196, lon: 75.8577 },
                          Patna: { lat: 25.5941, lon: 85.1376 },
                          Coimbatore: { lat: 11.0168, lon: 76.9558 },
                          Kochi: { lat: 9.9312, lon: 76.2673 },
                          Visakhapatnam: { lat: 17.6868, lon: 83.2185 },
                          Guwahati: { lat: 26.1445, lon: 91.7362 },
                        };
                        const city = e.target.value;
                        if (cities[city]) {
                          if (type === "origin")
                            setForm({
                              ...form,
                              origin_city: city,
                              origin_lat: String(cities[city].lat),
                              origin_lon: String(cities[city].lon),
                            });
                          else
                            setForm({
                              ...form,
                              destination_city: city,
                              destination_lat: String(cities[city].lat),
                              destination_lon: String(cities[city].lon),
                            });
                        }
                      }}
                    >
                      <option value="">
                        {type === "origin" ? "ORIGIN" : "DESTINATION"}
                      </option>
                      {[
                        "Mumbai",
                        "Delhi",
                        "Chennai",
                        "Bangalore",
                        "Hyderabad",
                        "Pune",
                        "Kolkata",
                        "Ahmedabad",
                        "Jaipur",
                        "Nagpur",
                        "Surat",
                        "Lucknow",
                        "Chandigarh",
                        "Bhopal",
                        "Indore",
                        "Patna",
                        "Coimbatore",
                        "Kochi",
                        "Visakhapatnam",
                        "Guwahati",
                      ].map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  ))}
                </div>
              ) : (
                <>
                  <div style={S.formRow}>
                    <input
                      style={S.inp}
                      placeholder="ORIGIN CITY"
                      value={form.origin_city}
                      onChange={(e) =>
                        setForm({ ...form, origin_city: e.target.value })
                      }
                    />
                    <input
                      style={S.inp}
                      placeholder="DEST CITY"
                      value={form.destination_city}
                      onChange={(e) =>
                        setForm({ ...form, destination_city: e.target.value })
                      }
                    />
                  </div>
                  <div style={S.formRow}>
                    <input
                      style={S.inp}
                      placeholder="ORIGIN LAT"
                      value={form.origin_lat}
                      onChange={(e) =>
                        setForm({ ...form, origin_lat: e.target.value })
                      }
                    />
                    <input
                      style={S.inp}
                      placeholder="ORIGIN LON"
                      value={form.origin_lon}
                      onChange={(e) =>
                        setForm({ ...form, origin_lon: e.target.value })
                      }
                    />
                  </div>
                  <div style={S.formRow}>
                    <input
                      style={S.inp}
                      placeholder="DEST LAT"
                      value={form.destination_lat}
                      onChange={(e) =>
                        setForm({ ...form, destination_lat: e.target.value })
                      }
                    />
                    <input
                      style={S.inp}
                      placeholder="DEST LON"
                      value={form.destination_lon}
                      onChange={(e) =>
                        setForm({ ...form, destination_lon: e.target.value })
                      }
                    />
                  </div>
                </>
              )}

              {/* Departure & Arrival */}
              <div style={S.formRow}>
                <input
                  style={S.inp}
                  placeholder="DEPARTURE"
                  value={form.scheduled_departure}
                  onChange={(e) =>
                    setForm({ ...form, scheduled_departure: e.target.value })
                  }
                />
                <input
                  style={S.inp}
                  placeholder="ARRIVAL"
                  value={form.scheduled_arrival}
                  onChange={(e) =>
                    setForm({ ...form, scheduled_arrival: e.target.value })
                  }
                />
              </div>

              {/* Carrier & Weight */}
              <div style={S.formRow}>
                <input
                  style={S.inp}
                  placeholder="CARRIER"
                  value={form.carrier_name}
                  onChange={(e) =>
                    setForm({ ...form, carrier_name: e.target.value })
                  }
                />
                <input
                  style={S.inp}
                  placeholder="WEIGHT KG"
                  value={form.cargo_weight_kg}
                  onChange={(e) =>
                    setForm({ ...form, cargo_weight_kg: e.target.value })
                  }
                />
              </div>
            </div>
            <button
              onClick={createShipment}
              disabled={loading}
              style={S.deployBtn}
            >
              {loading ? "PROCESSING..." : "+ DEPLOY SHIPMENT"}
            </button>
          </div>
          <div style={S.sectionLabel}>
            <div style={{ ...S.sectionBar, background: "#475569" }} />
            SHIPMENT REGISTRY
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "0 10px 10px" }}>
            {shipments.map((s, i) => (
              <div
                key={s.id}
                onClick={() => {
                  setSelected(s);
                  fetchLocation(s.tracking_number);
                  fetchAnomalies(s.tracking_number);
                  fetchRoutes(s);
                  fetchWeather(
                    s.origin_lat,
                    s.origin_lon,
                    s.destination_lat,
                    s.destination_lon,
                  );
                }}
                style={S.shipCard(selected?.id === s.id)}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 4,
                  }}
                >
                  <span style={S.trackNo}>{s.tracking_number}</span>
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      padding: "2px 7px",
                      borderRadius: 4,
                      background: `${RISK_COLORS[s.risk_level]}15`,
                      border: `1px solid ${RISK_COLORS[s.risk_level]}30`,
                      color: RISK_COLORS[s.risk_level],
                    }}
                  >
                    {s.risk_level.toUpperCase()}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "#475569",
                    marginBottom: 4,
                    fontFamily: "'JetBrains Mono',monospace",
                  }}
                >
                  {s.origin_city} → {s.destination_city}
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 6,
                  }}
                >
                  <span
                    style={{
                      fontSize: 10,
                      color: "#334155",
                      fontFamily: "'JetBrains Mono',monospace",
                    }}
                  >
                    {s.status.toUpperCase()}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#f59e0b",
                      fontFamily: "'JetBrains Mono',monospace",
                    }}
                  >
                    ⚡ {Math.round(s.delay_probability * 100)}%
                  </span>
                </div>
                <div style={S.progressWrap}>
                  <div
                    style={S.progressFill(
                      s.status === "delivered"
                        ? "100%"
                        : s.status === "in_transit"
                          ? "50%"
                          : "5%",
                      RISK_COLORS[s.risk_level],
                    )}
                  />
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main style={S.main}>
          {/* MAP */}
          {activeTab === "map" && (
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
            >
              <div style={{ flex: 1 }}>
                <MapComponent location={location} shipments={shipments} />
              </div>
              <div style={S.statusBar}>
                {location?.current_lat ? (
                  [
                    {
                      label: "ROUTE",
                      value: `${location.origin_city} → ${location.destination_city}`,
                      color: "#e2e8f0",
                    },
                    {
                      label: "COORDINATES",
                      value: `${Number(location.current_lat).toFixed(4)}, ${Number(location.current_lon).toFixed(4)}`,
                      color: "#94a3b8",
                    },
                    {
                      label: "SPEED",
                      value: `${location.speed_kmh} KM/H`,
                      color: "#10b981",
                    },
                    {
                      label: "RISK LEVEL",
                      value: location.risk_level?.toUpperCase(),
                      color: RISK_COLORS[location.risk_level] || "#10b981",
                    },
                    {
                      label: "DELAY PROB.",
                      value: `${Math.round(location.delay_probability * 100)}%`,
                      color: "#f59e0b",
                    },
                    {
                      label: "ETA DELAY",
                      value: `+${location.predicted_delay_hours}H`,
                      color: "#f97316",
                    },
                  ].map((item, i) => (
                    <div key={i} style={S.statusItem}>
                      <div style={S.statusLbl}>{item.label}</div>
                      <div
                        style={{
                          ...S.statusVal,
                          color: item.color,
                          fontSize:
                            item.label === "ROUTE" ||
                            item.label === "COORDINATES"
                              ? 11
                              : 13,
                        }}
                      >
                        {item.value}
                      </div>
                    </div>
                  ))
                ) : (
                  <div
                    style={{
                      fontFamily: "'JetBrains Mono',monospace",
                      fontSize: 11,
                      color: "#334155",
                      letterSpacing: "0.1em",
                      margin: "auto",
                    }}
                  >
                    SELECT A SHIPMENT TO BEGIN TRACKING
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ANALYTICS */}
          {activeTab === "analytics" && (
            <div style={S.content}>
              <div style={S.contentTitle}>
                <div style={{ ...S.titleBar, background: "#06b6d4" }} />
                INTELLIGENCE DASHBOARD
              </div>
              <div style={S.statsGrid}>
                {[
                  {
                    label: "AVG DELAY RISK",
                    value: `${shipments.length ? Math.round((shipments.reduce((a, s) => a + s.delay_probability, 0) / shipments.length) * 100) : 0}%`,
                    color: "#f59e0b",
                    border: "#f59e0b20",
                  },
                  {
                    label: "CRITICAL SHIPMENTS",
                    value: shipments.filter((s) => s.risk_level === "critical")
                      .length,
                    color: "#ef4444",
                    border: "#ef444420",
                  },
                  {
                    label: "AVG DELAY HOURS",
                    value: `${shipments.length ? (shipments.reduce((a, s) => a + (s.predicted_delay_hours || 0), 0) / shipments.length).toFixed(1) : 0}H`,
                    color: "#f97316",
                    border: "#f9731620",
                  },
                  {
                    label: "ON TIME",
                    value: shipments.filter((s) => s.risk_level === "low")
                      .length,
                    color: "#10b981",
                    border: "#10b98120",
                  },
                ].map((s, i) => (
                  <div key={i} style={S.statCard(s.border)}>
                    <div style={{ ...S.statCardVal, color: s.color }}>
                      {s.value}
                    </div>
                    <div style={S.statCardLbl}>{s.label}</div>
                  </div>
                ))}
              </div>
              <div style={S.chartsGrid}>
                <div style={S.chartCard}>
                  <div style={S.chartTitle}>RISK DISTRIBUTION</div>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={["low", "medium", "high", "critical"]
                          .map((r) => ({
                            name: r,
                            value: shipments.filter((s) => s.risk_level === r)
                              .length,
                          }))
                          .filter((d) => d.value > 0)}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {["low", "medium", "high", "critical"].map((r, i) => (
                          <Cell key={i} fill={RISK_COLORS[r]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: "#0a1020",
                          border: "1px solid #1a2540",
                          fontFamily: "monospace",
                          fontSize: 11,
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div style={S.chartCard}>
                  <div style={S.chartTitle}>DELAY PROBABILITY PER SHIPMENT</div>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart
                      data={shipments.map((s) => ({
                        name: s.tracking_number,
                        delay: Math.round(s.delay_probability * 100),
                      }))}
                    >
                      <XAxis
                        dataKey="name"
                        stroke="#2a3a55"
                        tick={{
                          fill: "#4a5568",
                          fontSize: 10,
                          fontFamily: "monospace",
                        }}
                      />
                      <YAxis
                        stroke="#2a3a55"
                        tick={{
                          fill: "#4a5568",
                          fontSize: 10,
                          fontFamily: "monospace",
                        }}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "#0a1020",
                          border: "1px solid #1a2540",
                          fontFamily: "monospace",
                          fontSize: 11,
                        }}
                      />
                      <Bar
                        dataKey="delay"
                        fill="#06b6d4"
                        radius={[3, 3, 0, 0]}
                        name="DELAY %"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* ALERTS */}
          {activeTab === "alerts" && (
            <div style={S.content}>
              <div style={S.contentTitle}>
                <div style={{ ...S.titleBar, background: "#ef4444" }} />
                ACTIVE ALERTS — {alerts.length} INCIDENTS
              </div>
              {alerts.length === 0 ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    height: 300,
                    gap: 16,
                  }}
                >
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      border: "2px solid #10b98130",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 28,
                    }}
                  >
                    ✓
                  </div>
                  <div
                    style={{
                      fontFamily: "'JetBrains Mono',monospace",
                      fontSize: 11,
                      color: "#334155",
                      letterSpacing: "0.1em",
                    }}
                  >
                    ALL SYSTEMS NOMINAL
                  </div>
                </div>
              ) : (
                alerts.map((a, i) => (
                  <div key={i} style={S.alertCard(a.severity)}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 8,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <div
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            background: RISK_COLORS[a.severity],
                          }}
                        />
                        <span
                          style={{
                            fontFamily: "'JetBrains Mono',monospace",
                            fontSize: 13,
                            fontWeight: 700,
                            color: "#e2e8f0",
                          }}
                        >
                          {a.tracking_number}
                        </span>
                      </div>
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: 4,
                          background: `${RISK_COLORS[a.severity]}15`,
                          border: `1px solid ${RISK_COLORS[a.severity]}30`,
                          color: RISK_COLORS[a.severity],
                          letterSpacing: "0.08em",
                        }}
                      >
                        {a.severity.toUpperCase()}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "#94a3b8",
                        marginBottom: 6,
                        lineHeight: 1.5,
                      }}
                    >
                      {a.message}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <span
                        style={{
                          fontSize: 11,
                          color: "#475569",
                          fontFamily: "'JetBrains Mono',monospace",
                        }}
                      >
                        {a.origin_city} → {a.destination_city}
                      </span>
                      <span
                        style={{
                          fontSize: 10,
                          color: "#334155",
                          fontFamily: "'JetBrains Mono',monospace",
                        }}
                      >
                        {new Date(a.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* SUPPLIERS */}
          {activeTab === "suppliers" && (
            <div style={S.content}>
              <div style={S.contentTitle}>
                <div style={{ ...S.titleBar, background: "#a78bfa" }} />
                SUPPLIER INTELLIGENCE
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3,1fr)",
                  gap: 12,
                  marginBottom: 20,
                }}
              >
                {[
                  {
                    label: "TOTAL SUPPLIERS",
                    value: suppliers.length,
                    color: "#a78bfa",
                    border: "#a78bfa20",
                  },
                  {
                    label: "HIGH RISK",
                    value: suppliers.filter((s) =>
                      ["high", "critical"].includes(s.risk_level),
                    ).length,
                    color: "#ef4444",
                    border: "#ef444420",
                  },
                  {
                    label: "AVG COMPLIANCE",
                    value: `${suppliers.length ? Math.round(suppliers.reduce((a, s) => a + s.compliance_score, 0) / suppliers.length) : 0}%`,
                    color: "#10b981",
                    border: "#10b98120",
                  },
                ].map((s, i) => (
                  <div
                    key={i}
                    style={{ ...S.statCard(s.border), textAlign: "center" }}
                  >
                    <div style={{ ...S.statCardVal, color: s.color }}>
                      {s.value}
                    </div>
                    <div style={S.statCardLbl}>{s.label}</div>
                  </div>
                ))}
              </div>
              <div
                style={{
                  background: "#0a1020",
                  border: "1px solid #1a2540",
                  borderRadius: 8,
                  overflow: "hidden",
                }}
              >
                <table style={S.table}>
                  <thead>
                    <tr>
                      {[
                        "SUPPLIER",
                        "LOCATION",
                        "COMPLIANCE",
                        "RISK",
                        "SHIPMENTS",
                        "DELAYS",
                      ].map((h) => (
                        <th key={h} style={S.th}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {suppliers.map((s, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid #1a2540" }}>
                        <td style={S.td}>
                          <div
                            style={{
                              fontWeight: 700,
                              fontSize: 12,
                              color: "#e2e8f0",
                            }}
                          >
                            {s.name}
                          </div>
                          <div
                            style={{
                              fontSize: 10,
                              color: "#475569",
                              fontFamily: "'JetBrains Mono',monospace",
                            }}
                          >
                            {s.email}
                          </div>
                        </td>
                        <td
                          style={{
                            ...S.td,
                            color: "#475569",
                            fontFamily: "'JetBrains Mono',monospace",
                            fontSize: 11,
                          }}
                        >
                          {s.city}, {s.country}
                        </td>
                        <td style={S.td}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                            }}
                          >
                            <div
                              style={{
                                flex: 1,
                                height: 4,
                                background: "#1a2540",
                                borderRadius: 2,
                                overflow: "hidden",
                              }}
                            >
                              <div
                                style={{
                                  height: "100%",
                                  width: `${s.compliance_score}%`,
                                  background:
                                    s.compliance_score >= 90
                                      ? "#10b981"
                                      : s.compliance_score >= 75
                                        ? "#f59e0b"
                                        : "#ef4444",
                                  borderRadius: 2,
                                }}
                              />
                            </div>
                            <span
                              style={{
                                fontFamily: "'JetBrains Mono',monospace",
                                fontSize: 12,
                                fontWeight: 700,
                                color:
                                  s.compliance_score >= 90
                                    ? "#10b981"
                                    : s.compliance_score >= 75
                                      ? "#f59e0b"
                                      : "#ef4444",
                              }}
                            >
                              {s.compliance_score}%
                            </span>
                          </div>
                        </td>
                        <td style={S.td}>
                          <span
                            style={{
                              fontSize: 9,
                              fontWeight: 700,
                              padding: "2px 7px",
                              borderRadius: 4,
                              background: `${RISK_COLORS[s.risk_level]}15`,
                              border: `1px solid ${RISK_COLORS[s.risk_level]}30`,
                              color: RISK_COLORS[s.risk_level],
                              letterSpacing: "0.08em",
                            }}
                          >
                            {s.risk_level.toUpperCase()}
                          </span>
                        </td>
                        <td
                          style={{
                            ...S.td,
                            color: "#475569",
                            fontFamily: "'JetBrains Mono',monospace",
                          }}
                        >
                          {s.total_shipments}
                        </td>
                        <td
                          style={{
                            ...S.td,
                            color: "#ef4444",
                            fontFamily: "'JetBrains Mono',monospace",
                          }}
                        >
                          {s.delayed_shipments}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* COMPLIANCE */}
          {activeTab === "compliance" && (
            <div style={S.content}>
              <div style={S.contentTitle}>
                <div style={{ ...S.titleBar, background: "#10b981" }} />
                COMPLIANCE MONITOR
              </div>
              <div style={S.chartsGrid}>
                <div style={S.chartCard}>
                  <div style={S.chartTitle}>SUPPLIER COMPLIANCE SCORES</div>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart
                      data={suppliers.map((s) => ({
                        name: s.name.split(" ")[0],
                        score: s.compliance_score,
                      }))}
                    >
                      <XAxis
                        dataKey="name"
                        stroke="#2a3a55"
                        tick={{ fill: "#4a5568", fontSize: 10 }}
                      />
                      <YAxis
                        stroke="#2a3a55"
                        tick={{ fill: "#4a5568", fontSize: 10 }}
                        domain={[0, 100]}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "#0a1020",
                          border: "1px solid #1a2540",
                          fontFamily: "monospace",
                          fontSize: 11,
                        }}
                      />
                      <Bar
                        dataKey="score"
                        fill="#10b981"
                        radius={[3, 3, 0, 0]}
                        name="COMPLIANCE %"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div style={S.chartCard}>
                  <div style={S.chartTitle}>SHIPMENT COMPLIANCE STATUS</div>
                  {shipments.map((s, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "10px 0",
                        borderBottom: "1px solid #1a2540",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontFamily: "'JetBrains Mono',monospace",
                            fontSize: 12,
                            fontWeight: 700,
                            color: "#e2e8f0",
                          }}
                        >
                          {s.tracking_number}
                        </div>
                        <div style={{ fontSize: 10, color: "#475569" }}>
                          {s.origin_city} → {s.destination_city}
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          padding: "3px 8px",
                          borderRadius: 4,
                          letterSpacing: "0.08em",
                          background:
                            s.risk_level === "low" ? "#10b98115" : "#ef444415",
                          border: `1px solid ${s.risk_level === "low" ? "#10b98130" : "#ef444430"}`,
                          color: s.risk_level === "low" ? "#10b981" : "#ef4444",
                        }}
                      >
                        {s.risk_level === "low"
                          ? "COMPLIANT"
                          : s.risk_level === "medium"
                            ? "REVIEW"
                            : "NON-COMPLIANT"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ ...S.chartCard, marginTop: 16 }}>
                <div style={S.chartTitle}>
                  COMPLIANCE ISSUES REQUIRING ACTION
                </div>
                {suppliers.filter((s) => s.compliance_score < 80).length ===
                0 ? (
                  <div
                    style={{
                      textAlign: "center",
                      padding: 24,
                      fontFamily: "'JetBrains Mono',monospace",
                      fontSize: 11,
                      color: "#334155",
                    }}
                  >
                    NO COMPLIANCE ISSUES DETECTED
                  </div>
                ) : (
                  suppliers
                    .filter((s) => s.compliance_score < 80)
                    .map((s, i) => (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "12px 0",
                          borderBottom: "1px solid #1a2540",
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontWeight: 700,
                              fontSize: 12,
                              color: "#ef4444",
                            }}
                          >
                            {s.name}
                          </div>
                          <div
                            style={{
                              fontSize: 11,
                              color: "#475569",
                              marginTop: 2,
                            }}
                          >
                            Score below threshold — {s.compliance_score}% / 80%
                            required
                          </div>
                        </div>
                        <span
                          style={{
                            fontSize: 10,
                            background: "#ef444415",
                            border: "1px solid #ef444430",
                            color: "#ef4444",
                            padding: "4px 12px",
                            borderRadius: 4,
                            fontFamily: "'JetBrains Mono',monospace",
                          }}
                        >
                          ACTION REQUIRED
                        </span>
                      </div>
                    ))
                )}
              </div>
            </div>
          )}

          {/* INTELLIGENCE */}
          {activeTab === "intelligence" && (
            <div style={S.content}>
              <div style={S.contentTitle}>
                <div style={{ ...S.titleBar, background: "#f59e0b" }} />
                INTELLIGENCE CENTER
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 16,
                  marginBottom: 16,
                }}
              >
                {/* Anomaly Detection */}
                <div style={S.chartCard}>
                  <div style={S.chartTitle}>
                    🔍 ANOMALY DETECTION —{" "}
                    {selected?.tracking_number || "SELECT SHIPMENT"}
                  </div>
                  {anomalies ? (
                    <div>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr 1fr",
                          gap: 8,
                          marginBottom: 12,
                        }}
                      >
                        {[
                          {
                            label: "THEFT RISK",
                            value: anomalies.theft_risk,
                            color:
                              anomalies.theft_risk === "HIGH"
                                ? "#ef4444"
                                : "#10b981",
                          },
                          {
                            label: "ACCIDENT PROB.",
                            value: anomalies.accident_probability,
                            color: "#f97316",
                          },
                          {
                            label: "DRIVER SCORE",
                            value: `${anomalies.driver_behavior_score}/100`,
                            color:
                              anomalies.driver_behavior_score > 80
                                ? "#10b981"
                                : "#f59e0b",
                          },
                        ].map((item, i) => (
                          <div
                            key={i}
                            style={{
                              background: "#060a12",
                              border: "1px solid #1a2540",
                              borderRadius: 6,
                              padding: "10px",
                              textAlign: "center",
                            }}
                          >
                            <div
                              style={{
                                fontFamily: "'JetBrains Mono',monospace",
                                fontSize: 14,
                                fontWeight: 700,
                                color: item.color,
                              }}
                            >
                              {item.value}
                            </div>
                            <div
                              style={{
                                fontSize: 9,
                                color: "#334155",
                                letterSpacing: "0.08em",
                                marginTop: 3,
                              }}
                            >
                              {item.label}
                            </div>
                          </div>
                        ))}
                      </div>
                      {anomalies.anomalies?.length === 0 ? (
                        <div
                          style={{
                            textAlign: "center",
                            padding: 16,
                            fontSize: 11,
                            color: "#334155",
                            fontFamily: "'JetBrains Mono',monospace",
                          }}
                        >
                          NO ANOMALIES DETECTED
                        </div>
                      ) : (
                        anomalies.anomalies?.map((a: any, i: number) => (
                          <div
                            key={i}
                            style={{
                              background: "#ef444410",
                              border: "1px solid #ef444425",
                              borderRadius: 6,
                              padding: "10px",
                              marginBottom: 6,
                            }}
                          >
                            <div
                              style={{
                                fontSize: 11,
                                fontWeight: 700,
                                color: "#ef4444",
                                marginBottom: 3,
                              }}
                            >
                              {a.type}
                            </div>
                            <div style={{ fontSize: 11, color: "#94a3b8" }}>
                              {a.message}
                            </div>
                            <div
                              style={{
                                fontSize: 10,
                                color: "#f59e0b",
                                marginTop: 4,
                              }}
                            >
                              → {a.recommendation}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  ) : (
                    <div
                      style={{
                        textAlign: "center",
                        padding: 24,
                        fontSize: 11,
                        color: "#334155",
                        fontFamily: "'JetBrains Mono',monospace",
                      }}
                    >
                      SELECT A SHIPMENT TO ANALYSE
                    </div>
                  )}
                </div>

                {/* Route Optimization */}
                <div style={S.chartCard}>
                  {weather && selected && (
                    <div
                      style={{
                        ...S.chartCard,
                        gridColumn: "span 2",
                        marginBottom: 16,
                      }}
                    >
                      <div style={S.chartTitle}>
                        🌤️ REAL-TIME WEATHER — {weather.source}
                      </div>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: 12,
                        }}
                      >
                        {[
                          {
                            label: `ORIGIN — ${selected.origin_city}`,
                            w: weather.origin_weather,
                          },
                          {
                            label: `DESTINATION — ${selected.destination_city}`,
                            w: weather.destination_weather,
                          },
                        ].map((item, i) => (
                          <div
                            key={i}
                            style={{
                              background: "#060a12",
                              border: "1px solid #1a2540",
                              borderRadius: 8,
                              padding: 14,
                            }}
                          >
                            <div
                              style={{
                                fontSize: 10,
                                color: "#475569",
                                letterSpacing: "0.08em",
                                marginBottom: 8,
                              }}
                            >
                              {item.label}
                            </div>
                            <div
                              style={{
                                display: "flex",
                                gap: 16,
                                alignItems: "center",
                              }}
                            >
                              <div style={{ fontSize: 24 }}>
                                {item.w.condition.includes("Rain")
                                  ? "🌧️"
                                  : item.w.condition.includes("Fog")
                                    ? "🌫️"
                                    : item.w.condition.includes("Drizzle")
                                      ? "🌦️"
                                      : "☀️"}
                              </div>
                              <div>
                                <div
                                  style={{
                                    fontFamily: "'JetBrains Mono',monospace",
                                    fontSize: 16,
                                    fontWeight: 700,
                                    color: "#e2e8f0",
                                  }}
                                >
                                  {item.w.temperature_c}°C
                                </div>
                                <div
                                  style={{
                                    fontSize: 11,
                                    color: "#94a3b8",
                                    marginTop: 2,
                                  }}
                                >
                                  {item.w.condition}
                                </div>
                              </div>
                              <div
                                style={{
                                  marginLeft: "auto",
                                  textAlign: "right",
                                }}
                              >
                                <div style={{ fontSize: 11, color: "#475569" }}>
                                  💨 {item.w.windspeed_kmh} km/h
                                </div>
                                <div
                                  style={{
                                    fontSize: 11,
                                    color: "#475569",
                                    marginTop: 2,
                                  }}
                                >
                                  🌧 {item.w.precipitation_mm}mm
                                </div>
                                <div
                                  style={{
                                    fontSize: 11,
                                    color:
                                      item.w.risk_score > 0.3
                                        ? "#ef4444"
                                        : "#10b981",
                                    marginTop: 2,
                                  }}
                                >
                                  Risk: {Math.round(item.w.risk_score * 100)}%
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div style={S.chartTitle}>
                    🗺️ ROUTE OPTIMIZATION —{" "}
                    {selected?.tracking_number || "SELECT SHIPMENT"}
                  </div>
                  {routes ? (
                    <div>
                      {routes.routes?.map((r: any, i: number) => (
                        <div
                          key={i}
                          style={{
                            background:
                              r.type === routes.recommended
                                ? `${r.color}10`
                                : "#060a12",
                            border: `1px solid ${r.type === routes.recommended ? r.color + "40" : "#1a2540"}`,
                            borderRadius: 6,
                            padding: "10px",
                            marginBottom: 8,
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              marginBottom: 6,
                            }}
                          >
                            <span
                              style={{
                                fontFamily: "'JetBrains Mono',monospace",
                                fontSize: 11,
                                fontWeight: 700,
                                color: r.color,
                              }}
                            >
                              {r.type}{" "}
                              {r.type === routes.recommended ? "⭐" : ""}
                            </span>
                            <span
                              style={{
                                fontFamily: "'JetBrains Mono',monospace",
                                fontSize: 11,
                                color: "#10b981",
                              }}
                            >
                              ₹{r.total_cost_inr.toLocaleString()}
                            </span>
                          </div>
                          <div
                            style={{
                              fontSize: 10,
                              color: "#475569",
                              marginBottom: 6,
                            }}
                          >
                            {r.description}
                          </div>
                          <div style={{ display: "flex", gap: 12 }}>
                            {[
                              {
                                label: "DISTANCE",
                                value: `${r.distance_km}km`,
                              },
                              { label: "TIME", value: `${r.duration_hours}h` },
                              {
                                label: "TOLLS",
                                value: `${r.toll_count} (₹${r.toll_cost_inr})`,
                              },
                              { label: "FUEL", value: `₹${r.fuel_cost_inr}` },
                            ].map((item, j) => (
                              <div key={j}>
                                <div
                                  style={{
                                    fontSize: 8,
                                    color: "#334155",
                                    letterSpacing: "0.08em",
                                  }}
                                >
                                  {item.label}
                                </div>
                                <div
                                  style={{
                                    fontFamily: "'JetBrains Mono',monospace",
                                    fontSize: 11,
                                    color: "#94a3b8",
                                  }}
                                >
                                  {item.value}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div
                      style={{
                        textAlign: "center",
                        padding: 24,
                        fontSize: 11,
                        color: "#334155",
                        fontFamily: "'JetBrains Mono',monospace",
                      }}
                    >
                      SELECT A SHIPMENT TO SEE ROUTES
                    </div>
                  )}
                </div>
              </div>

              {/* News Feed */}
              <div style={S.chartCard}>
                <div style={S.chartTitle}>
                  📰 REAL-TIME SUPPLY CHAIN INTELLIGENCE FEED
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 8,
                  }}
                >
                  {news.map((n: any, i: number) => (
                    <div
                      key={i}
                      style={{
                        background: "#060a12",
                        border: `1px solid ${n.impact === "critical" ? "#ef444425" : n.impact === "high" ? "#f9731625" : n.impact === "medium" ? "#f59e0b25" : "#1a2540"}`,
                        borderRadius: 6,
                        padding: "12px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          marginBottom: 6,
                          gap: 8,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: "#e2e8f0",
                            lineHeight: 1.4,
                            flex: 1,
                          }}
                        >
                          {n.title}
                        </span>
                        <span
                          style={{
                            fontSize: 8,
                            fontWeight: 700,
                            padding: "2px 6px",
                            borderRadius: 3,
                            flexShrink: 0,
                            background: `${RISK_COLORS[n.impact] || "#475569"}15`,
                            border: `1px solid ${RISK_COLORS[n.impact] || "#475569"}30`,
                            color: RISK_COLORS[n.impact] || "#475569",
                          }}
                        >
                          {n.category}
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: 10,
                          color: "#475569",
                          lineHeight: 1.5,
                          marginBottom: 6,
                        }}
                      >
                        {n.description}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <span
                          style={{
                            fontSize: 9,
                            color: "#334155",
                            fontFamily: "'JetBrains Mono',monospace",
                          }}
                        >
                          {n.source}
                        </span>
                        <span
                          style={{
                            fontSize: 9,
                            color: "#334155",
                            fontFamily: "'JetBrains Mono',monospace",
                          }}
                        >
                          {new Date(n.published).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
