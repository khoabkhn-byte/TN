const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

// Helper function to read/write JSON files
const readDB = () => JSON.parse(fs.readFileSync('db.json', 'utf8'));
const writeDB = (data) => fs.writeFileSync('db.json', JSON.stringify(data, null, 2));

// --- API Endpoints ---

// Login
app.post('/api/login', (req, res) => {
  const { user, pass } = req.body;
  const db = readDB();
  const foundUser = db.users.find(u => u.user === user && u.pass === pass);
  if (foundUser) {
    res.json({ success: true, user: { id: foundUser.id, user: foundUser.user, role: foundUser.role } });
  } else {
    res.status(401).json({ success: false, message: 'Tên đăng nhập hoặc mật khẩu không đúng.' });
  }
});

// User (Student) Management
app.get('/api/users', (req, res) => {
  const db = readDB();
  res.json(db.users);
});

app.post('/api/register', (req, res) => {
  const { user, pass, dob, gender } = req.body;
  const db = readDB();
  const existingUser = db.users.find(u => u.user === user);
  if (existingUser) {
    return res.status(409).json({ success: false, message: 'Tên tài khoản đã tồn tại.' });
  }
  const newUser = { id: uuidv4(), user, pass, dob, gender, role: 'student' };
  db.users.push(newUser);
  writeDB(db);
  res.status(201).json({ success: true, user: newUser });
});

app.delete('/api/users/:id', (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const initialLength = db.users.length;
  db.users = db.users.filter(u => u.id !== id);
  if (db.users.length < initialLength) {
    writeDB(db);
    res.status(204).send();
  } else {
    res.status(404).json({ message: 'Người dùng không tìm thấy.' });
  }
});

// Question Management
app.get('/api/questions', (req, res) => {
  const db = readDB();
  let questions = db.questions;
  const { subject, level } = req.query;
  if (subject) {
    questions = questions.filter(q => q.subject === subject);
  }
  if (level) {
    questions = questions.filter(q => q.level === level);
  }
  res.json(questions);
});

app.post('/api/questions', (req, res) => {
  const { q, imageUrl, type, points, subject, level, options } = req.body;
  const newQuestion = { id: uuidv4(), q, imageUrl, type, points, subject, level, options };
  const db = readDB();
  db.questions.push(newQuestion);
  writeDB(db);
  res.status(201).json(newQuestion);
});

app.get('/api/questions/:id', (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const question = db.questions.find(q => q.id === id);
  if (question) {
    res.json(question);
  } else {
    res.status(404).json({ message: 'Câu hỏi không tồn tại.' });
  }
});

app.put('/api/questions/:id', (req, res) => {
  const { id } = req.params;
  const updatedData = req.body;
  const db = readDB();
  const questionIndex = db.questions.findIndex(q => q.id === id);
  if (questionIndex !== -1) {
    db.questions[questionIndex] = { ...db.questions[questionIndex], ...updatedData };
    writeDB(db);
    res.json(db.questions[questionIndex]);
  } else {
    res.status(404).json({ message: 'Câu hỏi không tồn tại.' });
  }
});

app.delete('/api/questions/:id', (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const initialLength = db.questions.length;
  db.questions = db.questions.filter(q => q.id !== id);
  if (db.questions.length < initialLength) {
    writeDB(db);
    res.status(204).send();
  } else {
    res.status(404).json({ message: 'Câu hỏi không tìm thấy.' });
  }
});

// Test Management
app.get('/api/tests', (req, res) => {
  const db = readDB();
  res.json(db.tests);
});

app.post('/api/tests', (req, res) => {
  const { name, time, subject, level, questions, teacherId } = req.body;
  const newTest = { id: uuidv4(), name, time, subject, level, questions, teacherId };
  const db = readDB();
  db.tests.push(newTest);
  writeDB(db);
  res.status(201).json(newTest);
});

app.put('/api/tests/:id', (req, res) => {
  const { id } = req.params;
  const updatedData = req.body;
  const db = readDB();
  const testIndex = db.tests.findIndex(t => t.id === id);
  if (testIndex !== -1) {
    db.tests[testIndex] = { ...db.tests[testIndex], ...updatedData };
    writeDB(db);
    res.json(db.tests[testIndex]);
  } else {
    res.status(404).json({ message: 'Bài kiểm tra không tồn tại.' });
  }
});

app.delete('/api/tests/:id', (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const initialLength = db.tests.length;
  db.tests = db.tests.filter(t => t.id !== id);
  if (db.tests.length < initialLength) {
    writeDB(db);
    res.status(204).send();
  } else {
    res.status(404).json({ message: 'Bài kiểm tra không tìm thấy.' });
  }
});

// Test Assignment
app.get('/api/assigns', (req, res) => {
  const db = readDB();
  const { studentId } = req.query;
  let assigns = db.assigns;
  if (studentId) {
    assigns = assigns.filter(a => a.studentId === studentId);
  }
  res.json(assigns);
});

app.post('/api/assigns', (req, res) => {
  const { testId, studentId, deadline, status } = req.body;
  const newAssign = { id: uuidv4(), testId, studentId, deadline, status, timeAssigned: new Date().toISOString() };
  const db = readDB();
  db.assigns.push(newAssign);
  writeDB(db);
  res.status(201).json(newAssign);
});

// Result Management
app.get('/api/results', (req, res) => {
  const db = readDB();
  const { studentId, resultId } = req.query;
  let results = db.results;
  if (studentId) {
    results = results.filter(r => r.studentId === studentId);
  }
  if (resultId) {
    const result = results.find(r => r.id === resultId);
    if (result) {
      return res.json(result);
    } else {
      return res.status(404).json({ message: 'Kết quả không tìm thấy.' });
    }
  }
  res.json(results);
});

app.post('/api/results', (req, res) => {
  const newResult = { id: uuidv4(), ...req.body, submittedAt: new Date().toISOString() };
  const db = readDB();
  db.results.push(newResult);
  writeDB(db);
  res.status(201).json(newResult);
});

const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

});


