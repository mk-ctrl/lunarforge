/* ══════════════════════════════════════════════
   LUNAR FORGE 1.0 — DASHBOARD LOGIC
   ══════════════════════════════════════════════ */

(function () {
    'use strict';

    // ══════════════════════════════════════════════
    // AUTHENTICATION GATE
    // ══════════════════════════════════════════════
    const sessionData = localStorage.getItem('lunarforge_session');
    if (!sessionData) {
        // Not logged in, redirect to login page
        window.location.href = 'login.html';
        return;
    }

    // ══════════════════════════════════════════════
    // CONFIGURATION
    // ══════════════════════════════════════════════
    // ** PASTE YOUR NEW APPS SCRIPT URL HERE **
    const SUBMISSION_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz3WJYa90NAniPifnhfRI3zAFRC33Fr33_oRGGvGTf54XWSzxi63ZL4yMiFAPo9jXHBfg/exec';
    
    const WHATSAPP_LINK = 'https://chat.whatsapp.com/BOVOzMeJVxmFUtDsMeDH2e?mode=hq1tcla';
    const TARGET_DATE = new Date(Date.UTC(2026, 2, 30, 13, 30, 0)); // March 30, 2026, 7:00 PM IST
    const SUBMISSION_DEADLINE = new Date(Date.UTC(2026, 2, 31, 7, 30, 0)); // March 31, 2026, 1:00 PM IST
    const PPT_DEADLINE = new Date(Date.UTC(2026, 2, 28, 14, 30, 0)); // March 28, 2026, 8:00 PM IST

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

    let submissionLocked = false;
    let initialLockCheckDone = false;
    let isTeamShortlisted = false; // Globally tracks shortlist status

    function checkSubmissionLockState(now) {
        // OVERRIDE: If not shortlisted, lock Final Submission entirely
        if (!isTeamShortlisted) {
            if (!submissionLocked) {
                lockSubmissionUI(false, "LOCKED: Awaiting Evaluation. Only shortlisted teams can submit Final Projects.");
            }
            return;
        }

        if (now < TARGET_DATE.getTime() || now > SUBMISSION_DEADLINE.getTime()) {
            if (!submissionLocked || !initialLockCheckDone) {
                lockSubmissionUI(now > SUBMISSION_DEADLINE.getTime());
                initialLockCheckDone = true;
            }
        } else {
            if (submissionLocked || !initialLockCheckDone) {
                unlockSubmissionUI();
                initialLockCheckDone = true;
                if (typeof checkExistingSubmission === 'function') {
                    checkExistingSubmission();
                }
            }
        }
    }

    function lockSubmissionUI(isPastDeadline, overrideMessage = null) {
        submissionLocked = true;
        const wrapper = document.getElementById('submission-wrapper');
        const overlay = document.getElementById('submission-locked-overlay');
        const btn = document.getElementById('submit-project-btn');
        const ql = document.querySelector('[data-goto="submission"]');
        const overlayText = overlay ? overlay.querySelector('.locked-overlay-text') : null;
        
        if (wrapper) wrapper.classList.add('submission-disabled');
        if (overlay) {
            overlay.style.display = 'flex';
            if (overlayText) {
                if (overrideMessage) {
                    overlayText.textContent = overrideMessage;
                } else {
                    overlayText.textContent = isPastDeadline ? 'SUBMISSIONS HAVE CLOSED' : 'SUBMISSIONS OPEN WHEN THE HACKATHON BEGINS';
                }
            }
        }
        
        ['sub-github', 'sub-demo'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.disabled = true;
        });

        if (btn) {
            btn.disabled = true;
            const txt = document.getElementById('submit-btn-text');
            if (txt) txt.textContent = 'SUBMISSIONS LOCKED';
        }

        if (ql) {
            ql.classList.add('ql-disabled');
            const iconWrap = ql.querySelector('.ql-icon-wrap');
            if (iconWrap) {
                iconWrap.className = 'ql-icon-wrap ql-icon-locked';
                iconWrap.style.cssText = '';
                iconWrap.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="ql-svg">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>`;
            }
            const txt = ql.querySelector('.ql-text');
            if (txt) txt.textContent = 'Submissions Locked';
            const arr = ql.querySelector('.ql-arrow');
            if (arr) arr.textContent = '🔒';
        }
    }

    function unlockSubmissionUI() {
        submissionLocked = false;
        const wrapper = document.getElementById('submission-wrapper');
        const overlay = document.getElementById('submission-locked-overlay');
        const btn = document.getElementById('submit-project-btn');
        const ql = document.querySelector('[data-goto="submission"]');

        if (wrapper) wrapper.classList.remove('submission-disabled');
        if (overlay) overlay.style.display = 'none';

        ['sub-github', 'sub-demo'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.disabled = false;
        });

        if (btn) {
            btn.disabled = false;
            const txt = document.getElementById('submit-btn-text');
            if (txt && txt.textContent === 'SUBMISSIONS LOCKED') txt.textContent = 'SUBMIT PROJECT';
        }

        if (ql) {
            ql.classList.remove('ql-disabled');
            const iconWrap = ql.querySelector('.ql-icon-wrap');
            if (iconWrap) {
                iconWrap.className = 'ql-icon-wrap';
                iconWrap.style.cssText = 'color:var(--accent-cyan); background:rgba(0, 212, 255, 0.1);';
                iconWrap.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="ql-svg">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>`;
            }
            const txt = ql.querySelector('.ql-text');
            if (txt) txt.textContent = 'Submit Project';
            const arr = ql.querySelector('.ql-arrow');
            if (arr) arr.textContent = '→';
        }
    }

    function updateSubmissionCountdown() {
        const now = Date.now();
        const diff = SUBMISSION_DEADLINE.getTime() - now;

        // Dynamic locking logic based on date
        checkSubmissionLockState(now);

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
    // DYNAMIC TIMELINE
    // ══════════════════════════════════════════════
    // All times in UTC (IST - 5:30)
    // DAY 1 = March 30, 2026 | DAY 2 = March 31, 2026
    const TIMELINE_EVENTS = [
        {
            label: 'DAY 1 — 🕖 7:00 PM – 7:30 PM',
            title: 'INAUGURATION',
            desc: 'Welcome + HOD address. Rules, theme, judging criteria.',
            start: new Date(Date.UTC(2026, 2, 30, 13, 30, 0)),  // 7:00 PM IST
            end:   new Date(Date.UTC(2026, 2, 30, 14, 0, 0)),   // 7:30 PM IST
        },
        {
            label: 'DAY 1 — 🕢 7:30 PM – 8:15 PM',
            title: 'GITHUB SESSION',
            desc: 'Git workflow + repo setup. Submission guidelines.',
            start: new Date(Date.UTC(2026, 2, 30, 14, 0, 0)),
            end:   new Date(Date.UTC(2026, 2, 30, 14, 45, 0)),
        },
        {
            label: 'DAY 1 — 🕗 8:15 PM – 10:00 PM',
            title: 'HACK TIME',
            desc: 'Teams start building their projects.',
            start: new Date(Date.UTC(2026, 2, 30, 14, 45, 0)),
            end:   new Date(Date.UTC(2026, 2, 30, 16, 30, 0)),
        },
        {
            label: 'DAY 1 — 🕙 10:00 PM – 10:30 PM',
            title: 'GAME 1',
            desc: 'Icebreaker / fun reset to recharge.',
            start: new Date(Date.UTC(2026, 2, 30, 16, 30, 0)),
            end:   new Date(Date.UTC(2026, 2, 30, 17, 0, 0)),
        },
        {
            label: 'DAY 1 — 🕥 10:30 PM – 11:00 PM',
            title: 'HACK TIME',
            desc: 'Short continuation before review.',
            start: new Date(Date.UTC(2026, 2, 30, 17, 0, 0)),
            end:   new Date(Date.UTC(2026, 2, 30, 17, 30, 0)),
        },
        {
            label: 'DAY 1 — 🕚 11:00 PM – 12:00 AM',
            title: 'REVIEW',
            desc: 'Teams present progress. Quick judge feedback.',
            start: new Date(Date.UTC(2026, 2, 30, 17, 30, 0)),
            end:   new Date(Date.UTC(2026, 2, 30, 18, 30, 0)),
        },
        {
            label: 'DAY 2 — 🕛 12:00 AM – 12:30 AM',
            title: 'HACK TIME',
            desc: 'Apply feedback / continue work.',
            start: new Date(Date.UTC(2026, 2, 30, 18, 30, 0)),
            end:   new Date(Date.UTC(2026, 2, 30, 19, 0, 0)),
        },
        {
            label: 'DAY 2 — 🕧 12:30 AM – 1:00 AM',
            title: 'GAME 2',
            desc: 'Energy boost before the long stretch.',
            start: new Date(Date.UTC(2026, 2, 30, 19, 0, 0)),
            end:   new Date(Date.UTC(2026, 2, 30, 19, 30, 0)),
        },
        {
            label: 'DAY 2 — 🌙 1:00 AM – 12:30 PM',
            title: 'CONTINUOUS HACK TIME',
            desc: 'No interruptions. Deep work phase.',
            start: new Date(Date.UTC(2026, 2, 30, 19, 30, 0)),
            end:   new Date(Date.UTC(2026, 2, 31, 7, 0, 0)),
        },
        {
            label: 'DAY 2 — 🕧 12:30 PM – 1:00 PM',
            title: 'FINAL GIT PUSH',
            desc: 'Final submission. README + demo check.',
            start: new Date(Date.UTC(2026, 2, 31, 7, 0, 0)),
            end:   new Date(Date.UTC(2026, 2, 31, 7, 30, 0)),
        },
    ];

    function renderTimeline() {
        const container = document.getElementById('dash-timeline-container');
        if (!container) return;

        const now = Date.now();

        // Remove old items (keep the line element)
        const oldItems = container.querySelectorAll('.dash-tl-item');
        oldItems.forEach(item => item.remove());

        // Track counts for timeline-line gradient
        let completedCount = 0;
        let activeIndex = -1;

        TIMELINE_EVENTS.forEach((evt, i) => {
            let status, statusClass, badgeText;
            const startMs = evt.start.getTime();
            const endMs = evt.end.getTime();

            if (now >= endMs) {
                status = 'completed';
                statusClass = 'completed';
                badgeText = 'COMPLETED';
                completedCount++;
            } else if (now >= startMs && now < endMs) {
                status = 'active';
                statusClass = 'active';
                badgeText = 'IN PROGRESS';
                activeIndex = i;
            } else {
                status = 'upcoming';
                statusClass = 'upcoming';
                badgeText = 'UPCOMING';
            }

            // Build dot inner content
            let dotInner = '';
            if (status === 'completed') {
                dotInner = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12" /></svg>`;
            } else if (status === 'active') {
                dotInner = `<div class="tl-dot-pulse"></div>`;
            }

            const itemHTML = `
                <div class="dash-tl-item ${statusClass}" data-step="${i + 1}" style="animation-delay: ${i * 0.05}s;">
                    <div class="dash-tl-dot">${dotInner}</div>
                    <div class="dash-tl-card">
                        <div class="dash-tl-card-header">
                            <span class="dash-tl-time">${evt.label}</span>
                            <span class="dash-tl-badge ${statusClass}">${badgeText}</span>
                        </div>
                        <h3 class="dash-tl-title">${evt.title}</h3>
                        <p class="dash-tl-desc">${evt.desc}</p>
                    </div>
                </div>
            `;
            container.insertAdjacentHTML('beforeend', itemHTML);
        });

        // Update the timeline-line gradient to reflect progress
        const line = container.querySelector('.dash-timeline-line');
        if (line) {
            const total = TIMELINE_EVENTS.length;
            const progressPercent = activeIndex >= 0
                ? Math.round(((activeIndex + 0.5) / total) * 100)
                : completedCount === total
                    ? 100
                    : Math.round((completedCount / total) * 100);

            line.style.background = `linear-gradient(to bottom,
                var(--accent) 0%,
                var(--accent) ${progressPercent}%,
                rgba(255, 255, 255, 0.08) ${progressPercent}%,
                rgba(255, 255, 255, 0.08) 100%)`;
        }

        // Update the overview event status badge
        const heroStatus = document.getElementById('hero-event-status');
        const eventStatusVal = document.getElementById('event-status-value');
        const eventStatusBadge = document.getElementById('event-status-badge');
        if (now < TIMELINE_EVENTS[0].start.getTime()) {
            // Before event
            if (heroStatus) heroStatus.textContent = 'UPCOMING';
            if (eventStatusVal) eventStatusVal.textContent = 'UPCOMING';
            if (eventStatusBadge) eventStatusBadge.textContent = 'UPCOMING';
        } else if (now > TIMELINE_EVENTS[TIMELINE_EVENTS.length - 1].end.getTime()) {
            // After event
            if (heroStatus) heroStatus.textContent = 'COMPLETED';
            if (eventStatusVal) eventStatusVal.textContent = 'COMPLETED';
            if (eventStatusBadge) eventStatusBadge.textContent = 'ENDED';
        } else {
            // During event
            if (heroStatus) heroStatus.textContent = 'LIVE NOW';
            if (eventStatusVal) eventStatusVal.textContent = 'LIVE';
            if (eventStatusBadge) eventStatusBadge.textContent = 'LIVE';
        }
    }

    // Render on load and update every 30 seconds
    renderTimeline();
    setInterval(renderTimeline, 30000);

    // ══════════════════════════════════════════════
    // ══════════════════════════════════════════════
    // POPULATE DATA FROM SESSION
    // ══════════════════════════════════════════════
    function populateDashboard() {
        // We already verified sessionData exists at the top
        const raw = sessionData;
        
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

            const problemDescriptions = {
                "Scholarship Recommendation System": "Students often miss out on scholarships due to lack of awareness and eligibility confusion. This system recommends relevant scholarships based on a student’s profile, academic background, and financial need.",
                "Inclusive Learning Platform": "Many digital learning platforms are not accessible to all learners. This platform integrates assistive technologies like speech-to-text, sign language support, screen readers, and multilingual content to ensure inclusive education.",
                "Meme-to-Knowledge Converter": "Gen-Z users often ignore important academic or institutional updates. This tool converts important information like exam dates, circulars, or announcements into engaging meme-style content to improve reach and retention.",
                "Attention-Aware Learning System": "Students lose focus during online lectures, reducing learning efficiency. This system tracks attention using webcam-based facial and eye movement analysis and dynamically adjusts content delivery.",
                "Home Construction Materials Calculator": "Construction projects often face cost overruns due to poor material estimation. This tool calculates required materials and cost based on building dimensions, reducing waste and improving planning.",
                "Carbon Footprint Tracker (Online Purchases)": "Consumers are unaware of the environmental impact of their online purchases. This tool estimates and displays the carbon footprint of products in real-time, promoting eco-conscious decisions.",
                "Smart Meal Planner": "Households waste food due to poor planning. This app suggests weekly meal plans using ingredients already available in the fridge, minimizing waste and saving money.",
                "Sustainable Travel Planner": "Travelers often prioritize cost and convenience while ignoring environmental impact. This system suggests sustainable travel options with a clear breakdown of cost, carbon footprint, and alternatives.",
                "Farm-to-Market Digital Platform": "Farmers often lose profits due to intermediaries and inefficient supply chains. This platform connects farmers directly with buyers, ensuring fair pricing and reducing food loss.",
                "Smart Farming Decision System": "Uses weather, soil, and crop data to give simple recommendations for improving yield and reducing waste.",
                "Agriculture Resource Optimization Platform": "Combines data to guide farmers in saving water, fertilizers, and costs while increasing income.",
                "Farmer Loan & Subsidy Tracker": "Farmers struggle to track loan status and government subsidies. This system provides a transparent interface to apply, monitor, and manage financial assistance schemes.",
                "AI-Based Fake Document Detection": "Fake documents are a major issue in education, banking, and recruitment. This system uses AI to verify authenticity and detect tampering in documents.",
                "Digital Health Record Management System": "Medical records are often scattered and inaccessible. This system securely stores and manages patient health records for easy access by doctors and patients.",
                "Digital Declutter System": "Duplicate photos and videos consume unnecessary storage and energy. This system identifies and removes redundant files, optimizing storage and reducing data center load.",
                "Home Finance Management System": "Individuals struggle to track expenses and savings. This system helps users manage budgets, monitor spending patterns, and improve financial planning."
            };

            if (ps && ps !== 'others') {
                const problemId = document.getElementById('problem-id-display');
                const psParts = ps.split(':');
                if (problemId && psParts.length > 1) {
                    problemId.textContent = psParts[0].trim();
                }

                const problemTitle = document.getElementById('problem-title-display');
                const problemDesc = document.getElementById('problem-desc-display');
                if (problemTitle && psParts.length > 1) {
                    const titleText = psParts.slice(1).join(':').trim();
                    problemTitle.textContent = titleText;
                    
                    if (problemDesc && problemDescriptions[titleText]) {
                        problemDesc.textContent = problemDescriptions[titleText];
                    } else if (problemDesc) {
                        problemDesc.textContent = "Your team problem statement description will appear here.";
                    }
                }
            } else if (ps === 'others') {
                const customPS = data['custom-ps'] || data['customPS'] || 'Custom Open Innovation Project';
                const problemTitle = document.getElementById('problem-title-display');
                if (problemTitle) problemTitle.textContent = customPS;

                const problemId = document.getElementById('problem-id-display');
                if (problemId) problemId.textContent = 'OPEN';
                
                const problemDesc = document.getElementById('problem-desc-display');
                if (problemDesc) problemDesc.textContent = "A custom open innovation project defined by your team during registration.";
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
            const defaultId = `CN-LF${String(counter).padStart(2, '0')}`;
            const finalTeamId = data['teamId'] || defaultId;
            if (teamIdDisplay) teamIdDisplay.textContent = finalTeamId;

            // Pre-fill read-only submission fields
            const subTeamId = document.getElementById('sub-team-id');
            if (subTeamId) subTeamId.value = finalTeamId;

            const subTeamName = document.getElementById('sub-team-name');
            if (subTeamName) subTeamName.value = teamName.toUpperCase();

            const subDomain = document.getElementById('sub-domain');
            if (subDomain) subDomain.value = domain.toUpperCase();

            const subProblem = document.getElementById('sub-problem');
            if (subProblem) subProblem.value = ps === 'others' ? (data['custom-ps'] || data['customPS'] || 'Custom Project') : ps;

        } catch (e) {
            console.warn('[Dashboard] Error populating data:', e);
        }
    }

    // ══════════════════════════════════════════════
    // SUBMISSION FORM
    // ══════════════════════════════════════════════
    const submissionForm = document.getElementById('submission-form');
    if (submissionForm) {
        submissionForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const github = document.getElementById('sub-github').value.trim();
            const demo = document.getElementById('sub-demo').value.trim();

            if (!github || !demo) {
                alert('Please fill in both GitHub URL and Video URL.');
                return;
            }

            const teamId = document.getElementById('sub-team-id').value;
            const teamName = document.getElementById('sub-team-name').value;
            const domain = document.getElementById('sub-domain').value;
            const problemStatement = document.getElementById('sub-problem').value;

            const submitBtn = document.getElementById('submit-project-btn');
            const submitBtnText = document.getElementById('submit-btn-text');
            
            if (submitBtn) submitBtn.disabled = true;
            if (submitBtnText) submitBtnText.textContent = 'SUBMITTING...';

            const submissionData = {
                teamId,
                teamName,
                domain,
                problemStatement,
                githubUrl: github,
                videoUrl: demo
            };

            // Capture initial local timestamp fallback
            let localTime = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
            submissionData.timestamp = localTime;

            try {
                if (SUBMISSION_APPS_SCRIPT_URL !== 'PASTE_YOUR_NEW_APPS_SCRIPT_URL_HERE') {
                    const response = await fetch(SUBMISSION_APPS_SCRIPT_URL, {
                        method: 'POST',
                        body: JSON.stringify(submissionData),
                        redirect: 'follow'
                    });
                    
                    if (response.ok && response.type !== 'opaque') {
                        try {
                            const resJson = await response.json();
                            console.log('[Lunar Forge] Submission Response:', resJson);
                            if (resJson.debug) {
                                console.log('[Lunar Forge DEBUG] Action:', resJson.message);
                                console.log('[Lunar Forge DEBUG] Found Col:', resJson.debug.foundColIndex);
                                console.log('[Lunar Forge DEBUG] Found Row:', resJson.debug.rowIndex);
                            }
                            if (resJson.timestamp) {
                                submissionData.timestamp = resJson.timestamp;
                            }
                        } catch (e) {
                            console.warn('[Lunar Forge] Could not parse Apps Script JSON');
                        }
                    } else if (response.type === 'opaque') {
                        console.log('[Lunar Forge] Opaque response received. Fallback to local time. (Cannot read debug info)');
                    }
                } else {
                    console.warn('[Lunar Forge] Default Apps Script URL used. Simulating submission.');
                }
            } catch (err) {
                console.error('[Lunar Forge] Network error on submission:', err);
                try {
                    // Fallback to no-cors mode if the first one fails
                    await fetch(SUBMISSION_APPS_SCRIPT_URL, {
                        method: 'POST',
                        mode: 'no-cors',
                        body: JSON.stringify(submissionData),
                    });
                } catch (err2) {
                    console.error('[Lunar Forge] no-cors fallback failed:', err2);
                }
            }

            localStorage.setItem('lunarforge_submission', JSON.stringify(submissionData));
            updateSubmissionBanner(submissionData);

            if (submitBtn) {
                submitBtn.disabled = false;
                if (submitBtnText) submitBtnText.textContent = 'UPDATE SUBMISSION';
            }

            alert('🚀 Project submitted successfully!');
        });
    }

    function updateSubmissionBanner(data) {
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
            <p>Your project has been submitted successfully! You can continuously update it before the deadline.</p>
            <p style="font-size: 0.85rem; color: #888; margin-top: 6px;">
              <strong>Submitted AT:</strong> ${data.timestamp}
            </p>
          </div>
        `;
            banner.style.borderColor = 'rgba(0, 230, 118, 0.2)';
            banner.style.background = 'rgba(0, 230, 118, 0.04)';
        }

        const statusVal = document.getElementById('submission-status-value');
        if (statusVal) {
            statusVal.textContent = 'SUBMITTED';
            statusVal.classList.remove('pending');
            statusVal.style.color = '#00e676';
        }
    }

    // Check for existing submission
    function checkExistingSubmission() {
        const raw = localStorage.getItem('lunarforge_submission');
        if (!raw) return;

        try {
            const data = JSON.parse(raw);
            updateSubmissionBanner(data);

            const fields = {
                'sub-github': data.githubUrl || data.github,
                'sub-demo': data.videoUrl || data.demo
            };

            Object.entries(fields).forEach(([id, value]) => {
                const el = document.getElementById(id);
                if (el && value) el.value = value;
            });

            const submitBtnText = document.getElementById('submit-btn-text');
            if (submitBtnText) submitBtnText.textContent = 'UPDATE SUBMISSION';

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
    // LOGOUT LOGIC
    // ══════════════════════════════════════════════
    const dashLogoutBtn = document.getElementById('dash-logout-btn');
    if (dashLogoutBtn) {
        dashLogoutBtn.addEventListener('click', () => {
            localStorage.removeItem('lunarforge_session');
            window.location.href = 'index.html';
        });
    }

    // ══════════════════════════════════════════════
    // PPT SUBMISSION
    // ══════════════════════════════════════════════
    (function initPPTSubmission() {
        // ── DOM refs ────────────────────────────────
        const pptFileInput      = document.getElementById('ppt-file-input');
        const pptDropzone       = document.getElementById('ppt-dropzone');
        const pptBrowseBtn      = document.getElementById('ppt-browse-btn');
        const pptChosenFile     = document.getElementById('ppt-chosen-file');
        const pptChosenName     = document.getElementById('ppt-chosen-name');
        const pptClearBtn       = document.getElementById('ppt-clear-btn');
        const pptUploadBtn      = document.getElementById('ppt-upload-btn');
        const pptUploadBtnText  = document.getElementById('ppt-upload-btn-text');
        const pptStatusBadge    = document.getElementById('ppt-status-badge');
        const pptSuccessMsg     = document.getElementById('ppt-success-msg');
        const pptDriveLink      = document.getElementById('ppt-drive-link');
        const pptErrorMsg       = document.getElementById('ppt-error-msg');
        const pptErrorText      = document.getElementById('ppt-error-text');
        const pptMobFab         = document.getElementById('ppt-mob-fab');

        if (!pptFileInput) return; // PPT section not present

        // ── Get teamId from session ──────────────────
        let pptTeamId = '';
        try {
            const sd = JSON.parse(sessionData || '{}');
            pptTeamId = sd.teamId || sd['teamId'] || '';
            // Fallback: try sidebar element
            if (!pptTeamId) {
                const el = document.getElementById('sidebar-team-id');
                if (el) pptTeamId = el.textContent.trim();
            }
        } catch (e) { /* ignore */ }

        // ── Helpers ──────────────────────────────────
        function setPPTBadge(uploaded) {
            if (!pptStatusBadge) return;
            pptStatusBadge.className = 'ppt-status-badge ' + (uploaded ? 'ppt-badge-uploaded' : 'ppt-badge-pending');
            pptStatusBadge.innerHTML = uploaded
                ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" width="12" height="12"><polyline points="20 6 9 17 4 12"/></svg> Uploaded`
                : `<svg viewBox="0 0 10 10" width="8" height="8" fill="currentColor"><circle cx="5" cy="5" r="5"/></svg> Pending`;
        }

        function showPPTSuccess(fileUrl) {
            if (pptSuccessMsg) pptSuccessMsg.style.display = 'flex';
            if (pptDriveLink && fileUrl) {
                pptDriveLink.href = fileUrl;
                pptDriveLink.textContent = 'View / Download →';
            }
            if (pptErrorMsg) pptErrorMsg.style.display = 'none';
            if (pptUploadBtnText) pptUploadBtnText.textContent = 'Replace PPT';
            setPPTBadge(true);
            if (pptMobFab) pptMobFab.style.display = 'none';
        }

        function showPPTError(msg) {
            if (pptErrorMsg) pptErrorMsg.style.display = 'flex';
            if (pptErrorText) pptErrorText.textContent = msg || 'Upload failed. Please try again.';
            if (pptSuccessMsg) pptSuccessMsg.style.display = 'none';
        }

        function hidePPTMessages() {
            if (pptSuccessMsg) pptSuccessMsg.style.display = 'none';
            if (pptErrorMsg) pptErrorMsg.style.display = 'none';
        }

        function setSelectedFile(file) {
            if (!file) {
                pptChosenFile.style.display = 'none';
                pptDropzone.style.display = '';
                pptFileInput.value = '';
                return;
            }
            pptChosenName.textContent = file.name;
            pptChosenFile.style.display = 'flex';
            pptDropzone.style.display = 'none';
        }

        function setUploading(loading) {
            if (!pptUploadBtn) return;
            pptUploadBtn.disabled = loading;
            if (pptUploadBtnText) {
                pptUploadBtnText.textContent = loading ? 'Uploading…' : (pptUploadBtnText.textContent === 'Uploading…' ? 'Upload PPT' : pptUploadBtnText.textContent);
            }
            if (loading && pptUploadBtnText) pptUploadBtnText.textContent = 'Uploading…';
        }

        // ── Fetch PPT status on page load ────────────
        async function fetchPPTStatus() {
            if (!pptTeamId) return;
            try {
                const url = new URL(SUBMISSION_APPS_SCRIPT_URL);
                url.searchParams.set('action', 'getPPTStatus');
                url.searchParams.set('teamId', pptTeamId);

                const res = await fetch(url.toString(), { method: 'GET', redirect: 'follow' });
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.hasPPT) {
                        showPPTSuccess(data.fileUrl || '');
                    }
                    if (data && data.hasOwnProperty('isShortlisted')) {
                        isTeamShortlisted = data.isShortlisted;
                        // Force a re-check of the lock state immediately
                        checkSubmissionLockState(Date.now());
                    }
                }
            } catch (err) {
                console.warn('[Lunar Forge] PPT status fetch failed:', err.message);
            }
            
            // Check PPT deadline onload
            if (Date.now() > PPT_DEADLINE.getTime()) {
                showPPTError("PPT Submissions Closed (March 28, 8:00 PM IST).");
                if (pptUploadBtn) pptUploadBtn.style.display = 'none';
                if (pptDropzone) {
                    pptDropzone.style.pointerEvents = 'none';
                    pptDropzone.style.opacity = '0.5';
                }
                if (pptFileInput) pptFileInput.disabled = true;
                if (pptClearBtn) pptClearBtn.style.display = 'none';
                if (pptBrowseBtn) pptBrowseBtn.style.display = 'none';
            }
        }

        // ── Helpers ──────────────────────────────────────────
        /** Read a File object as a Base64 string (no data-URI prefix). */
        function fileToBase64(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result.split(',')[1]);
                reader.onerror = () => reject(new Error('File read failed.'));
                reader.readAsDataURL(file);
            });
        }

        // ── Upload handler ────────────────────────────────────
        async function uploadPPT() {
            if (Date.now() > PPT_DEADLINE.getTime()) {
                showPPTError('PPT Submissions have closed (March 28, 8:00 PM IST).');
                return;
            }
            const file = pptFileInput.files[0];
            if (!file) {
                showPPTError('Please select a file before uploading.');
                return;
            }
            if (!pptTeamId) {
                showPPTError('Session error: Team ID not found. Please log out and log in again.');
                return;
            }

            hidePPTMessages();
            setUploading(true);

            try {
                // Convert file → Base64 and POST as JSON (Apps Script can't read raw multipart)
                const base64Data = await fileToBase64(file);

                const payload = JSON.stringify({
                    action    : 'uploadPPT',
                    teamId    : pptTeamId,
                    fileBase64: base64Data,
                    fileName  : file.name,
                    mimeType  : file.type || 'application/octet-stream'
                });

                const res = await fetch(SUBMISSION_APPS_SCRIPT_URL, {
                    method  : 'POST',
                    body    : payload,
                    redirect: 'follow'
                });

                if (res.ok) {
                    let result = null;
                    try { result = await res.json(); } catch (_) { /* opaque */ }

                    if (result && result.success) {
                        showPPTSuccess(result.fileUrl || '');
                        setSelectedFile(null);
                    } else if (result && (result.error || result.message)) {
                        showPPTError(result.error || result.message);
                    } else {
                        // Opaque response — assume success
                        showPPTSuccess('');
                        setSelectedFile(null);
                    }
                } else {
                    showPPTError(`Server returned ${res.status}. Please try again.`);
                }
            } catch (err) {
                console.error('[Lunar Forge] PPT upload error:', err);
                showPPTError('Upload failed: ' + err.message);
            } finally {
                pptUploadBtn.disabled = false;
                if (pptUploadBtnText && pptUploadBtnText.textContent === 'Uploading…') {
                    pptUploadBtnText.textContent = 'Upload PPT';
                }
            }
        }

        // ── Wire up UI events ────────────────────────
        // Browse button → open file picker
        pptBrowseBtn && pptBrowseBtn.addEventListener('click', () => pptFileInput.click());

        // File picked via dialog
        pptFileInput.addEventListener('change', () => {
            setSelectedFile(pptFileInput.files[0] || null);
            hidePPTMessages();
        });

        // Clear selected file
        pptClearBtn && pptClearBtn.addEventListener('click', () => setSelectedFile(null));

        // Drag & drop
        pptDropzone && pptDropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            pptDropzone.classList.add('ppt-dropzone-over');
        });
        pptDropzone && pptDropzone.addEventListener('dragleave', () => {
            pptDropzone.classList.remove('ppt-dropzone-over');
        });
        pptDropzone && pptDropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            pptDropzone.classList.remove('ppt-dropzone-over');
            const dt = e.dataTransfer;
            if (dt && dt.files.length) {
                const f = dt.files[0];
                // Validate type
                const ok = /\.(pptx|ppt|pdf)$/i.test(f.name);
                if (!ok) { showPPTError('Please drop a .pptx, .ppt, or .pdf file.'); return; }
                // Inject file into hidden input (DataTransfer trick)
                const transfer = new DataTransfer();
                transfer.items.add(f);
                pptFileInput.files = transfer.files;
                setSelectedFile(f);
                hidePPTMessages();
            }
        });

        // Upload button
        pptUploadBtn && pptUploadBtn.addEventListener('click', uploadPPT);

        // Mobile FAB — switch to submission tab then scroll to PPT card
        if (pptMobFab) {
            pptMobFab.addEventListener('click', () => {
                switchTab('submission');
            });
        }

        // Fetch status immediately
        fetchPPTStatus();
    })();

    // ══════════════════════════════════════════════
    // INIT
    // ══════════════════════════════════════════════
    populateDashboard();
    checkExistingSubmission();
    handleHash();

})();
