const pool = require('../config/db');

const ingresosController = {
    // Crear un nuevo registro de ingreso
    crearIngreso: async (req, res) => {
        const { tipo_entidad, entidad_id, tipo_declaracion, ingresos_semanales } = req.body;
        const ingresos_anuales = ingresos_semanales * 52; // Cálculo en el backend

        try {
            const [result] = await pool.execute(
                `INSERT INTO ingresos (tipo_entidad, entidad_id, tipo_declaracion, ingresos_semanales, ingresos_anuales)
                 VALUES (?, ?, ?, ?, ?)`,
                [tipo_entidad, entidad_id, tipo_declaracion, ingresos_semanales, ingresos_anuales]
            );
            res.status(201).json({ message: 'Ingreso registrado con éxito', ingresoId: result.insertId });
        } catch (error) {
            console.error('Error al registrar ingreso:', error);
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ message: 'Ya existe un registro de ingreso para esta entidad.' });
            }
            res.status(500).json({ message: 'Error interno del servidor al registrar ingreso' });
        }
    },

    // Obtener ingresos por tipo de entidad y ID
    getIngresosByEntidad: async (req, res) => {
        const { tipoEntidad, entidadId } = req.params; // ej. /api/ingresos/Usuario/1 o /api/ingresos/Dependiente/5
        try {
            const [rows] = await pool.execute(
                'SELECT * FROM ingresos WHERE tipo_entidad = ? AND entidad_id = ?',
                [tipoEntidad, entidadId]
            );
            res.status(200).json(rows);
        } catch (error) {
            console.error('Error al obtener ingresos por entidad:', error);
            res.status(500).json({ message: 'Error interno del servidor al obtener ingresos' });
        }
    },

    // Actualizar un registro de ingreso
    actualizarIngreso: async (req, res) => {
        const { id } = req.params; // ID del registro de ingreso
        const { tipo_declaracion, ingresos_semanales } = req.body;
        const ingresos_anuales = ingresos_semanales * 52; // Recalcular

        try {
            const [result] = await pool.execute(
                `UPDATE ingresos SET tipo_declaracion = ?, ingresos_semanales = ?, ingresos_anuales = ? WHERE id = ?`,
                [tipo_declaracion, ingresos_semanales, ingresos_anuales, id]
            );
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Registro de ingreso no encontrado' });
            }
            res.status(200).json({ message: 'Ingreso actualizado con éxito' });
        } catch (error) {
            console.error('Error al actualizar ingreso:', error);
            res.status(500).json({ message: 'Error interno del servidor al actualizar ingreso' });
        }
    },

    // Eliminar un registro de ingreso
    eliminarIngreso: async (req, res) => {
        const { id } = req.params;
        try {
            const [result] = await pool.execute('DELETE FROM ingresos WHERE id = ?', [id]);
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Registro de ingreso no encontrado' });
            }
            res.status(200).json({ message: 'Ingreso eliminado con éxito' });
        } catch (error) {
            console.error('Error al eliminar ingreso:', error);
            res.status(500).json({ message: 'Error interno del servidor al eliminar ingreso' });
        }
    }
};

module.exports = ingresosController;