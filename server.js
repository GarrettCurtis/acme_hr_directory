require("dotenv").config();
const pg = require('pg');
const express = require("express");

const app = express();
app.use(express.json());
app.use(require('morgan')('dev'));

const client = new pg.Client(
  process.env.DATABASE_URL || `postgres://localhost/${process.env.DB_NAME}`
);

// READ departments
app.get('/api/departments', async (req, res, next) => {
  try {
    const SQL = 'SELECT * FROM departments';
    const response = await client.query(SQL);
    res.send(response.rows);
  } catch (error) {
    next(error);
  }
});

// READ employees
app.get('/api/employees', async (req, res, next) => {
  try {
    const sql = 'SELECT * FROM employees';
    const response = await client.query(SQL);
    res.send(response.rows);
  } catch (error) {
    next(error);
  }
});

// CREATE employees
app.post('/api/employees', async (req, res, next) => {
  try {
    const SQL = `
      INSERT INTO employees (name, department_id)
      VALUES ($1, $2)
      RETURNING *;
    `;
    const response = await client.query(SQL, [req.body.name, req.body.department_id]);
    res.send(response.rows[0]);
  } catch (error) {
    next(error);
  }
});

// UPDATE employees
app.put('/api/employees/:id', async (req, res, next) => {
  try {
    const SQL = `
      UPDATE employees
      SET name = $1, department_id = $2, updated_at = NOW()
      WHERE id = $3 RETURNING *
    `;
    const response = await client.query(SQL, [req.body.name, req.body.department_id, req.params.id
    ]);
    res.send(response.rows[0]);
  } catch (error) {
    next(error);
  }
});

// DELETE employees
app.delete('/api/employees/:id', async (req, res, next) => {
  try {
    const SQL = 'DELETE FROM employees WHERE id = $1';
    await client.query(SQL, [req.params.id]);
    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
});

// Error handling
app.use((error, req, res, next) => {
  res.status(res.statusCode || 500).send({ error: error.message });
});

const init = async () => {
  await client.connect();

  let SQL = `
    DROP TABLE IF EXISTS employees;
    DROP TABLE IF EXISTS departments;

    CREATE TABLE departments(
      id SERIAL PRIMARY KEY,
      name VARCHAR(50)
    );

    CREATE TABLE employees(
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT now(),
      updated_at TIMESTAMP DEFAULT now(),
      department_id INTEGER REFERENCES departments(id) NOT NULL
    );
  `;
  await client.query(SQL);
  console.log('Tables created');

  SQL = `
  INSERT INTO departments(name) VALUES('Training'), ('Recruitment'), ('Accounting');
  INSERT INTO employees(name, department_id) VALUES
    ('Alex Martel', (SELECT id FROM departments WHERE name='Training')),
    ('Jamie Knox', (SELECT id FROM departments WHERE name='Recruitment')),
    ('Samantha Bloom', (SELECT id FROM departments WHERE name='Accounting')),
    ('Chris P. Bacon', (SELECT id FROM departments WHERE name='Accounting')),
    ('Morgan Yates', (SELECT id FROM departments WHERE name='Training'));
  
  `;
  await client.query(SQL);
  console.log('Data seeded');

  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`Listening on port ${port}`));
};

init();


