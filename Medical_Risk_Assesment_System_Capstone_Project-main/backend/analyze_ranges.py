import pandas as pd
import os

def analyze_file(filepath, disease_name):
    print(f"\n--- Analyzing {disease_name} ({filepath}) ---")
    try:
        df = pd.read_csv(filepath)
        
        # Clean numeric columns that might have bad data (like '?' or empty strings)
        for col in df.columns:
            # Attempt to convert to numeric, coercing errors to NaN
            df[col] = pd.to_numeric(df[col], errors='coerce')
        
        # Get description
        desc = df.describe().transpose()[['min', 'max']]
        print(desc)
    except Exception as e:
        print(f"Error analyzing {filepath}: {e}")

base_path = 'data'

# Heart
analyze_file(os.path.join(base_path, 'heart.csv'), 'Heart')

# Diabetes
analyze_file(os.path.join(base_path, 'diabetes.csv'), 'Diabetes')

# Stroke
analyze_file(os.path.join(base_path, 'stroke.csv'), 'Stroke')

# Kidney
analyze_file(os.path.join(base_path, 'kidney.csv'), 'Kidney')
