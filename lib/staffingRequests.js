const mysql = require("mysql2/promise");
const { randomUUID } = require("node:crypto");
let pool;
function database() {
  if (!process.env.STAFFING_MYSQL_URL) throw new Error("Missing staffing database");
  pool ??= mysql.createPool(process.env.STAFFING_MYSQL_URL);
  return pool;
}

async function listStaffingRequests(page) {
  const [rows] = await database().query("SELECT id, hiring_type, city, requirement_text, contact_email, created_at FROM staffing_requests ORDER BY created_at DESC, id DESC LIMIT 26 OFFSET ?", [(page - 1) * 25]);
  return rows;
}

async function submitStaffingRequest(values) {
  const id = randomUUID();
  await database().execute("INSERT INTO staffing_requests (id,hiring_type,city,requirement_text,contact_email) VALUES (?,?,?,?,?)", [id,...values]);
  return id;
}
module.exports = { submitStaffingRequest, listStaffingRequests };
