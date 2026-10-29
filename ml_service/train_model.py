import pandas as pd
import numpy as np
from pathlib import Path
import joblib
import logging
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split, GridSearchCV, cross_val_score
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score, confusion_matrix, classification_report
)

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "model.pkl"

def generate_synthetic_data(num_samples_per_class=500):
    """
    Generate a balanced synthetic dataset with logical feature ranges for each class.
    SAFE: Good sleep, positive sentiment, high mood, few negative keywords.
    WARNING: Average/low sleep, neutral/negative sentiment, average mood, some negative keywords.
    CRITICAL: Poor sleep, highly negative sentiment, low mood, high negative keywords.
    """
    logger.info(f"Generating synthetic data: {num_samples_per_class} per class...")
    np.random.seed(42)
    
    # SAFE (0)
    safe_sleep = np.random.uniform(6.5, 10.0, num_samples_per_class)
    safe_sentiment = np.random.uniform(-0.1, 1.0, num_samples_per_class)
    safe_mood = np.random.uniform(3.0, 5.0, num_samples_per_class)
    safe_neg_keywords = np.random.uniform(0, 2, num_samples_per_class)
    safe_labels = np.zeros(num_samples_per_class)
    
    # WARNING (1)
    warn_sleep = np.random.uniform(4.0, 7.0, num_samples_per_class)
    warn_sentiment = np.random.uniform(-0.6, 0.2, num_samples_per_class)
    warn_mood = np.random.uniform(2.0, 3.5, num_samples_per_class)
    warn_neg_keywords = np.random.uniform(1, 4, num_samples_per_class)
    warn_labels = np.ones(num_samples_per_class)
    
    # CRITICAL (2)
    crit_sleep = np.random.uniform(0.0, 5.0, num_samples_per_class)
    crit_sentiment = np.random.uniform(-1.0, -0.4, num_samples_per_class)
    crit_mood = np.random.uniform(1.0, 2.5, num_samples_per_class)
    crit_neg_keywords = np.random.uniform(3, 10, num_samples_per_class)
    crit_labels = np.ones(num_samples_per_class) * 2
    
    # Combine data
    sleep = np.concatenate([safe_sleep, warn_sleep, crit_sleep])
    sentiment = np.concatenate([safe_sentiment, warn_sentiment, crit_sentiment])
    mood = np.concatenate([safe_mood, warn_mood, crit_mood])
    neg_keywords = np.concatenate([safe_neg_keywords, warn_neg_keywords, crit_neg_keywords])
    labels = np.concatenate([safe_labels, warn_labels, crit_labels])
    
    df = pd.DataFrame({
        "sentiment": sentiment,
        "sleep": sleep,
        "mood": mood,
        "negKeywords": neg_keywords,
        "label": labels
    })
    
    # Round variables and enforce API limits
    df["sleep"] = df["sleep"].round(1).clip(0, 24)
    df["sentiment"] = df["sentiment"].round(2).clip(-1.0, 1.0)
    df["mood"] = df["mood"].round(1).clip(1, 5)
    df["negKeywords"] = df["negKeywords"].round(0).clip(0, 100)
    
    return df

def train_and_evaluate():
    # 2 & 3. Generate much larger synthetic dataset, balanced across classes
    df = generate_synthetic_data(500) # 1500 samples total
    
    # 4. Feature engineering
    # With only 4 clear numerical features, Random Forest can natively learn their interactions 
    # and non-linear thresholds (e.g. low sleep + bad mood). Explicit feature engineering 
    # (like multiplication of factors) is mostly unnecessary for RF, but the data is structured logically.
    X = df[["sentiment", "sleep", "mood", "negKeywords"]]
    y = df["label"]
    
    # Train-test split (stratified)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    # 5. Tune hyperparameters using GridSearchCV
    logger.info("Tuning hyperparameters for RandomForest using CV...")
    param_grid = {
        'n_estimators': [100, 200],
        'max_depth': [None, 5, 10],
        'min_samples_split': [2, 5],
        'min_samples_leaf': [1, 2]
    }
    
    rf = RandomForestClassifier(random_state=42)
    grid_search = GridSearchCV(rf, param_grid, cv=5, scoring='f1_macro', n_jobs=-1)
    grid_search.fit(X_train, y_train)
    
    best_model = grid_search.best_estimator_
    logger.info(f"Best hyperparameters: {grid_search.best_params_}")
    
    # 6. Use cross-validation to evaluate generalization
    cv_scores = cross_val_score(best_model, X, y, cv=5, scoring='accuracy')
    logger.info(f"5-Fold CV Accuracy: {cv_scores.mean():.4f} (+/- {cv_scores.std() * 2:.4f})")
    
    # Predict on test set
    y_pred = best_model.predict(X_test)
    
    # 7. Print comprehensive metrics
    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred, average='macro')
    rec = recall_score(y_test, y_pred, average='macro')
    f1 = f1_score(y_test, y_pred, average='macro')
    cm = confusion_matrix(y_test, y_pred)
    
    print("\n" + "="*30)
    print("--- Model Evaluation Metrics ---")
    print("="*30)
    print(f"Accuracy:  {acc:.4f}")
    print(f"Precision: {prec:.4f} (Macro)")
    print(f"Recall:    {rec:.4f} (Macro)")
    print(f"F1-Score:  {f1:.4f} (Macro)")
    print("\nConfusion Matrix:")
    print(cm)
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=["SAFE", "WARNING", "CRITICAL"]))
    
    # 11. Model recommendation logic:
    # Random Forest is a great baseline, but for small-to-medium tabular datasets with complex 
    # non-linear boundaries, Gradient Boosting machines (XGBoost, LightGBM) are often strictly better 
    # because they build trees sequentially to reduce bias, resulting in higher accuracy and better 
    # calibration. However, Random Forest is provided here as it's less prone to overfitting without 
    # extensive tuning and satisfies the requirements perfectly for this feature set size.
    print("\n[NOTE]: If performance maxes out, consider switching from RandomForest to Gradient Boosting (e.g., XGBoost).")
    print("Gradient Boosting builds trees sequentially, correcting errors of previous trees, and often yields better results on tabular data.")
    
    # 8. Save the improved model
    joblib.dump(best_model, MODEL_PATH)
    logger.info(f"Model successfully saved to {MODEL_PATH}")

if __name__ == "__main__":
    train_and_evaluate()
