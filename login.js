/* ══════════════════════════════════════════════
   LUNAR FORGE 1.0 — LOGIN LOGIC
   ══════════════════════════════════════════════ */

(function () {
    'use strict';

    // Same Google Apps Script URL as registration
    const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbymTF_DGFXvQlOYDY9ZjxD6wuOos6mRhlgRP7OBJL3QrCrQMEFT1ZiUp1M_iYs6tClr/exec';
    
    // DOM Elements
    const form = document.getElementById('login-form');
    const teamIdInput = document.getElementById('login-team-id');
    const passwordInput = document.getElementById('login-password');
    const submitBtn = document.getElementById('login-btn');
    const submitBtnText = submitBtn.querySelector('.submit-btn-text');
    const submitBtnLoading = submitBtn.querySelector('.submit-btn-loading');
    const alertBox = document.getElementById('login-alert');
    const alertMsg = document.getElementById('login-alert-msg');
    
    // Check if already logged in -> redirect to dashboard
    if (localStorage.getItem('lunarforge_session')) {
        window.location.href = 'dashboard.html';
        return;
    }

    // ══════════════════════════════════════════════
    // PARTICLES (lightweight)
    // ══════════════════════════════════════════════
    const canvas = document.getElementById('particles');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let particles = [];

        function resizeCanvas() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }

        class Particle {
            constructor() { this.reset(); }
            reset() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.size = Math.random() * 2 + 0.5;
                this.speedX = (Math.random() - 0.5) * 0.2;
                this.speedY = (Math.random() - 0.5) * 0.2;
                this.opacity = Math.random() * 0.3 + 0.05;
            }
            update() {
                this.x += this.speedX;
                this.y += this.speedY;
                if (this.x < -10) this.x = canvas.width + 10;
                if (this.x > canvas.width + 10) this.x = -10;
                if (this.y < -10) this.y = canvas.height + 10;
                if (this.y > canvas.height + 10) this.y = -10;
            }
            draw() {
                ctx.globalAlpha = this.opacity;
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        function init() {
            resizeCanvas();
            const count = Math.min(Math.floor((canvas.width * canvas.height) / 12000), 120);
            particles = [];
            for (let i = 0; i < count; i++) particles.push(new Particle());
        }

        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => { p.update(); p.draw(); });
            requestAnimationFrame(animate);
        }

        window.addEventListener('resize', resizeCanvas);
        init();
        animate();
    }

    // ══════════════════════════════════════════════
    // UI HELPERS
    // ══════════════════════════════════════════════
    function setLoading(loading) {
        submitBtn.disabled = loading;
        submitBtnText.style.display = loading ? 'none' : '';
        submitBtnLoading.style.display = loading ? '' : 'none';
        
        teamIdInput.disabled = loading;
        passwordInput.disabled = loading;
    }

    function showError(msg) {
        alertMsg.textContent = msg;
        alertBox.style.display = 'flex';
        
        // Remove and re-add animation to trigger shake
        alertBox.style.animation = 'none';
        alertBox.offsetHeight; /* trigger reflow */
        alertBox.style.animation = null;
    }

    function hideError() {
        alertBox.style.display = 'none';
    }

    // ══════════════════════════════════════════════
    // AUTHENTICATION LOGIC
    // ══════════════════════════════════════════════
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideError();
        
        const teamId = teamIdInput.value.trim().toUpperCase();
        const password = passwordInput.value.trim();
        
        if (!teamId || !password) {
            showError('Please enter both Team ID and Password.');
            return;
        }
        
        if (!teamId.startsWith('CN-LF')) {
            showError('Invalid Team ID format. Should start with CN-LF.');
            return;
        }

        setLoading(true);

        try {
            console.log('[Lunar Forge] Attempting login with Apps Script GET...');
            
            // Build GET request URL with params
            // Note: Your Apps Script must implement a doGet() function to handle this
            const url = new URL(APPS_SCRIPT_URL);
            url.searchParams.append('action', 'login');
            url.searchParams.append('teamId', teamId);
            url.searchParams.append('password', password);

            const response = await fetch(url.toString(), {
                method: 'GET',
                redirect: 'follow'
            });

            if (response.ok) {
                const result = await response.json();
                
                if (result.success && result.data) {
                    // Successful API login
                    console.log('[Lunar Forge] Login successful from server');
                    
                    // Store full session data (matching the structure needed by dashboard)
                    localStorage.setItem('lunarforge_session', JSON.stringify(result.data));
                    
                    // Redirect to dashboard
                    window.location.href = 'dashboard.html';
                    return;
                } else if (result.success === false) {
                    showError(result.message || 'Invalid Team ID or Password.');
                    setLoading(false);
                    return;
                }
            }
            
            throw new Error('Server response not OK or invalid JSON format.');
            
        } catch (err) {
            console.warn('[Lunar Forge] Network/Server error, attempting offline fallback:', err.message);
            
            // ── OFFLINE FALLBACK (Using local storage from registration) ──
            const rawReg = localStorage.getItem('lunarforge_registration');
            if (rawReg) {
                try {
                    const regData = JSON.parse(rawReg);
                    
                    // Check if local registration matches credentials
                    if (regData.teamId === teamId && regData.password === password) {
                        console.log('[Lunar Forge] Offline login successful using local cache');
                        // Create session from registration data
                        localStorage.setItem('lunarforge_session', rawReg);
                        window.location.href = 'dashboard.html';
                        return;
                    } else if (regData.teamId === teamId) {
                        showError('Invalid Password.');
                        setLoading(false);
                        return;
                    }
                } catch (e) {
                    // Ignore parse error
                }
            }
            
            // If offline and no match
            showError('Unable to connect to server and no offline cache found for this Team ID.');
            setLoading(false);
        }
    });

})();
