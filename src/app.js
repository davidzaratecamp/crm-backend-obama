// src/app.js

// Cargar variables de entorno primero
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const pool = require('./config/db'); // Asumiendo que db.js está en src/config/

// Importar rutas (asegúrate de que estas rutas también sean correctas)
const usuarioRoutes = require('./routes/usuarioRoutes');
const dependienteRoutes = require('./routes/dependienteRoutes');
const ingresosRoutes = require('./routes/ingresosRoutes');
const planSaludRoutes = require('./routes/planSaludRoutes');
const informacionPagoRoutes = require('./routes/informacionPagoRoutes');
const evidenciaRoutes = require('./routes/evidenciaRoutes');
const general = require('./routes/General.route');
const auditorRoutes = require('./routes/auditorRoutes');
const personalRoutes = require('./routes/personalRoutes');

const app = express();
const PUERTO = process.env.PUERTO || 3001;

app.use(cors());
app.use(express.json());

// Probar conexión a la base de datos
(async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Conexión a la base de datos MySQL exitosa');
        connection.release();
    } catch (error) {
        console.error('❌ Error al conectar con la base de datos:', error.message);
    }
})();

// --- INICIO DE LA SOLUCIÓN ---

// La ruta ahora sube un nivel ('..') desde 'src' para encontrar la carpeta 'public'.
const audiosPath = path.join(__dirname, '..', 'public/audios');

// Mensaje de depuración para confirmar la ruta correcta
console.log(`Sirviendo archivos de audio desde la carpeta: ${audiosPath}`);

// Servir los archivos estáticos desde la ruta corregida.
app.use('/audios', express.static(audiosPath));

// --- FIN DE LA SOLUCIÓN ---


// Montar rutas de la API
app.use('/api/usuarios', usuarioRoutes);
app.use('/api', dependienteRoutes);
app.use('/api/ingresos', ingresosRoutes);
app.use('/api/planes_salud', planSaludRoutes);
app.use('/api', informacionPagoRoutes);
app.use('/api', evidenciaRoutes);
app.use("/", general);
app.use('/api/_auditor', auditorRoutes);

// Montar las rutas para el personal
app.use('/api/_admin', personalRoutes);
app.use('/api/_asesor', personalRoutes);
app.use('/api/_auth', personalRoutes);

// Iniciar servidor
app.listen(PUERTO, () => {
    console.log(`Servidor backend corriendo en http://localhost:${PUERTO}`);
});