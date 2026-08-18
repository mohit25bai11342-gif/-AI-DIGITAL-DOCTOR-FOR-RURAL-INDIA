from model import get_model

model, vectorizer = get_model()

print("Model training completed")
print("Classes:", model.classes_)