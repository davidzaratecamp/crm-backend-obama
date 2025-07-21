// backend/src/controllers/planSaludController.js
const pool = require('../config/db');

const planSaludController = {
    // Crear o Actualizar (Upsert) un plan de salud para un usuario
    // Ahora recibe usuario_id en el cuerpo para ser consistente con el PUT
    crearOActualizarPlanSalud: async (req, res) => {
        const { usuario_id, aseguradora, nombre_plan, tipo_plan, deducible, gasto_max_bolsillo, valor_prima } = req.body;

        if (!usuario_id || !aseguradora || !nombre_plan || !tipo_plan || !valor_prima) {
            return res.status(400).json({ message: 'Todos los campos obligatorios deben ser proporcionados.' });
        }
        if (parseFloat(valor_prima) < 0) { // Validación de valor_prima
            return res.status(400).json({ message: 'El valor de la prima no puede ser negativo.' });
        }
        if (deducible !== null && parseFloat(deducible) < 0) { // Validación para campos opcionales
            return res.status(400).json({ message: 'El deducible no puede ser negativo.' });
        }
        if (gasto_max_bolsillo !== null && parseFloat(gasto_max_bolsillo) < 0) { // Validación para campos opcionales
            return res.status(400).json({ message: 'El gasto máximo de bolsillo no puede ser negativo.' });
        }

        try {
            // Verificar si ya existe un plan para este usuario
            const [existingPlanRows] = await pool.execute(
                'SELECT id FROM planes_salud WHERE usuario_id = ?',
                [usuario_id]
            );

            if (existingPlanRows.length > 0) {
                // Si existe, actualizarlo (comportamiento de PUT)
                const planId = existingPlanRows[0].id;
                await pool.execute(
                    `UPDATE planes_salud SET
                     aseguradora = ?, nombre_plan = ?, tipo_plan = ?, deducible = ?, gasto_max_bolsillo = ?, valor_prima = ?
                     WHERE id = ?`,
                    [aseguradora, nombre_plan, tipo_plan, deducible, gasto_max_bolsillo, valor_prima, planId]
                );
                return res.status(200).json({ message: 'Plan de salud actualizado con éxito', planId: planId });
            } else {
                // Si no existe, crearlo (comportamiento de POST)
                const [result] = await pool.execute(
                    `INSERT INTO planes_salud (usuario_id, aseguradora, nombre_plan, tipo_plan, deducible, gasto_max_bolsillo, valor_prima)
                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [usuario_id, aseguradora, nombre_plan, tipo_plan, deducible, gasto_max_bolsillo, valor_prima]
                );
                return res.status(201).json({ message: 'Plan de salud registrado con éxito', planId: result.insertId });
            }

        } catch (error) {
            console.error('Error al guardar/actualizar plan de salud:', error);
            // Si hay un error de clave duplicada a nivel de DB (si añades un UNIQUE INDEX a usuario_id)
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ message: 'Ya existe un plan de salud para este usuario.' });
            }
            res.status(500).json({ message: 'Error interno del servidor al guardar/actualizar plan de salud' });
        }
    },

    // Obtener plan de salud por ID de usuario
    // Renombrado para reflejar que se busca el plan de UN usuario específico
    getPlanSaludByUsuarioId: async (req, res) => {
        const { usuarioId } = req.params;
        try {
            // Asumiendo que solo hay un plan por usuario, el frontend espera un array
            const [rows] = await pool.execute('SELECT * FROM planes_salud WHERE usuario_id = ?', [usuarioId]);
            res.status(200).json(rows); // Devolver siempre un array, incluso si está vacío
        } catch (error) {
            console.error('Error al obtener plan de salud por usuario ID:', error);
            res.status(500).json({ message: 'Error interno del servidor al obtener plan de salud' });
        }
    },

    // Estos métodos ya no serían necesarios si crearOActualizarPlanSalud maneja todo.
    // Sin embargo, los mantendremos por si en el futuro se necesita manipular planes por su propio ID
    // pero el frontend no los usará directamente para guardar.

    // Obtener un plan de salud por ID (ID del plan, no del usuario)
    getPlanSaludById: async (req, res) => {
        const { id } = req.params;
        try {
            const [rows] = await pool.execute('SELECT * FROM planes_salud WHERE id = ?', [id]);
            if (rows.length === 0) {
                return res.status(404).json({ message: 'Plan de salud no encontrado' });
            }
            res.status(200).json(rows[0]);
        } catch (error) {
            console.error('Error al obtener plan de salud por ID:', error);
            res.status(500).json({ message: 'Error interno del servidor al obtener plan de salud' });
        }
    },

    // Actualizar un plan de salud por su ID (si se fuera a actualizar un plan específico sin relación directa con el usuario logueado en ese momento)
    actualizarPlanSaludById: async (req, res) => { // Renombrado para evitar confusión
        const { id } = req.params;
        const { aseguradora, nombre_plan, tipo_plan, deducible, gasto_max_bolsillo, valor_prima } = req.body;

        if (!aseguradora || !nombre_plan || !tipo_plan || !valor_prima) {
            return res.status(400).json({ message: 'Todos los campos obligatorios deben ser proporcionados.' });
        }
        if (parseFloat(valor_prima) < 0) {
            return res.status(400).json({ message: 'El valor de la prima no puede ser negativo.' });
        }
        if (deducible !== null && parseFloat(deducible) < 0) {
            return res.status(400).json({ message: 'El deducible no puede ser negativo.' });
        }
        if (gasto_max_bolsillo !== null && parseFloat(gasto_max_bolsillo) < 0) {
            return res.status(400).json({ message: 'El gasto máximo de bolsillo no puede ser negativo.' });
        }

        try {
            const [result] = await pool.execute(
                `UPDATE planes_salud SET
                 aseguradora = ?, nombre_plan = ?, tipo_plan = ?, deducible = ?, gasto_max_bolsillo = ?, valor_prima = ?
                 WHERE id = ?`,
                [aseguradora, nombre_plan, tipo_plan, deducible, gasto_max_bolsillo, valor_prima, id]
            );
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Plan de salud no encontrado' });
            }
            res.status(200).json({ message: 'Plan de salud actualizado con éxito' });
        } catch (error) {
            console.error('Error al actualizar plan de salud por ID:', error);
            res.status(500).json({ message: 'Error interno del servidor al actualizar plan de salud' });
        }
    },

    // Eliminar un plan de salud (por ID del plan)
    eliminarPlanSalud: async (req, res) => {
        const { id } = req.params;
        try {
            const [result] = await pool.execute('DELETE FROM planes_salud WHERE id = ?', [id]);
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Plan de salud no encontrado' });
            }
            res.status(200).json({ message: 'Plan de salud eliminado con éxito' });
        } catch (error) {
            console.error('Error al eliminar plan de salud:', error);
            res.status(500).json({ message: 'Error interno del servidor al eliminar plan de salud' });
        }
    }
};

module.exports = planSaludController;