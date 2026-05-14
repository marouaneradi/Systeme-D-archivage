import pandas as pd

excel_file = r'C:\Users\radim\OneDrive\Desktop\carte de formation 2025-2026.xlsx'
df = pd.read_excel(excel_file)

print("\n" + "=" * 80)
print("DETAILED ANALYSIS - RELATIONSHIPS & PATTERNS")
print("=" * 80)

print("\n📋 ALL UNIQUE LEVELS (Niveau):")
for niveau in sorted(df['Niveau'].unique()):
    count = len(df[df['Niveau'] == niveau])
    print("  {}: {} entries".format(niveau, count))

print("\n🏢 ALL SECTORS (Secteur):")
for secteur in sorted(df['Secteur'].unique()):
    count = len(df[df['Secteur'] == secteur])
    print("  {}: {} entries".format(secteur, count))

print("\n📚 FILIÈRES (with codes):")
filiere_mapping = df[['Code Filière', 'filière', 'Secteur', 'Niveau']].drop_duplicates().sort_values('Secteur')
print(filiere_mapping.to_string(index=False))

print("\n🔗 GROUPS BY FILIÈRE & LEVEL:")
for (filiere, niveau), group_df in df.groupby(['filière', 'Niveau']):
    groups = group_df['Groupe'].unique()
    print("  {} ({}): {}".format(filiere, niveau, ', '.join(sorted(groups))))

print("\n📅 CRENEAUX:")
for creneau in sorted(df['Creneau'].unique()):
    count = len(df[df['Creneau'] == creneau])
    print("  {}: {} entries".format(creneau, count))

print("\n✅ KEY FINDINGS:")
print("  - All data is for year 2025")
print("  - 2 creneaux (CDJ, CDS) = morning/afternoon shifts")
print("  - {} level types".format(df['Niveau'].nunique()))
print("  - {} sectors".format(df['Secteur'].nunique()))
print("  - {} distinct filières".format(df['filière'].nunique()))
print("  - {} total groups".format(df['Groupe'].nunique()))
