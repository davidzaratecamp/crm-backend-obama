// src/controllers/usuarioController.js
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
            pregunta_seguridad, respuesta_seguridad,
            asesor_id // ✅ Desestructura el asesor_id del cuerpo de la petición
        } = req.body;

        // Validaciones básicas para campos NO NULOS
        // Se ha añadido 'asesor_id' a la validación para asegurar que siempre venga al crear un usuario.
        if (!nombres || !apellidos || !sexo || !fecha_nacimiento ||
            !phone_1 || !pregunta_seguridad || !respuesta_seguridad || !asesor_id) {
            return res.status(400).json({ message: 'Campos obligatorios (incluyendo el ID del agente) faltantes o inválidos.' });
        }

        try {
            // Hashear la respuesta de seguridad antes de guardarla
            const hashedRespuestaSeguridad = await bcrypt.hash(respuesta_seguridad, 10);

            // ✅ Añadir estado_registro con valor por defecto 'nuevo' y asesor_id
            const [result] = await pool.execute(
                `INSERT INTO usuarios (
                    solicita_cobertura, nombres, apellidos, sexo, fecha_nacimiento,
                    social, estatus_migratorio, tipo_vivienda, direccion,
                    ciudad, estado, codigo_postal, condado, correo_electronico, phone_1, phone_2,
                    origen_venta, pregunta_seguridad, respuesta_seguridad, estado_registro,
                    asesor_id  /* ✅ Nueva columna para el ID del agente */
                )
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, // ✅ Ahora son 21 placeholders
                [
                    solicita_cobertura,
                    nombres, apellidos, sexo, fecha_nacimiento,
                    social || null,             // Si es null o vacío, guarda NULL en DB
                    estatus_migratorio || null, // Si es null o vacío, guarda NULL en DB
                    tipo_vivienda || null,      // Si es null o vacío, guarda NULL en DB
                    direccion || null,          // Si es null o vacío, guarda NULL en DB
                    ciudad || null,             // Si es null o vacío, guarda NULL en DB
                    estado || null,             // Si es null o vacío, guarda NULL en DB
                    codigo_postal || null,      // Si es null o vacío, guarda NULL en DB
                    condado || null,            // Si es null o vacío, guarda NULL en DB
                    correo_electronico || null, // Si es null o vacío, guarda NULL en DB
                    phone_1,
                    phone_2 || null,            // Si es null o vacío, guarda NULL en DB
                    origen_venta || null,       // Si es null o vacío, guarda NULL en DB
                    pregunta_seguridad,
                    hashedRespuestaSeguridad,
                    'nuevo',                    // Valor por defecto para estado_registro
                    asesor_id                   // ✅ El valor del ID del agente
                ]
            );
            res.status(201).json({ message: 'Usuario creado con éxito', userId: result.insertId });
        } catch (error) {
            console.error('Error al crear usuario:', error);
            if (error.code === 'ER_DUP_ENTRY') {
                let errorMessage = 'El correo electrónico o número social ya están registrados.';
                // Puedes ser más específico si la base de datos te da el detalle de qué índice falló
                if (error.sqlMessage && error.sqlMessage.includes('correo_electronico')) {
                    errorMessage = 'El correo electrónico ya está registrado.';
                } else if (error.sqlMessage && error.sqlMessage.includes('social')) {
                    errorMessage = 'El número social ya está registrado.';
                }
                return res.status(409).json({ message: errorMessage });
            }
            res.status(500).json({ message: 'Error interno del servidor al crear usuario', details: error.message });
        }
    },
getVentasPorAsesor: async (req, res) => {
    const { fechaInicio, fechaFin } = req.params;

    try {
        // ✅ Ajustar la fechaFin para que incluya todo el día final
        const fechaFinAjustada = new Date(fechaFin);
        fechaFinAjustada.setDate(fechaFinAjustada.getDate() + 1); // Suma un día
        const fechaFinParaQuery = fechaFinAjustada.toISOString().split('T')[0]; // Formato YYYY-MM-DD

        const [rows] = await pool.execute(
            `SELECT
                u.asesor_id,
                p.nombre AS nombre_asesor,
                p.apellido AS apellido_asesor,
                COUNT(u.id) AS total_ventas
            FROM
                usuarios u
            JOIN
                personal p ON u.asesor_id = p.id
            WHERE
                u.created_at >= ? AND u.created_at < ?  -- ✅ Cambiado a >= y <
            GROUP BY
                u.asesor_id, p.nombre, p.apellido
            ORDER BY
                total_ventas DESC;`,
            [fechaInicio, fechaFinParaQuery] // Usa la fecha ajustada aquí
        );
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error al obtener ventas por asesor:', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener ventas por asesor.' });
    }
},
    // Obtener todos los usuarios
    getUsuarios: async (req, res) => {
        try {
            // Puedes considerar hacer un JOIN con la tabla 'personal' si quieres incluir información del asesor
            // directamente en esta consulta. Por ahora, solo selecciona los datos del usuario.
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
            // Si necesitas el nombre del asesor, puedes hacer un JOIN aquí:
            // SELECT u.*, p.nombre AS nombre_asesor, p.apellido AS apellido_asesor
            // FROM usuarios u LEFT JOIN personal p ON u.asesor_id = p.id
            // WHERE u.id = ?
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
    // Este método es flexible y puede manejar la actualización de 'asesor_id' si se envía.
    // Como el frontend (UserForm) no lo envía en el PUT, no hay problema.
    // Si en el futuro quieres cambiar el asesor de un cliente, este método ya lo permitiría.
    actualizarUsuario: async (req, res) => {
        const { id } = req.params;
        const fieldsToUpdate = req.body;

        try {
            const queryParts = [];
            const queryParams = [];

            // Verificar si el usuario existe antes de intentar actualizar
            const [existingUser] = await pool.execute('SELECT id FROM usuarios WHERE id = ?', [id]);
            if (existingUser.length === 0) {
                return res.status(404).json({ message: 'Usuario no encontrado para actualizar.' });
            }

            for (const key in fieldsToUpdate) {
                // Evitar actualizar 'id', 'created_at', 'updated_at' a través del body
                if (fieldsToUpdate.hasOwnProperty(key) && key !== 'id' && key !== 'created_at' && key !== 'updated_at') {
                    if (key === 'respuesta_seguridad') {
                        // Hashear la respuesta de seguridad si se está actualizando
                        if (fieldsToUpdate[key] !== undefined && fieldsToUpdate[key] !== null && fieldsToUpdate[key] !== '') {
                            const hashedRespuestaSeguridad = await bcrypt.hash(fieldsToUpdate[key], 10);
                            queryParts.push(`${key} = ?`);
                            queryParams.push(hashedRespuestaSeguridad);
                        }
                    } else if (key === 'fecha_nacimiento') {
                        // Manejar fechas que pueden ser nulas
                        queryParts.push(`${key} = ?`);
                        queryParams.push(fieldsToUpdate[key] || null);
                    } else {
                        // Para todos los demás campos, incluyendo 'asesor_id' si se enviara, y booleanos como 'solicita_cobertura'
                        queryParts.push(`${key} = ?`);
                        // Asegura que los campos undefined se conviertan a NULL para la DB
                        queryParams.push(fieldsToUpdate[key] === undefined ? null : fieldsToUpdate[key]);
                    }
                }
            }

            if (queryParts.length === 0) {
                return res.status(400).json({ message: 'No se proporcionaron campos para actualizar.' });
            }

            const updateQuery = `UPDATE usuarios SET ${queryParts.join(', ')} WHERE id = ?`;
            queryParams.push(id); // Añadir el ID del usuario al final de los parámetros

            const [result] = await pool.execute(updateQuery, queryParams);

            if (result.affectedRows === 0) {
                // Esto podría ocurrir si el ID no existe (aunque ya lo verificamos) o si los datos enviados son idénticos a los existentes
                return res.status(404).json({ message: 'Usuario no encontrado o no se realizaron cambios.' });
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
            // Esta consulta podría beneficiarse de un JOIN con la tabla 'personal'
            // para mostrar quién es el asesor de cada usuario pendiente.
            const [rows] = await pool.execute(
                `SELECT u.id, u.nombres, u.apellidos, u.estado_registro, p.nombre AS nombre_asesor, p.apellido AS apellido_asesor
                 FROM usuarios u
                 LEFT JOIN personal p ON u.asesor_id = p.id
                 WHERE u.estado_registro = 'pendiente'`
            );
            res.status(200).json(rows);
        } catch (error) {
            console.error('Error al obtener usuarios pendientes:', error);
            res.status(500).json({ message: 'Error interno del servidor al obtener usuarios pendientes' });
        }
    },

    // ✅ NUEVO: Obtener usuarios por asesor_id (útil para que un agente vea sus propios clientes)
    getUsuariosByAsesorId: async (req, res) => {
        const { asesorId } = req.params; // Se asume que el ID del asesor viene en los parámetros de la URL
        try {
            const [rows] = await pool.execute(
                `SELECT id, nombres, apellidos, estado_registro, correo_electronico, phone_1
                 FROM usuarios
                 WHERE asesor_id = ?`,
                [asesorId]
            );
            res.status(200).json(rows);
        } catch (error) {
            console.error('Error al obtener usuarios por asesor_id:', error);
            res.status(500).json({ message: 'Error interno del servidor al obtener usuarios por asesor.' });
        }
    }
    
};



module.exports = usuarioController;