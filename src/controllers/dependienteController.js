// src/controllers/dependienteController.js
const pool = require('../config/db');

const dependienteController = {
    // Crear un nuevo dependiente para un usuario específico
    crearDependiente: async (req, res) => {
        const { usuarioId } = req.params; // ID del usuario principal
        const {
            parentesco, solicita_cobertura, nombres, apellidos, sexo,
            // direccion, // <-- ¡ELIMINAR ESTA LÍNEA!
            fecha_nacimiento, social, estatus_migratorio, medicare_medicaid,
            estado, condado, ciudad
        } = req.body;

        try {
            const [result] = await pool.execute(
                `INSERT INTO dependientes (usuario_id, parentesco, solicita_cobertura, nombres, apellidos, sexo,
                    fecha_nacimiento, social, estatus_migratorio, medicare_medicaid,
                    estado, condado, ciudad)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, // <-- ¡AHORA SON 13 placeholders!
                [usuarioId, parentesco, solicita_cobertura, nombres, apellidos, sexo,
                    fecha_nacimiento, social, estatus_migratorio, medicare_medicaid,
                    estado, condado, ciudad] // <-- ¡AHORA SON 13 valores!
            );
            res.status(201).json({ message: 'Dependiente creado con éxito', dependienteId: result.insertId });
        } catch (error) {
            console.error('Error al crear dependiente:', error);
            res.status(500).json({ message: 'Error interno del servidor al crear dependiente' });
        }
    },

    // Obtener todos los dependientes de un usuario
    getDependientesByUsuario: async (req, res) => {
        const { usuarioId } = req.params;
        try {
            // Seleccionar TODOS los campos EXCEPTO direccion (o solo los que necesitas explícitamente)
            const [rows] = await pool.execute('SELECT id, usuario_id, parentesco, solicita_cobertura, nombres, apellidos, sexo, fecha_nacimiento, social, estatus_migratorio, medicare_medicaid, estado, condado, ciudad FROM dependientes WHERE usuario_id = ?', [usuarioId]);
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
            // Seleccionar TODOS los campos EXCEPTO direccion
            const [rows] = await pool.execute('SELECT id, usuario_id, parentesco, solicita_cobertura, nombres, apellidos, sexo, fecha_nacimiento, social, estatus_migratorio, medicare_medicaid, estado, condado, ciudad FROM dependientes WHERE id = ?', [id]);
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
            // direccion, // <-- ¡ELIMINAR ESTA LÍNEA!
            fecha_nacimiento, social, estatus_migratorio, medicare_medicaid,
            estado, condado, ciudad
        } = req.body;

        try {
            const [result] = await pool.execute(
                `UPDATE dependientes SET
                parentesco = ?, solicita_cobertura = ?, nombres = ?, apellidos = ?, sexo = ?,
                fecha_nacimiento = ?, social = ?, estatus_migratorio = ?, medicare_medicaid = ?,
                estado = ?, condado = ?, ciudad = ?
                 WHERE id = ?`,
                [parentesco, solicita_cobertura, nombres, apellidos, sexo,
                    fecha_nacimiento, social, estatus_migratorio, medicare_medicaid,
                    estado, condado, ciudad, id]
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
    
    // Eliminar un dependiente por su ID (no necesita cambios)
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
    }
};

module.exports = dependienteController;