//src/routes/dependienteRoutes.js
const express = require('express');
const router = express.Router();
const dependienteController = require('../controllers/dependienteController');



// POST /api/usuarios/:usuarioId/dependientes - Crear un nuevo dependiente para un usuario
router.post('/:usuarioId/dependientes', dependienteController.crearDependiente);

// GET /api/usuarios/:usuarioId/dependientes - Obtener todos los dependientes de un usuario
router.get('/:usuarioId/dependientes', dependienteController.getDependientesByUsuario);

// GET /api/dependientes/:id - Obtener un dependiente por su ID
router.get('/dependientes/:id', dependienteController.getDependienteById);

// PUT /api/dependientes/:id - Actualizar un dependiente por su ID
router.put('/dependientes/:id', dependienteController.actualizarDependiente);

// DELETE /api/dependientes/:id - Eliminar un dependiente por su ID
router.delete('/dependientes/:id', dependienteController.eliminarDependiente);

module.exports = router;