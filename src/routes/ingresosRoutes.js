const express = require('express');
const router = express.Router();
const ingresosController = require('../controllers/ingresosController');

// Rutas para la gestión de ingresos

// POST /api/ingresos - Crear un nuevo registro de ingreso
router.post('/', ingresosController.crearIngreso);

// GET /api/ingresos/:tipoEntidad/:entidadId - Obtener ingresos por tipo de entidad y ID (ej. /api/ingresos/Usuario/1)
router.get('/:tipoEntidad/:entidadId', ingresosController.getIngresosByEntidad);

// PUT /api/ingresos/:id - Actualizar un registro de ingreso por su ID
router.put('/:id', ingresosController.actualizarIngreso);

// DELETE /api/ingresos/:id - Eliminar un registro de ingreso por su ID
router.delete('/:id', ingresosController.eliminarIngreso);

module.exports = router;