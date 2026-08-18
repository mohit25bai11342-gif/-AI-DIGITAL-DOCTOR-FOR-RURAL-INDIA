from ai_model.model import get_model
from ai_model.preprocessing import clean_text

model, vectorizer = get_model()

def predict_disease(symptoms):
    symptoms = clean_text(symptoms)

    X = vectorizer.transform([symptoms])

    prediction = model.predict(X)[0]
    probabilities = model.predict_proba(X)[0]

    confidence = max(probabilities) * 100

    emergency_words = [
        "chest pain",
        "difficulty breathing",
        "unconscious",
        "severe bleeding",
        "stroke",
        "heart attack"
    ]

    emergency = any(word in symptoms for word in emergency_words)

    return {
        "prediction": prediction,
        "confidence": round(confidence, 2),
        "emergency": emergency,
        "message": "Seek immediate medical attention." if emergency else "Consult a qualified healthcare professional for proper evaluation."
    }