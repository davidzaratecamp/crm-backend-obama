const express = require('express');
const router = express.Router();
const evidenciaController = require('../controllers/evidenciaController');

// Rutas para la gestión de evidencias

// POST /api/usuarios/:usuarioId/evidencias - Subir evidencia(s) para un usuario
// Multer se encarga del procesamiento del archivo en el controlador, no aquí en la ruta
router.post('/:usuarioId/evidencias', evidenciaController.subirEvidencia);

// GET /api/usuarios/:usuarioId/evidencias - Obtener todas las evidencias de un usuario
router.get('/:usuarioId/evidencias', evidenciaController.getEvidenciasByUsuario);

// DELETE /api/evidencias/:id - Eliminar una evidencia por su ID
router.delete('/evidencias/:id', evidenciaController.eliminarEvidencia);

module.exports = router;