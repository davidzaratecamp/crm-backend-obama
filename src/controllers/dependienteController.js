const pool = require('../config/db');

const dependienteController = {
    // Crear un nuevo dependiente para un usuario específico
    crearDependiente: async (req, res) => {
        const { usuarioId } = req.params; // ID del usuario principal
        const {
            parentesco, solicita_cobertura, nombres, apellidos, sexo,
            fecha_nacimiento, social, estatus_migratorio, medicare_medicaid
        } = req.body;

        try {
            const [result] = await pool.execute(
                `INSERT INTO dependientes (usuario_id, parentesco, solicita_cobertura, nombres, apellidos, sexo,
                    fecha_nacimiento, social, estatus_migratorio, medicare_medicaid)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [usuarioId, parentesco, solicita_cobertura, nombres, apellidos, sexo,
                    fecha_nacimiento, social, estatus_migratorio, medicare_medicaid] // ¡CORREGIDO AQUÍ!
            );
            res.status(201).json({ message: 'Dependiente creado con éxito', dependienteId: result.insertId });
        } catch (error) {
            console.error('Error al crear dependiente:', error);
            res.status(500).json({ message: 'Error interno del servidor al crear dependiente' });
        }
    },

    // Obtener todos los dependientes de un usuario (ahora podría incluir el cónyuge si no se filtra)
    getDependientesByUsuario: async (req, res) => {
        const { usuarioId } = req.params;
        try {
            const [rows] = await pool.execute(
                `SELECT
                    id, usuario_id, parentesco, solicita_cobertura, nombres, apellidos, sexo,
                    fecha_nacimiento, social, estatus_migratorio, medicare_medicaid,
                    created_at, updated_at
                FROM dependientes
                WHERE usuario_id = ?`,
                [usuarioId]
            );
            res.status(200).json(rows);
        } catch (error) {
            console.error('Error al obtener dependientes por usuario:', error);
            res.status(500).json({ message: 'Error interno del servidor al obtener dependientes' });
        }
    },

    // Obtener un dependiente por ID (del dependiente)
    getDependienteById: async (req, res) => {
        const { id } = req.params;
        try {
            const [rows] = await pool.execute(
                `SELECT
                    id, usuario_id, parentesco, solicita_cobertura, nombres, apellidos, sexo,
                    fecha_nacimiento, social, estatus_migratorio, medicare_medicaid,
                    created_at, updated_at
                FROM dependientes
                WHERE id = ?`,
                [id]
            );
            if (rows.length === 0) {
                return res.status(404).json({ message: 'Dependiente no encontrado' });
            }
            res.status(200).json(rows[0]);
        } catch (error) {
            console.error('Error al obtener dependiente por ID:', error);
            res.status(500).json({ message: 'Error interno del servidor al obtener dependiente' });
        }
    },

    // Actualizar un dependiente
    actualizarDependiente: async (req, res) => {
        const { id } = req.params;
        const {
            parentesco, solicita_cobertura, nombres, apellidos, sexo,
            fecha_nacimiento, social, estatus_migratorio, medicare_medicaid
        } = req.body;

        try {
            const [result] = await pool.execute(
                `UPDATE dependientes SET
                parentesco = ?, solicita_cobertura = ?, nombres = ?, apellidos = ?, sexo = ?,
                fecha_nacimiento = ?, social = ?, estatus_migratorio = ?, medicare_medicaid = ?
                 WHERE id = ?`,
                [parentesco, solicita_cobertura, nombres, apellidos, sexo,
                    fecha_nacimiento, social, estatus_migratorio, medicare_medicaid, id]
            );
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Dependiente no encontrado' });
            }
            res.status(200).json({ message: 'Dependiente actualizado con éxito' });
        } catch (error) {
            console.error('Error al actualizar dependiente:', error);
            res.status(500).json({ message: 'Error interno del servidor al actualizar dependiente' });
        }
    },

    // Eliminar un dependiente por su ID
    eliminarDependiente: async (req, res) => {
        const { id } = req.params;
        try {
            const [result] = await pool.execute('DELETE FROM dependientes WHERE id = ?', [id]);
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Dependiente no encontrado' });
            }
            res.status(200).json({ message: 'Dependiente eliminado con éxito' });
        } catch (error) {
            console.error('Error al eliminar dependiente:', error);
            res.status(500).json({ message: 'Error interno del servidor al eliminar dependiente' });
        }
    },

    // NUEVA FUNCIÓN: Obtener un dependiente por userId y parentesco (para el Cónyuge)
    getDependienteByUserIdAndParentesco: async (req, res) => {
        const { userId, parentesco } = req.params; // parentesco debería ser 'Cónyuge'
        try {
            const [rows] = await pool.execute(
                `SELECT
                    id, usuario_id, parentesco, solicita_cobertura, nombres, apellidos, sexo,
                    fecha_nacimiento, social, estatus_migratorio, medicare_medicaid,
                    created_at, updated_at
                FROM dependientes
                WHERE usuario_id = ? AND parentesco = ?`,
                [userId, parentesco]
            );
            // Si no se encuentra, rows será un array vacío
            if (rows.length === 0) {
                // Devolvemos un 200 con array vacío o null para que el frontend sepa que no hay cónyuge,
                // en lugar de un 404 que podría indicar un error de la API.
                return res.status(200).json(null); // O [] si el frontend espera un array vacío
            }
            res.status(200).json(rows[0]); // Devuelve el primer (y debería ser el único) resultado
        } catch (error) {
            console.error('Error al obtener dependiente por userId y parentesco:', error);
            res.status(500).json({ message: 'Error interno del servidor al obtener dependiente.' });
        }
    },

    // NUEVA FUNCIÓN: Obtener dependientes de un usuario, excluyendo al cónyuge
    getDependientesExcludingConyuge: async (req, res) => {
        const { userId } = req.params;
        try {
            const [rows] = await pool.execute(
                `SELECT
                    id, usuario_id, parentesco, solicita_cobertura, nombres, apellidos, sexo,
                    fecha_nacimiento, social, estatus_migratorio, medicare_medicaid,
                    created_at, updated_at
                FROM dependientes
                WHERE usuario_id = ? AND parentesco != 'Cónyuge'`, // Filtra por parentesco
                [userId]
            );
            res.status(200).json(rows);
        } catch (error) {
            console.error('Error al obtener dependientes excluyendo cónyuge:', error);
            res.status(500).json({ message: 'Error interno del servidor al obtener dependientes.' });
        }
    }
};

module.exports = dependienteController;