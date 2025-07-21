// backend/src/controllers/informacionPagoController.js
const pool = require('../config/db');

const informacionPagoController = {
    // Unificar crear y actualizar en una sola función 'upsert'
    crearOActualizarInformacionPago: async (req, res) => {
        const { usuario_id, ultimos_4_digitos_tarjeta, token_pago, fecha_expiracion_mes, fecha_expiracion_ano } = req.body;

        if (!usuario_id || !ultimos_4_digitos_tarjeta || !token_pago || !fecha_expiracion_mes || !fecha_expiracion_ano) {
            return res.status(400).json({ message: 'Todos los campos obligatorios deben ser proporcionados.' });
        }
        if (ultimos_4_digitos_tarjeta.length !== 4 || !/^\d{4}$/.test(ultimos_4_digitos_tarjeta)) {
            return res.status(400).json({ message: 'Los últimos 4 dígitos de la tarjeta deben ser exactamente 4 números.' });
        }
        if (fecha_expiracion_mes < 1 || fecha_expiracion_mes > 12) {
            return res.status(400).json({ message: 'El mes de expiración debe estar entre 1 y 12.' });
        }
        const currentYear = new Date().getFullYear();
        if (fecha_expiracion_ano < currentYear || fecha_expiracion_ano > currentYear + 10) { // Asumiendo un rango razonable
            return res.status(400).json({ message: `El año de expiración debe estar entre ${currentYear} y ${currentYear + 10}.` });
        }
        const today = new Date();
        const expirationDate = new Date(fecha_expiracion_ano, fecha_expiracion_mes - 1, 1); // Meses son 0-index en JS
        if (expirationDate < today) {
            return res.status(400).json({ message: 'La fecha de expiración no puede ser en el pasado.' });
        }


        try {
            // Verificar si ya existe información de pago para este usuario
            const [existingPagoRows] = await pool.execute(
                'SELECT id FROM informacion_pago WHERE usuario_id = ?',
                [usuario_id]
            );

            if (existingPagoRows.length > 0) {
                // Si existe, actualizarlo
                const pagoId = existingPagoRows[0].id;
                await pool.execute(
                    `UPDATE informacion_pago SET
                     ultimos_4_digitos_tarjeta = ?, token_pago = ?, fecha_expiracion_mes = ?, fecha_expiracion_ano = ?
                     WHERE id = ?`,
                    [ultimos_4_digitos_tarjeta, token_pago, fecha_expiracion_mes, fecha_expiracion_ano, pagoId]
                );
                return res.status(200).json({ message: 'Información de pago actualizada con éxito', pagoId: pagoId });
            } else {
                // Si no existe, crearlo
                const [result] = await pool.execute(
                    `INSERT INTO informacion_pago (usuario_id, ultimos_4_digitos_tarjeta, token_pago, fecha_expiracion_mes, fecha_expiracion_ano)
                     VALUES (?, ?, ?, ?, ?)`,
                    [usuario_id, ultimos_4_digitos_tarjeta, token_pago, fecha_expiracion_mes, fecha_expiracion_ano]
                );
                return res.status(201).json({ message: 'Información de pago registrada con éxito', pagoId: result.insertId });
            }

        } catch (error) {
            console.error('Error al guardar/actualizar información de pago:', error);
            // Si hay un error de clave duplicada a nivel de DB (si añades un UNIQUE INDEX a usuario_id en informacion_pago)
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ message: 'Ya existe información de pago para este usuario.' });
            }
            res.status(500).json({ message: 'Error interno del servidor al guardar/actualizar información de pago' });
        }
    },

    // Obtener información de pago de un usuario
    // Esta función ya estaba bien para el GET del frontend
    getInformacionPagoByUsuario: async (req, res) => {
        const { usuarioId } = req.params;
        try {
            const [rows] = await pool.execute('SELECT id, ultimos_4_digitos_tarjeta, fecha_expiracion_mes, fecha_expiracion_ano FROM informacion_pago WHERE usuario_id = ?', [usuarioId]);
            res.status(200).json(rows); // Devolver siempre un array, incluso si está vacío
        } catch (error) {
            console.error('Error al obtener información de pago por usuario:', error);
            res.status(500).json({ message: 'Error interno del servidor al obtener información de pago' });
        }
    },

    // Estos métodos individuales pueden mantenerse si se necesitan para otras operaciones,
    // pero el frontend no los usará para el flujo principal de guardar/actualizar.

    // Actualizar información de pago por ID (si se necesita actualizar un registro de pago específico)
    actualizarInformacionPagoById: async (req, res) => { // Renombrado para evitar confusión
        const { id } = req.params;
        const { ultimos_4_digitos_tarjeta, token_pago, fecha_expiracion_mes, fecha_expiracion_ano } = req.body;

        if (!ultimos_4_digitos_tarjeta || !token_pago || !fecha_expiracion_mes || !fecha_expiracion_ano) {
            return res.status(400).json({ message: 'Todos los campos obligatorios deben ser proporcionados.' });
        }
        if (ultimos_4_digitos_tarjeta.length !== 4 || !/^\d{4}$/.test(ultimos_4_digitos_tarjeta)) {
            return res.status(400).json({ message: 'Los últimos 4 dígitos de la tarjeta deben ser exactamente 4 números.' });
        }
        // Validaciones de fecha de expiración como arriba
        const currentYear = new Date().getFullYear();
        const today = new Date();
        const expirationDate = new Date(fecha_expiracion_ano, fecha_expiracion_mes - 1, 1);
        if (expirationDate < today || fecha_expiracion_mes < 1 || fecha_expiracion_mes > 12 || fecha_expiracion_ano < currentYear || fecha_expiracion_ano > currentYear + 10) {
            return res.status(400).json({ message: 'La fecha de expiración no es válida.' });
        }

        try {
            const [result] = await pool.execute(
                `UPDATE informacion_pago SET
                ultimos_4_digitos_tarjeta = ?, token_pago = ?, fecha_expiracion_mes = ?, fecha_expiracion_ano = ?
                 WHERE id = ?`,
                [ultimos_4_digitos_tarjeta, token_pago, fecha_expiracion_mes, fecha_expiracion_ano, id]
            );
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Información de pago no encontrada' });
            }
            res.status(200).json({ message: 'Información de pago actualizada con éxito' });
        } catch (error) {
            console.error('Error al actualizar información de pago por ID:', error);
            res.status(500).json({ message: 'Error interno del servidor al actualizar información de pago' });
        }
    },

    // Eliminar información de pago
    eliminarInformacionPago: async (req, res) => {
        const { id } = req.params;
        try {
            const [result] = await pool.execute('DELETE FROM informacion_pago WHERE id = ?', [id]);
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Información de pago no encontrada' });
            }
            res.status(200).json({ message: 'Información de pago eliminada con éxito' });
        } catch (error) {
            console.error('Error al eliminar información de pago:', error);
            res.status(500).json({ message: 'Error interno del servidor al eliminar información de pago' });
        }
    }
};

module.exports = informacionPagoController;