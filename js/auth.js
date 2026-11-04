function getCurrentUser() {
    const user = localStorage.getItem('rnj_user');
    return user ? JSON.parse(user) : null;
}

function logoutUser() {
    localStorage.removeItem('rnj_user');
}

async function registerUser(login, phone, password) {
    login    = (login || '').trim();
    phone    = (phone || '').trim();
    password = password || '';

    if (!login || !phone || !password) return { ok: false, error: 'Заполните все поля!' };

    const digits = phone.replace(/\D/g, '');
    if (digits.length !== 11) return { ok: false, error: 'Номер должен содержать 11 цифр' };
    const normalizedPhone = '+' + digits;

    if (password.length < 5 || password.length > 15) return { ok: false, error: 'Пароль должен быть от 5 до 15 символов' };

    try {
        const res = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ login, phone: normalizedPhone, password })
        });
        const data = await res.json();
        
        if (!res.ok) return { ok: false, error: data.error };
        
        localStorage.setItem('rnj_user', JSON.stringify(data.user));
        return { ok: true, user: data.user };
    } catch (err) {
        return { ok: false, error: 'Ошибка соединения с сервером' };
    }
}

async function loginUser(phone, password) {
    phone    = (phone || '').trim();
    password = password || '';

    if (!phone || !password) return { ok: false, error: 'Заполните все поля!' };

    const digits = phone.replace(/\D/g, '');
    if (digits.length !== 11) return { ok: false, error: 'Номер должен содержать 11 цифр' };
    const normalizedPhone = '+' + digits;

    try {
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: normalizedPhone, password })
        });
        const data = await res.json();
        
        if (!res.ok) return { ok: false, error: data.error };
        
        localStorage.setItem('rnj_user', JSON.stringify(data.user));
        return { ok: true, user: data.user };
    } catch (err) {
        return { ok: false, error: 'Ошибка соединения с сервером' };
    }
}