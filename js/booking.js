document.addEventListener('DOMContentLoaded', () => {
    const nameInput = document.getElementById('booking-name');
    if (!nameInput) return;

    const user = getCurrentUser();
    const isGuest = !user;
    const phoneInput = document.getElementById('booking-phone');
    const dateInput = document.getElementById('booking-date');
    const timeInput = document.getElementById('booking-time');
    const timeDropdown = document.getElementById('time-dropdown');
    const guestQuan = document.getElementById('guest-quan');
    const guestMinus = document.querySelector('[data-guest-minus]');
    const guestPlus = document.querySelector('[data-guest-plus]');

    if (user) {
        nameInput.value = user.login;
        phoneInput.value = user.phone;
    }

    phoneInput.addEventListener('focus', () => { if (!phoneInput.value) phoneInput.value = '+'; });
    phoneInput.addEventListener('blur',  () => { if (phoneInput.value === '+') phoneInput.value = ''; });
    phoneInput.addEventListener('input', () => {
        let d = phoneInput.value.replace(/\D/g, '').slice(0, 11);
        phoneInput.value = d ? '+' + d : '';
    });
    phoneInput.addEventListener('keypress', (e) => { if (!/[0-9]/.test(e.key)) e.preventDefault(); });

    let guestCount = 1;
    guestPlus.addEventListener('click', () => {
        if (guestCount < 15) { guestCount++; guestQuan.textContent = guestCount; }
    });
    guestMinus.addEventListener('click', () => {
        if (guestCount > 1) { guestCount--; guestQuan.textContent = guestCount; }
    });

    dateInput.min = '2026-11-01';
    dateInput.max = '2026-12-31';

    let busyTimes = [];

    async function generateTimeSlots() {
        if (!dateInput.value) {
            alert('Сначала выберите дату!');
            timeInput.value = '';
            return;
        }

        try {
            const res = await fetch(`/api/busy-slots?date=${dateInput.value}`);
            busyTimes = await res.json();
            
            timeDropdown.innerHTML = '';
            const startHour = 11;
            const endHour = 19;

            for (let h = startHour; h <= endHour; h++) {
                for (let m of ['00', '30']) {
                    if (h === 19 && m === '30') continue;

                    const timeStr = `${String(h).padStart(2, '0')}:${m}`;
                    const isBusy = busyTimes.includes(timeStr);

                    const div = document.createElement('div');
                    div.className = 'time-slot' + (isBusy ? ' disabled' : '');
                    div.textContent = timeStr;
                    
                    if (!isBusy) {
                        div.addEventListener('click', () => {
                            timeInput.value = timeStr;
                            timeDropdown.classList.remove('active');
                        });
                    }
                    
                    timeDropdown.appendChild(div);
                }
            }

            timeDropdown.classList.add('active');
        } catch (e) {
            console.error('Ошибка загрузки слотов');
        }
    }

    dateInput.addEventListener('change', () => {
        timeInput.value = '';
        if (dateInput.value) generateTimeSlots();
    });

    timeInput.addEventListener('click', (e) => {
        e.stopPropagation();
        if (dateInput.value) {
            timeDropdown.classList.toggle('active');
        } else {
            alert('Сначала выберите дату!');
        }
    });

    document.addEventListener('click', (e) => {
        if (e.target !== timeInput && !timeDropdown.contains(e.target)) {
            timeDropdown.classList.remove('active');
        }
    });

    window.toggleDropdown = function(element) {
        element.classList.toggle('active');
        const content = element.nextElementSibling;
        if (content) content.classList.toggle('open');
    };

    let dishes = [];
    const totalEl = document.querySelector('.totalPrice');
    
    function recalc() {
        const sum = dishes.reduce((a, d) => a + d.price * d.qty, 0);
        totalEl.textContent = sum + ' ₽';
    }
    totalEl.textContent = '0 ₽';

    async function loadMenuForBooking() {
        try {
            const res = await fetch('/api/menu');
            const items = await res.json();
            const foodList = document.getElementById('food-list');
            const drinkList = document.getElementById('drink-list');
            
            if (!foodList || !drinkList) return; 

            foodList.innerHTML = '';
            drinkList.innerHTML = '';

            items.forEach(item => {
                const html = `
                    <div class="pos" data-name="${item.name}" data-price="${item.price}">
                        <div class="position">
                            <p class="posText">${item.name}</p>
                            <p class="price">${item.price} ₽</p>
                        </div>
                        <div class="field13">
                            <p class="plusminus" data-minus>-</p>
                            <p class="quan">0</p>
                            <p class="plusminus" data-plus>+</p>
                        </div>
                    </div>
                `;
                if (item.type === 'food') foodList.innerHTML += html;
                else drinkList.innerHTML += html;
            });

            document.querySelectorAll('.pos').forEach(pos => {
                const name = pos.dataset.name;
                const price = parseInt(pos.dataset.price);
                const quanEl = pos.querySelector('.quan');
                const minus = pos.querySelector('[data-minus]');
                const plus = pos.querySelector('[data-plus]');
                
                const itemObj = { name, price, qty: 0, quanEl };
                dishes.push(itemObj);

                plus.addEventListener('click', () => {
                    if (itemObj.qty < 3) { itemObj.qty++; quanEl.textContent = itemObj.qty; recalc(); }
                });
                minus.addEventListener('click', () => {
                    if (itemObj.qty > 0) { itemObj.qty--; quanEl.textContent = itemObj.qty; recalc(); }
                });
            });
        } catch (e) { console.error('Ошибка загрузки меню'); }
    }

    loadMenuForBooking();

    document.querySelector('.bookingfinal').addEventListener('click', () => {
        if (isGuest) { alert('Чтобы забронировать столик, войдите или зарегистрируйтесь!'); return; }
        if (!nameInput.value.trim()) { alert('Введите имя'); return; }
        if (phoneInput.value.replace(/\D/g, '').length !== 11) { alert('Введите номер (11 цифр)'); return; }
        if (!dateInput.value) { alert('Выберите дату'); return; }
        if (!timeInput.value) { alert('Выберите время'); return; }

        document.getElementById('pay-overlay').classList.add('active');
        document.getElementById('modal-pay').classList.add('active');
        document.body.style.overflow = 'hidden';
    });

    const payOverlay = document.getElementById('pay-overlay');
    const payModal   = document.getElementById('modal-pay');
    const cardIn     = document.getElementById('pay-card');
    const expIn      = document.getElementById('pay-exp');
    const cvvIn      = document.getElementById('pay-cvv');
    const errEl      = document.getElementById('pay-error');

    function closePay() {
        payOverlay.classList.remove('active');
        payModal.classList.remove('active');
        document.body.style.overflow = '';
    }

    document.getElementById('pay-close').addEventListener('click', closePay);
    payOverlay.addEventListener('click', closePay);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closePay(); });

    cardIn.addEventListener('input', () => { let d = cardIn.value.replace(/\D/g, '').slice(0, 16); cardIn.value = d.replace(/(.{4})/g, '$1 ').trim(); });
    expIn.addEventListener('input', () => { let d = expIn.value.replace(/\D/g, '').slice(0, 4); if (d.length >= 2) d = d.slice(0, 2) + '/' + d.slice(2); expIn.value = d; });
    cvvIn.addEventListener('input', () => { cvvIn.value = cvvIn.value.replace(/\D/g, '').slice(0, 3); });

    document.getElementById('pay-submit').addEventListener('click', () => {
        const card = cardIn.value.replace(/\s/g, '');
        const exp  = expIn.value;
        const cvv  = cvvIn.value;

        if (!card || !exp || !cvv) { errEl.textContent = 'Заполните все поля!'; return; }
        if (card.length !== 16)    { errEl.textContent = 'Номер карты — 16 цифр'; return; }
        if (!/^\d{2}\/\d{2}$/.test(exp)) { errEl.textContent = 'Срок в формате ММ/ГГ'; return; }
        const [mm, yy] = exp.split('/').map(Number);
        if (mm < 1 || mm > 12) { errEl.textContent = 'Неверный месяц'; return; }
        if (new Date(2000 + yy, mm, 1) <= new Date()) { errEl.textContent = 'Карта просрочена'; return; }
        if (cvv.length !== 3)  { errEl.textContent = 'CVV — 3 цифры'; return; }

        const orderNumber = Math.floor(1000 + Math.random() * 9000);
        const bookingData = {
            userId: user.id, orderNumber, date: dateInput.value, time: timeInput.value,
            guests: guestCount, items: dishes.filter(d => d.qty > 0),
            total: dishes.reduce((a, d) => a + d.price * d.qty, 0)
        };

        fetch('/api/booking', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bookingData)
        })
        .then(res => res.json())
        .then(data => {
            if (data.ok) {
                closePay();
                alert('Бронь успешно оплачена!');
                setTimeout(() => document.location = 'profile.html', 1000);
            } else {
                alert('Ошибка: ' + data.error);
            }
        })
        .catch(() => alert('Ошибка соединения с сервером'));
    });
});