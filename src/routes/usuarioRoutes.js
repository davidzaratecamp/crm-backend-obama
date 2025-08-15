// src/routes/usuarioRoutes.js
const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');

// Rutas para la gestión de usuarios

// POST /api/usuarios - Crear un nuevo usuario
router.post('/', usuarioController.crearUsuario);

// GET /api/usuarios - Obtener todos los usuarios
router.get('/', usuarioController.getUsuarios);

// GET /api/usuarios/pendientes - ✅ NUEVA RUTA: Obtener usuarios con estado_registro = 'pendiente'
router.get('/pendientes', usuarioController.getUsuariosPendientes); // Colócala antes de /:id para evitar conflicto

// GET /api/usuarios/:id - Obtener un usuario por ID
router.get('/:id', usuarioController.getUsuarioById);

// PUT /api/usuarios/:id - Actualizar un usuario por ID
router.put('/:id', usuarioController.actualizarUsuario);

// DELETE /api/usuarios/:id - Eliminar un usuario por ID
router.delete('/:id', usuarioController.eliminarUsuario);

// Ruta para obtener el conteo de ventas por asesor en un rango de fechas
router.get('/ventasPorAsesor/:fechaInicio/:fechaFin', usuarioController.getVentasPorAsesor);


module.exports = router;