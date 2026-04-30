from pydantic import BaseModel
from datetime import datetime
from fastapi import APIRouter
import asyncio
import uuid
import math
from datetime import datetime
from app.services.shipment_service import get_connection

router = APIRouter(prefix="/api/tracking", tags=["tracking"])

@router.post("/simulate/{tracking_number}")
async def simulate_gps(tracking_number: str):
    """Simulate GPS movement for a shipment"""
    conn = get_connection()
    try:
        rows = conn.run("""
            SELECT id::text, origin_lat, origin_lon, destination_lat, destination_lon,
                   status::text, tracking_number
            FROM shipments WHERE tracking_number = :tn
        """, tn=tracking_number)
        
        if not rows:
            return {"error": "Shipment not found"}
        
        columns = [col['name'] for col in conn.columns]
        shipment = dict(zip(columns, rows[0]))
        
        # Get current GPS updates count
        gps_rows = conn.run("""
            SELECT COUNT(*) as cnt FROM gps_updates 
            WHERE shipment_id = :sid::uuid
        """, sid=shipment['id'])
        count = gps_rows[0][0]
        
        # Calculate next position (move 5% closer to destination each update)
        progress = min((count + 1) * 0.05, 1.0)
        current_lat = shipment['origin_lat'] + (shipment['destination_lat'] - shipment['origin_lat']) * progress
        current_lon = shipment['origin_lon'] + (shipment['destination_lon'] - shipment['origin_lon']) * progress
        
        # Insert GPS update
        conn.run("""
            INSERT INTO gps_updates (id, shipment_id, latitude, longitude, speed_kmh)
            VALUES (:id::uuid, :sid::uuid, :lat, :lon, :speed)
        """, 
            id=str(uuid.uuid4()),
            sid=shipment['id'],
            lat=current_lat,
            lon=current_lon,
            speed=65.0
        )
        
        # Update shipment status
        new_status = 'delivered' if progress >= 1.0 else 'in_transit'
        conn.run("""
            UPDATE shipments SET status = :status::shipmentstatus
            WHERE tracking_number = :tn
        """, status=new_status, tn=tracking_number)
        # Auto generate alert if progress > 50% and status in_transit
        if progress > 0.5 and new_status == 'in_transit':
            # Check risk level
            risk_rows = conn.run("""
                SELECT risk_level::text, delay_probability, predicted_delay_hours
                FROM shipments WHERE tracking_number = :tn
            """, tn=tracking_number)
            if risk_rows:
                risk = risk_rows[0][0]
                delay_prob = risk_rows[0][1]
                delay_hours = risk_rows[0][2]
                if risk in ['critical', 'high']:
                    conn.run("""
                        INSERT INTO alerts (id, shipment_id, alert_type, message, severity)
                        VALUES (:id::uuid, :sid::uuid, :atype, :msg, :sev::risklevel)
                        ON CONFLICT DO NOTHING
                    """,
                        id=str(uuid.uuid4()),
                        sid=shipment['id'],
                        atype='delay_risk',
                        msg=f"Shipment {tracking_number} has {int(delay_prob*100)}% delay risk. Predicted delay: {delay_hours}h",
                        sev=risk
                    )
        
        return {
            "tracking_number": tracking_number,
            "current_lat": current_lat,
            "current_lon": current_lon,
            "progress_percent": round(progress * 100, 1),
            "status": new_status,
            "speed_kmh": 65.0,
            "timestamp": datetime.utcnow().isoformat()
        }
    finally:
        conn.close()

@router.get("/location/{tracking_number}")
async def get_location(tracking_number: str):
    """Get latest GPS location for a shipment"""
    conn = get_connection()
    try:
        rows = conn.run("""
            SELECT s.tracking_number, s.origin_city, s.destination_city,
                   s.origin_lat, s.origin_lon, s.destination_lat, s.destination_lon,
                   s.status::text, s.risk_level::text, s.delay_probability,
                   s.predicted_delay_hours,
                   g.latitude as current_lat, g.longitude as current_lon,
                   g.speed_kmh, g.timestamp
            FROM shipments s
            LEFT JOIN gps_updates g ON g.shipment_id = s.id
            WHERE s.tracking_number = :tn
            ORDER BY g.timestamp DESC
            LIMIT 1
        """, tn=tracking_number)
        
        if not rows:
            return {"error": "Shipment not found"}
        
        columns = [col['name'] for col in conn.columns]
        return dict(zip(columns, rows[0]))
    finally:
        conn.close()
@router.post("/start-auto/{tracking_number}")
async def start_auto_simulate(tracking_number: str):
    """Move shipment automatically - call this once to start"""
    results = []
    for i in range(20):  # 20 steps = full journey
        res = await simulate_gps(tracking_number)
        results.append(res)
        if res.get('status') == 'delivered':
            break
        await asyncio.sleep(0)  # non-blocking
    return {"message": f"Simulated {len(results)} GPS updates", "final": results[-1]}
@router.get("/alerts")
async def get_alerts():
    """Get all unresolved alerts"""
    conn = get_connection()
    try:
        rows = conn.run("""
            SELECT a.id::text, a.alert_type, a.message, a.severity::text,
                   a.is_resolved, a.created_at,
                   s.tracking_number, s.origin_city, s.destination_city
            FROM alerts a
            JOIN shipments s ON s.id = a.shipment_id
            ORDER BY a.created_at DESC
            LIMIT 20
        """)
        columns = [col['name'] for col in conn.columns]
        return [dict(zip(columns, row)) for row in rows]
    finally:
        conn.close()        
class DriverUpdate(BaseModel):
    tracking_number: str
    latitude: float
    longitude: float
    speed_kmh: float = 0.0

@router.post("/driver-update")
async def driver_update(update: DriverUpdate):
    """Receive real GPS from driver and recalculate all analysis"""
    conn = get_connection()
    try:
        # Get shipment details
        rows = conn.run("""
            SELECT id::text, origin_lat, origin_lon, destination_lat, destination_lon,
                   scheduled_departure, scheduled_arrival, cargo_weight_kg, vehicle_type,
                   carrier_name, origin_city, destination_city
            FROM shipments WHERE tracking_number = :tn
        """, tn=update.tracking_number)

        if not rows:
            return {"error": "Shipment not found"}

        columns = [col['name'] for col in conn.columns]
        shipment = dict(zip(columns, rows[0]))
        shipment_id = shipment['id']

        # Insert GPS update
        conn.run("""
            INSERT INTO gps_updates (id, shipment_id, latitude, longitude, speed_kmh)
            VALUES (:id::uuid, :sid::uuid, :lat, :lon, :speed)
        """,
            id=str(uuid.uuid4()),
            sid=shipment_id,
            lat=update.latitude,
            lon=update.longitude,
            speed=update.speed_kmh
        )

        # Recalculate analysis based on current location
        from app.services.intelligence import haversine, get_weather_for_route
        from app.ml_engine.predictor import calculate_delay_probability

        # Distance remaining to destination
        dist_remaining = haversine(
            update.latitude, update.longitude,
            float(shipment['destination_lat']), float(shipment['destination_lon'])
        )

        # Distance from origin
        dist_from_origin = haversine(
            float(shipment['origin_lat']), float(shipment['origin_lon']),
            update.latitude, update.longitude
        )

        total_dist = haversine(
            float(shipment['origin_lat']), float(shipment['origin_lon']),
            float(shipment['destination_lat']), float(shipment['destination_lon'])
        )

        # Progress percentage
        progress = dist_from_origin / total_dist if total_dist > 0 else 0

        # ETA based on current speed
        speed = update.speed_kmh if update.speed_kmh > 5 else 60
        eta_hours = round(dist_remaining / speed, 1)

        # Recalculate delay probability
        prediction_data = {
            'origin_lat': update.latitude,
            'origin_lon': update.longitude,
            'destination_lat': float(shipment['destination_lat']),
            'destination_lon': float(shipment['destination_lon']),
            'origin_city': shipment['origin_city'],
            'destination_city': shipment['destination_city'],
            'scheduled_departure': shipment['scheduled_departure'],
            'scheduled_arrival': shipment['scheduled_arrival'],
            'cargo_weight_kg': shipment['cargo_weight_kg'],
            'vehicle_type': shipment['vehicle_type'],
        }
        prediction = calculate_delay_probability(prediction_data)

        # Anomaly detection
        hour = datetime.utcnow().hour
        anomalies = []
        if update.speed_kmh > 90:
            anomalies.append("OVERSPEEDING")
        if update.speed_kmh < 5:
            anomalies.append("UNEXPECTED_STOP")

        theft_risk = "HIGH" if (hour >= 22 or hour <= 5) else "LOW"

        # Update shipment with new predictions
        new_status = 'delivered' if progress >= 0.98 else 'in_transit'

        conn.run("""
            UPDATE shipments SET
                delay_probability = :dp,
                predicted_delay_hours = :pdh,
                risk_level = :rl::risklevel,
                status = :status::shipmentstatus,
                updated_at = NOW()
            WHERE tracking_number = :tn
        """,
            dp=prediction['delay_probability'],
            pdh=prediction['predicted_delay_hours'],
            rl=prediction['risk_level'],
            status=new_status,
            tn=update.tracking_number
        )

        # Generate alert if high risk
        if prediction['risk_level'] in ['critical', 'high']:
            conn.run("""
                INSERT INTO alerts (id, shipment_id, alert_type, message, severity)
                VALUES (:id::uuid, :sid::uuid, :atype, :msg, :sev::risklevel)
            """,
                id=str(uuid.uuid4()),
                sid=shipment_id,
                atype='location_risk_update',
                msg=f"{update.tracking_number}: {prediction['risk_level'].upper()} risk detected at current location. Delay probability: {int(prediction['delay_probability']*100)}%",
                sev=prediction['risk_level']
            )

        return {
            "success": True,
            "tracking_number": update.tracking_number,
            "current_location": {"lat": update.latitude, "lon": update.longitude},
            "speed_kmh": update.speed_kmh,
            "progress_percent": round(progress * 100, 1),
            "distance_remaining_km": round(dist_remaining, 1),
            "eta_hours": eta_hours,
            "status": new_status,
            "analysis": {
                "delay_probability": prediction['delay_probability'],
                "predicted_delay_hours": prediction['predicted_delay_hours'],
                "risk_level": prediction['risk_level'],
                "risk_factors": prediction['risk_factors'],
                "theft_risk": theft_risk,
                "anomalies": anomalies,
            },
            "timestamp": datetime.utcnow().isoformat()
        }
    finally:
        conn.close()