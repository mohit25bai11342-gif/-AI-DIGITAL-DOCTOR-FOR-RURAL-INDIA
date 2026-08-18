from flask import Flask, render_template, request, jsonify
from ai_model.prediction import predict_disease
from database.database import init_db, save_feedback, save_patient
from modules.hospital.hospital_finder import find_hospitals
from modules.sos.sos_alert import send_sos
from modules.medicine_reminder.reminder import add_reminder, get_reminders

app = Flask(__name__)

init_db()

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json()
    symptoms = data.get("symptoms", "")

    if not symptoms.strip():
        return jsonify({"error": "Please enter symptoms"}), 400

    result = predict_disease(symptoms)

    save_patient(symptoms, result["prediction"])

    return jsonify(result)

@app.route("/hospitals", methods=["GET"])
def hospitals():

    latitude = request.args.get("latitude")
    longitude = request.args.get("longitude")

    if not latitude or not longitude:
        return jsonify({
            "error": "Location not provided"
        }), 400

    try:
        latitude = float(latitude)
        longitude = float(longitude)
    except ValueError:
        return jsonify({
            "error": "Invalid location"
        }), 400

    result = find_hospitals(
        latitude,
        longitude
    )

    return jsonify(result)

@app.route("/sos", methods=["POST"])
def sos():
    data = request.get_json()
    message = data.get("message", "Emergency assistance required")

    result = send_sos(message)

    return jsonify(result)

@app.route("/reminder", methods=["POST"])
def reminder():
    data = request.get_json()

    medicine = data.get("medicine")
    time = data.get("time")

    if not medicine or not time:
        return jsonify({"error": "Medicine and time are required"}), 400

    result = add_reminder(medicine, time)

    return jsonify(result)

@app.route("/reminders", methods=["GET"])
def reminders():
    return jsonify(get_reminders())

@app.route("/feedback", methods=["POST"])
def feedback():
    data = request.get_json()

    message = data.get("message", "")
    rating = data.get("rating", 0)

    save_feedback(message, rating)

    return jsonify({"message": "Feedback submitted successfully"})

if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )