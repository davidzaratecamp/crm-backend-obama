const pool = require('../config/db'); // Importa la conexión a la base de datos
const bcrypt = require('bcryptjs'); // Para hashear contraseñas/respuestas de seguridad

const usuarioController = {
    // Crear un nuevo usuario
    crearUsuario: async (req, res) => {
        const {
            solicita_cobertura, nombres, apellidos, sexo, fecha_nacimiento,
            social, estatus_migratorio, tipo_vivienda,
            direccion,
            ciudad, estado, codigo_postal, condado, correo_electronico,
            phone_1, phone_2, origen_venta,
            pregunta_seguridad, respuesta_seguridad
        } = req.body;

        // Validaciones básicas para campos NO NULOS
        // ✅ ELIMINADO: !solicita_cobertura
        if (!nombres || !apellidos || !sexo || !fecha_nacimiento ||
            !phone_1 || !pregunta_seguridad || !respuesta_seguridad) {
            return res.status(400).json({ message: 'Campos obligatorios (marcados con *) faltantes o inválidos.' });
        }

        try {
            // Hashear la respuesta de seguridad antes de guardarla
            const hashedRespuestaSeguridad = await bcrypt.hash(respuesta_seguridad, 10);

            // ✅ Añadir estado_registro con valor por defecto 'nuevo'
            const [result] = await pool.execute(
                `INSERT INTO usuarios (solicita_cobertura, nombres, apellidos, sexo, fecha_nacimiento,
                    social, estatus_migratorio, tipo_vivienda, direccion,
                    ciudad, estado, codigo_postal, condado, correo_electronico, phone_1, phone_2,
                    origen_venta, pregunta_seguridad, respuesta_seguridad, estado_registro)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, // 20 placeholders
                [
                    solicita_cobertura, // Deja el valor tal cual (true/false)
                    nombres, apellidos, sexo, fecha_nacimiento,
                    social || null,
                    estatus_migratorio || null,
                    tipo_vivienda || null,
                    direccion || null,
                    ciudad || null,
                    estado || null,
                    codigo_postal || null,
                    condado || null,
                    correo_electronico || null,
                    phone_1,
                    phone_2 || null,
                    origen_venta || null,
                    pregunta_seguridad, hashedRespuestaSeguridad, 'nuevo'
                ]
            );
            res.status(201).json({ message: 'Usuario creado con éxito', userId: result.insertId });
        } catch (error) {
            console.error('Error al crear usuario:', error);
            if (error.code === 'ER_DUP_ENTRY') {
                let errorMessage = 'El correo electrónico o número social ya están registrados.';
                return res.status(409).json({ message: errorMessage });
            }
            res.status(500).json({ message: 'Error interno del servidor al crear usuario', details: error.message });
        }
    },

    // Obtener todos los usuarios
    getUsuarios: async (req, res) => {
        try {
            const [rows] = await pool.query('SELECT * FROM usuarios');
            res.status(200).json(rows);
        } catch (error) {
            console.error('Error al obtener usuarios:', error);
            res.status(500).json({ message: 'Error interno del servidor al obtener usuarios' });
        }
    },

    // Obtener un usuario por ID
    getUsuarioById: async (req, res) => {
        const { id } = req.params;
        try {
            const [rows] = await pool.execute('SELECT * FROM usuarios WHERE id = ?', [id]);
            if (rows.length === 0) {
                return res.status(404).json({ message: 'Usuario no encontrado' });
            }
            res.status(200).json(rows[0]);
        } catch (error) {
            console.error('Error al obtener usuario por ID:', error);
            res.status(500).json({ message: 'Error interno del servidor al obtener usuario' });
        }
    },

    // Actualizar un usuario
    actualizarUsuario: async (req, res) => {
        const { id } = req.params;
        const fieldsToUpdate = req.body;

        try {
            const queryParts = [];
            const queryParams = [];

            const [existingUser] = await pool.execute('SELECT id FROM usuarios WHERE id = ?', [id]);
            if (existingUser.length === 0) {
                return res.status(404).json({ message: 'Usuario no encontrado para actualizar.' });
            }

            for (const key in fieldsToUpdate) {
                if (fieldsToUpdate.hasOwnProperty(key) && key !== 'id' && key !== 'created_at' && key !== 'updated_at') {
                    if (key === 'respuesta_seguridad') {
                        if (fieldsToUpdate[key] !== undefined && fieldsToUpdate[key] !== null && fieldsToUpdate[key] !== '') {
                            const hashedRespuestaSeguridad = await bcrypt.hash(fieldsToUpdate[key], 10);
                            queryParts.push(`${key} = ?`);
                            queryParams.push(hashedRespuestaSeguridad);
                        }
                    } else if (key === 'fecha_nacimiento') {
                        queryParts.push(`${key} = ?`);
                        queryParams.push(fieldsToUpdate[key] || null);
                    } else {
                        queryParts.push(`${key} = ?`);
                        // Aquí, 'solicita_cobertura' es un boolean y se manejará correctamente
                        // ya sea true, false, o undefined si no se envía (aunque el frontend siempre lo envía)
                        queryParams.push(fieldsToUpdate[key] === undefined ? null : fieldsToUpdate[key]);
                    }
                }
            }

            if (queryParts.length === 0) {
                return res.status(400).json({ message: 'No se proporcionaron campos para actualizar.' });
            }

            const updateQuery = `UPDATE usuarios SET ${queryParts.join(', ')} WHERE id = ?`;
            queryParams.push(id);

            const [result] = await pool.execute(updateQuery, queryParams);

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Usuario no encontrado (aunque se verificó su existencia previamente).' });
            }
            res.status(200).json({ message: 'Usuario actualizado con éxito' });
        } catch (error) {
            console.error('Error al actualizar usuario:', error);
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ message: 'El correo electrónico o número social ya están registrados para otro usuario.' });
            }
            res.status(500).json({ message: 'Error interno del servidor al actualizar usuario', details: error.message });
        }
    },

    // Eliminar un usuario
    eliminarUsuario: async (req, res) => {
        const { id } = req.params;
        try {
            const [result] = await pool.execute('DELETE FROM usuarios WHERE id = ?', [id]);
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Usuario no encontrado' });
            }
            res.status(200).json({ message: 'Usuario eliminado con éxito' });
        } catch (error) {
            console.error('Error al eliminar usuario:', error);
            res.status(500).json({ message: 'Error interno del servidor al eliminar usuario' });
        }
    },

    // Obtener usuarios con estado_registro = 'pendiente'
    getUsuariosPendientes: async (req, res) => {
        try {
            const [rows] = await pool.execute(
                `SELECT id, nombres, apellidos FROM usuarios WHERE estado_registro = 'pendiente'`
            );
            res.status(200).json(rows);
        } catch (error) {
            console.error('Error al obtener usuarios pendientes:', error);
            res.status(500).json({ message: 'Error interno del servidor al obtener usuarios pendientes' });
        }
    }
};

module.exports = usuarioController;