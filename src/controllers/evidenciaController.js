const pool = require('../config/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs'); // Para manejar el sistema de archivos (ej. eliminar)

// Configuración de Multer para almacenamiento en disco
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../../uploads'); // Carpeta para guardar archivos
        // Crea la carpeta si no existe
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        // Genera un nombre de archivo único para evitar colisiones
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Limite de 5MB por archivo
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Tipo de archivo no permitido. Solo se permiten PDF, JPG y PNG.'), false);
        }
    }
}).array('archivos', 5); // Permite subir hasta 5 archivos con el nombre de campo 'archivos'

const evidenciaController = {
    // Subir evidencia(s) para un usuario
    subirEvidencia: (req, res) => {
        upload(req, res, async (err) => {
            if (err instanceof multer.MulterError) {
                // Un error de Multer ocurrió durante la carga.
                return res.status(400).json({ message: err.message });
            } else if (err) {
                // Un error desconocido ocurrió.
                return res.status(500).json({ message: err.message });
            }

            // Si no hay archivos o el usuarioId no está presente
            if (!req.files || req.files.length === 0 || !req.params.usuarioId) {
                return res.status(400).json({ message: 'No se subieron archivos o falta el ID del usuario.' });
            }

            const { usuarioId } = req.params;
            const { descripcion } = req.body; // Puedes enviar una descripción por cada archivo o una general

            try {
                const inserts = req.files.map(file => {
                    const ruta_archivo = `/uploads/${file.filename}`; // Ruta relativa para guardar en DB
                    return pool.execute(
                        `INSERT INTO evidencias (usuario_id, nombre_archivo, ruta_archivo, tipo_archivo, tamano_archivo, descripcion)
                         VALUES (?, ?, ?, ?, ?, ?)`,
                        [usuarioId, file.originalname, ruta_archivo, file.mimetype, file.size, descripcion || '']
                    );
                });
                await Promise.all(inserts);
                res.status(201).json({ message: 'Evidencias subidas con éxito' });
            } catch (error) {
                console.error('Error al guardar evidencia en la DB:', error);
                // Si falla la inserción en DB, considera eliminar los archivos ya subidos
                req.files.forEach(file => {
                    fs.unlink(file.path, (unlinkErr) => {
                        if (unlinkErr) console.error('Error al eliminar archivo subido:', unlinkErr);
                    });
                });
                res.status(500).json({ message: 'Error interno del servidor al guardar evidencia' });
            }
        });
    },

    // Obtener evidencias de un usuario
    getEvidenciasByUsuario: async (req, res) => {
        const { usuarioId } = req.params;
        try {
            const [rows] = await pool.execute('SELECT * FROM evidencias WHERE usuario_id = ?', [usuarioId]);
            // Para servir los archivos, podrías enviar la ruta completa si es local o la URL si es en la nube
            res.status(200).json(rows);
        } catch (error) {
            console.error('Error al obtener evidencias por usuario:', error);
            res.status(500).json({ message: 'Error interno del servidor al obtener evidencias' });
        }
    },

    // Eliminar una evidencia
    eliminarEvidencia: async (req, res) => {
        const { id } = req.params;
        try {
            const [rows] = await pool.execute('SELECT ruta_archivo FROM evidencias WHERE id = ?', [id]);
            if (rows.length === 0) {
                return res.status(404).json({ message: 'Evidencia no encontrada' });
            }

            const filePath = path.join(__dirname, '../../', rows[0].ruta_archivo);

            await pool.execute('DELETE FROM evidencias WHERE id = ?', [id]);

            // Eliminar el archivo físico después de eliminar el registro de la DB
            fs.unlink(filePath, (err) => {
                if (err) {
                    console.error('Error al eliminar el archivo físico:', err);
                    // Puedes decidir si retornar un error 500 aquí o solo loguear
                }
                res.status(200).json({ message: 'Evidencia eliminada con éxito' });
            });

        } catch (error) {
            console.error('Error al eliminar evidencia:', error);
            res.status(500).json({ message: 'Error interno del servidor al eliminar evidencia' });
        }
    }
};

module.exports = evidenciaController;