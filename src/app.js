require('dotenv').config(); // ✅ Cargar variables de entorno primero

const express = require('express');
const cors = require('cors');
const path = require('path');
const pool = require('./config/db'); 

const usuarioRoutes = require('./routes/usuarioRoutes'); // Importa las rutas de usuario
const dependienteRoutes = require('./routes/dependienteRoutes');
const ingresosRoutes = require('./routes/ingresosRoutes');
const planSaludRoutes = require('./routes/planSaludRoutes');
const informacionPagoRoutes = require('./routes/informacionPagoRoutes');
const evidenciaRoutes = require('./routes/evidenciaRoutes'); 
// ... importa otras rutas

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Servir archivos estáticos desde /uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ✅ Probar conexión a la base de datos
(async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Conexión a la base de datos MySQL exitosa');
        connection.release();
    } catch (error) {
        console.error('❌ Error al conectar con la base de datos:', error.message);
    }
})();

// Montar rutas
app.use('/api/usuarios', usuarioRoutes);
app.use('/api', dependienteRoutes);
app.use('/api/ingresos', ingresosRoutes);
app.use('/api/planes_salud', planSaludRoutes);
app.use('/api', informacionPagoRoutes);
//app.use('/api/informacion_pago', informacionPagoRoutes);
app.use('/api', evidenciaRoutes);
// ... monta otras rutas aquí si las tienes

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
});
