// src/controllers/auditorController.js
const pool = require('../config/db.js');

// 1. Obtener lista de grabaciones pendientes de auditoría
exports.getPendingAudits = async (req, res) => {
    try {
        const [rows] = await pool.execute(
            `SELECT 
                g.id AS id_grabacion, g.id_usuario, g.etiquetas, g.fecha_grabacion, g.estado_auditoria,
                u.nombres AS nombre_cliente, u.apellidos AS apellido_cliente,
                p.nombre AS nombre_agente, p.apellido AS apellido_agente
             FROM grabaciones g
             JOIN usuarios u ON g.id_usuario = u.id
             JOIN personal p ON g.id_agente = p.id
             WHERE g.estado_auditoria = 'pendiente'`
        );
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error al obtener grabaciones pendientes:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

// 2. Obtener lista de grabaciones rechazadas
exports.getRejectedAudits = async (req, res) => {
    try {
        const [rows] = await pool.execute(
            `SELECT 
                g.id AS id_grabacion, g.id_usuario, g.etiquetas, g.created_at, g.estado_auditoria,
                u.nombres AS nombre_cliente, u.apellidos AS apellido_cliente,
                p.nombre AS nombre_agente, p.apellido AS apellido_agente
             FROM grabaciones g
             JOIN usuarios u ON g.id_usuario = u.id
             JOIN personal p ON g.id_agente = p.id
             WHERE g.estado_auditoria = 'rechazado'`
        );
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error al obtener auditorías rechazadas:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

// 3. Obtener detalles completos de una auditoría y cliente
exports.getAuditDetail = async (req, res) => {
    const { idGrabacion } = req.params;
    try {
        const [grabacionRows] = await pool.execute('SELECT * FROM grabaciones WHERE id = ?', [idGrabacion]);
        if (grabacionRows.length === 0) {
            return res.status(404).json({ message: 'Grabación no encontrada.' });
        }
        const grabacion = grabacionRows[0];
        const id_usuario = grabacion.id_usuario;
        
        const [usuarioRows] = await pool.execute('SELECT * FROM usuarios WHERE id = ?', [id_usuario]);
        const cliente = usuarioRows[0];

        const [dependientesRows] = await pool.execute('SELECT * FROM dependientes WHERE usuario_id = ?', [id_usuario]);
        const conyuge = dependientesRows.find(dep => dep.parentesco === 'Cónyuge');
        const dependientes = dependientesRows.filter(dep => dep.parentesco !== 'Cónyuge');

        // ✅ Lógica y método de consulta corregidos para los ingresos.
        // Creamos una lista de todos los IDs relevantes: el del usuario y los de los dependientes
        const allIds = [id_usuario, ...dependientes.map(d => d.id)];
        
        // Usamos pool.query en lugar de pool.execute, que maneja mejor la expansión de arrays en la cláusula IN.
        const [ingresosRows] = await pool.query(
            'SELECT * FROM ingresos WHERE entidad_id IN (?)',
            [allIds]
        );
        
        const ingresos = {
            usuario: ingresosRows.find(ing => ing.tipo_entidad === 'Usuario'),
            dependientes: ingresosRows.filter(ing => ing.tipo_entidad === 'Dependiente')
        };
        
        // ... (el resto del código sigue igual) ...
        const [planesRows] = await pool.execute('SELECT * FROM planes_salud WHERE usuario_id = ?', [id_usuario]);
        const planes_salud = planesRows;

        const [pagoRows] = await pool.execute('SELECT * FROM informacion_pago WHERE usuario_id = ?', [id_usuario]);
        const informacion_pago = pagoRows[0] || null;

        res.status(200).json({
            grabacion,
            cliente,
            conyuge,
            dependientes,
            ingresos,
            planes_salud,
            informacion_pago
        });

    } catch (error) {
        console.error('Error al obtener el detalle de la auditoría:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};


// 4. Actualizar el estado de una grabación (aprobar o rechazar)
exports.updateAuditStatus = async (req, res) => {
    const { idGrabacion } = req.params;
    
    // ✅ CAMBIO: Extraer el estado y asignar 'null' si las otras variables no existen.
    const { estado_auditoria } = req.body;
    let { observaciones_auditor, id_auditor } = req.body;
    
    // Cuando el agente reenvía la auditoría, no se mandan observaciones ni id de auditor.
    // Es importante que estos valores se establezcan a 'null' para la base de datos.
    observaciones_auditor = observaciones_auditor || null;
    id_auditor = id_auditor || null;

    // ... (Tu validación de estados) ...
    if (!['aprobado', 'rechazado', 'pendiente'].includes(estado_auditoria)) {
        return res.status(400).json({ message: 'El estado de auditoría es inválido.' });
    }
    
    try {
        await pool.execute(
            `UPDATE grabaciones SET estado_auditoria = ?, observaciones_auditor = ?, id_auditor = ?, fecha_auditoria = NOW() WHERE id = ?`,
            [estado_auditoria, observaciones_auditor, id_auditor, idGrabacion]
        );

        // ... (El resto de tu lógica para actualizar el estado del usuario) ...
        const [grabacionRows] = await pool.execute(
            'SELECT id_usuario, id_agente FROM grabaciones WHERE id = ?',
            [idGrabacion]
        );
        const { id_usuario, id_agente } = grabacionRows[0];
        
        let nuevoEstadoUsuario = '';
        if (estado_auditoria === 'aprobado') {
            nuevoEstadoUsuario = 'aprobado_auditor';
        } else if (estado_auditoria === 'rechazado') {
            nuevoEstadoUsuario = 'rechazado_auditor';
        } else { // 'pendiente'
            nuevoEstadoUsuario = 'en_revision'; 
        }

        await pool.execute(
            'UPDATE usuarios SET estado_registro = ? WHERE id = ?',
            [nuevoEstadoUsuario, id_usuario]
        );
        
        res.status(200).json({ message: 'Estado de auditoría actualizado con éxito.' });
    } catch (error) {
        console.error('Error al actualizar estado de auditoría:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};


// 5. Obtener grabaciones rechazadas de un agente específico
exports.getRejectedAuditsByAgent = async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await pool.execute(
            `SELECT 
                g.id AS id_grabacion, 
                g.id_usuario, 
                g.etiquetas, 
                g.observaciones_auditor, 
                u.nombres AS nombre_cliente, 
                u.apellidos AS apellido_cliente
             FROM grabaciones g
             JOIN usuarios u ON g.id_usuario = u.id
             WHERE g.id_agente = ? AND g.estado_auditoria = 'rechazado'`,
            [id]
        );
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error al obtener auditorías rechazadas para el agente:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

// ✅ NUEVA FUNCIÓN: Reenviar una auditoría para una nueva revisión.
exports.resubmitAudit = async (req, res) => {
    // Usamos el ID de usuario para encontrar la grabación rechazada correspondiente.
    const { id_usuario } = req.params;

    try {
        // Buscamos la grabación rechazada para este usuario.
        const [grabacionRows] = await pool.execute(
            `SELECT id FROM grabaciones WHERE id_usuario = ? AND estado_auditoria = 'rechazado' ORDER BY fecha_auditoria DESC LIMIT 1`,
            [id_usuario]
        );

        if (grabacionRows.length === 0) {
            return res.status(404).json({ message: 'No se encontró una auditoría rechazada para este usuario.' });
        }

        const idGrabacion = grabacionRows[0].id;

        // Actualizamos la grabación: la ponemos como 'pendiente' y limpiamos los datos de la auditoría anterior.
        await pool.execute(
            `UPDATE grabaciones 
             SET 
                estado_auditoria = 'pendiente', 
                observaciones_auditor = NULL, 
                id_auditor = NULL, 
                fecha_auditoria = NULL 
             WHERE id = ?`,
            [idGrabacion]
        );

        // También actualizamos el estado del usuario para reflejar que está en revisión nuevamente.
        await pool.execute(
            `UPDATE usuarios SET estado_registro = 'pendiente_auditoria' WHERE id = ?`,
            [id_usuario]
        );

        res.status(200).json({ message: 'Auditoría reenviada con éxito.' });

    } catch (error) {
        console.error('Error al reenviar la auditoría:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};


