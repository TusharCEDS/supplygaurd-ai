"use client";
import { useState, useEffect } from "react";
import axios from "axios";

const API = "http://localhost:8000";

export default function DriverPage() {
  const [trackingNumber, setTrackingNumber] = useState("");
  const [status, setStatus] = useState("");
  const [location, setLocation] = useState<{ lat: number; lon: number; speed: number } | null>(null);
  const [autoUpdate, setAutoUpdate] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [shipmentInfo, setShipmentInfo] = useState<any>(null);
  const [updateCount, setUpdateCount] = useState(0);
  const [lastLocationTime, setLastLocationTime] = useState<number>(0);
  const [lastLocationCoords, setLastLocationCoords] = useState<{
    lat: number;
    lon: number;
  } | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  useEffect(() => {
    if (!autoUpdate || !verified) return;
    const interval = setInterval(
      () => {
        sendLocation();
      },
      15 * 60 * 1000,
    );
    return () => clearInterval(interval);
  }, [autoUpdate, verified]);

  const verifyShipment = async () => {
    if (!trackingNumber) return;
    setLoading(true);
    setStatus("🔄 Connecting to database... please wait 10-15 seconds...");

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const r = await axios.get(`${API}/api/shipments/${trackingNumber}`, {
          timeout: 20000,
        });
        if (r.data) {
          setShipmentInfo(r.data);
          setVerified(true);
          setStatus("✅ Shipment verified! You can now share your location.");
          setLoading(false);
          return;
        }
      } catch (e: any) {
        if (attempt < 3) {
          setStatus(`🔄 Attempt ${attempt} failed. Retrying... (${attempt}/3)`);
          await new Promise((res) => setTimeout(res, 2000));
        } else {
          setStatus(
            "❌ Connection failed after 3 attempts. Check if backend is running.",
          );
        }
      }
    }
    setLoading(false);
  };
  const getLocation = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("GPS not supported"));
        return;
      }
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      });
    });
  };

  const calculateSpeed = (newLat: number, newLon: number) => {
    if (!lastLocationCoords || !lastLocationTime) return 60;
    const now = Date.now();
    const timeDiffHours = (now - lastLocationTime) / (1000 * 60 * 60);
    if (timeDiffHours < 0.001) return 60;
    const R = 6371;
    const dLat = ((newLat - lastLocationCoords.lat) * Math.PI) / 180;
    const dLon = ((newLon - lastLocationCoords.lon) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lastLocationCoords.lat * Math.PI) / 180) *
        Math.cos((newLat * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    const dist = R * 2 * Math.asin(Math.sqrt(a));
    return Math.min(Math.round(dist / timeDiffHours), 120);
  };

  const sendLocationUpdate = async (
    lat: number,
    lon: number,
    label: string,
  ) => {
    setLoading(true);
    setStatus(`📡 Updating location to ${label}...`);
    try {
      const speed = calculateSpeed(lat, lon);
      const r = await axios.post(`${API}/api/tracking/driver-update`, {
        tracking_number: trackingNumber,
        latitude: lat,
        longitude: lon,
        speed_kmh: speed,
      });
      setLocation({ lat, lon, speed });
      setLastLocationCoords({ lat, lon });
      setLastLocationTime(Date.now());
      setUpdateCount((c) => c + 1);
      setLastUpdate(new Date().toLocaleTimeString());
      setAnalysisResult(r.data);
      const a = r.data.analysis;
      setStatus(
        `✅ ${label} | Speed: ${speed} km/h | Risk: ${a?.risk_level?.toUpperCase()} | Delay: ${Math.round(a?.delay_probability * 100)}% | ETA: ${r.data.eta_hours}h left`,
      );
    } catch {
      setStatus("❌ Failed to send location");
    }
    setLoading(false);
  };

  const sendLocation = async () => {
    if (!verified) return;
    setLoading(true);
    setStatus("📡 Getting GPS...");
    try {
      const pos = await getLocation();
      await sendLocationUpdate(
        pos.coords.latitude,
        pos.coords.longitude,
        "Current Location",
      );
    } catch (e: any) {
      setStatus(e.code === 1 ? "❌ GPS permission denied" : `❌ ${e.message}`);
      setLoading(false);
    }
  };

  const cities = [
    { label: "Chennai", lat: 13.0827, lon: 80.2707 },
    { label: "Bangalore", lat: 12.9716, lon: 77.5946 },
    { label: "Pune", lat: 18.5204, lon: 73.8567 },
    { label: "Mumbai", lat: 19.076, lon: 72.8777 },
    { label: "Delhi", lat: 28.6139, lon: 77.209 },
    { label: "Hyderabad", lat: 17.385, lon: 78.4867 },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#080c14",
        fontFamily: "'Space Grotesk',sans-serif",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background: "#0d1425",
          border: "1px solid #1a2540",
          borderRadius: 16,
          padding: 28,
          color: "#e2e8f0",
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🚛</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#06b6d4" }}>
            SupplyGuard Driver
          </div>
          <div style={{ fontSize: 12, color: "#475569", marginTop: 4 }}>
            Location Sharing Portal
          </div>
        </div>

        {!verified ? (
          <div>
            <div
              style={{
                fontSize: 11,
                color: "#475569",
                marginBottom: 8,
                letterSpacing: "0.08em",
              }}
            >
              TRACKING NUMBER
            </div>
            <input
              style={{
                width: "100%",
                background: "#060a12",
                border: "1px solid #1a2540",
                borderRadius: 8,
                padding: "12px 14px",
                fontSize: 14,
                color: "#e2e8f0",
                fontFamily: "'JetBrains Mono',monospace",
                letterSpacing: "0.1em",
                outline: "none",
                marginBottom: 14,
                boxSizing: "border-box",
              }}
              placeholder="e.g. SG-004"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && verifyShipment()}
            />
            <button
              onClick={verifyShipment}
              disabled={loading}
              style={{
                width: "100%",
                background: "#06b6d420",
                border: "1px solid #06b6d440",
                color: "#06b6d4",
                borderRadius: 8,
                padding: "12px",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
                letterSpacing: "0.06em",
              }}
            >
              {loading ? "VERIFYING..." : "VERIFY SHIPMENT"}
            </button>
            {status && (
              <div
                style={{
                  marginTop: 12,
                  fontSize: 13,
                  color: status.includes("❌") ? "#ef4444" : "#10b981",
                  textAlign: "center",
                }}
              >
                {status}
              </div>
            )}
          </div>
        ) : (
          <div>
            {/* Shipment Info */}
            <div
              style={{
                background: "#060a12",
                border: "1px solid #1a2540",
                borderRadius: 8,
                padding: 14,
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  color: "#475569",
                  letterSpacing: "0.08em",
                  marginBottom: 6,
                }}
              >
                ACTIVE SHIPMENT
              </div>
              <div
                style={{
                  fontFamily: "'JetBrains Mono',monospace",
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#06b6d4",
                }}
              >
                {trackingNumber}
              </div>
              <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>
                {shipmentInfo?.origin_city} → {shipmentInfo?.destination_city}
              </div>
              <span
                style={{
                  display: "inline-block",
                  marginTop: 6,
                  fontSize: 10,
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: 4,
                  background:
                    shipmentInfo?.risk_level === "critical"
                      ? "#ef444415"
                      : shipmentInfo?.risk_level === "high"
                        ? "#f9731615"
                        : "#10b98115",
                  border: `1px solid ${shipmentInfo?.risk_level === "critical" ? "#ef444430" : shipmentInfo?.risk_level === "high" ? "#f9731630" : "#10b98130"}`,
                  color:
                    shipmentInfo?.risk_level === "critical"
                      ? "#ef4444"
                      : shipmentInfo?.risk_level === "high"
                        ? "#f97316"
                        : "#10b981",
                }}
              >
                {shipmentInfo?.risk_level?.toUpperCase()} RISK
              </span>
            </div>

            {/* Analysis Result */}
            {analysisResult && (
              <div
                style={{
                  background: "#060a12",
                  border: "1px solid #1a2540",
                  borderRadius: 8,
                  padding: 14,
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    color: "#475569",
                    letterSpacing: "0.08em",
                    marginBottom: 10,
                  }}
                >
                  LIVE ANALYSIS
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    gap: 8,
                  }}
                >
                  {[
                    {
                      label: "PROGRESS",
                      value: `${analysisResult.progress_percent}%`,
                      color: "#06b6d4",
                    },
                    {
                      label: "DIST LEFT",
                      value: `${analysisResult.distance_remaining_km}km`,
                      color: "#94a3b8",
                    },
                    {
                      label: "ETA",
                      value: `${analysisResult.eta_hours}h`,
                      color: "#f59e0b",
                    },
                    {
                      label: "SPEED",
                      value: `${location?.speed} km/h`,
                      color: location?.speed > 90 ? "#ef4444" : "#10b981",
                    },
                    {
                      label: "DELAY RISK",
                      value: `${Math.round(analysisResult.analysis?.delay_probability * 100)}%`,
                      color: "#f97316",
                    },
                    {
                      label: "RISK LEVEL",
                      value: analysisResult.analysis?.risk_level?.toUpperCase(),
                      color:
                        analysisResult.analysis?.risk_level === "critical"
                          ? "#ef4444"
                          : analysisResult.analysis?.risk_level === "high"
                            ? "#f97316"
                            : "#10b981",
                    },
                  ].map((s, i) => (
                    <div
                      key={i}
                      style={{
                        textAlign: "center",
                        background: "#0a1020",
                        borderRadius: 6,
                        padding: "8px 4px",
                      }}
                    >
                      <div
                        style={{
                          fontFamily: "'JetBrains Mono',monospace",
                          fontSize: 13,
                          fontWeight: 700,
                          color: s.color,
                        }}
                      >
                        {s.value}
                      </div>
                      <div
                        style={{
                          fontSize: 8,
                          color: "#334155",
                          letterSpacing: "0.08em",
                          marginTop: 2,
                        }}
                      >
                        {s.label}
                      </div>
                    </div>
                  ))}
                </div>
                {analysisResult.analysis?.risk_factors?.length > 0 && (
                  <div
                    style={{ marginTop: 10, fontSize: 10, color: "#f59e0b" }}
                  >
                    ⚠️ {analysisResult.analysis.risk_factors.join(" • ")}
                  </div>
                )}
                {analysisResult.analysis?.anomalies?.length > 0 && (
                  <div style={{ marginTop: 6, fontSize: 10, color: "#ef4444" }}>
                    🚨 {analysisResult.analysis.anomalies.join(" • ")}
                  </div>
                )}
              </div>
            )}

            {/* Last Location */}
            {location && (
              <div
                style={{
                  background: "#10b98110",
                  border: "1px solid #10b98130",
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 14,
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    color: "#10b981",
                    letterSpacing: "0.08em",
                    marginBottom: 4,
                  }}
                >
                  LAST LOCATION SENT
                </div>
                <div
                  style={{
                    fontFamily: "'JetBrains Mono',monospace",
                    fontSize: 12,
                    color: "#94a3b8",
                  }}
                >
                  {location.lat.toFixed(6)}, {location.lon.toFixed(6)}
                </div>
                <div style={{ fontSize: 11, color: "#475569", marginTop: 4 }}>
                  🕐 {lastUpdate} • 📡 {updateCount} update
                  {updateCount !== 1 ? "s" : ""} sent
                </div>
              </div>
            )}

            {/* Status */}
            {status && (
              <div
                style={{
                  marginBottom: 14,
                  fontSize: 12,
                  color: status.includes("❌")
                    ? "#ef4444"
                    : status.includes("📡")
                      ? "#f59e0b"
                      : "#10b981",
                  textAlign: "center",
                  padding: "10px",
                  background: "#060a12",
                  borderRadius: 8,
                  lineHeight: 1.5,
                }}
              >
                {status}
              </div>
            )}

            {/* Manual Coordinates */}
            <div style={{ marginBottom: 12 }}>
              <div
                style={{
                  fontSize: 10,
                  color: "#475569",
                  letterSpacing: "0.08em",
                  marginBottom: 8,
                }}
              >
                MANUAL COORDINATES
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 8,
                  marginBottom: 8,
                }}
              >
                <input
                  id="manualLat"
                  style={{
                    background: "#060a12",
                    border: "1px solid #1a2540",
                    borderRadius: 6,
                    padding: "8px 10px",
                    fontSize: 12,
                    color: "#e2e8f0",
                    fontFamily: "'JetBrains Mono',monospace",
                    outline: "none",
                  }}
                  placeholder="Latitude"
                />
                <input
                  id="manualLon"
                  style={{
                    background: "#060a12",
                    border: "1px solid #1a2540",
                    borderRadius: 6,
                    padding: "8px 10px",
                    fontSize: 12,
                    color: "#e2e8f0",
                    fontFamily: "'JetBrains Mono',monospace",
                    outline: "none",
                  }}
                  placeholder="Longitude"
                />
              </div>
              <button
                onClick={async () => {
                  const lat = parseFloat(
                    (document.getElementById("manualLat") as HTMLInputElement)
                      .value,
                  );
                  const lon = parseFloat(
                    (document.getElementById("manualLon") as HTMLInputElement)
                      .value,
                  );
                  if (isNaN(lat) || isNaN(lon)) {
                    setStatus("❌ Enter valid coordinates");
                    return;
                  }
                  await sendLocationUpdate(
                    lat,
                    lon,
                    `${lat.toFixed(4)}, ${lon.toFixed(4)}`,
                  );
                }}
                style={{
                  width: "100%",
                  background: "#a78bfa15",
                  border: "1px solid #a78bfa30",
                  color: "#a78bfa",
                  borderRadius: 6,
                  padding: "8px",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  letterSpacing: "0.06em",
                }}
              >
                📍 SEND MANUAL LOCATION
              </button>
            </div>

            {/* Quick Cities */}
            <div style={{ marginBottom: 14 }}>
              <div
                style={{
                  fontSize: 10,
                  color: "#475569",
                  letterSpacing: "0.08em",
                  marginBottom: 8,
                }}
              >
                QUICK WAYPOINTS
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 6,
                }}
              >
                {cities.map((city, i) => (
                  <button
                    key={i}
                    onClick={() =>
                      sendLocationUpdate(city.lat, city.lon, city.label)
                    }
                    disabled={loading}
                    style={{
                      background: "#060a12",
                      border: "1px solid #1a2540",
                      color: "#94a3b8",
                      borderRadius: 6,
                      padding: "9px",
                      fontSize: 11,
                      cursor: "pointer",
                      fontFamily: "'JetBrains Mono',monospace",
                      transition: "all 0.15s",
                    }}
                  >
                    📍 {city.label}
                  </button>
                ))}
              </div>
            </div>

            {/* GPS Button */}
            <button
              onClick={sendLocation}
              disabled={loading}
              style={{
                width: "100%",
                background: loading ? "#06b6d410" : "#06b6d420",
                border: "1px solid #06b6d440",
                color: "#06b6d4",
                borderRadius: 8,
                padding: "14px",
                fontSize: 14,
                fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                letterSpacing: "0.06em",
                marginBottom: 12,
              }}
            >
              {loading ? "📡 SENDING..." : "📍 SEND MY GPS LOCATION"}
            </button>

            {/* Auto Update */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "#060a12",
                border: "1px solid #1a2540",
                borderRadius: 8,
                padding: "12px 14px",
                marginBottom: 12,
              }}
            >
              <div>
                <div
                  style={{ fontSize: 13, color: "#e2e8f0", fontWeight: 600 }}
                >
                  Auto-update every 15 min
                </div>
                <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>
                  Keep this page open
                </div>
              </div>
              <div
                onClick={() => setAutoUpdate(!autoUpdate)}
                style={{
                  width: 44,
                  height: 24,
                  background: autoUpdate ? "#06b6d4" : "#1a2540",
                  borderRadius: 12,
                  cursor: "pointer",
                  position: "relative",
                  transition: "all 0.3s",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: 3,
                    left: autoUpdate ? 23 : 3,
                    width: 18,
                    height: 18,
                    background: "white",
                    borderRadius: "50%",
                    transition: "all 0.3s",
                  }}
                />
              </div>
            </div>

            {autoUpdate && (
              <div
                style={{
                  fontSize: 11,
                  color: "#06b6d4",
                  textAlign: "center",
                  padding: "8px",
                  background: "#06b6d410",
                  borderRadius: 6,
                  marginBottom: 12,
                }}
              >
                🟢 Auto-updating every 15 minutes. Keep this page open!
              </div>
            )}

            <button
              onClick={() => {
                setVerified(false);
                setStatus("");
                setLocation(null);
                setAutoUpdate(false);
                setAnalysisResult(null);
              }}
              style={{
                width: "100%",
                background: "transparent",
                border: "1px solid #1a2540",
                color: "#475569",
                borderRadius: 8,
                padding: "10px",
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              Switch Shipment
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
