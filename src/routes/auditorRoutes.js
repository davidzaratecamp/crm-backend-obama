// src/routes/auditorRoutes.js
const express = require('express');
const router = express.Router();
const auditorController = require('../controllers/auditorController');

// Rutas para el módulo de Auditoría
// Requeriría un middleware de autenticación para el rol 'Auditor'
router.get('/audits/pending', auditorController.getPendingAudits);
router.get('/audits/:idGrabacion', auditorController.getAuditDetail);
router.put('/audits/:idGrabacion', auditorController.updateAuditStatus);
router.put('/audits/resubmit/usuario/:id_usuario', auditorController.resubmitAudit);


module.exports = router;