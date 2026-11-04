document.addEventListener('DOMContentLoaded', async () => {
    const track = document.getElementById('menucard-track');
    if (track) {
        try {
            const res = await fetch('/api/menu');
            const items = await res.json();

            track.innerHTML = items.map(item => {
                const itemClass = item.type === 'food' ? 'menu_item' : 'menu_item1';
                const imgId = item.type === 'food' ? 'ramen' : 'drink';
                const imgStyle = item.type === 'food' ? 'width: 271px; padding-top: 68px; padding-left: 25px;' : 'width: 206.5px; margin-top: 15px; margin-left: 60px;';

                const spicy = parseInt(item.spicy_level) || 0;
                const sweet = parseInt(item.sweet_level) || 0;

                let level = 0;
                let label = 'остроты';

                if (spicy > 0) {
                    level = spicy;
                    label = 'остроты';
                } else if (sweet > 0) {
                    level = sweet;
                    label = 'сладости';
                }

                let rects = '';
                for (let i = 0; i < 3; i++) {
                    rects += i < level ? '<div class="rectangle"></div>' : '<div class="rectanglenone"></div>';
                }

                return `
                <div class="${itemClass}">
                    <div class="containerDesc">
                        <img src="${item.image_url}" id="${imgId}" style="${imgStyle}">
                        <div class="sweetspicy">
                            <div class="rectangles">${rects}</div>
                            <p class="ssText">${level}/3 ${label}</p>
                        </div>
                        <div class="nametext">
                            <p class="namemenu">${item.name}</p>
                            <p class="descmenu">${item.description}</p>
                        </div>
                    </div>
                    <div class="buttonprice">
                        <button class="bookingText3" onclick="document.location='booking.html'">Забронировать столик</button>
                        <p style="font-family: 'bim'; font-size: 24px; color: #FFFFFF;">${parseInt(item.price)} ₽</p>
                    </div>
                </div>
            `}).join('');

            window.dispatchEvent(new Event('menuLoaded'));

        } catch (e) {
            console.error('Ошибка загрузки меню');
        }
    }
});

document.addEventListener('DOMContentLoaded', async () => {
    const track = document.getElementById('reviewss-track');
    if (track) {
        try {
            const res = await fetch('/api/reviews');
            const reviews = await res.json();
            track.innerHTML = reviews.map(r => `
                <div class="onerev">
                    <div class="content">
                        <div class="revText">
                            <p class="nameuser">${r.author_name}</p>
                            <p class="reviewDesc">${r.text}</p>
                        </div>
                        <div class="rate">
                            ${Array(5).fill().map((_, i) => `<img src="/images/rev (${i < r.rating ? 2 : 1}).svg" width="45px">`).join('')}
                        </div>
                    </div>
                </div>
            `).join('');

            window.dispatchEvent(new Event('reviewsLoaded'));

        } catch (e) { 
            console.error('Ошибка отзывов'); 
        }
    }
});

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const res = await fetch('/api/settings');
        const s = await res.json();
        const contacts = document.querySelectorAll('.dataText');
        if (contacts.length >= 3) {
            contacts[0].textContent = s.phone;
            contacts[1].textContent = s.email;
            contacts[2].textContent = s.address;
        }
    } catch (e) { 
        console.error('Ошибка контактов'); 
    }
});