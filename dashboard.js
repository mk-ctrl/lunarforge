/* ══════════════════════════════════════════════
   LUNAR FORGE 1.0 — DASHBOARD LOGIC
   ══════════════════════════════════════════════ */

(function () {
    'use strict';

    // ══════════════════════════════════════════════
    // CONFIGURATION
    // ══════════════════════════════════════════════
    const WHATSAPP_LINK = 'https://chat.whatsapp.com/BOVOzMeJVxmFUtDsMeDH2e?mode=hq1tcla';
    const TARGET_DATE = new Date(Date.UTC(2026, 2, 30, 13, 30, 0)); // March 30, 2026, 7:00 PM IST
    const SUBMISSION_DEADLINE = new Date(Date.UTC(2026, 2, 31, 7, 30, 0)); // March 31, 2026, 1:00 PM IST

    // ══════════════════════════════════════════════
    // DOM REFS
    // ══════════════════════════════════════════════
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    const tabPanels = document.querySelectorAll('.dash-tab');
    const mobileNavBtns = document.querySelectorAll('.mobile-nav-btn');
    const quickLinkCards = document.querySelectorAll('.quicklink-card');
    const faqItems = document.querySelectorAll('.faq-item');

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
                this.size = Math.random() * 2 + 0.3;
                this.speedX = (Math.random() - 0.5) * 0.15;
                this.speedY = (Math.random() - 0.5) * 0.15;
                this.opacity = Math.random() * 0.25 + 0.03;
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

        function initParticles() {
            resizeCanvas();
            const count = Math.min(Math.floor((canvas.width * canvas.height) / 15000), 100);
            particles = [];
            for (let i = 0; i < count; i++) particles.push(new Particle());
        }

        function animateParticles() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => { p.update(); p.draw(); });
            requestAnimationFrame(animateParticles);
        }

        window.addEventListener('resize', resizeCanvas);
        initParticles();
        animateParticles();
    }

    // ══════════════════════════════════════════════
    // TAB NAVIGATION
    // ══════════════════════════════════════════════
    function switchTab(tabName) {
        // Block navigation to submission if disabled
        const submissionWrapper = document.querySelector('.submission-disabled');
        // Still allow navigation, just show the locked view

        // Update sidebar
        sidebarLinks.forEach(link => {
            link.classList.toggle('active', link.dataset.tab === tabName);
        });

        // Update mobile nav
        mobileNavBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // Show/hide tab panels
        tabPanels.forEach(panel => {
            const panelTab = panel.id.replace('panel-', '');
            if (panelTab === tabName) {
                panel.classList.add('active');
                // Re-trigger animation
                panel.style.animation = 'none';
                panel.offsetHeight; // force reflow
                panel.style.animation = '';
            } else {
                panel.classList.remove('active');
            }
        });

        // Scroll to top of content
        const content = document.getElementById('dash-content');
        if (content) content.scrollTop = 0;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Sidebar click handlers
    sidebarLinks.forEach(link => {
        link.addEventListener('click', () => switchTab(link.dataset.tab));
    });

    // Mobile nav click handlers
    mobileNavBtns.forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // Quick link click handlers
    quickLinkCards.forEach(card => {
        card.addEventListener('click', () => {
            const target = card.dataset.goto;
            if (target) switchTab(target);
        });
    });

    // ══════════════════════════════════════════════
    // FAQ ACCORDION
    // ══════════════════════════════════════════════
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        question.addEventListener('click', () => {
            const isOpen = item.classList.contains('open');

            // Close all other items
            faqItems.forEach(other => {
                if (other !== item) other.classList.remove('open');
            });

            // Toggle current
            item.classList.toggle('open', !isOpen);
            question.setAttribute('aria-expanded', !isOpen);
        });
    });

    // ══════════════════════════════════════════════
    // COUNTDOWN TIMERS
    // ══════════════════════════════════════════════
    function pad(n) { return String(n).padStart(2, '0'); }

    function updateEventCountdown() {
        const now = Date.now();
        const diff = TARGET_DATE.getTime() - now;

        const cdDays = document.getElementById('ov-cd-days');
        const cdHours = document.getElementById('ov-cd-hours');
        const cdMins = document.getElementById('ov-cd-mins');
        const cdSecs = document.getElementById('ov-cd-secs');

        if (!cdDays) return;

        if (diff <= 0) {
            cdDays.textContent = '00';
            cdHours.textContent = '00';
            cdMins.textContent = '00';
            cdSecs.textContent = '00';
            return;
        }

        const seconds = Math.floor(diff / 1000);
        cdDays.textContent = pad(Math.floor(seconds / 86400));
        cdHours.textContent = pad(Math.floor((seconds % 86400) / 3600));
        cdMins.textContent = pad(Math.floor((seconds % 3600) / 60));
        cdSecs.textContent = pad(seconds % 60);
    }

    function updateSubmissionCountdown() {
        const now = Date.now();
        const diff = SUBMISSION_DEADLINE.getTime() - now;

        // Submission tab countdown
        const cdDays = document.getElementById('sub-cd-days');
        const cdHours = document.getElementById('sub-cd-hours');
        const cdMins = document.getElementById('sub-cd-mins');
        const cdSecs = document.getElementById('sub-cd-secs');

        // Overview submission countdown
        const ovSubDays = document.getElementById('ov-sub-days');
        const ovSubHours = document.getElementById('ov-sub-hours');
        const ovSubMins = document.getElementById('ov-sub-mins');
        const ovSubSecs = document.getElementById('ov-sub-secs');

        if (diff <= 0) {
            if (cdDays) cdDays.textContent = '00';
            if (cdHours) cdHours.textContent = '00';
            if (cdMins) cdMins.textContent = '00';
            if (cdSecs) cdSecs.textContent = '00';
            if (ovSubDays) ovSubDays.textContent = '00';
            if (ovSubHours) ovSubHours.textContent = '00';
            if (ovSubMins) ovSubMins.textContent = '00';
            if (ovSubSecs) ovSubSecs.textContent = '00';
            return;
        }

        const seconds = Math.floor(diff / 1000);
        const days = pad(Math.floor(seconds / 86400));
        const hours = pad(Math.floor((seconds % 86400) / 3600));
        const mins = pad(Math.floor((seconds % 3600) / 60));
        const secs = pad(seconds % 60);

        // Update submission tab countdown
        if (cdDays) cdDays.textContent = days;
        if (cdHours) cdHours.textContent = hours;
        if (cdMins) cdMins.textContent = mins;
        if (cdSecs) cdSecs.textContent = secs;

        // Update overview submission countdown
        if (ovSubDays) ovSubDays.textContent = days;
        if (ovSubHours) ovSubHours.textContent = hours;
        if (ovSubMins) ovSubMins.textContent = mins;
        if (ovSubSecs) ovSubSecs.textContent = secs;
    }

    updateEventCountdown();
    updateSubmissionCountdown();
    setInterval(updateEventCountdown, 1000);
    setInterval(updateSubmissionCountdown, 1000);

    // ══════════════════════════════════════════════
    // POPULATE DATA FROM REGISTRATION
    // ══════════════════════════════════════════════
    function populateDashboard() {
        const raw = localStorage.getItem('lunarforge_registration');
        if (!raw) return;

        try {
            const data = JSON.parse(raw);

            // Team name
            const teamNameEl = document.getElementById('sidebar-team-name');
            const teamName = data['team-name'] || data['teamName'] || 'TEAM NINJA';
            if (teamNameEl) teamNameEl.textContent = teamName.toUpperCase();

            // Greeting
            const greetingEl = document.getElementById('greeting-text');
            const leadName = data['lead-name'] || data['leadName'] || 'NINJA';
            const firstName = leadName.split(' ')[0].toUpperCase();
            if (greetingEl) greetingEl.textContent = `HELLO, ${firstName}`;

            // Update overview hero greeting
            const heroGreeting = document.getElementById('overview-hero-greeting');
            if (heroGreeting) heroGreeting.textContent = `WELCOME BACK, ${firstName}`;

            // Avatar letter
            const avatarLetter = document.getElementById('avatar-letter');
            if (avatarLetter) avatarLetter.textContent = firstName.charAt(0);

            // Lead avatar
            const leadAvatarLetter = document.getElementById('lead-avatar-letter');
            if (leadAvatarLetter) leadAvatarLetter.textContent = leadName.charAt(0).toUpperCase();

            // Lead info
            const leadNameDisplay = document.getElementById('lead-name-display');
            if (leadNameDisplay) leadNameDisplay.textContent = leadName;

            const leadBatchDisplay = document.getElementById('lead-batch-display');
            const leadBatch = data['lead-batch'] || data['leadBatch'] || '';
            if (leadBatchDisplay && leadBatch) leadBatchDisplay.textContent = `Batch: ${leadBatch}`;

            const leadPhoneDisplay = document.getElementById('lead-phone-display');
            const leadPhone = data['lead-phone'] || data['leadPhone'] || '';
            if (leadPhoneDisplay && leadPhone) leadPhoneDisplay.textContent = `📱 ${leadPhone}`;

            // Team size
            const teamSize = parseInt(data['teamSize'] || '1', 10);
            const teamSizeValue = document.getElementById('team-size-value');
            if (teamSizeValue) {
                teamSizeValue.textContent = teamSize === 1 ? 'SOLO' : `${teamSize} MEMBERS`;
            }

            // Track (domain)
            const domain = data['domain'] || 'AI / ML';
            const trackValue = document.getElementById('track-value');
            if (trackValue) trackValue.textContent = domain.toUpperCase();

            // Problem statement
            const ps = data['problem-statement'] || data['problemStatement'] || '';
            const problemBadge = document.getElementById('problem-domain-badge');
            if (problemBadge) problemBadge.textContent = domain.toUpperCase();

            const problemDomainValue = document.getElementById('problem-domain-value');
            if (problemDomainValue) problemDomainValue.textContent = domain;

            if (ps && ps !== 'others') {
                const problemId = document.getElementById('problem-id-display');
                const psParts = ps.split(':');
                if (problemId && psParts.length > 1) {
                    problemId.textContent = psParts[0].trim();
                }

                const problemTitle = document.getElementById('problem-title-display');
                if (problemTitle && psParts.length > 1) {
                    problemTitle.textContent = psParts.slice(1).join(':').trim();
                }
            } else if (ps === 'others') {
                const customPS = data['custom-ps'] || data['customPS'] || 'Custom Open Innovation Project';
                const problemTitle = document.getElementById('problem-title-display');
                if (problemTitle) problemTitle.textContent = customPS;

                const problemId = document.getElementById('problem-id-display');
                if (problemId) problemId.textContent = 'OPEN';
            }

            // Member 1
            const m1Name = data['m1-name'] || data['m1Name'] || '';
            const member1Card = document.getElementById('member1-card');
            if (teamSize < 2 && member1Card) {
                member1Card.style.display = 'none';
            } else if (m1Name && member1Card) {
                const m1NameDisplay = document.getElementById('m1-name-display');
                if (m1NameDisplay) m1NameDisplay.textContent = m1Name;

                const m1Avatar = document.getElementById('m1-avatar-letter');
                if (m1Avatar) m1Avatar.textContent = m1Name.charAt(0).toUpperCase();

                const m1Batch = data['m1-batch'] || data['m1Batch'] || '';
                const m1BatchDisplay = document.getElementById('m1-batch-display');
                if (m1BatchDisplay && m1Batch) m1BatchDisplay.textContent = `Batch: ${m1Batch}`;

                const m1Phone = data['m1-phone'] || data['m1Phone'] || '';
                const m1PhoneDisplay = document.getElementById('m1-phone-display');
                if (m1PhoneDisplay && m1Phone) m1PhoneDisplay.textContent = `📱 ${m1Phone}`;
            }

            // Member 2
            const m2Name = data['m2-name'] || data['m2Name'] || '';
            const member2Card = document.getElementById('member2-card');
            if (teamSize < 3 && member2Card) {
                member2Card.style.display = 'none';
            } else if (m2Name && member2Card) {
                const m2NameDisplay = document.getElementById('m2-name-display');
                if (m2NameDisplay) m2NameDisplay.textContent = m2Name;

                const m2Avatar = document.getElementById('m2-avatar-letter');
                if (m2Avatar) m2Avatar.textContent = m2Name.charAt(0).toUpperCase();

                const m2Batch = data['m2-batch'] || data['m2Batch'] || '';
                const m2BatchDisplay = document.getElementById('m2-batch-display');
                if (m2BatchDisplay && m2Batch) m2BatchDisplay.textContent = `Batch: ${m2Batch}`;

                const m2Phone = data['m2-phone'] || data['m2Phone'] || '';
                const m2PhoneDisplay = document.getElementById('m2-phone-display');
                if (m2PhoneDisplay && m2Phone) m2PhoneDisplay.textContent = `📱 ${m2Phone}`;
            }

            // Team ID
            const teamIdDisplay = document.getElementById('sidebar-team-id');
            const counter = localStorage.getItem('lunarforge_team_counter') || '01';
            if (teamIdDisplay) teamIdDisplay.textContent = `CN-LF${String(counter).padStart(2, '0')}`;

        } catch (e) {
            console.warn('[Dashboard] Error populating data:', e);
        }
    }

    // ══════════════════════════════════════════════
    // SUBMISSION FORM
    // ══════════════════════════════════════════════
    const submissionForm = document.getElementById('submission-form');
    if (submissionForm) {
        submissionForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const title = document.getElementById('sub-project-title').value.trim();
            const desc = document.getElementById('sub-project-desc').value.trim();
            const github = document.getElementById('sub-github').value.trim();
            const techStack = document.getElementById('sub-tech-stack').value.trim();

            if (!title || !desc || !github || !techStack) {
                alert('Please fill in all required fields (Project Title, Description, GitHub URL, Tech Stack).');
                return;
            }

            // Save submission locally
            const submissionData = {
                title,
                description: desc,
                github,
                demo: document.getElementById('sub-demo').value.trim(),
                techStack,
                presentation: document.getElementById('sub-presentation').value.trim(),
                submittedAt: new Date().toISOString()
            };

            localStorage.setItem('lunarforge_submission', JSON.stringify(submissionData));

            // Update UI
            const banner = document.getElementById('submission-banner');
            if (banner) {
                banner.innerHTML = `
          <div class="submission-status-icon" style="background: rgba(0, 230, 118, 0.12); color: #00e676;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:24px;height:24px;">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div class="submission-status-text">
            <h3 style="color: #00e676;">SUBMISSION RECEIVED</h3>
            <p>Your project "${title}" has been submitted successfully!</p>
          </div>
        `;
                banner.style.borderColor = 'rgba(0, 230, 118, 0.2)';
                banner.style.background = 'rgba(0, 230, 118, 0.04)';
            }

            // Update overview card
            const statusVal = document.getElementById('submission-status-value');
            if (statusVal) {
                statusVal.textContent = 'SUBMITTED';
                statusVal.classList.remove('pending');
                statusVal.style.color = '#00e676';
            }

            alert('🚀 Project submitted successfully!');
        });
    }

    // Check for existing submission
    function checkExistingSubmission() {
        const raw = localStorage.getItem('lunarforge_submission');
        if (!raw) return;

        try {
            const data = JSON.parse(raw);

            // Update banner
            const banner = document.getElementById('submission-banner');
            if (banner) {
                banner.innerHTML = `
          <div class="submission-status-icon" style="background: rgba(0, 230, 118, 0.12); color: #00e676;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:24px;height:24px;">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div class="submission-status-text">
            <h3 style="color: #00e676;">SUBMISSION RECEIVED</h3>
            <p>Your project "${data.title}" was submitted. You can update it before the deadline.</p>
          </div>
        `;
                banner.style.borderColor = 'rgba(0, 230, 118, 0.2)';
                banner.style.background = 'rgba(0, 230, 118, 0.04)';
            }

            // Fill form
            const fields = {
                'sub-project-title': data.title,
                'sub-project-desc': data.description,
                'sub-github': data.github,
                'sub-demo': data.demo,
                'sub-tech-stack': data.techStack,
                'sub-presentation': data.presentation
            };

            Object.entries(fields).forEach(([id, value]) => {
                const el = document.getElementById(id);
                if (el && value) el.value = value;
            });

            // Update submit button text
            const submitBtn = document.getElementById('submit-project-btn');
            if (submitBtn) submitBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="btn-icon" style="width:18px;height:18px;">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        UPDATE SUBMISSION
      `;

            // Update overview card
            const statusVal = document.getElementById('submission-status-value');
            if (statusVal) {
                statusVal.textContent = 'SUBMITTED';
                statusVal.classList.remove('pending');
                statusVal.style.color = '#00e676';
            }
        } catch (e) {
            // ignore
        }
    }

    // ══════════════════════════════════════════════
    // WHATSAPP LINK
    // ══════════════════════════════════════════════
    const whatsappTeamLink = document.getElementById('whatsapp-team-link');
    if (whatsappTeamLink && WHATSAPP_LINK) {
        whatsappTeamLink.href = WHATSAPP_LINK;
    }

    // ══════════════════════════════════════════════
    // KEYBOARD NAVIGATION
    // ══════════════════════════════════════════════
    document.addEventListener('keydown', (e) => {
        // Number keys 1-6 switch tabs
        const tabMap = { '1': 'overview', '2': 'timeline', '3': 'problem', '4': 'submission', '5': 'teammates', '6': 'faq' };
        if (tabMap[e.key] && !e.ctrlKey && !e.altKey && !e.metaKey) {
            // Only if not focused on an input
            const active = document.activeElement;
            if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.tagName === 'SELECT')) return;
            switchTab(tabMap[e.key]);
        }
    });

    // ══════════════════════════════════════════════
    // URL HASH NAVIGATION
    // ══════════════════════════════════════════════
    function handleHash() {
        const hash = window.location.hash.replace('#', '');
        const validTabs = ['overview', 'timeline', 'problem', 'submission', 'teammates', 'faq'];
        if (validTabs.includes(hash)) {
            switchTab(hash);
        }
    }

    window.addEventListener('hashchange', handleHash);

    // ══════════════════════════════════════════════
    // INIT
    // ══════════════════════════════════════════════
    populateDashboard();
    checkExistingSubmission();
    handleHash();

})();
