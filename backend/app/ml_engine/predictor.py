import numpy as np
from datetime import datetime

def calculate_delay_probability(shipment_data: dict) -> dict:
    """
    Rule-based + weighted scoring delay predictor.
    Returns delay probability, risk level and predicted delay hours.
    """
    score = 0.0
    factors = []

    # Factor 1: Distance (longer = higher risk)
    origin_lat = shipment_data.get('origin_lat', 0)
    origin_lon = shipment_data.get('origin_lon', 0)
    dest_lat = shipment_data.get('destination_lat', 0)
    dest_lon = shipment_data.get('destination_lon', 0)
    
    distance = np.sqrt((dest_lat - origin_lat)**2 + (dest_lon - origin_lon)**2)
    if distance > 20:
        score += 0.3
        factors.append("long distance route")
    elif distance > 10:
        score += 0.15
        factors.append("medium distance route")

    # Factor 2: Cargo weight (heavier = higher risk)
    weight = shipment_data.get('cargo_weight_kg', 0) or 0
    if weight > 1000:
        score += 0.2
        factors.append("heavy cargo")
    elif weight > 500:
        score += 0.1
        factors.append("medium weight cargo")

    # Factor 3: Departure time (night departures = higher risk)
    departure = shipment_data.get('scheduled_departure')
    if departure:
        hour = departure.hour if hasattr(departure, 'hour') else 12
        if hour >= 22 or hour <= 5:
            score += 0.2
            factors.append("night departure")
        elif hour >= 17:
            score += 0.1
            factors.append("evening departure")

    # Factor 4: Transit time (very tight schedule = higher risk)
    arrival = shipment_data.get('scheduled_arrival')
    if departure and arrival:
        transit_hours = (arrival - departure).total_seconds() / 3600
        if transit_hours < 12:
            score += 0.25
            factors.append("tight schedule")
        elif transit_hours < 24:
            score += 0.1
            factors.append("moderate schedule")

    # Factor 5: Vehicle type
    vehicle = shipment_data.get('vehicle_type', '') or ''
    if vehicle.lower() in ['motorcycle', 'bicycle']:
        score += 0.15
        factors.append("small vehicle")

    # Cap at 0.95
    probability = min(score, 0.95)

    # Risk level
    if probability >= 0.7:
        risk_level = "critical"
        predicted_delay = round(probability * 12, 1)
    elif probability >= 0.5:
        risk_level = "high"
        predicted_delay = round(probability * 8, 1)
    elif probability >= 0.3:
        risk_level = "medium"
        predicted_delay = round(probability * 4, 1)
    else:
        risk_level = "low"
        predicted_delay = round(probability * 2, 1)

    return {
        "delay_probability": round(probability, 2),
        "risk_level": risk_level,
        "predicted_delay_hours": predicted_delay,
        "prediction_confidence": 0.78,
        "risk_factors": factors
    }
def get_weather_risk(origin_city: str, dest_city: str) -> dict:
    """
    Simulate weather risk based on city pairs.
    In production this would call a real weather API.
    """
    high_risk_cities = ['Mumbai', 'Chennai', 'Kolkata', 'Bhubaneswar']
    medium_risk_cities = ['Bangalore', 'Hyderabad', 'Pune']
    
    risk = 0.0
    condition = 'Clear'
    
    if origin_city in high_risk_cities or dest_city in high_risk_cities:
        risk = 0.35
        condition = 'Heavy Rain Expected'
    elif origin_city in medium_risk_cities or dest_city in medium_risk_cities:
        risk = 0.15
        condition = 'Light Rain Possible'
    else:
        risk = 0.05
        condition = 'Clear Skies'
    
    return {
        'weather_risk': risk,
        'weather_condition': condition
    }    