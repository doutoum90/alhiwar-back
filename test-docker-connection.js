// test-docker-connection.js
require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
});

console.log(`🔗 Test connexion: ${process.env.DB_USERNAME}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_DATABASE}`);

client.connect()
    .then(() => {
        console.log('✅ Connexion Docker PostgreSQL réussie !');
        return client.query('SELECT version()');
    })
    .then(result => {
        console.log('🗄️ PostgreSQL:', result.rows[0].version.split(' ')[0]);
    })
    .catch(err => {
        console.error('❌ Erreur:', err.message);
    })
    .finally(() => client.end());