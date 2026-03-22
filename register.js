/* ══════════════════════════════════════════════
   LUNAR FORGE 1.0 — REGISTRATION LOGIC
   ══════════════════════════════════════════════ */

(function () {
    'use strict';

    // ══════════════════════════════════════════════
    // CONFIGURATION
    // ══════════════════════════════════════════════
    // Paste your deployed Google Apps Script URL here:
    const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzCfFTAEbjqQwjGTC7IpPs_YJk1hmPGx7iBWuErE7hsXpSCptd5fHNym85E5zAyXvKPAQ/exec';

    // WhatsApp channel link (for team leaders after registration):
    const WHATSAPP_LINK = 'https://chat.whatsapp.com/BOVOzMeJVxmFUtDsMeDH2e?mode=hq1tcla';

    const STORAGE_KEY = 'lunarforge_registration';
    const TEAM_ID_PREFIX = 'CN-LF';

    // ══════════════════════════════════════════════
    // DOM REFS
    // ══════════════════════════════════════════════
    const form = document.getElementById('reg-form');
    const formContainer = document.getElementById('reg-form-container');
    const successScreen = document.getElementById('reg-success');
    const teamIdDisplay = document.getElementById('team-id-display');
    const passwordDisplay = document.getElementById('password-display');
    const whatsappLink = document.getElementById('whatsapp-link');
    const submitBtn = document.getElementById('submit-btn');
    const submitBtnText = submitBtn.querySelector('.submit-btn-text');
    const submitBtnLoading = submitBtn.querySelector('.submit-btn-loading');

    // Team size radios & member sections
    const teamSizeRadios = document.querySelectorAll('input[name="teamSize"]');
    const membersSection = document.getElementById('members-section');
    const member1Block = document.getElementById('member-1-block');
    const member2Block = document.getElementById('member-2-block');

    // Problem statement
    const problemSelect = document.getElementById('problem-statement');
    const domainSelect = document.getElementById('domain');

    // All saveable inputs
    const allInputs = form.querySelectorAll('input, select, textarea');

    // ══════════════════════════════════════════════
    // PARTICLES (lightweight copy from main)
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
    // LOCAL STORAGE — PERSISTENCE
    // ══════════════════════════════════════════════
    function saveFormState() {
        const data = {};
        allInputs.forEach(input => {
            if (input.type === 'radio') {
                if (input.checked) data[input.name] = input.value;
            } else if (input.type === 'checkbox') {
                data[input.id] = input.checked;
            } else {
                data[input.id || input.name] = input.value;
            }
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }

    function restoreFormState() {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return;

        try {
            const data = JSON.parse(raw);

            // Restore domain first so PS can be populated
            if (data['domain']) {
                domainSelect.value = data['domain'];
                populateProblemStatements(data['domain']);
            }

            allInputs.forEach(input => {
                if (input.type === 'radio') {
                    if (data[input.name] === input.value) {
                        input.checked = true;
                    }
                } else if (input.type === 'checkbox') {
                    input.checked = !!data[input.id];
                } else {
                    const key = input.id || input.name;
                    if (data[key] !== undefined) input.value = data[key];
                }
            });

            // Trigger team size change to show/hide member sections
            const teamSize = data['teamSize'];
            if (teamSize) handleTeamSizeChange(teamSize);

        } catch (e) {
            // Corrupted data — ignore
        }
    }

    function clearFormState() {
        localStorage.removeItem(STORAGE_KEY);
    }

    // Auto-save on every input change
    allInputs.forEach(input => {
        const eventType = (input.type === 'radio' || input.type === 'checkbox' || input.tagName === 'SELECT')
            ? 'change' : 'input';
        input.addEventListener(eventType, saveFormState);
    });

    // ══════════════════════════════════════════════
    // TEAM SIZE — SHOW / HIDE MEMBERS
    // ══════════════════════════════════════════════
    function handleTeamSizeChange(size) {
        const s = parseInt(size, 10);

        if (s === 1) {
            membersSection.style.display = 'none';
            member1Block.style.display = 'none';
            member2Block.style.display = 'none';
        } else if (s === 2) {
            membersSection.style.display = '';
            member1Block.style.display = '';
            member2Block.style.display = 'none';
        } else if (s === 3) {
            membersSection.style.display = '';
            member1Block.style.display = '';
            member2Block.style.display = '';
        }
    }

    teamSizeRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            handleTeamSizeChange(radio.value);
            saveFormState();
        });
    });
    // ══════════════════════════════════════════════
    // DOMAIN → PROBLEM STATEMENT MAPPING
    // ══════════════════════════════════════════════
    const DOMAIN_PS_MAP = {
        'Education': [
            { value: '1.1: Scholarship Recommendation System', label: '1.1 Scholarship Recommendation System' },
            { value: '1.2: Inclusive Learning Platform', label: '1.2 Inclusive Learning Platform' },
            { value: '1.3: Meme-to-Knowledge Converter', label: '1.3 Meme-to-Knowledge Converter' },
            { value: '1.4: Attention-Aware Learning System', label: '1.4 Attention-Aware Learning System' },
        ],
        'Sustainability': [
            { value: '2.1: Home Construction Materials Calculator', label: '2.1 Home Construction Materials Calculator' },
            { value: '2.2: Carbon Footprint Tracker', label: '2.2 Carbon Footprint Tracker' },
            { value: '2.3: Smart Meal Planner', label: '2.3 Smart Meal Planner' },
            { value: '2.4: Sustainable Travel Planner', label: '2.4 Sustainable Travel Planner' },
        ],
        'Agriculture': [
            { value: '3.1: Crop Disease Identifier', label: '3.1 Crop Disease Identifier' },
            { value: '3.2: Smart Irrigation Planner', label: '3.2 Smart Irrigation Planner' },
            { value: '3.3: Farm-to-Market Connector', label: '3.3 Farm-to-Market Connector' },
            { value: '3.4: Soil Health Analyzer', label: '3.4 Soil Health Analyzer' },
        ],
        'Miscellaneous': [
            { value: '4.1: Personal Finance Tracker', label: '4.1 Personal Finance Tracker' },
            { value: '4.2: Neighborhood Safety Reporter', label: '4.2 Neighborhood Safety Reporter' },
            { value: '4.3: Lost & Found Platform', label: '4.3 Lost & Found Platform' },
            { value: '4.4: Skill Swap Marketplace', label: '4.4 Skill Swap Marketplace' },
        ],
    };

    function populateProblemStatements(domain) {
        // Clear existing options
        problemSelect.innerHTML = '';

        if (!domain || !DOMAIN_PS_MAP[domain]) {
            problemSelect.innerHTML = '<option value="" disabled selected>First select a domain</option>';
            problemSelect.disabled = true;
            return;
        }

        // Enable and populate
        problemSelect.disabled = false;
        problemSelect.innerHTML = '<option value="" disabled selected>Select a problem statement</option>';

        DOMAIN_PS_MAP[domain].forEach(ps => {
            const opt = document.createElement('option');
            opt.value = ps.value;
            opt.textContent = ps.label;
            problemSelect.appendChild(opt);
        });
    }

    // Listen for domain change → populate PS
    domainSelect.addEventListener('change', () => {
        populateProblemStatements(domainSelect.value);
        saveFormState();
    });

    // ══════════════════════════════════════════════
    // VALIDATION
    // ══════════════════════════════════════════════
    function showError(id, message) {
        const el = document.getElementById(id);
        if (el) {
            el.textContent = message;
            el.classList.add('visible');
        }
        // Also mark the input
        const inputId = id.replace('-error', '');
        const input = document.getElementById(inputId);
        if (input) input.classList.add('error');
    }

    function clearErrors() {
        document.querySelectorAll('.form-error').forEach(el => {
            el.textContent = '';
            el.classList.remove('visible');
        });
        document.querySelectorAll('.form-input, .form-select').forEach(el => {
            el.classList.remove('error');
        });
    }

    function validateBatch(value) {
        return /^27\d{4}$/.test(value);
    }

    function validatePhone(value) {
        return /^\d{10}$/.test(value);
    }

    function validateEmail(value) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    }

    function validateForm() {
        clearErrors();
        let valid = true;

        // Team name
        const teamName = document.getElementById('team-name').value.trim();
        if (!teamName) {
            showError('team-name-error', 'Team name is required');
            valid = false;
        }

        // Team size
        const teamSizeChecked = document.querySelector('input[name="teamSize"]:checked');
        if (!teamSizeChecked) {
            showError('team-size-error', 'Select a team size');
            valid = false;
        }
        const teamSize = teamSizeChecked ? parseInt(teamSizeChecked.value, 10) : 0;

        // Team lead
        const leadName = document.getElementById('lead-name').value.trim();
        if (!leadName) { showError('lead-name-error', 'Name is required'); valid = false; }

        const leadBatch = document.getElementById('lead-batch').value.trim();
        if (!leadBatch) { showError('lead-batch-error', 'Batch number is required'); valid = false; }
        else if (!validateBatch(leadBatch)) {
            showError('lead-batch-error', 'Must be 6 digits starting with 27 (e.g. 278064)');
            valid = false;
        }

        const leadPhone = document.getElementById('lead-phone').value.trim();
        if (!leadPhone) { showError('lead-phone-error', 'Phone number is required'); valid = false; }
        else if (!validatePhone(leadPhone)) {
            showError('lead-phone-error', 'Must be a valid 10-digit number');
            valid = false;
        }

        const leadEmail = document.getElementById('lead-email').value.trim();
        if (!leadEmail) { showError('lead-email-error', 'Email is required'); valid = false; }
        else if (!validateEmail(leadEmail)) {
            showError('lead-email-error', 'Must be a valid email address');
            valid = false;
        }

        // Members (if duo or trio)
        if (teamSize >= 2) {
            const m1Name = document.getElementById('m1-name').value.trim();
            if (!m1Name) { showError('m1-name-error', 'Member 1 name is required'); valid = false; }

            const m1Batch = document.getElementById('m1-batch').value.trim();
            if (!m1Batch) { showError('m1-batch-error', 'Batch number is required'); valid = false; }
            else if (!validateBatch(m1Batch)) {
                showError('m1-batch-error', 'Must be 6 digits starting with 27');
                valid = false;
            }

            const m1Phone = document.getElementById('m1-phone').value.trim();
            if (!m1Phone) { showError('m1-phone-error', 'Phone number is required'); valid = false; }
            else if (!validatePhone(m1Phone)) {
                showError('m1-phone-error', 'Must be a valid 10-digit number');
                valid = false;
            }

            const m1Email = document.getElementById('m1-email').value.trim();
            if (!m1Email) { showError('m1-email-error', 'Email is required'); valid = false; }
            else if (!validateEmail(m1Email)) {
                showError('m1-email-error', 'Must be a valid email address');
                valid = false;
            }
        }

        if (teamSize >= 3) {
            const m2Name = document.getElementById('m2-name').value.trim();
            if (!m2Name) { showError('m2-name-error', 'Member 2 name is required'); valid = false; }

            const m2Batch = document.getElementById('m2-batch').value.trim();
            if (!m2Batch) { showError('m2-batch-error', 'Batch number is required'); valid = false; }
            else if (!validateBatch(m2Batch)) {
                showError('m2-batch-error', 'Must be 6 digits starting with 27');
                valid = false;
            }

            const m2Phone = document.getElementById('m2-phone').value.trim();
            if (!m2Phone) { showError('m2-phone-error', 'Phone number is required'); valid = false; }
            else if (!validatePhone(m2Phone)) {
                showError('m2-phone-error', 'Must be a valid 10-digit number');
                valid = false;
            }

            const m2Email = document.getElementById('m2-email').value.trim();
            if (!m2Email) { showError('m2-email-error', 'Email is required'); valid = false; }
            else if (!validateEmail(m2Email)) {
                showError('m2-email-error', 'Must be a valid email address');
                valid = false;
            }
        }

        // Domain
        const domain = document.getElementById('domain').value;
        if (!domain) { showError('domain-error', 'Select a domain'); valid = false; }

        // Problem statement
        const ps = document.getElementById('problem-statement').value;
        if (!ps) { showError('problem-statement-error', 'Select a problem statement'); valid = false; }

        // Consent
        const consent = document.getElementById('consent').checked;
        if (!consent) { showError('consent-error', 'You must agree to participate'); valid = false; }

        return valid;
    }

    // ══════════════════════════════════════════════
    // TEAM ID GENERATION
    // ══════════════════════════════════════════════
    function generateLocalTeamId() {
        let counter = parseInt(localStorage.getItem('lunarforge_team_counter') || '0', 10);
        counter++;
        localStorage.setItem('lunarforge_team_counter', String(counter));
        return TEAM_ID_PREFIX + String(counter).padStart(2, '0');
    }

    // ══════════════════════════════════════════════
    // PASSWORD GENERATION
    // ══════════════════════════════════════════════
    function generatePassword() {
        const alpha = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz';
        const nums = '23456789';
        const special = '!@#$%&*';
        const all = alpha + nums + special;

        // Guarantee at least 1 of each type
        let pw = '';
        pw += alpha[Math.floor(Math.random() * alpha.length)];
        pw += nums[Math.floor(Math.random() * nums.length)];
        pw += special[Math.floor(Math.random() * special.length)];

        // Fill remaining 3 chars from the full pool
        for (let i = 0; i < 3; i++) {
            pw += all[Math.floor(Math.random() * all.length)];
        }

        // Shuffle the password
        return pw.split('').sort(() => Math.random() - 0.5).join('');
    }

    // ══════════════════════════════════════════════
    // FORM DATA COLLECTION
    // ══════════════════════════════════════════════
    function collectFormData() {
        const teamSize = parseInt(document.querySelector('input[name="teamSize"]:checked').value, 10);

        const data = {
            teamName: document.getElementById('team-name').value.trim(),
            teamSize: teamSize,
            leadName: document.getElementById('lead-name').value.trim(),
            leadBatch: document.getElementById('lead-batch').value.trim(),
            leadPhone: document.getElementById('lead-phone').value.trim(),
            leadEmail: document.getElementById('lead-email').value.trim(),
            m1Name: '',
            m1Batch: '',
            m1Phone: '',
            m1Email: '',
            m2Name: '',
            m2Batch: '',
            m2Phone: '',
            m2Email: '',
            domain: document.getElementById('domain').value,
            problemStatement: document.getElementById('problem-statement').value,
        };

        if (teamSize >= 2) {
            data.m1Name = document.getElementById('m1-name').value.trim();
            data.m1Batch = document.getElementById('m1-batch').value.trim();
            data.m1Phone = document.getElementById('m1-phone').value.trim();
            data.m1Email = document.getElementById('m1-email').value.trim();
        }

        if (teamSize >= 3) {
            data.m2Name = document.getElementById('m2-name').value.trim();
            data.m2Batch = document.getElementById('m2-batch').value.trim();
            data.m2Phone = document.getElementById('m2-phone').value.trim();
            data.m2Email = document.getElementById('m2-email').value.trim();
        }

        return data;
    }

    // ══════════════════════════════════════════════
    // SUBMISSION
    // ══════════════════════════════════════════════
    function setLoading(loading) {
        submitBtn.disabled = loading;
        submitBtnText.style.display = loading ? 'none' : '';
        submitBtnLoading.style.display = loading ? '' : 'none';
    }

    async function submitToSheets(data) {
        // Generate local team ID and password
        const localTeamId = generateLocalTeamId();
        const password = generatePassword();
        data.teamId = localTeamId;
        data.password = password;

        if (!APPS_SCRIPT_URL) {
            console.log('[Lunar Forge] No Apps Script URL configured, using local ID');
            return { teamId: localTeamId, password: password };
        }

        // Try sending to Google Sheets (best-effort)
        try {
            console.log('[Lunar Forge] Sending data to Google Sheets...');
            const response = await fetch(APPS_SCRIPT_URL, {
                method: 'POST',
                body: JSON.stringify(data),
                redirect: 'follow',
            });
            console.log('[Lunar Forge] Response status:', response.status, response.type);

            if (response.ok && response.type !== 'opaque') {
                try {
                    const result = await response.json();
                    console.log('[Lunar Forge] Server response:', result);
                    if (result && result.teamId) {
                        result.password = result.password || password;
                        return result;
                    }
                } catch (jsonErr) {
                    console.warn('[Lunar Forge] Could not parse response JSON:', jsonErr.message);
                }
            }
        } catch (fetchErr) {
            console.warn('[Lunar Forge] Fetch failed, trying no-cors:', fetchErr.message);
            try {
                await fetch(APPS_SCRIPT_URL, {
                    method: 'POST',
                    mode: 'no-cors',
                    body: JSON.stringify(data),
                });
                console.log('[Lunar Forge] Data sent via no-cors mode');
            } catch (noCorsErr) {
                console.warn('[Lunar Forge] no-cors also failed:', noCorsErr.message);
            }
        }

        return { teamId: localTeamId, password: password };
    }

    function showSuccess(teamId, password, formData) {
        formContainer.style.display = 'none';
        successScreen.style.display = '';
        teamIdDisplay.textContent = teamId;
        if (passwordDisplay) passwordDisplay.textContent = password || '——';

        // Populate team details
        const elTeamName = document.getElementById('success-team-name');
        const elLeadName = document.getElementById('success-lead-name');
        const elTeamSize = document.getElementById('success-team-size');
        const elDomain = document.getElementById('success-domain');

        if (elTeamName && formData) elTeamName.textContent = formData.teamName || '—';
        if (elLeadName && formData) elLeadName.textContent = formData.leadName || '—';
        if (elTeamSize && formData) {
            const sizeMap = { 1: 'SOLO', 2: 'DUO', 3: 'TRIO' };
            elTeamSize.textContent = sizeMap[formData.teamSize] || formData.teamSize;
        }
        if (elDomain && formData) elDomain.textContent = formData.domain || '—';

        // Copy buttons
        const copyIdBtn = document.getElementById('copy-id-btn');
        const copyPwBtn = document.getElementById('copy-pw-btn');

        function copyToClipboard(text, btn) {
            navigator.clipboard.writeText(text).then(() => {
                const originalHTML = btn.innerHTML;
                btn.innerHTML = '<span style="font-size:12px;">✓</span>';
                btn.style.color = 'var(--success, #00e676)';
                setTimeout(() => {
                    btn.innerHTML = originalHTML;
                    btn.style.color = '';
                }, 1500);
            }).catch(() => {
                // Fallback: select text
                const range = document.createRange();
                const sel = window.getSelection();
                const span = btn.previousElementSibling;
                range.selectNodeContents(span);
                sel.removeAllRanges();
                sel.addRange(range);
            });
        }

        if (copyIdBtn) {
            copyIdBtn.addEventListener('click', () => copyToClipboard(teamId, copyIdBtn));
        }
        if (copyPwBtn && password) {
            copyPwBtn.addEventListener('click', () => copyToClipboard(password, copyPwBtn));
        }

        // WhatsApp link
        if (WHATSAPP_LINK && WHATSAPP_LINK !== '#') {
            whatsappLink.href = WHATSAPP_LINK;
        } else {
            const whatsappCard = document.getElementById('whatsapp-card');
            if (whatsappCard) whatsappCard.style.display = 'none';
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // ══════════════════════════════════════════════
    // FORM SUBMIT HANDLER
    // ══════════════════════════════════════════════
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            const firstError = document.querySelector('.form-error.visible');
            if (firstError) {
                firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        }

        const data = collectFormData();
        setLoading(true);

        try {
            const result = await submitToSheets(data);
            // Save minimal data for offline login fallback
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                teamId: result.teamId,
                password: result.password
            }));
            showSuccess(result.teamId, result.password, data);
        } catch (err) {
            console.error('[Lunar Forge] Registration error:', err);
            // Even if sheets fails, show success with local ID & password
            const localTeamId = data.teamId || generateLocalTeamId();
            const localPassword = data.password || generatePassword();
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                teamId: localTeamId,
                password: localPassword
            }));
            showSuccess(localTeamId, localPassword, data);
        } finally {
            setLoading(false);
        }
    });

    // ══════════════════════════════════════════════
    // INIT — RESTORE SAVED STATE
    // ══════════════════════════════════════════════
    restoreFormState();

})();
