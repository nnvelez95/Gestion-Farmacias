import pandas as pd

# Define the full list of columns as used in the successful load
COLUMN_NAMES = [
    'Cod.Producto', 'Troquel', 'Producto', 'Codebar', 'Rubro', 'SubRubro', 'Laboratorio',
    'Droga', 'Costo', 'Precio', 'Fec. Precio', 'IVA', 'Precio Pami', 'Cantidad',
    'Unidades', 'Activo', 'Visible', 'Tipo Bonif.', 'Bonif.', 'Tipo Bonif. Dif.',
    'Bonif. Diferencial', 'e-commerce', 'Delivery', 'codebar1', 'Cod. en Proveedor',
    'ABC', 'Estacional', 'Margen', 'OrigenCosto'
]

file_path = "/Users/norbertovelez/Documents/GitHub/Gestion-Farmacias/Backend/data/Listado_Productos.csv"

# 1. Load the data again (using the same successful parameters)
df = pd.read_csv(file_path, delimiter=';', skiprows=11, header=None, names=COLUMN_NAMES, encoding='latin1')

# 2. Define the FINAL set of important columns to KEEP
COLUMNS_TO_KEEP = [
    'Cod.Producto', 'Troquel', 'Producto', 'Codebar', 'Rubro', 'Laboratorio',
    'Droga', 'Costo', 'Precio', 'Fec. Precio', 'Precio Pami', 'Margen'
]

df_final = df[COLUMNS_TO_KEEP].copy()

# 3. Data Cleaning and Type Conversion
# Price columns use comma (',') as decimal separator. We must convert them to proper numeric types.
price_cols = ['Costo', 'Precio', 'Precio Pami', 'Margen']
for col in price_cols:
    # Replace comma with dot, then convert to numeric
    df_final[col] = df_final[col].astype(str).str.replace(',', '.', regex=False)
    df_final[col] = pd.to_numeric(df_final[col], errors='coerce') # coerce errors for safety

# Date column conversion
df_final['Fec. Precio'] = pd.to_datetime(df_final['Fec. Precio'], format='%d/%m/%Y', errors='coerce')

# Convert code columns to string (after dropping potential floats)
code_cols = ['Troquel', 'Codebar']
for col in code_cols:
    df_final[col] = df_final[col].fillna(0).astype(str).str.replace(r'\.0$', '', regex=True) # Remove potential '.0' from conversion

# 4. Show the result
print("✅ Proceso de filtrado y limpieza finalizado.")
print("\nColumnas remanentes y tipos de datos después de la limpieza:")
print(df_final.info())
print("\nPrimeros 5 registros del nuevo DataFrame limpio:")
print(df_final.head())

# 5. Save the final clean dataset to CSV
output_filename = "Base_Datos_Productos_Argentina_Final.csv"
df_final.to_csv(
    output_filename,
    sep=';',
    index=False,
    encoding='latin1' # Use latin1 to ensure compatibility with local systems if needed, or UTF-8. Sticking to latin1 for output as it was the input encoding.
)