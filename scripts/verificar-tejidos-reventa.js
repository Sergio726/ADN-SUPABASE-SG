/**
 * Verificación posterior a la migración 20260808_tejidos_reventa.sql
 *
 * Solo lee: no modifica nada. Comprueba que
 *   - las SKUs de Marcelo (cal.14 + cal.12) quedaron en origen = 'reventa' con los precios esperados
 *     (precio_costo = precio_compra y precio_venta = compra × (1 + margen/100)),
 *   - los tejidos fabricados conservan su lógica,
 *   - la vista v_tejidos_con_precios expone las columnas nuevas,
 *   - qué configuraciones de cercado quedaron con precios viejos y hay que recalcular.
 *
 * Uso: node scripts/verificar-tejidos-reventa.js
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Lista de compra de Marcelo Rojas (cal.14 + cal.12, rollo 10 m)
const LISTA_MARCELO = {
  // Calibre 14
  'TR-1.2-3.5-14': 40000,
  'TR-1.5-3.5-14': 45000,
  'TR-1.8-3.5-14': 55000,
  'TR-2.0-3.5-14': 58000,
  'TR-1.2-3.0-14': 45200,
  'TR-1.5-3.0-14': 52800,
  'TR-1.8-3.0-14': 60300,
  'TR-2.0-3.0-14': 65000,
  'TR-1.2-2.5-14': 49500,
  'TR-1.5-2.5-14': 58000,
  'TR-1.8-2.5-14': 68000,
  'TR-2.0-2.5-14': 72600,
  'TR-1.2-2.0-14': 58500,
  'TR-1.5-2.0-14': 69000,
  'TR-1.8-2.0-14': 79800,
  'TR-2.0-2.0-14': 87000,
  // Calibre 12 — rombo 3"
  'TR-1.0-3.0-12': 50000,
  'TR-1.2-3.0-12': 57000,
  'TR-1.5-3.0-12': 67500,
  'TR-1.8-3.0-12': 78000,
  'TR-2.0-3.0-12': 85000,
  // Calibre 12 — rombo 2.5"
  'TR-1.0-2.5-12': 60500,
  'TR-1.2-2.5-12': 71000,
  'TR-1.5-2.5-12': 85000,
  'TR-1.8-2.5-12': 99000,
  'TR-2.0-2.5-12': 106000,
  // Calibre 12 — rombo 2"
  'TR-1.0-2.0-12': 71000,
  'TR-1.2-2.0-12': 85000,
  'TR-1.5-2.0-12': 99000,
  'TR-1.8-2.0-12': 116500,
  'TR-2.0-2.0-12': 127000,
};

const EXPECTED_REVENTA = Object.keys(LISTA_MARCELO).length;

const money = (n) => '$' + Number(n || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

async function verificar() {
  let errores = 0;

  console.log('\n🔍 VERIFICACIÓN — TEJIDOS EN MODO REVENTA');
  console.log('='.repeat(96));

  // ---------------------------------------------------------------- Tejidos
  const { data: tejidos, error } = await supabase
    .from('tejidos_configuraciones')
    .select('codigo, origen, proveedor_id, precio_compra, precio_costo, precio_venta, margen_efectivo, cantidad_alambre, costo_mano_obra, activo')
    .order('codigo');

  if (error) {
    console.error('\n❌ No se pudo leer tejidos_configuraciones:', error.message);
    if (error.message.includes('origen')) {
      console.error('   ¿Aplicaste la migración 20260808_tejidos_reventa.sql en el SQL Editor de Supabase?');
    }
    process.exit(1);
  }

  const reventa = tejidos.filter((t) => t.origen === 'reventa');
  const fabricados = tejidos.filter((t) => t.origen !== 'reventa');

  console.log(`\n📊 Total: ${tejidos.length} | Reventa: ${reventa.length} | Fabricados: ${fabricados.length}`);

  if (reventa.length !== EXPECTED_REVENTA) {
    console.log(`\n⚠️  Se esperaban ${EXPECTED_REVENTA} tejidos de reventa y hay ${reventa.length}.`);
    errores++;
  }

  console.log('\n📦 TEJIDOS DE REVENTA');
  console.log('-'.repeat(96));
  console.log('Código'.padEnd(18) + 'Compra'.padStart(14) + 'Costo'.padStart(16) + 'Venta'.padStart(16) + '  Estado');
  console.log('-'.repeat(96));

  for (const t of reventa) {
    const esperadoCompra = LISTA_MARCELO[t.codigo];
    const margen = Number(t.margen_efectivo ?? 45);
    const ventaEsperada = Math.round(Number(t.precio_compra || 0) * (100 + margen)) / 100;

    const problemas = [];
    if (esperadoCompra === undefined) {
      problemas.push('no está en la lista de Marcelo');
    } else if (Number(t.precio_compra) !== esperadoCompra) {
      problemas.push(`compra ${money(t.precio_compra)} ≠ lista ${money(esperadoCompra)}`);
    }
    if (Number(t.precio_costo) !== Number(t.precio_compra)) {
      problemas.push('costo ≠ compra');
    }
    if (Math.abs(Number(t.precio_venta) - ventaEsperada) > 0.02) {
      problemas.push(`venta ${money(t.precio_venta)} ≠ esperada ${money(ventaEsperada)}`);
    }
    if (!t.proveedor_id) {
      problemas.push('sin proveedor');
    }

    if (problemas.length) errores++;

    console.log(
      t.codigo.padEnd(18) +
      money(t.precio_compra).padStart(14) +
      money(t.precio_costo).padStart(16) +
      money(t.precio_venta).padStart(16) +
      '  ' + (problemas.length ? '❌ ' + problemas.join('; ') : '✅')
    );
  }

  // Fabricados: no deberían tener datos de reventa
  const fabricadosSucios = fabricados.filter((t) => t.precio_compra != null || t.proveedor_id != null);
  console.log('\n🏭 TEJIDOS FABRICADOS');
  console.log('-'.repeat(96));
  console.log(`${fabricados.length} configuraciones conservan la lógica de alambre + mano de obra.`);
  if (fabricadosSucios.length) {
    console.log(`⚠️  ${fabricadosSucios.length} tienen datos de reventa cargados: ${fabricadosSucios.map((t) => t.codigo).join(', ')}`);
    errores++;
  }

  // ------------------------------------------------------------------ Vista
  const { data: vista, error: errorVista } = await supabase
    .from('v_tejidos_con_precios')
    .select('*')
    .limit(1);

  console.log('\n👁️  VISTA v_tejidos_con_precios');
  console.log('-'.repeat(96));
  if (errorVista) {
    console.log('❌ Error al leer la vista:', errorVista.message);
    errores++;
  } else {
    const columnas = Object.keys(vista[0] || {});
    for (const col of ['origen', 'proveedor_id', 'precio_compra', 'proveedor_nombre']) {
      const ok = columnas.includes(col);
      if (!ok) errores++;
      console.log(`${ok ? '✅' : '❌'} ${col}`);
    }
  }

  // ---------------------------------------------------------------- Cercado
  const { data: configs, error: errorCfg } = await supabase
    .from('configuraciones_cercado')
    .select('id, nombre, tejido_config_id, precio_base_180m, actualizado_en, activo');

  console.log('\n🚧 CONFIGURACIONES DE CERCADO QUE USAN TEJIDOS DE REVENTA');
  console.log('-'.repeat(96));

  if (errorCfg) {
    console.log('❌ Error al leer configuraciones_cercado:', errorCfg.message);
    errores++;
  } else {
    const idsReventa = new Set(
      (await supabase.from('tejidos_configuraciones').select('id, origen')).data
        .filter((t) => t.origen === 'reventa')
        .map((t) => t.id)
    );
    const afectadas = configs.filter((c) => idsReventa.has(c.tejido_config_id));

    console.log(`${afectadas.length} de ${configs.length} configuraciones dependen de un tejido de reventa.`);
    afectadas.forEach((c) => {
      console.log(`  • ${c.nombre} — base 180 m: ${money(c.precio_base_180m)} (actualizado ${c.actualizado_en?.slice(0, 10) || 's/d'})`);
    });
    if (afectadas.length) {
      console.log('\n👉 Recalculá sus precios desde /dashboard/cercado con el botón "Recalcular todas".');
    }
  }

  console.log('\n' + '='.repeat(96));
  console.log(errores === 0
    ? '✅ Verificación OK: la migración quedó aplicada como se esperaba.'
    : `❌ Se encontraron ${errores} problemas. Revisá el detalle de arriba.`);
  console.log('');

  process.exit(errores === 0 ? 0 : 1);
}

verificar().catch((error) => {
  console.error('Error inesperado:', error);
  process.exit(1);
});
