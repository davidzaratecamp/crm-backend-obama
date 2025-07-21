// backend/src/routes/informacionPagoRoutes.js
const express = require('express');
const router = express.Router();
const informacionPagoController = require('../controllers/informacionPagoController');

// Rutas para la gestión de información de pago

// POST /api/pagos - Crear o Actualizar información de pago para un usuario
// Ahora este endpoint recibirá usuario_id en el cuerpo y se encargará del upsert
router.post('/', informacionPagoController.crearOActualizarInformacionPago);

// GET /api/pagos/usuario/:usuarioId - Obtener información de pago de un usuario
// La ruta del frontend será /api/usuarios/:usuarioId/pagos
router.get('/usuario/:usuarioId', informacionPagoController.getInformacionPagoByUsuario);


// Opcional: Mantener si se necesitan rutas para operaciones por el ID del registro de pago
router.put('/:id', informacionPagoController.actualizarInformacionPagoById);
router.delete('/:id', informacionPagoController.eliminarInformacionPago);

module.exports = router;