const bcrypt = require('bcrypt');
const password = 'SecureAdmin1234!'; // 12+ caracteres para el frontend
const saltRounds = 12; // Cumpliendo RF-02

bcrypt.hash(password, saltRounds, (err, hash) => {
    console.log("TU HASH REGLAMENTARIO:");
    console.log(hash);
});