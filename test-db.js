// test-db.js
require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
    host: 'localhost', // Cambiado de 127.0.0.1 a localhost
    port: 5433,        // Asegúrate que en el .env diga 5433
    user: 'secure_fortress_user',
    password: 'secure_fortress_password',
    database: 'secure_fortress',
});

client.connect()
  .then(() => {
    console.log("✅ ¡CONEXIÓN EXITOSA DESDE NODE!");
    process.exit(0);
  })
  .catch(err => {
    console.error("❌ ERROR DE CONEXIÓN:", err.message);
    process.exit(1);
  });