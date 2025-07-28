const pool = require('../config/db');


const {
  searchAct,
  searchErr,
} = require("../messages/lead.messages");

exports.contadorventas = async (req, res) => {
  try {
    console.log("✅ Entró al controlador: /contadorventas");

    const { tabla, campo, value1, value2 } = req.params;

    // ✅ Lista blanca de tablas y campos permitidos
    const allowedTables = ['usuarios', 'ventas', 'clientes'];
    const allowedFields = ['created_at', 'fecha', 'updated_at'];

    if (!allowedTables.includes(tabla)) {
      return res.status(400).json({ err: "Tabla no permitida" });
    }

    if (!allowedFields.includes(campo)) {
      return res.status(400).json({ err: "Campo no permitido" });
    }

    // ✅ Ahora construye la consulta con los valores validados (seguro)
    const query = `
      SELECT COUNT(*) AS total 
      FROM \`${tabla}\` 
      WHERE \`${campo}\` >= ? 
        AND \`${campo}\` < DATE_ADD(?, INTERVAL 1 DAY)
    `;

    const values = [value1, value2]; // Solo los valores (fechas)

    console.log("🔍 SQL:", query);
    console.log("📊 Valores:", values);

    const [results] = await pool.execute(query, values);
    console.log("✅ Resultado:", results);

    const total = results[0]?.total || 0;

    const responseMsg = {
      title:
        total === 0
          ? "Sin resultados"
          : total === 1
          ? `${total}`
          : `${total}`,
    };

    res.json(
      total === 0
        ? { err: searchErr, msg: responseMsg }
        : { total, msg: responseMsg }
    );
  } catch (error) {
    console.error("❌ Error en consulta:", error.message);
    res.status(500).json({
      err: "Error al ejecutar la consulta",
      message: error.message,
    });
  }
};