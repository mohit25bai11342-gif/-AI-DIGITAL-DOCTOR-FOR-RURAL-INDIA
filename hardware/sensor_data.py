def validate_sensor_data(data):
    required = [
        "heart_rate",
        "spo2",
        "temperature"
    ]

    for item in required:
        if item not in data:
            return False

    return True

def process_sensor_data(data):
    return {
        "heart_rate": float(data["heart_rate"]),
        "spo2": float(data["spo2"]),
        "temperature": float(data["temperature"])
    }