// MySQL Database Connection Config (Placeholder for upcoming Database Module)
// Database connection setup using mysql2 / sequelize will be implemented in the database module.

module.exports = {
  dbConfig: {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'agrif2c_db'
  }
};
