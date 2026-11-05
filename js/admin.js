document.addEventListener('DOMContentLoaded', async () => {
    const user = getCurrentUser();
    if (!user || user.role !== 'admin') {
        document.location = 'index.html';
        return;
    }

    const bookingsBody = document.getElementById('bookings-body');
    const usersBody = document.getElementById('users-body');
    const menuBody = document.getElementById('menu-body');
    const reviewsBody = document.getElementById('reviews-body');

    window.switchTab = (tab) => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        const tabs = ['bookings', 'users', 'menu', 'reviews', 'settings'];
        
        tabs.forEach(t => {
            const el = document.getElementById('tab-' + t);
            if (el) el.style.display = 'none';
        });

        const index = tabs.indexOf(tab);
        if (index !== -1) {
            document.querySelectorAll('.tab-btn')[index].classList.add('active');
            document.getElementById('tab-' + tab).style.display = 'block';
            
            if (tab === 'bookings') loadBookings();
            if (tab === 'users') loadUsers();
            if (tab === 'menu') loadMenu();
            if (tab === 'reviews') loadReviews();
            if (tab === 'settings') loadSettings();
        }
    };

    async function loadBookings() {
        bookingsBody.innerHTML = '<tr><td colspan="8" style="text-align:center;">Загрузка...</td></tr>';
        try {
            const res = await fetch('/api/admin/bookings');
            const data = await res.json();
            bookingsBody.innerHTML = '';
            data.forEach(b => {
                const dateStr = b.date ? b.date.substring(0, 10).split('-').reverse().join('.') : '—';
                const timeStr = b.time ? b.time.substring(0, 5) : '—';
                const statusClass = b.status ? b.status.replace(/\s/g, '') : '';
                bookingsBody.innerHTML += `
                    <tr>
                        <td>№${b.orderNumber}</td><td>${b.userName}</td><td>${b.userPhone}</td>
                        <td>${dateStr} в ${timeStr}</td><td>${b.guests}</td><td>${b.total} ₽</td>
                        <td class="status-text status-${statusClass}">${b.status}</td>
                        <td>
                            ${b.status !== 'Успешно' ? `<button class="status-btn btn-success" onclick="changeStatus(${b.id}, 'Успешно')">Одобрить</button>` : ''}
                            ${b.status !== 'Отменено' ? `<button class="status-btn btn-cancel" onclick="changeStatus(${b.id}, 'Отменено')">Отменить</button>` : ''}
                        </td>
                    </tr>`;
            });
        } catch (e) { bookingsBody.innerHTML = '<tr><td colspan="8" style="color:red; text-align:center;">Ошибка загрузки</td></tr>'; }
    }

    window.changeStatus = async (id, status) => {
        await fetch(`/api/admin/bookings/${id}/status`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({statusName: status}) });
        loadBookings();
    };

    async function loadUsers() {
        usersBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Загрузка...</td></tr>';
        try {
            const res = await fetch('/api/admin/users');
            const data = await res.json();
            usersBody.innerHTML = '';
            data.forEach(u => {
                const isBanned = u.is_banned === 1;
                usersBody.innerHTML += `
                    <tr>
                        <td>${u.id}</td><td>${u.login}</td><td>${u.phone}</td>
                        <td style="color: ${isBanned ? '#C63333' : '#28a745'}; font-weight: bold;">${isBanned ? 'Забанен' : 'Активен'}</td>
                        <td>
                            <button class="status-btn ${isBanned ? 'btn-success' : 'btn-cancel'}" onclick="toggleBan(${u.id}, ${u.is_banned})">${isBanned ? 'Разбанить' : 'Забанить'}</button>
                            <button class="status-btn" style="background: #555;" onclick="deleteUser(${u.id})">Удалить</button>
                        </td>
                    </tr>`;
            });
        } catch (e) { usersBody.innerHTML = '<tr><td colspan="5" style="color:red; text-align:center;">Ошибка загрузки</td></tr>'; }
    }

    window.toggleBan = async (id, isBanned) => {
        await fetch(`/api/admin/users/${id}/ban`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({isBanned: !isBanned}) });
        loadUsers();
    };
    
    window.deleteUser = async (id) => {
        if (!confirm('Удалить пользователя?')) return;
        await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
        loadUsers();
    };

    async function loadMenu() {
        menuBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Загрузка...</td></tr>';
        try {
            const res = await fetch('/api/admin/menu');
            const data = await res.json();
            menuBody.innerHTML = '';
            data.forEach(m => {
                const isAvail = m.is_available === 1;
                menuBody.innerHTML += `
                    <tr>
                        <td>${m.menu_itemID}</td>
                        <td>${m.name}</td>
                        <td>${m.price} ₽</td>
                        <td style="color: ${isAvail ? '#28a745' : '#C63333'}; font-weight: bold;">${isAvail ? 'Показано' : 'Скрыто'}</td>
                        <td>
                            <button class="status-btn ${isAvail ? 'btn-cancel' : 'btn-success'}" onclick="toggleMenu(${m.menu_itemID}, ${m.is_available})">${isAvail ? 'Скрыть' : 'Показать'}</button>
                            <button class="status-btn" style="background: #555;" onclick="deleteMenuItem(${m.menu_itemID})">Удалить</button>
                        </td>
                    </tr>`;
            });
        } catch (e) { menuBody.innerHTML = '<tr><td colspan="5" style="color:red; text-align:center;">Ошибка загрузки</td></tr>'; }
    }

    window.toggleMenu = async (id, isAvailable) => {
        await fetch(`/api/admin/menu/${id}/toggle`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({isAvailable: !isAvailable}) });
        loadMenu();
    };
    
    window.deleteMenuItem = async (id) => {
        if (!confirm('Удалить блюдо навсегда?')) return;
        const res = await fetch(`/api/admin/menu/${id}`, { method: 'DELETE' });
        if (res.ok) loadMenu();
        else alert('Нельзя удалить блюдо, так как на него уже есть заказы! Лучше просто скрой его.');
    };

    window.createMenuItem = async () => {
        const name = document.getElementById('add-name').value;
        const description = document.getElementById('add-desc').value;
        const price = document.getElementById('add-price').value;
        const type = document.getElementById('add-type').value;
        const image_url = document.getElementById('add-image').value;
        const spicy_level = parseInt(document.getElementById('add-spicy').value) || 0;
        const sweet_level = parseInt(document.getElementById('add-sweet').value) || 0;

        if (!name || !price || !image_url) {
            alert('Заполните хотя бы название, цену и картинку!');
            return;
        }

        try {
            const res = await fetch('/api/admin/menu', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, description, price, type, image_url, spicy_level, sweet_level })
            });
            const data = await res.json();
            
            if (data.ok) {
                document.getElementById('add-menu-modal').style.display = 'none';
                document.getElementById('add-name').value = '';
                document.getElementById('add-desc').value = '';
                document.getElementById('add-price').value = '';
                document.getElementById('add-image').value = '';
                loadMenu();
            } else {
                alert('Ошибка: ' + data.error);
            }
        } catch (err) {
            alert('Ошибка соединения с сервером');
        }
    };

    async function loadReviews() {
        reviewsBody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Загрузка...</td></tr>';
        try {
            const res = await fetch('/api/admin/reviews');
            const data = await res.json();
            reviewsBody.innerHTML = '';
            data.forEach(r => {
                const isHidden = r.is_hidden === 1;
                reviewsBody.innerHTML += `
                    <tr>
                        <td>${r.reviewsID}</td>
                        <td>${r.author_name}</td>
                        <td>${r.rating}</td>
                        <td>${r.text.substring(0, 50)}...</td>
                        <td style="color: ${isHidden ? '#C63333' : '#28a745'}; font-weight: bold;">${isHidden ? 'Скрыт' : 'Виден'}</td>
                        <td>
                            <button class="status-btn ${isHidden ? 'btn-success' : 'btn-cancel'}" onclick="toggleReview(${r.reviewsID}, ${r.is_hidden})">${isHidden ? 'Показать' : 'Скрыть'}</button>
                            <button class="status-btn" style="background: #555;" onclick="deleteReview(${r.reviewsID})">Удалить</button>
                        </td>
                    </tr>`;
            });
        } catch (e) { reviewsBody.innerHTML = '<tr><td colspan="6" style="color:red; text-align:center;">Ошибка загрузки</td></tr>'; }
    }

    window.toggleReview = async (id, isHidden) => {
        await fetch(`/api/admin/reviews/${id}/toggle`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({isHidden: !isHidden}) });
        loadReviews();
    };
    
    window.deleteReview = async (id) => {
        if (!confirm('Удалить отзыв навсегда?')) return;
        await fetch(`/api/admin/reviews/${id}`, { method: 'DELETE' });
        loadReviews();
    };

    async function loadSettings() {
        try {
            const res = await fetch('/api/settings');
            const data = await res.json();
            document.getElementById('set-phone').value = data.phone || '';
            document.getElementById('set-email').value = data.email || '';
            document.getElementById('set-address').value = data.address || '';
        } catch (e) { console.error(e); }
    }

    window.saveSettings = async () => {
        const phone = document.getElementById('set-phone').value;
        const email = document.getElementById('set-email').value;
        const address = document.getElementById('set-address').value;
        await fetch('/api/admin/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone, email, address })
        });
        alert('Контакты успешно обновлены!');
    };

    loadBookings();
});