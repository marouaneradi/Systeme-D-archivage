import pandas as pd
import openpyxl

# Read the Excel file
excel_file = r'C:\Users\radim\OneDrive\Desktop\carte de formation 2025-2026.xlsx'

# Load with pandas
df = pd.read_excel(excel_file)

print("=" * 80)
print("STEP 1: EXCEL FILE STRUCTURE ANALYSIS")
print("=" * 80)

print("\n📊 BASIC INFO:")
print(f"Total Rows: {len(df)}")
print(f"Total Columns: {len(df.columns)}")

print("\n📋 COLUMN NAMES:")
for i, col in enumerate(df.columns, 1):
    print(f"  {i}. {col}")

print("\n🔍 FIRST 10 ROWS:")
print(df.head(10).to_string())

print("\n📊 UNIQUE VALUES PER COLUMN:")
for col in df.columns:
    unique_count = df[col].nunique()
    print(f"  {col}: {unique_count} unique values")

print("\n🔎 SAMPLE VALUES FOR EACH COLUMN:")
for col in df.columns:
    print(f"\n  {col}:")
    samples = df[col].dropna().unique()[:5]
    for sample in samples:
        print(f"    - {sample}")

print("\n✅ NULL VALUES:")
print(df.isnull().sum())
