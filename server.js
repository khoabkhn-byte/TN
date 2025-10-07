
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const { MongoClient } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// 💡 CẤU HÌNH MONGODB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://khoabkhn_db_user:KVhPaIp7GDUGYRtM@quiz.hvpqlmn.mongodb.net/?retryWrites=true&w=majority&appName=quiz';
const DB_NAME = process.env.DB_NAME || 'quiz'; // 👈 thêm dòng này

let db;

// Hàm kết nối Database
async function connectDB() {
    try {
        const client = await MongoClient.connect(MONGODB_URI);
        db = client.db(DB_NAME);
        console.log(`✅ Connected to MongoDB database: ${DB_NAME}`);
    } catch (error) {
        console.error("❌ MongoDB connection error. Vui lòng kiểm tra MONGODB_URI:", error);
        process.exit(1);
    }
}

// --- API Endpoints ---

// Đăng nhập
app.post('/api/login', async (req, res) => {
    const { user, pass } = req.body;
    try {
        const foundUser = await db.collection('users').findOne({ user, pass });
        if (foundUser) {
            res.json({ success: true, user: { id: foundUser.id, user: foundUser.user, role: foundUser.role } });
        } else {
            res.status(401).json({ success: false, message: 'Tên đăng nhập hoặc mật khẩu không đúng.' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server.' });
    }
});

// Lấy danh sách người dùng
app.get('/api/users', async (req, res) => {
    try {
        const users = await db.collection('users').find({}).toArray();
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server.' });
    }
});

// Đăng ký
app.post('/api/register', async (req, res) => {
    const { user, pass, dob, gender } = req.body;
    try {
        const existingUser = await db.collection('users').findOne({ user });
        if (existingUser) {
            return res.status(409).json({ success: false, message: 'Tên tài khoản đã tồn tại.' });
        }
        const newUser = { id: uuidv4(), user, pass, dob, gender, role: 'student' };
        await db.collection('users').insertOne(newUser);
        res.status(201).json({ success: true, user: newUser });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server.' });
    }
});

// Question Management
app.get('/api/questions', async (req, res) => {
    try {
        let query = {};
        const { subject, level } = req.query;
        if (subject) query.subject = subject;
        if (level) query.level = level;
        
        const questions = await db.collection('questions').find(query).toArray();
        res.json(questions);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server.' });
    }
});

app.post('/api/questions', async (req, res) => {
    const { q, imageUrl, type, points, subject, level, options } = req.body;
    try {
        const newQuestion = { id: uuidv4(), q, imageUrl, type, points, subject, level, options };
        await db.collection('questions').insertOne(newQuestion);
        res.status(201).json(newQuestion);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server.' });
    }
});

app.get('/api/questions/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const question = await db.collection('questions').findOne({ id });
        if (question) {
            res.json(question);
        } else {
            res.status(404).json({ message: 'Câu hỏi không tồn tại.' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server.' });
    }
});

app.put('/api/questions/:id', async (req, res) => {
    const { id } = req.params;
    const updatedData = req.body;
    try {
        // Loại bỏ trường _id của MongoDB nếu có
        delete updatedData._id; 
        const result = await db.collection('questions').updateOne(
            { id }, 
            { $set: updatedData }
        );
        if (result.matchedCount > 0) {
            const updatedQuestion = await db.collection('questions').findOne({ id });
            res.json(updatedQuestion);
        } else {
            res.status(404).json({ message: 'Câu hỏi không tồn tại.' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server.' });
    }
});

app.delete('/api/questions/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.collection('questions').deleteOne({ id });
        if (result.deletedCount > 0) {
            res.status(204).send();
        } else {
            res.status(404).json({ message: 'Câu hỏi không tìm thấy.' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server.' });
    }
});

// Test Management
app.get('/api/tests', async (req, res) => {
    try {
        const tests = await db.collection('tests').find({}).toArray();
        res.json(tests);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server.' });
    }
});

app.post('/api/tests', async (req, res) => {
    const { name, time, subject, level, questions, teacherId } = req.body;
    try {
        const newTest = { id: uuidv4(), name, time, subject, level, questions, teacherId };
        await db.collection('tests').insertOne(newTest);
        res.status(201).json(newTest);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server.' });
    }
});

app.put('/api/tests/:id', async (req, res) => {
    const { id } = req.params;
    const updatedData = req.body;
    try {
        delete updatedData._id;
        const result = await db.collection('tests').updateOne(
            { id }, 
            { $set: updatedData }
        );
        if (result.matchedCount > 0) {
            const updatedTest = await db.collection('tests').findOne({ id });
            res.json(updatedTest);
        } else {
            res.status(404).json({ message: 'Bài kiểm tra không tồn tại.' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server.' });
    }
});

app.delete('/api/tests/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.collection('tests').deleteOne({ id });
        if (result.deletedCount > 0) {
            res.status(204).send();
        } else {
            res.status(404).json({ message: 'Bài kiểm tra không tìm thấy.' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server.' });
    }
});

// Test Assignment
app.get('/api/assigns', async (req, res) => {
    try {
        let query = {};
        const { studentId } = req.query;
        if (studentId) query.studentId = studentId;

        const assigns = await db.collection('assigns').find(query).toArray();
        res.json(assigns);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server.' });
    }
});

app.post('/api/assigns', async (req, res) => {
    const { testId, studentId, deadline, status } = req.body;
    try {
        const newAssign = { id: uuidv4(), testId, studentId, deadline, status, timeAssigned: new Date().toISOString() };
        await db.collection('assigns').insertOne(newAssign);
        res.status(201).json(newAssign);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server.' });
    }
});

// Result Management
app.get('/api/results', async (req, res) => {
    try {
        let query = {};
        const { studentId } = req.query;
        if (studentId) query.studentId = studentId;
        
        const results = await db.collection('results').find(query).toArray();
        res.json(results);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server.' });
    }
});

app.post('/api/results', async (req, res) => {
    try {
        const newResult = { id: uuidv4(), ...req.body, submittedAt: new Date().toISOString() };
        await db.collection('results').insertOne(newResult);
        res.status(201).json(newResult);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server.' });
    }
});

app.get("/api/results/:id", async (req, res) => {
    const id = req.params.id;
    try {
        const result = await db.collection('results').findOne({ id });
        if (!result) {
            return res.status(404).json({ message: "Kết quả không tìm thấy." });
        }
        res.json(result);
    } catch (err) {
        console.error("Error in GET /results/:id:", err);
        res.status(500).json({ message: "Lỗi server nội bộ." });
    }
});

// GET single test by ID
app.get('/api/tests/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const test = await db.collection('tests').findOne({ id });
        if (test) {
            res.json(test);
        } else {
            res.status(404).json({ message: 'Bài kiểm tra không tồn tại.' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server.' });
    }
});

app.get('/api/questions', async (req, res) => {
    try {
        let query = {};
        const { subject, level } = req.query;
        if (subject) query.subject = subject;
        if (level) query.level = level;
        const questions = await db.collection('questions').find(query).toArray();
        res.json(questions);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server.' });
    }
});

// 💡 KHỞI ĐỘNG SERVER SAU KHI KẾT NỐI DB THÀNH CÔNG
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 Server is running on port ${PORT}`);
        console.log(`🌐 URL: https://tn-j0j4.onrender.com`);
    });
});
```
