const express = require('express');
const db = require('../db');

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const [citas] = await db.query(
            'SELECT * FROM citas ORDER BY fecha, hora'
        );

        res.json(citas);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ mensaje: 'No se pudieron consultar las citas' });
    }
});

router.post('/', async (req, res) => {
    const {
        nombre_cliente,
        telefono,
        servicio,
        fecha,
        hora,
    } = req.body;

    const campos = [nombre_cliente, telefono, servicio, fecha, hora];

    if (campos.some(campo => typeof campo !== 'string' || !campo.trim())) {
        return res.status(400).json({
            mensaje: 'Todos los campos son obligatorios',
        });
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha) || !/^\d{2}:\d{2}$/.test(hora)) {
        return res.status(400).json({
            mensaje: 'La fecha debe ser AAAA-MM-DD y la hora HH:MM',
        });
    }

    try {
        const [ocupadas] = await db.query(
            `SELECT id FROM citas
             WHERE fecha = ? AND hora = ? AND estado <> 'cancelada'
             LIMIT 1`,
            [fecha, hora]
        );

        if (ocupadas.length > 0) {
            return res.status(409).json({
                mensaje: 'Ese horario ya está ocupado',
            });
        }

        const [resultado] = await db.query(
            `INSERT INTO citas
             (nombre_cliente, telefono, servicio, fecha, hora)
             VALUES (?, ?, ?, ?, ?)`,
            [
                nombre_cliente.trim(),
                telefono.trim(),
                servicio.trim(),
                fecha,
                hora,
            ]
        );

        res.status(201).json({
            mensaje: 'Cita registrada correctamente',
            id: resultado.insertId,
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ mensaje: 'No se pudo registrar la cita' });
    }
});

router.put('/:id', async (req, res) => {
    const id = req.params.id;
    const { nombre_cliente, telefono, servicio, fecha, hora } = req.body;
    const campos = [nombre_cliente, telefono, servicio, fecha, hora];

    if (campos.some(campo => typeof campo !== 'string' || !campo.trim())) {
        return res.status(400).json({
            mensaje: 'Todos los campos son obligatorios',
        });
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha) || !/^\d{2}:\d{2}$/.test(hora)) {
        return res.status(400).json({
            mensaje: 'La fecha debe ser AAAA-MM-DD y la hora HH:MM',
        });
    }

    try {
        const [citasEncontradas] = await db.query(
            'SELECT estado FROM citas WHERE id = ?',
            [id]
        );

        if (citasEncontradas.length === 0) {
            return res.status(404).json({ mensaje: 'No se encontró la cita' });
        }

        if (citasEncontradas[0].estado === 'cancelada') {
            return res.status(409).json({
                mensaje: 'No se puede editar una cita cancelada',
            });
        }

        const [horariosOcupados] = await db.query(
            `SELECT id FROM citas
             WHERE fecha = ? AND hora = ? AND estado <> 'cancelada' AND id <> ?
             LIMIT 1`,
            [fecha, hora, id]
        );

        if (horariosOcupados.length > 0) {
            return res.status(409).json({
                mensaje: 'Ese horario ya está ocupado',
            });
        }

        await db.query(
            `UPDATE citas
             SET nombre_cliente = ?, telefono = ?, servicio = ?, fecha = ?, hora = ?
             WHERE id = ?`,
            [
                nombre_cliente.trim(),
                telefono.trim(),
                servicio.trim(),
                fecha,
                hora,
                id,
            ]
        );

        res.json({ mensaje: 'Cita actualizada correctamente' });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ mensaje: 'No se pudo actualizar la cita' });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const [resultado] = await db.query(
            `UPDATE citas
             SET estado = 'cancelada'
             WHERE id = ? AND estado <> 'cancelada'`,
            [req.params.id]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                mensaje: 'No se encontró una cita activa con ese ID',
            });
        }

        res.json({ mensaje: 'Cita cancelada correctamente' });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ mensaje: 'No se pudo cancelar la cita' });
    }
});

module.exports = router;