// backend/src/routes/planSaludRoutes.js
const express = require('express');
const router = express.Router();
const planSaludController = require('../controllers/planSaludController');

// Rutas para la gestión de planes de salud

// POST /api/planes_salud - Crear o Actualizar un plan de salud para un usuario
// Ahora este endpoint recibirá usuario_id en el cuerpo y se encargará del upsert
router.post('/', planSaludController.crearOActualizarPlanSalud);

// GET /api/planes_salud/usuario/:usuarioId - Obtener el plan de salud de un usuario específico
router.get('/usuario/:usuarioId', planSaludController.getPlanSaludByUsuarioId);

// Opcional: Si necesitas obtener/actualizar/eliminar un plan por su ID de plan (no de usuario)
// Mantener estas rutas separadas si se usarán en otras partes de la aplicación.
router.get('/:id', planSaludController.getPlanSaludById); // Originalmente era /planes-salud/:id
router.put('/:id', planSaludController.actualizarPlanSaludById); // Originalmente era /planes-salud/:id
router.delete('/:id', planSaludController.eliminarPlanSalud); // Originalmente era /planes-salud/:id

module.exports = router;