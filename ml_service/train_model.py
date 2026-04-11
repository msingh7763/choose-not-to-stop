import pandas as pd
from pathlib import Path
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import train_test_split
import joblib


BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "model.pkl"


def create_model():
    print("Generating sample data...")
    # Generate sample data. Columns: sentiment, sleep, mood, negKeywords
    # Label: 0 -> SAFE, 1 -> WARNING, 2 -> CRITICAL
    data = [
        [-0.1, 7, 3, 1, 0],   # SAFE
        [0.2, 8, 4, 0, 0],    # SAFE
        [-0.3, 6, 3, 2, 0],   # SAFE
        [-0.5, 5, 2, 3, 1],   # WARNING
        [-0.6, 6, 2, 4, 1],   # WARNING
        [-0.4, 4, 3, 3, 1],   # WARNING
        [-0.9, 3, 1, 6, 2],   # CRITICAL
        [-0.8, 4, 1, 5, 2],   # CRITICAL
        [-1.0, 2, 1, 8, 2],   # CRITICAL
    ]

    df = pd.DataFrame(data, columns=[
        "sentiment", "sleep", "mood", "negKeywords", "label"
    ])

    print("Training RandomForest model...")
    X = df[["sentiment", "sleep", "mood", "negKeywords"]]
    y = df["label"]

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.33,
        random_state=42,
        stratify=y,
    )

    model = RandomForestClassifier(n_estimators=200, random_state=42)
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)

    print(f"Validation accuracy: {accuracy:.2f}")
    print("Validation report:")
    print(classification_report(y_test, y_pred, zero_division=0))

    if accuracy < 0.60:
        print("WARNING: Validation accuracy is low. Consider expanding and rebalancing training data.")

    # Save model
    joblib.dump(model, MODEL_PATH)
    print(f"Model saved to {MODEL_PATH} successfully!")

if __name__ == "__main__":
    create_model()
