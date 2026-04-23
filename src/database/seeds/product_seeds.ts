import { type Knex } from "knex";

/**
 * Datos de ejemplo (RF-03). Texto sin emojis; `sku_alfanumerico` alfanumerico.
 * Idempotente por `sku_alfanumerico` (ON CONFLICT ... MERGE).
 */
const SAMPLE_PRODUCTS: ReadonlyArray<{
  sku_alfanumerico: string;
  nombre: string;
  descripcion: string;
  cantidad: number;
  precio: number;
}> = [
  {
    sku_alfanumerico: "SF001",
    nombre: "Candado de acero",
    descripcion: "Candado resistente para uso interior y exterior.",
    cantidad: 40,
    precio: 24.5,
  },
  {
    sku_alfanumerico: "SF002",
    nombre: "Cinta metrica 5m",
    descripcion: "Cinta con bloqueo automatico y gancho magnetico.",
    cantidad: 120,
    precio: 12.99,
  },
  {
    sku_alfanumerico: "SF003",
    nombre: "Guantes de trabajo",
    descripcion: "Guantes reforzados, talla unica ajustable.",
    cantidad: 200,
    precio: 8.75,
  },
  {
    sku_alfanumerico: "SF004",
    nombre: "Martillo de garra",
    descripcion: "Martillo con mango ergonomico de fibra.",
    cantidad: 35,
    precio: 18.0,
  },
  {
    sku_alfanumerico: "SF005",
    nombre: "Destornillador set 6 piezas",
    descripcion: "Juego de puntas intercambiables en estuche rigido.",
    cantidad: 60,
    precio: 15.4,
  },
  {
    sku_alfanumerico: "SF006",
    nombre: "Linterna LED",
    descripcion: "Linterna compacta, tres modos de intensidad.",
    cantidad: 85,
    precio: 22.1,
  },
  {
    sku_alfanumerico: "SF007",
    nombre: "Cinta adhesiva doble cara",
    descripcion: "Rollo de 10 metros, adhesion fuerte.",
    cantidad: 150,
    precio: 6.25,
  },
  {
    sku_alfanumerico: "SF008",
    nombre: "Nivel de burbuja 30cm",
    descripcion: "Nivel magnetico con tres burbujas de lectura.",
    cantidad: 45,
    precio: 11.3,
  },
  {
    sku_alfanumerico: "SF009",
    nombre: "Casco de seguridad",
    descripcion: "Casco ajustable con barboquejo y ventilacion.",
    cantidad: 28,
    precio: 31.9,
  },
  {
    sku_alfanumerico: "SF010",
    nombre: "Gafas de proteccion",
    descripcion: "Gafas antiempanante y antiarano.",
    cantidad: 95,
    precio: 9.6,
  },
  {
    sku_alfanumerico: "SF011",
    nombre: "Extension electrica 5m",
    descripcion: "Extension con tres tomas y proteccion termica.",
    cantidad: 22,
    precio: 27.45,
  },
];

export async function seed(knex: Knex): Promise<void> {
  for (const product of SAMPLE_PRODUCTS) {
    await knex("products")
      .insert({
        sku_alfanumerico: product.sku_alfanumerico,
        nombre: product.nombre,
        descripcion: product.descripcion,
        cantidad: product.cantidad,
        precio: product.precio,
      })
      .onConflict("sku_alfanumerico")
      .merge({
        nombre: product.nombre,
        descripcion: product.descripcion,
        cantidad: product.cantidad,
        precio: product.precio,
        updated_at: knex.fn.now(),
      });

    console.log(`[product_seeds] Producto listo: ${product.sku_alfanumerico} - ${product.nombre}`);
  }
}
