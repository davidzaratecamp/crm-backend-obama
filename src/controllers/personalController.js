// src/controllers/personalController.js
const bcrypt = require('bcrypt'); // Para hashear contraseñas
const pool = require('../config/db.js'); // Ajusta la ruta a tu archivo de conexión a la DB

// Generar un hash de contraseña
const hashPassword = async (password) => {
    const saltRounds = 10; // Número de rondas de sal para bcrypt (mayor es más seguro, pero más lento)
    return await bcrypt.hash(password, saltRounds);
};

// Comparar una contraseña con su hash
const comparePassword = async (password, hash) => {
    return await bcrypt.compare(password, hash);
};

// --- Funciones para la gestión de personal (CRUD básico) ---

// Crear nuevo miembro del personal
exports.createPersonal = async (req, res) => {
    const { nombre, apellido, email, password, rol, meta_mensual } = req.body;
    if (!nombre || !apellido || !email || !password || !rol) {
        return res.status(400).json({ message: 'Todos los campos requeridos son obligatorios.' });
    }

    try {
        const hashedPassword = await hashPassword(password);
        const [result] = await pool.execute(
            'INSERT INTO personal (nombre, apellido, email, password_hash, rol, meta_mensual) VALUES (?, ?, ?, ?, ?, ?)',
            [nombre, apellido, email, hashedPassword, rol, meta_mensual || 0]
        );
        res.status(201).json({ id: result.insertId, message: 'Miembro del personal creado con éxito.' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'El email ya está registrado.' });
        }
        console.error('Error al crear miembro del personal:', error);
        res.status(500).json({ message: 'Error interno del servidor al crear personal.' });
    }
};

// Obtener todos los miembros del personal (puede requerir autenticación y rol de admin/auditor)
exports.getAllPersonal = async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT id, nombre, apellido, email, rol, meta_mensual, activo, fecha_creacion, fecha_actualizacion FROM personal');
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error al obtener todo el personal:', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener personal.' });
    }
};

// Obtener un miembro del personal por ID
exports.getPersonalById = async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await pool.execute('SELECT id, nombre, apellido, email, rol, meta_mensual, activo, fecha_creacion, fecha_actualizacion FROM personal WHERE id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Miembro del personal no encontrado.' });
        }
        res.status(200).json(rows[0]);
    } catch (error) {
        console.error('Error al obtener miembro del personal por ID:', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener personal por ID.' });
    }
};

// Actualizar miembro del personal
exports.updatePersonal = async (req, res) => {
    const { id } = req.params;
    const { nombre, apellido, email, password, rol, meta_mensual, activo } = req.body;

    try {
        let updateFields = [];
        let updateValues = [];

        if (nombre) { updateFields.push('nombre = ?'); updateValues.push(nombre); }
        if (apellido) { updateFields.push('apellido = ?'); updateValues.push(apellido); }
        if (email) { updateFields.push('email = ?'); updateValues.push(email); }
        if (password) {
            const hashedPassword = await hashPassword(password);
            updateFields.push('password_hash = ?'); updateValues.push(hashedPassword);
        }
        if (rol) { updateFields.push('rol = ?'); updateValues.push(rol); }
        if (meta_mensual !== undefined) { updateFields.push('meta_mensual = ?'); updateValues.push(meta_mensual); }
        if (activo !== undefined) { updateFields.push('activo = ?'); updateValues.push(activo); }

        if (updateFields.length === 0) {
            return res.status(400).json({ message: 'No hay campos para actualizar.' });
        }

        updateValues.push(id);
        const [result] = await pool.execute(
            `UPDATE personal SET ${updateFields.join(', ')} WHERE id = ?`,
            updateValues
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Miembro del personal no encontrado para actualizar.' });
        }
        res.status(200).json({ message: 'Miembro del personal actualizado con éxito.' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'El email ya está en uso por otro miembro del personal.' });
        }
        console.error('Error al actualizar miembro del personal:', error);
        res.status(500).json({ message: 'Error interno del servidor al actualizar personal.' });
    }
};

// Eliminar miembro del personal
exports.deletePersonal = async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await pool.execute('DELETE FROM personal WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Miembro del personal no encontrado para eliminar.' });
        }
        res.status(200).json({ message: 'Miembro del personal eliminado con éxito.' });
    } catch (error) {
        console.error('Error al eliminar miembro del personal:', error);
        res.status(500).json({ message: 'Error interno del servidor al eliminar personal.' });
    }
};

// --- Lógica para obtener ventas de un agente específico (para el Home del asesor) ---
exports.getAgentSalesSummary = async (req, res) => {
    const { asesorId } = req.params;
    const { fechaInicio, fechaFin } = req.query; // 'YYYY-MM-DD'

    if (!fechaInicio || !fechaFin) {
        return res.status(400).json({ message: 'Las fechas de inicio y fin son requeridas.' });
    }

    try {
        // Obtener ventas actuales del agente
        const [ventasResult] = await pool.execute(
            `SELECT COUNT(*) AS total_ventas
             FROM usuarios
             WHERE asesor_id = ? AND estado_registro = 'completado' AND DATE(fecha_creacion) BETWEEN ? AND ?`,
            [asesorId, fechaInicio, fechaFin]
        );
        const ventas_actuales = ventasResult[0] ? ventasResult[0].total_ventas : 0;

        // Obtener la meta mensual del agente
        const [metaResult] = await pool.execute(
            `SELECT meta_mensual FROM personal WHERE id = ? AND rol = 'Agente'`,
            [asesorId]
        );
        const meta_mensual = metaResult[0] ? metaResult[0].meta_mensual : 0; // Default 0 si no es agente o no tiene meta

        res.json({
            ventas_actuales: ventas_actuales,
            meta_mensual: meta_mensual
        });

    } catch (error) {
        console.error("Error al obtener ventas y meta del agente:", error);
        res.status(500).json({ message: 'Error interno del servidor al obtener datos de agente.' });
    }
};

// Opcional: Implementar login para el personal
exports.loginPersonal = async (req, res) => {
    const { email, password } = req.body;
    try {
        const [rows] = await pool.execute('SELECT id, password_hash, rol, nombre, apellido, email FROM personal WHERE email = ? AND activo = TRUE', [email]);
        if (rows.length === 0) {
            return res.status(401).json({ message: 'Credenciales inválidas.' });
        }

        const personal = rows[0];
        const isMatch = await comparePassword(password, personal.password_hash);

        if (!isMatch) {
            return res.status(401).json({ message: 'Credenciales inválidas.' });
        }

        // Si las credenciales son válidas, podrías generar un JWT aquí
        // const token = jwt.sign({ id: personal.id, rol: personal.rol }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.status(200).json({
            message: 'Login exitoso.',
            personal: { id: personal.id, nombre: personal.nombre, apellido: personal.apellido, rol: personal.rol },
            // token: token
        });

    } catch (error) {
        console.error('Error durante el login del personal:', error);
        res.status(500).json({ message: 'Error interno del servidor durante el login.' });
    }
};