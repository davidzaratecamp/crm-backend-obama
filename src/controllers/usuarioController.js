// src/controllers/usuarioController.js
const pool = require('../config/db'); // Importa la conexión a la base de datos
const bcrypt = require('bcryptjs'); // Para hashear contraseñas/respuestas de seguridad

const usuarioController = {
    // Crear un nuevo usuario
    crearUsuario: async (req, res) => {
        const {
            solicita_cobertura, nombres, apellidos, sexo, fecha_nacimiento,
            estado_cobertura, social, estatus_migratorio, tipo_vivienda,
            direccion, // <-- ¡CAMBIO: Añadido 'direccion'!
            ciudad, estado, codigo_postal, condado, correo_electronico,
            phone_1, phone_2, origen_venta, referido, base,
            pregunta_seguridad, respuesta_seguridad
        } = req.body;

        try {
            // Hashear la respuesta de seguridad antes de guardarla
            const hashedRespuestaSeguridad = await bcrypt.hash(respuesta_seguridad, 10);

            const [result] = await pool.execute(
                `INSERT INTO usuarios (solicita_cobertura, nombres, apellidos, sexo, fecha_nacimiento,
                    estado_cobertura, social, estatus_migratorio, tipo_vivienda, direccion, /* <-- ¡CAMBIO: Añadido 'direccion'! */
                    ciudad, estado, codigo_postal, condado, correo_electronico, phone_1, phone_2,
                    origen_venta, referido, base, pregunta_seguridad, respuesta_seguridad)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, /* <-- ¡CAMBIO: 22 placeholders! */
                [solicita_cobertura, nombres, apellidos, sexo, fecha_nacimiento,
                    estado_cobertura, social, estatus_migratorio, tipo_vivienda, direccion, /* <-- ¡CAMBIO: Añadido 'direccion'! */
                    ciudad, estado, codigo_postal, condado, correo_electronico, phone_1, phone_2,
                    origen_venta, referido, base, pregunta_seguridad, hashedRespuestaSeguridad] /* <-- ¡CAMBIO: 22 valores! */
            );
            res.status(201).json({ message: 'Usuario creado con éxito', userId: result.insertId });
        } catch (error) {
            console.error('Error al crear usuario:', error);
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ message: 'El correo electrónico o número social ya están registrados.' });
            }
            res.status(500).json({ message: 'Error interno del servidor al crear usuario' });
        }
    },

    // Obtener todos los usuarios
    getUsuarios: async (req, res) => {
        try {
            // Seleccionar también la dirección
            const [rows] = await pool.query('SELECT *, direccion FROM usuarios'); // <-- ¡CAMBIO: Añadido 'direccion'!
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
            // Seleccionar también la dirección
            const [rows] = await pool.execute('SELECT *, direccion FROM usuarios WHERE id = ?', [id]); // <-- ¡CAMBIO: Añadido 'direccion'!
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
        const {
            solicita_cobertura, nombres, apellidos, sexo, fecha_nacimiento,
            estado_cobertura, social, estatus_migratorio, tipo_vivienda,
            direccion, // <-- ¡CAMBIO: Añadido 'direccion'!
            ciudad, estado, codigo_postal, condado, correo_electronico,
            phone_1, phone_2, origen_venta, referido, base, pregunta_seguridad, respuesta_seguridad
        } = req.body;

        try {
            // Considera si la respuesta de seguridad también se puede actualizar y hashear
            let updateQuery = `
                UPDATE usuarios SET
                solicita_cobertura = ?, nombres = ?, apellidos = ?, sexo = ?, fecha_nacimiento = ?,
                estado_cobertura = ?, social = ?, estatus_migratorio = ?, tipo_vivienda = ?, direccion = ?, /* <-- ¡CAMBIO: Añadido 'direccion'! */
                ciudad = ?, estado = ?, codigo_postal = ?, condado = ?, correo_electronico = ?, phone_1 = ?, phone_2 = ?,
                origen_venta = ?, referido = ?, base = ?, pregunta_seguridad = ?
            `;
            const queryParams = [
                solicita_cobertura, nombres, apellidos, sexo, fecha_nacimiento,
                estado_cobertura, social, estatus_migratorio, tipo_vivienda, direccion, /* <-- ¡CAMBIO: Añadido 'direccion'! */
                ciudad, estado, codigo_postal, condado, correo_electronico, phone_1, phone_2,
                origen_venta, referido, base, pregunta_seguridad
            ];

            if (respuesta_seguridad) { // Si la respuesta de seguridad se está actualizando
                const hashedRespuestaSeguridad = await bcrypt.hash(respuesta_seguridad, 10);
                updateQuery += `, respuesta_seguridad = ?`;
                queryParams.push(hashedRespuestaSeguridad);
            }

            updateQuery += ` WHERE id = ?`;
            queryParams.push(id);

            const [result] = await pool.execute(updateQuery, queryParams);

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Usuario no encontrado' });
            }
            res.status(200).json({ message: 'Usuario actualizado con éxito' });
        } catch (error) {
            console.error('Error al actualizar usuario:', error);
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ message: 'El correo electrónico o número social ya están registrados para otro usuario.' });
            }
            res.status(500).json({ message: 'Error interno del servidor al actualizar usuario' });
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
    }
};

module.exports = usuarioController;