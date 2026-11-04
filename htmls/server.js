const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'peroxide',
    database: 'ramen_no_jutsu'
});

db.connect((err) => {
    if (err) console.error('Ошибка подключения к БД:', err.message);
    else console.log('Успешно подключено к базе данных MySQL');
});

app.use(express.static(__dirname));
app.use(express.static(path.join(__dirname, '..')));

app.post('/api/register', (req, res) => {
    const { login, phone, password } = req.body;
    db.query('SELECT * FROM users WHERE login = ? OR phone = ?', [login, phone], (err, results) => {
        if (err) return res.status(500).json({ error: 'Ошибка БД' });
        if (results.length > 0) return res.status(400).json({ error: 'Логин или номер уже заняты' });

        db.query('INSERT INTO users (login, phone, password, role) VALUES (?, ?, ?, "user")', [login, phone, password], (err, result) => {
            if (err) return res.status(500).json({ error: 'Ошибка при сохранении' });
            res.status(201).json({ ok: true, user: { id: result.insertId, login, phone, role: 'user' } });
        });
    });
});

app.post('/api/login', (req, res) => {
    const { phone, password } = req.body;
    db.query('SELECT * FROM users WHERE phone = ? AND password = ?', [phone, password], (err, results) => {
        if (err) return res.status(500).json({ error: 'Ошибка БД' });
        if (results.length === 0) return res.status(401).json({ error: 'Неверный номер или пароль' });
        const user = results[0];
        if (user.is_banned) return res.status(403).json({ error: 'Ваш аккаунт заблокирован' });
        res.json({ ok: true, user: { id: user.userID, login: user.login, phone: user.phone, role: user.role } });
    });
});

app.get('/api/users/:id', (req, res) => {
    db.query('SELECT userID as id, login, phone, role FROM users WHERE userID = ?', [req.params.id], (err, results) => {
        if (err || results.length === 0) return res.status(404).json({ error: 'Не найден' });
        res.json(results[0]);
    });
});

app.get('/api/menu', (req, res) => {
    db.query('SELECT * FROM menu_items WHERE is_available = 1', (err, results) => {
        if (err) return res.status(500).json({ error: 'Ошибка сервера' });
        res.json(results);
    });
});

app.get('/api/reviews', (req, res) => {
    db.query('SELECT * FROM reviews WHERE is_hidden = 0 ORDER BY reviewsID DESC', (err, results) => {
        if (err) return res.status(500).json({ error: 'Ошибка сервера' });
        res.json(results);
    });
});

app.post('/api/reviews', (req, res) => {
    const { userId, author_name, rating, text } = req.body;
    db.query('INSERT INTO reviews (userID, author_name, rating, text, is_hidden) VALUES (?, ?, ?, ?, 0)', [userId, author_name, rating, text], (err, result) => {
        if (err) return res.status(500).json({ error: 'Ошибка при сохранении отзыва' });
        res.json({ ok: true, id: result.insertId });
    });
});

app.get('/api/settings', (req, res) => {
    db.query('SELECT * FROM settings WHERE id = 1', (err, results) => {
        if (err || results.length === 0) return res.status(500).json({ error: 'Ошибка' });
        res.json(results[0]);
    });
});

app.post('/api/booking', (req, res) => {
    const { userId, orderNumber, date, time, guests, items, total } = req.body;
    db.query('SELECT statusID FROM booking_statuses WHERE status_name = "Отменено"', (err, statusRes) => {
        const cancelStatusID = (statusRes && statusRes.length > 0) ? statusRes[0].statusID : 2;
        db.query('INSERT INTO bookings (userID, order_number, booking_date, booking_time, guests_count, final_price, statusID) VALUES (?, ?, ?, ?, ?, ?, 1)', [userId, orderNumber, date, time, guests, total], (err, bookingResult) => {
            if (err) return res.status(500).json({ error: 'Ошибка при создании брони' });
            const bookingId = bookingResult.insertId;
            if (items && items.length > 0) {
                db.query('SELECT menu_itemID, name FROM menu_items', (err, menuRes) => {
                    if (err) return res.status(500).json({ error: 'Ошибка БД' });
                    const orderValues = items.map(item => {
                        const dbItem = menuRes.find(m => m.name.toLowerCase() === item.name.toLowerCase());
                        return [bookingId, dbItem ? dbItem.menu_itemID : 1, item.qty, item.price * item.qty];
                    });
                    db.query('INSERT INTO orders (bookingsID, menu_itemID, quantity, order_price) VALUES ?', [orderValues], (err) => {
                        if (err) return res.status(500).json({ error: 'Ошибка при сохранении блюд' });
                        res.json({ ok: true });
                    });
                });
            } else res.json({ ok: true });
        });
    });
});

app.get('/api/bookings/:userId', (req, res) => {
    db.query(`SELECT b.bookingsID as id, b.order_number as orderNumber, b.booking_date as date, b.booking_time as time, b.guests_count as guests, b.final_price as total, s.status_name as status FROM bookings b JOIN booking_statuses s ON b.statusID = s.statusID WHERE b.userID = ? ORDER BY b.bookingsID DESC`, [req.params.userId], (err, results) => {
        if (err) return res.status(500).json({ error: 'Ошибка сервера' });
        res.json(results);
    });
});

app.get('/api/admin/bookings', (req, res) => {
    db.query(`SELECT b.bookingsID as id, b.order_number as orderNumber, b.booking_date as date, b.booking_time as time, b.guests_count as guests, b.final_price as total, IFNULL(u.login, 'Удален') as userName, IFNULL(u.phone, '—') as userPhone, s.status_name as status FROM bookings b JOIN booking_statuses s ON b.statusID = s.statusID LEFT JOIN users u ON b.userID = u.userID ORDER BY b.bookingsID DESC`, (err, results) => {
        if (err) return res.status(500).json({ error: 'Ошибка сервера' });
        res.json(results);
    });
});

app.put('/api/admin/bookings/:id/status', (req, res) => {
    db.query('SELECT statusID FROM booking_statuses WHERE status_name = ?', [req.body.statusName], (err, statusRes) => {
        if (err || statusRes.length === 0) return res.status(400).json({ error: 'Неверный статус' });
        db.query('UPDATE bookings SET statusID = ? WHERE bookingsID = ?', [statusRes[0].statusID, req.params.id], (err) => {
            if (err) return res.status(500).json({ error: 'Ошибка обновления' });
            res.json({ ok: true });
        });
    });
});

app.get('/api/admin/users', (req, res) => {
    db.query('SELECT userID as id, login, phone, role, is_banned FROM users WHERE role != "admin"', (err, results) => {
        if (err) return res.status(500).json({ error: 'Ошибка сервера' });
        res.json(results);
    });
});

app.put('/api/admin/users/:id/ban', (req, res) => {
    db.query('UPDATE users SET is_banned = ? WHERE userID = ?', [req.body.isBanned ? 1 : 0, req.params.id], (err) => {
        if (err) return res.status(500).json({ error: 'Ошибка сервера' });
        res.json({ ok: true });
    });
});

app.delete('/api/admin/users/:id', (req, res) => {
    db.query('DELETE FROM users WHERE userID = ?', [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: 'Ошибка сервера' });
        res.json({ ok: true });
    });
});

app.get('/api/admin/menu', (req, res) => {
    db.query('SELECT * FROM menu_items', (err, results) => {
        if (err) return res.status(500).json({ error: 'Ошибка сервера' });
        res.json(results);
    });
});

app.post('/api/admin/menu', (req, res) => {
    const { name, description, price, type, image_url, spicy_level, sweet_level } = req.body;
    db.query('INSERT INTO menu_items (name, description, price, type, image_url, spicy_level, sweet_level, is_available) VALUES (?, ?, ?, ?, ?, ?, ?, 1)', 
    [name, description, price, type, image_url, spicy_level, sweet_level], 
    (err, result) => {
        if (err) return res.status(500).json({ error: 'Ошибка при добавлении блюда' });
        res.json({ ok: true, id: result.insertId });
    });
});

app.put('/api/admin/menu/:id/toggle', (req, res) => {
    db.query('UPDATE menu_items SET is_available = ? WHERE menu_itemID = ?', [req.body.isAvailable ? 1 : 0, req.params.id], (err) => {
        if (err) return res.status(500).json({ error: 'Ошибка сервера' });
        res.json({ ok: true });
    });
});

app.delete('/api/admin/menu/:id', (req, res) => {
    db.query('DELETE FROM menu_items WHERE menu_itemID = ?', [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: 'Ошибка сервера' });
        res.json({ ok: true });
    });
});

app.get('/api/admin/reviews', (req, res) => {
    db.query('SELECT * FROM reviews ORDER BY reviewsID DESC', (err, results) => {
        if (err) return res.status(500).json({ error: 'Ошибка сервера' });
        res.json(results);
    });
});

app.put('/api/admin/reviews/:id/toggle', (req, res) => {
    db.query('UPDATE reviews SET is_hidden = ? WHERE reviewsID = ?', [req.body.isHidden ? 1 : 0, req.params.id], (err) => {
        if (err) return res.status(500).json({ error: 'Ошибка сервера' });
        res.json({ ok: true });
    });
});

app.delete('/api/admin/reviews/:id', (req, res) => {
    db.query('DELETE FROM reviews WHERE reviewsID = ?', [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: 'Ошибка сервера' });
        res.json({ ok: true });
    });
});

app.post('/api/admin/settings', (req, res) => {
    const { phone, email, address } = req.body;
    db.query('UPDATE settings SET phone = ?, email = ?, address = ? WHERE id = 1', [phone, email, address], (err) => {
        if (err) return res.status(500).json({ error: 'Ошибка сервера' });
        res.json({ ok: true });
    });
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Сервер запущен: http://localhost:${PORT}`));