document.addEventListener('DOMContentLoaded', async () => {
            const user = getCurrentUser();
            if (!user) { document.location = 'index.html'; return; }
            
            document.getElementById('profile-login').textContent = user.login;
            document.getElementById('profile-phone').textContent = user.phone;

            if (user.role === 'admin') {
    document.getElementById('admin-btn').style.display = 'block';
    document.getElementById('review-btn').style.display = 'none';
}

            document.getElementById('logout-btn').addEventListener('click', () => {
                logoutUser();
                document.location = 'index.html';
            });

            const reviewOverlay = document.getElementById('review-overlay');
            const reviewModal = document.getElementById('review-modal');
            const closeReview = document.getElementById('close-review');
            const reviewBtn = document.getElementById('review-btn');
            const starsContainer = document.getElementById('stars-container');
            
            let currentRating = 0;

            for (let i = 1; i <= 5; i++) {
                const img = document.createElement('img');
                img.src = '/images/rev (1).svg';
                img.className = 'star-icon';
                img.dataset.value = i;
                starsContainer.appendChild(img);
            }

            const stars = document.querySelectorAll('.star-icon');

            stars.forEach(star => {
                star.addEventListener('click', () => {
                    currentRating = parseInt(star.dataset.value);
                    stars.forEach(s => {
                        if (parseInt(s.dataset.value) <= currentRating) {
                            s.src = '/images/rev (2).svg';
                        } else {
                            s.src = '/images/rev (1).svg';
                        }
                    });
                });
            });

            reviewBtn.addEventListener('click', () => {
                reviewOverlay.style.display = 'block';
                reviewOverlay.classList.add('active');
                reviewModal.style.display = 'flex';
                reviewModal.classList.add('active');
                document.body.style.overflow = 'hidden';
            });

            function closeReviewModal() {
                reviewOverlay.classList.remove('active');
                reviewModal.classList.remove('active');
                reviewOverlay.style.display = 'none';
                reviewModal.style.display = 'none';
                document.body.style.overflow = '';
            }

            closeReview.addEventListener('click', closeReviewModal);
            reviewOverlay.addEventListener('click', closeReviewModal);

            document.getElementById('submit-review').addEventListener('click', async () => {
                const name = document.getElementById('review-name').value.trim();
                const age = document.getElementById('review-age').value.trim();
                const text = document.getElementById('review-text').value;

                if (!name) { alert('Введите ваше имя!'); return; }
                if (!age) { alert('Введите ваш возраст!'); return; }
                if (currentRating === 0) { alert('Поставьте оценку!'); return; }
                if (!text.trim()) { alert('Напишите текст отзыва!'); return; }

                const author_name = `${name}, ${age}`;

                const res = await fetch('/api/reviews', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: user.id, author_name, rating: currentRating, text })
                });

                if (res.ok) {
                    alert('Спасибо за отзыв! Он появится на главной странице после проверки администратором.');
                    closeReviewModal();
                    document.getElementById('review-name').value = '';
                    document.getElementById('review-age').value = '';
                    document.getElementById('review-text').value = '';
                    currentRating = 0;
                    stars.forEach(s => s.src = '/images/rev (1).svg');
                } else {
                    alert('Ошибка при отправке отзыва');
                }
            });

            const list = document.getElementById('bookings-list');
            list.innerHTML = '<p style="color: white; font-family: \'bim\';">Загрузка...</p>';
            try {
                const res = await fetch('/api/bookings/' + user.id);
                const myBookings = await res.json();
                list.innerHTML = '';
                if (myBookings.length === 0) {
                    list.innerHTML = `<p style="font-family: 'bim'; color: #C5944E; font-size: 20px;">У вас пока нет бронирований.</p>`;
                    return;
                }
                myBookings.forEach(b => {
                    const cleanDate = b.date.substring(0, 10);
                    const dateParts = cleanDate.split('-');
                    const formattedDate = `${dateParts[2]}.${dateParts[1]}.${dateParts[0]}`;
                    const isSuccess = b.status !== 'Отменено';
                    const statusId = isSuccess ? 'status_order_success' : 'status_order_fail';
                    const displayTime = b.time.substring(0, 5);

                    const div = document.createElement('div');
                    div.className = 'onebook';
                    div.innerHTML = `
                        <div class="onebookcont">
                            <img src="/images/table.svg" width="69px">
                            <div class="onebtext">
                                <p class="textsob">№${b.orderNumber}</p>
                                <p class="textsob">${formattedDate}</p>
                                <p class="textsob">${displayTime}</p>
                                <p id="${statusId}">${b.status}</p>
                            </div>
                        </div>
                    `;
                    list.appendChild(div);
                });
            } catch (err) {
                list.innerHTML = `<p style="color: red; font-family: 'bim';">Ошибка загрузки данных.</p>`;
            }
        });