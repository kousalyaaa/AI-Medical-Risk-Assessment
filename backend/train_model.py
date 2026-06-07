# src/train_model.py
import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, roc_auc_score, classification_report
from sklearn.impute import SimpleImputer

def train_and_save_model(csv_path, target_col, model_name):
    # Load cleaned dataset
    df = pd.read_csv(csv_path)

    # Separate features and target
    X = df.drop(target_col, axis=1)
    y = df[target_col]

    # Encode categorical columns automatically
    for col in X.select_dtypes(include=['object']).columns:
        X[col] = X[col].astype('category').cat.codes

    # Train/test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    # Impute missing values
    imputer = SimpleImputer(strategy='mean')
    X_train_imputed = imputer.fit_transform(X_train)
    X_test_imputed = imputer.transform(X_test)

    # Scale features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train_imputed)
    X_test_scaled = scaler.transform(X_test_imputed)

    # Train model
    model = LogisticRegression(max_iter=1000)
    model.fit(X_train_scaled, y_train)

    # Evaluate
    y_pred = model.predict(X_test_scaled)
    print(f"📊 Results for {model_name}")
    print("Accuracy:", accuracy_score(y_test, y_pred))
    print("ROC-AUC:", roc_auc_score(y_test, model.predict_proba(X_test_scaled)[:,1]))
    print(classification_report(y_test, y_pred))

    # Save model + scaler + imputer
    joblib.dump(model, f"models/{model_name}_model.pkl")
    joblib.dump(scaler, f"models/{model_name}_scaler.pkl")
    joblib.dump(imputer, f"models/{model_name}_imputer.pkl")
    print(f"✅ {model_name} model saved!")

# Example usage
train_and_save_model("data/heart_clean.csv", "target", "heart")
train_and_save_model("data/diabetes_clean.csv", "outcome", "diabetes")
train_and_save_model("data/stroke_clean.csv", "stroke", "stroke")
train_and_save_model("data/kidney_clean.csv", "classification", "kidney")


# train_model.py
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score
import joblib
import os

# 1. Load dataset
DATA_PATH = "data/Medicaldataset.csv"  # <-- your dataset
if not os.path.exists(DATA_PATH):
    raise FileNotFoundError(f"Dataset not found at {DATA_PATH}")

df = pd.read_csv(DATA_PATH)

# 2. Handle missing values (fixed to avoid FutureWarning)
for col in df.columns:
    if df[col].dtype == "object":
        df[col] = df[col].fillna(df[col].mode()[0])
    else:
        df[col] = df[col].fillna(df[col].median())

# 3. Features and Target
TARGET_COLUMN = "Result"  # your target column
X = df.drop(TARGET_COLUMN, axis=1)
y = df[TARGET_COLUMN]

# 4. Train-test split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# 5. Train Random Forest Classifier
model = RandomForestClassifier()
model.fit(X_train, y_train)

# 6. Evaluate model
y_pred = model.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)
print(f"Model trained successfully! Accuracy: {accuracy:.2f}")

# 7. Save model
MODEL_PATH = "models/medical_risk_model.pkl"
os.makedirs("models", exist_ok=True)  # create folder if missing
joblib.dump(model, MODEL_PATH)
print(f"Model saved at {MODEL_PATH}")







