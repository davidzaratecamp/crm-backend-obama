// src/routes/dependienteRoutes.js
const express = require('express');
const router = express.Router();
const dependienteController = require('../controllers/dependienteController');

// NUEVA RUTA: Obtener cónyuge por userId y parentesco (debe ir antes de la ruta general de dependientes por usuario)
router.get('/dependientes/usuario/:userId/parentesco/:parentesco', dependienteController.getDependienteByUserIdAndParentesco);

// NUEVA RUTA: Obtener dependientes de un usuario, excluyendo el cónyuge (también debe ir antes de la ruta general de dependientes por usuario)
router.get('/:userId/dependientes/sin-conyuge', dependienteController.getDependientesExcludingConyuge);

// POST /api/usuarios/:usuarioId/dependientes - Crear un nuevo dependiente para un usuario
router.post('/:usuarioId/dependientes', dependienteController.crearDependiente);

// GET /api/usuarios/:usuarioId/dependientes - Obtener todos los dependientes de un usuario (ahora es más general)
router.get('/:usuarioId/dependientes', dependienteController.getDependientesByUsuario);

// GET /api/dependientes/:id - Obtener un dependiente por su ID
router.get('/dependientes/:id', dependienteController.getDependienteById);

// PUT /api/dependientes/:id - Actualizar un dependiente por su ID
router.put('/dependientes/:id', dependienteController.actualizarDependiente);

// DELETE /api/dependientes/:id - Eliminar un dependiente por su ID
router.delete('/dependientes/:id', dependienteController.eliminarDependiente);

module.exports = router;