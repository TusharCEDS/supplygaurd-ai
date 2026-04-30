import pg8000.native
import uuid
from app.ml_engine.predictor import calculate_delay_probability

def get_connection():
    import time
    for attempt in range(3):
        try:
            return pg8000.native.Connection(
                host='aws-1-ap-northeast-1.pooler.supabase.com',
                port=5432,
                database='postgres',
                user='postgres.ssdnmjpbmnjftehyrugf',
                password='SupplyGuard@123',
                timeout=15
            )
        except Exception as e:
            print(f"Connection attempt {attempt+1} failed: {e}")
            if attempt == 2:
                raise e
            time.sleep(2)
            
async def create_shipment(data: dict):
    # Run ML prediction
    prediction = calculate_delay_probability(data)
    
    conn = get_connection()
    try:
        result = conn.run("""
            INSERT INTO shipments (
                id, tracking_number, origin_city, origin_lat, origin_lon,
                destination_city, destination_lat, destination_lon,
                scheduled_departure, scheduled_arrival,
                carrier_name, vehicle_type, cargo_weight_kg, cargo_value_usd,
                delay_probability, predicted_delay_hours, prediction_confidence,
                risk_level
            ) VALUES (:id::uuid,:tracking_number,:origin_city,:origin_lat,:origin_lon,
                      :destination_city,:destination_lat,:destination_lon,
                      :scheduled_departure,:scheduled_arrival,
                      :carrier_name,:vehicle_type,:cargo_weight_kg,:cargo_value_usd,
                      :delay_probability,:predicted_delay_hours,:prediction_confidence,
                      :risk_level::risklevel)
            RETURNING id::text, tracking_number, origin_city, destination_city,
                      status::text, risk_level::text, delay_probability,
                      predicted_delay_hours, prediction_confidence, created_at
        """,
            id=str(uuid.uuid4()),
            tracking_number=data['tracking_number'],
            origin_city=data['origin_city'],
            origin_lat=data['origin_lat'],
            origin_lon=data['origin_lon'],
            destination_city=data['destination_city'],
            destination_lat=data['destination_lat'],
            destination_lon=data['destination_lon'],
            scheduled_departure=data['scheduled_departure'],
            scheduled_arrival=data['scheduled_arrival'],
            carrier_name=data.get('carrier_name'),
            vehicle_type=data.get('vehicle_type'),
            cargo_weight_kg=data.get('cargo_weight_kg'),
            cargo_value_usd=data.get('cargo_value_usd'),
            delay_probability=prediction['delay_probability'],
            predicted_delay_hours=prediction['predicted_delay_hours'],
            prediction_confidence=prediction['prediction_confidence'],
            risk_level=prediction['risk_level']
        )
        columns = [col['name'] for col in conn.columns]
        row = dict(zip(columns, result[0]))
        row['risk_factors'] = prediction['risk_factors']
        return row
    finally:
        conn.close()

async def get_all_shipments():
    conn = get_connection()
    try:
        rows = conn.run("""
            SELECT id::text, tracking_number, origin_city, destination_city,
                   origin_lat, origin_lon, destination_lat, destination_lon,
                   status::text, risk_level::text, delay_probability,
                   predicted_delay_hours, carrier_name, vehicle_type, created_at
            FROM shipments ORDER BY created_at DESC
        """)
        columns = [col['name'] for col in conn.columns]
        return [dict(zip(columns, row)) for row in rows]
    finally:
        conn.close()

async def get_shipment_by_tracking(tracking_number: str):
    conn = get_connection()
    try:
        rows = conn.run("""
            SELECT id::text, tracking_number, origin_city, destination_city,
                   status::text, risk_level::text, delay_probability,
                   predicted_delay_hours, prediction_confidence,
                   carrier_name, vehicle_type, cargo_weight_kg, cargo_value_usd,
                   created_at
            FROM shipments WHERE tracking_number = :tracking_number
        """, tracking_number=tracking_number)
        if not rows:
            return None
        columns = [col['name'] for col in conn.columns]
        return dict(zip(columns, rows[0]))
    finally:
        conn.close()