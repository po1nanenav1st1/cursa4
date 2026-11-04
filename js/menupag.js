window.initMenuCarousel = function() {
    const track = document.getElementById('menucard-track');
    const btnLeft = document.getElementById('arrow-left');
    const btnRight = document.getElementById('arrow-right');
    const menucard = document.getElementById('menucard');

    if (!track || !btnLeft || !btnRight) return;

    const cards = Array.from(track.children);
    const totalCards = cards.length;
    if (totalCards === 0) return;

    let currentIndex = 0;

    const getStep = () => {
        if (cards.length === 0) return 0;
        const cardWidth = cards[0].offsetWidth;
        const gap = parseFloat(window.getComputedStyle(track).gap) || 0;
        return cardWidth + gap;
    };

    const applyShift = () => {
        const step = getStep();
        track.style.transform = `translateX(-${step * currentIndex}px)`;
    };

    // Очищаем старые обработчики (на всякий случай)
    const newBtnRight = btnRight.cloneNode(true);
    const newBtnLeft = btnLeft.cloneNode(true);
    btnRight.replaceWith(newBtnRight);
    btnLeft.replaceWith(newBtnLeft);

    newBtnRight.addEventListener('click', () => {
        currentIndex = (currentIndex + 1) % totalCards;
        applyShift();
    });

    newBtnLeft.addEventListener('click', () => {
        currentIndex = (currentIndex - 1 + totalCards) % totalCards;
        applyShift();
    });

    window.addEventListener('resize', applyShift);
    applyShift();
};

// Запускаем, если меню уже загружено
document.addEventListener('DOMContentLoaded', () => {
    window.initMenuCarousel();
});

// Слушаем событие из index.html, когда меню придет из базы
window.addEventListener('menuLoaded', () => {
    window.initMenuCarousel();
});