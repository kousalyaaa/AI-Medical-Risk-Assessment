import pandas as pd
import os
import sys

# Force utf-8 output if possible
sys.stdout.reconfigure(encoding='utf-8')

def analyze_file(filepath, disease_name):
    print(f"ANALYZE:{disease_name}")
    if not os.path.exists(filepath):
        print(f"MISSING:{filepath}")
        return

    try:
        df = pd.read_csv(filepath)
        
        # Numeric columns only
        for col in df.columns:
            # force numeric
            s = pd.to_numeric(df[col], errors='coerce')
            if s.notna().sum() > 0: # if has data
                mn = s.min()
                mx = s.max()
                print(f"RANGE:{disease_name}:{col}:{mn}:{mx}")
    except Exception as e:
        print(f"ERROR:{disease_name}:{e}")

base_path = 'data'
analyze_file(os.path.join(base_path, 'heart.csv'), 'Heart')
analyze_file(os.path.join(base_path, 'diabetes.csv'), 'Diabetes')
analyze_file(os.path.join(base_path, 'stroke.csv'), 'Stroke')
analyze_file(os.path.join(base_path, 'kidney.csv'), 'Kidney')
