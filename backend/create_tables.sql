CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE shipmentstatus AS ENUM ('pending', 'in_transit', 'delayed', 'delivered', 'cancelled');
CREATE TYPE risklevel AS ENUM ('low', 'medium', 'high', 'critical');

CREATE TABLE IF NOT EXISTS shipments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tracking_number VARCHAR(50) UNIQUE NOT NULL,
    origin_city VARCHAR(100) NOT NULL,
    origin_lat FLOAT NOT NULL,
    origin_lon FLOAT NOT NULL,
    destination_city VARCHAR(100) NOT NULL,
    destination_lat FLOAT NOT NULL,
    destination_lon FLOAT NOT NULL,
    status shipmentstatus DEFAULT 'pending',
    risk_level risklevel DEFAULT 'low',
    scheduled_departure TIMESTAMP NOT NULL,
    actual_departure TIMESTAMP,
    scheduled_arrival TIMESTAMP NOT NULL,
    actual_arrival TIMESTAMP,
    estimated_arrival TIMESTAMP,
    delay_probability FLOAT DEFAULT 0.0,
    predicted_delay_hours FLOAT DEFAULT 0.0,
    prediction_confidence FLOAT DEFAULT 0.0,
    carrier_name VARCHAR(100),
    vehicle_type VARCHAR(50),
    cargo_weight_kg FLOAT,
    cargo_value_usd FLOAT,
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS gps_updates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shipment_id UUID REFERENCES shipments(id),
    latitude FLOAT NOT NULL,
    longitude FLOAT NOT NULL,
    speed_kmh FLOAT,
    heading FLOAT,
    timestamp TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shipment_id UUID REFERENCES shipments(id),
    alert_type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    severity risklevel DEFAULT 'low',
    is_resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);
