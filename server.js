const express = require('express');
const db = require('./db');
const cors = require('cors');

const app = express();

app.use(cors({
    origin: ['http://127.0.0.1:5500', 'http://localhost:5500'],
}));

app.use(express.json());

app.use('/api/citas', require('./routes/citas'));

app.get('/', (req, res) => {
    res.json({ mensaje: 'API de reservas activa' });
});

app.get('/api/prueba-db', async (req, res) => {
    try {
        const [resultado] = await db.query('SELECT 1 AS conexion');

        res.json({
            mensaje: 'Conexión a MySQL correcta',
            prueba: resultado[0].conexion,
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ mensaje: 'No se pudo conectar a MySQL' });
    }
});

const puerto = process.env.PORT || 3000;

app.listen(puerto, () => {
    console.log(`API disponible en http://localhost:${puerto}`);
});