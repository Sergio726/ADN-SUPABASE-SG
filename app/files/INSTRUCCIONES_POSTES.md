# 📋 Instrucciones para Importar Postes

## 📁 Archivos Necesarios

1. **`app/files/Postes.xlsx`** - Archivo Excel con la plantilla (ya creado)
2. **`scripts/importar-postes-excel.js`** - Script de importación (ya creado)

## 📝 Pasos para Completar la Plantilla

### 1. Abrir el archivo Excel
Abre `app/files/Postes.xlsx` en Excel o cualquier programa compatible.

### 2. Columnas a Completar

#### Columnas Obligatorias:

- **Articulo Detalle**: Nombre completo del poste
  - Ejemplo: `Poste de Hormigón con Ménsula 2.0m`
  - Ejemplo: `Poste de Hormigón Punta Diamante 2.5m`
  - Ejemplo: `Poste de Eucalipto 3.0m`
  - Ejemplo: `Puntal de Hormigón 2.0m`

- **Unidad**: Unidad de medida
  - Generalmente: `unidad`
  - También puede ser: `metro`, `m2`, etc.

- **Dimensiones**: Descripción de dimensiones (opcional pero recomendado)
  - Ejemplo: `2.0m altura, ménsula incluida`
  - Ejemplo: `2.5m altura, punta diamante`
  - Ejemplo: `3.0m altura, eucalipto tratado`

- **Precio Costo(neto + impuestos)**: Precio de compra + impuestos
  - Ejemplo: `15000` (sin decimales si son enteros)
  - Ejemplo: `15250.50` (con decimales si es necesario)

#### Columnas de Precios (Opcionales - se calculan automáticamente):

- **Precio Efectivo/Transf.**: Precio base (efectivo)
  - Si lo dejas en 0, se calculará como: `Costo × 1.56`
  - Si lo completas, ese será el precio base usado

- **Precio Venta/Lista**: Precio con factura
  - Se calcula automáticamente como: `Precio Base × 1.21`
  - Puedes dejarlo en 0

- **Precio Tarjeta**: Precio con tarjeta
  - Se calcula automáticamente como: `Precio Base × 1.3`
  - Puedes dejarlo en 0

### 3. Ejemplos de Postes a Agregar

#### Postes de Hormigón:
- Poste de Hormigón con Ménsula 2.0m
- Poste de Hormigón con Ménsula 2.5m
- Poste de Hormigón con Ménsula 3.0m
- Poste de Hormigón Punta Diamante 2.0m
- Poste de Hormigón Punta Diamante 2.5m
- Poste de Hormigón Punta Diamante 3.0m

#### Postes de Eucalipto:
- Poste de Eucalipto 2.0m
- Poste de Eucalipto 2.5m
- Poste de Eucalipto 3.0m
- Poste de Eucalipto 3.5m

#### Puntales:
- Puntal de Hormigón 2.0m
- Puntal de Hormigón 2.5m
- Puntal de Hormigón 3.0m
- Puntal de Hormigón 3.5m

#### Otros tipos:
- Poste de Metal 2.0m
- Poste de Madera 2.5m
- Poste de Hormigón Simple 2.0m
- etc.

### 4. Agregar o Eliminar Filas

- **Agregar**: Inserta nuevas filas y completa los datos
- **Eliminar**: Elimina las filas de ejemplo que no necesites
- **Modificar**: Cambia los nombres de los artículos según tus productos reales

### 5. Validar los Datos

Antes de importar, verifica:
- ✅ Todos los nombres están completos
- ✅ Todos los precios de costo están ingresados
- ✅ Las unidades son correctas
- ✅ No hay filas vacías (excepto las que quieras ignorar)

## 🚀 Importar los Postes

Una vez que hayas completado el archivo Excel:

```bash
node scripts/importar-postes-excel.js
```

### Qué hace el script:

1. ✅ Lee el archivo `app/files/Postes.xlsx`
2. ✅ Crea o actualiza artículos en la tabla `articulos`
3. ✅ Asigna categoría "Postes" automáticamente
4. ✅ Configura alturas compatibles según la altura del poste
5. ✅ Crea precios en `precios_venta` con el precio base (efectivo)
6. ✅ Marca los artículos como publicados
7. ✅ Habilita mostrar precio público

### Política de Precios Aplicada:

- **Precio Base (Efectivo)**: 
  - Si lo proporcionaste: se usa ese valor
  - Si está en 0: se calcula como `Costo × 1.56` (margen 56%)

- **Precios Derivados** (se calculan automáticamente):
  - Factura/Lista: `Precio Base × 1.21`
  - Tarjeta: `Precio Base × 1.3`
  - E-cheq 45: `Precio Base × 1.21`
  - E-cheq 60: `Precio Base × 1.3`
  - E-cheq 90: `Precio Base × 1.4`

## 📊 Después de la Importación

1. Ve a: `http://localhost:3000/dashboard/articulos`
2. Verifica que los postes aparezcan correctamente
3. Revisa los precios en `http://localhost:3000/dashboard/precios`
4. Los postes estarán disponibles para usar en presupuestos

## ⚠️ Notas Importantes

- Los postes importados se marcan como **publicados** por defecto
- Los precios se marcan como **vigentes** automáticamente
- Si un poste ya existe (mismo nombre), se actualizará en lugar de crear uno nuevo
- Las alturas compatibles se asignan automáticamente según la altura especificada en el nombre

## 🆘 Solución de Problemas

### Error: "No se encuentra el archivo"
- Verifica que el archivo esté en `app/files/Postes.xlsx`
- Asegúrate de que el archivo no esté abierto en Excel

### Error: "Faltan variables de entorno"
- Verifica que exista el archivo `.env.local`
- Asegúrate de que tenga `NEXT_PUBLIC_SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`

### Los precios no se importan correctamente
- Verifica que los precios de costo sean números válidos
- Asegúrate de que no haya caracteres especiales en los números
- Usa punto (.) para decimales, no coma (,)

## 📞 Soporte

Si tienes problemas, revisa:
1. Los logs del script en la consola
2. La tabla `articulos` en Supabase
3. La tabla `precios_venta` en Supabase

