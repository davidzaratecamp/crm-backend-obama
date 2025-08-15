const express = require('express');
const router = express.Router();
const personalController = require('../controllers/personalController'); 
const auditorController = require('../controllers/auditorController');

// Rutas para la gestión CRUD del personal (se montarán bajo /api/_admin)
router.post('/personal', personalController.createPersonal);
router.get('/personal', personalController.getAllPersonal);
router.get('/personal/:id', personalController.getPersonalById);
router.put('/personal/:id', personalController.updatePersonal);
router.delete('/personal/:id', personalController.deletePersonal);

// Nueva ruta para obtener las grabaciones rechazadas de un agente específico
router.get('/:id/auditorias-rechazadas', auditorController.getRejectedAuditsByAgent);

// Ruta para el resumen de ventas de un agente específico (se montará bajo /api/_asesor/dashboard)
// Nota: 'ventas-del-mes' es el endpoint final aquí. El '/api/_asesor/dashboard' es el prefijo de app.js.
// El :asesorId seguirá siendo un parámetro de la URL.
router.get('/dashboard/:asesorId/ventas-del-mes', personalController.getAgentSalesSummary);


// Ruta para la autenticación del personal (se montará bajo /api/_auth)
router.post('/personal/login', personalController.loginPersonal);

module.exports = router;