document.addEventListener('DOMContentLoaded', () => {
    const overlay   = document.querySelector('.modal-overlay');
    const modalAuth = document.getElementById('modal-auth');
    const modalReg  = document.getElementById('modal-reg');
    const allModals = [modalAuth, modalReg];

    function openModal(which) {
        if (!overlay) return;
        overlay.classList.add('active');
        allModals.forEach(m => m && m.classList.remove('active'));
        if (which === 'auth' && modalAuth) modalAuth.classList.add('active');
        if (which === 'reg'  && modalReg)  modalReg.classList.add('active');
    }
    function closeModals() {
        if (!overlay) return;
        overlay.classList.remove('active');
        allModals.forEach(m => m && m.classList.remove('active'));
    }

    const profIcon = document.getElementById('prof');
    if (profIcon) {
        profIcon.addEventListener('click', (e) => {
            e.preventDefault();
            if (getCurrentUser()) {
                document.location = 'profile.html';
            } else {
                openModal('auth');
            }
        });
    }

    document.querySelectorAll('[data-close-modal]').forEach(b => b.addEventListener('click', closeModals));
    if (overlay) overlay.addEventListener('click', closeModals);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModals(); });

    document.querySelectorAll('[data-switch-modal]').forEach(a => {
        a.addEventListener('click', (e) => {
            e.preventDefault();
            openModal(a.dataset.switchModal);
        });
    });

    if (modalAuth) {
        const authForm = modalAuth.querySelector('form');
        const authErr  = modalAuth.querySelector('[data-auth-error]');
        modalAuth.querySelector('.signin').addEventListener('click', () => authForm.requestSubmit());
        
        authForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const fd  = new FormData(authForm);
            const res = await loginUser(fd.get('phone'), fd.get('password'));
            
            if (!res.ok) { authErr.textContent = res.error; return; }
            authErr.textContent = '';
            authForm.reset();
            document.location = 'profile.html';
        });
    }

    if (modalReg) {
        const regForm = modalReg.querySelector('form');
        const regErr  = modalReg.querySelector('[data-reg-error]');
        modalReg.querySelector('.signup').addEventListener('click', () => regForm.requestSubmit());
        
        regForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const fd  = new FormData(regForm);
            const res = await registerUser(fd.get('login'), fd.get('phone'), fd.get('password'));
            
            if (!res.ok) { regErr.textContent = res.error; return; }
            regErr.textContent = '';
            regForm.reset();
            document.location = 'profile.html';
        });
    }

    document.querySelectorAll('[data-toggle-pass]').forEach(btn => {
        btn.addEventListener('click', () => {
            const inp = btn.parentElement.querySelector('input');
            inp.type = inp.type === 'password' ? 'text' : 'password';
        });
    });

    document.querySelectorAll('input[name="phone"]').forEach(inp => {
        inp.addEventListener('focus', () => { if (!inp.value) inp.value = '+'; });
        inp.addEventListener('blur',  () => { if (inp.value === '+') inp.value = ''; });
        inp.addEventListener('input', () => {
            let digits = inp.value.replace(/\D/g, '').slice(0, 11);
            inp.value = digits ? '+' + digits : '';
        });
        inp.addEventListener('keypress', (e) => {
            if (!/[0-9]/.test(e.key)) e.preventDefault();
        });
        inp.addEventListener('paste', (e) => {
            e.preventDefault();
            const pasted = (e.clipboardData || window.clipboardData).getData('text');
            let digits = pasted.replace(/\D/g, '').slice(0, 11);
            inp.value = digits ? '+' + digits : '';
        });
    });
});