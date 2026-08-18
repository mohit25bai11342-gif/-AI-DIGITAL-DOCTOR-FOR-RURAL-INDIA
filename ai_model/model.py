from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression

training_data = [
    "fever cough sore throat",
    "high fever body pain chills",
    "fever headache weakness",
    "cough runny nose sneezing",
    "cold cough sneezing",
    "runny nose sore throat",
    "headache nausea vomiting",
    "severe headache dizziness",
    "headache migraine sensitivity light",
    "stomach pain vomiting",
    "abdominal pain nausea",
    "diarrhea stomach pain",
    "chest pain breathing difficulty",
    "chest pressure shortness breath",
    "difficulty breathing chest pain",
    "skin rash itching",
    "red skin itching rash",
    "skin irritation itching",
    "fatigue thirst frequent urination",
    "excessive thirst frequent urination",
    "weakness frequent urination"
]

labels = [
    "Flu",
    "Flu",
    "Flu",
    "Common Cold",
    "Common Cold",
    "Common Cold",
    "Migraine",
    "Migraine",
    "Migraine",
    "Stomach Infection",
    "Stomach Infection",
    "Stomach Infection",
    "Respiratory Condition",
    "Respiratory Condition",
    "Respiratory Condition",
    "Skin Condition",
    "Skin Condition",
    "Skin Condition",
    "Diabetes Risk",
    "Diabetes Risk",
    "Diabetes Risk"
]

vectorizer = TfidfVectorizer()
X = vectorizer.fit_transform(training_data)

model = LogisticRegression(max_iter=1000)
model.fit(X, labels)

def get_model():
    return model, vectorizer