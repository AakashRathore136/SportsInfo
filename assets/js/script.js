(function() {
    'use strict';

    function initPrefetching() {
        const links = document.querySelectorAll('a[href$=".html"]');
        const prefetched = new Set();

        links.forEach(link => {
            link.addEventListener('mouseenter', function() {
                const href = this.getAttribute('href');
                if (href && !prefetched.has(href) && !href.startsWith('#')) {
                    const prefetchLink = document.createElement('link');
                    prefetchLink.rel = 'prefetch';
                    prefetchLink.href = href;
                    document.head.appendChild(prefetchLink);
                    prefetched.add(href);
                }
            }, { once: true });
        });
    }

    function initLazyLoading() {
        if ('loading' in HTMLImageElement.prototype) {
            const images = document.querySelectorAll('img[data-src]');
            images.forEach(img => {
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
            });
        } else {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        img.classList.add('loaded');
                        observer.unobserve(img);
                    }
                });
            }, { rootMargin: '50px' });

            document.querySelectorAll('img[data-src]').forEach(img => {
                imageObserver.observe(img);
            });
        }
    }

    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    function throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    const CookieManager = {
        set(name, value, days = 365) {
            let expires = '';
            if (days) {
                const date = new Date();
                date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
                expires = '; expires=' + date.toUTCString();
            }
            document.cookie = name + '=' + encodeURIComponent(value) + expires + '; path=/';
        },

        get(name) {
            const nameEQ = name + '=';
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                let cookie = cookies[i];
                while (cookie.charAt(0) === ' ') cookie = cookie.substring(1);
                if (cookie.indexOf(nameEQ) === 0) {
                    return decodeURIComponent(cookie.substring(nameEQ.length));
                }
            }
            return null;
        },

        delete(name) {
            document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/';
        },

        has(name) {
            return this.get(name) !== null;
        },

        getAll() {
            const cookies = {};
            const items = document.cookie.split(';');
            items.forEach(item => {
                const parts = item.split('=');
                if (parts[0]) {
                    const name = parts[0].trim();
                    const value = parts[1] ? decodeURIComponent(parts[1]) : '';
                    cookies[name] = value;
                }
            });
            return cookies;
        }
    };

    function initCookieConsent() {
        const CONSENT_COOKIE = 'sportsinfo_cookie_consent';
        
        if (CookieManager.has(CONSENT_COOKIE)) {
            console.log('✅ Cookie consent already accepted. Banner will not be shown.');
            return;
        }

        console.log('⚠️ Cookie consent not found. Showing consent banner.');

        const banner = document.createElement('div');
        banner.className = 'cookie-consent-banner';
        banner.innerHTML = `
            <div class="cookie-content">
                <span class="cookie-icon">🍪</span>
                <div class="cookie-text">
                    <strong>Cookie Notice</strong>
                    <p>We use cookies to enhance your experience, remember your preferences, and analyze site usage.</p>
                </div>
                <div class="cookie-actions">
                    <button id="acceptCookies" class="btn btn-accept">Accept All</button>
                    <button id="declineCookies" class="btn btn-decline">Decline</button>
                </div>
            </div>
        `;

        banner.style.cssText = `
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: rgba(10, 10, 10, 0.98);
            backdrop-filter: blur(10px);
            border-top: 2px solid var(--accent-gold);
            z-index: 10001;
            padding: 1.5rem;
            box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.5);
            animation: slideUp 0.4s ease;
        `;

        document.body.appendChild(banner);

        document.getElementById('acceptCookies').addEventListener('click', () => {
            CookieManager.set(CONSENT_COOKIE, 'accepted', 365);
            console.log('🍪 Cookies accepted by user. Banner will not show for 365 days.');
            initCookieTracking();
            banner.style.animation = 'slideDown 0.4s ease';
            setTimeout(() => banner.remove(), 400);
        });

        document.getElementById('declineCookies').addEventListener('click', () => {
            CookieManager.set(CONSENT_COOKIE, 'declined', 30);
            console.log('🍪 Cookies declined by user. Banner will show again in 30 days.');
            banner.style.animation = 'slideDown 0.4s ease';
            setTimeout(() => banner.remove(), 400);
        });
    }

    function initCookieTracking() {
        if (CookieManager.get('sportsinfo_cookie_consent') !== 'accepted') {
            return;
        }

        const visitCount = parseInt(CookieManager.get('sportsinfo_visit_count') || '0') + 1;
        CookieManager.set('sportsinfo_visit_count', visitCount.toString(), 365);

        if (!CookieManager.has('sportsinfo_first_visit')) {
            CookieManager.set('sportsinfo_first_visit', new Date().toISOString(), 365);
        }

        CookieManager.set('sportsinfo_last_visit', new Date().toISOString(), 365);

        const currentPage = window.location.pathname.split('/').pop();
        CookieManager.set('sportsinfo_last_page', currentPage, 30);

        const lang = document.documentElement.lang || 'en';
        CookieManager.set('sportsinfo_language', lang, 365);

        console.log('📊 Cookie Tracking:', {
            visits: visitCount,
            firstVisit: CookieManager.get('sportsinfo_first_visit'),
            lastPage: currentPage,
            language: lang
        });
    }

    const Preferences = {
        KEYS: {
            THEME: 'sportsinfo_theme',
            LANGUAGE: 'sportsinfo_language',
            FONT_SIZE: 'sportsinfo_font_size',
            VISITED_PAGES: 'sportsinfo_visited',
            FAVORITES: 'sportsinfo_favorites'
        },

        get(key) {
            try {
                return localStorage.getItem(key);
            } catch (e) {
                console.warn('LocalStorage not available:', e);
                return null;
            }
        },

        set(key, value) {
            try {
                localStorage.setItem(key, value);
                return true;
            } catch (e) {
                console.warn('LocalStorage not available:', e);
                return false;
            }
        },

        remove(key) {
            try {
                localStorage.removeItem(key);
            } catch (e) {
                console.warn('LocalStorage not available:', e);
            }
        }
    };

    function saveLanguagePreference() {
        const currentLang = document.documentElement.lang || 'en';
        Preferences.set(Preferences.KEYS.LANGUAGE, currentLang);
    }

    function trackPageVisit() {
        const visited = JSON.parse(Preferences.get(Preferences.KEYS.VISITED_PAGES) || '[]');
        const currentPage = window.location.pathname.split('/').pop();
        
        if (!visited.includes(currentPage)) {
            visited.push(currentPage);
            if (visited.length > 50) visited.shift();
            Preferences.set(Preferences.KEYS.VISITED_PAGES, JSON.stringify(visited));
        }
    }

    function initThemeToggle() {
        const savedTheme = Preferences.get(Preferences.KEYS.THEME);
        
        if (savedTheme === 'light') {
            document.body.classList.add('light-mode');
        }

        const themeToggle = document.createElement('button');
        themeToggle.className = 'theme-toggle';
        themeToggle.innerHTML = savedTheme === 'light' ? '⏾' : '🔅';
        themeToggle.setAttribute('aria-label', 'Toggle theme');
        themeToggle.title = 'Toggle dark/light mode';
        
        themeToggle.style.cssText = `
            position: fixed;
            bottom: 80px;
            right: 20px;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            border: 2px solid var(--accent-gold);
            background: rgba(10, 10, 10, 0.9);
            color: var(--accent-gold);
            font-size: 1.5rem;
            cursor: pointer;
            z-index: 9999;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
        `;

        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('light-mode');
            const isLight = document.body.classList.contains('light-mode');
            themeToggle.innerHTML = isLight ? '⏾' : '🔅';
            Preferences.set(Preferences.KEYS.THEME, isLight ? 'light' : 'dark');
        });

        themeToggle.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.1)';
        });

        themeToggle.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
        });

        document.body.appendChild(themeToggle);
    }

    function initAccessibility() {
        const skipLink = document.createElement('a');
        skipLink.href = '#main-content';
        skipLink.textContent = 'Skip to main content';
        skipLink.className = 'skip-link';
        skipLink.style.cssText = `
            position: absolute;
            top: -40px;
            left: 0;
            background: var(--accent-gold);
            color: black;
            padding: 8px;
            text-decoration: none;
            z-index: 10001;
            font-weight: bold;
        `;
        skipLink.addEventListener('focus', function() {
            this.style.top = '0';
        });
        skipLink.addEventListener('blur', function() {
            this.style.top = '-40px';
        });
        document.body.insertBefore(skipLink, document.body.firstChild);

        const mainContent = document.querySelector('.container, section');
        if (mainContent && !mainContent.id) {
            mainContent.id = 'main-content';
        }

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const modal = document.querySelector('.modal.active, .overlay.active');
                if (modal) modal.classList.remove('active');
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                document.body.classList.add('keyboard-nav');
            }
        });

        document.addEventListener('mousedown', () => {
            document.body.classList.remove('keyboard-nav');
        });
    }

    function initNetworkStatus() {
        function updateOnlineStatus() {
            const isOnline = navigator.onLine;
            const statusIndicator = document.getElementById('network-status') || createStatusIndicator();
            
            if (isOnline) {
                statusIndicator.textContent = '📶 Back online';
                statusIndicator.style.background = 'rgba(26, 143, 60, 0.95)';
                setTimeout(() => {
                    statusIndicator.style.display = 'none';
                }, 3000);
            } else {
                statusIndicator.textContent = '📵 No internet connection';
                statusIndicator.style.background = 'rgba(255, 68, 68, 0.95)';
                statusIndicator.style.display = 'block';
            }
        }

        function createStatusIndicator() {
            const indicator = document.createElement('div');
            indicator.id = 'network-status';
            indicator.style.cssText = `
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(255, 68, 68, 0.95);
                color: white;
                padding: 12px 24px;
                border-radius: 8px;
                z-index: 10000;
                display: none;
                font-weight: bold;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            `;
            document.body.appendChild(indicator);
            return indicator;
        }

        window.addEventListener('online', updateOnlineStatus);
        window.addEventListener('offline', updateOnlineStatus);
    }

    function logPerformanceMetrics() {
        if ('performance' in window) {
            window.addEventListener('load', () => {
                setTimeout(() => {
                    const perfData = performance.getEntriesByType('navigation')[0];
                    if (perfData) {
                        console.log('🚀 Performance Metrics:');
                        console.log(`   DOM Content Loaded: ${Math.round(perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart)}ms`);
                        console.log(`   Page Load Time: ${Math.round(perfData.loadEventEnd - perfData.loadEventStart)}ms`);
                        console.log(`   Total Load Time: ${Math.round(perfData.loadEventEnd - perfData.fetchStart)}ms`);
                    }

                    if ('PerformanceObserver' in window) {
                        const observer = new PerformanceObserver((list) => {
                            const entries = list.getEntries();
                            const lastEntry = entries[entries.length - 1];
                            console.log(`   Largest Contentful Paint: ${Math.round(lastEntry.startTime)}ms`);
                        });
                        observer.observe({ entryTypes: ['largest-contentful-paint'] });
                    }
                }, 0);
            });
        }
    }

    function initPageTransitions() {
        const pageLinks = document.querySelectorAll('a[href$=".html"]');
        
        pageLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                const href = this.getAttribute('href');
                if (href && !href.startsWith('#') && href.indexOf(window.location.hostname) !== -1) {
                    e.preventDefault();
                    document.body.style.opacity = '0';
                    document.body.style.transition = 'opacity 0.3s ease';
                    setTimeout(() => {
                        window.location.href = href;
                    }, 300);
                }
            });
        });

        window.addEventListener('load', () => {
            document.body.style.opacity = '1';
        });
    }

    function enhanceForms() {
        const forms = document.querySelectorAll('form');

        forms.forEach(form => {
            const formId = form.id || form.action;
            if (formId) {
                form.querySelectorAll('input, textarea, select').forEach(input => {
                    if (input.type !== 'password') {
                        const savedValue = Preferences.get(`form_${formId}_${input.name}`);
                        if (savedValue && !input.value) {
                            input.value = savedValue;
                        }
                    }
                });

                form.addEventListener('input', debounce((e) => {
                    if (e.target.type !== 'password' && e.target.name) {
                        Preferences.set(`form_${formId}_${e.target.name}`, e.target.value);
                    }
                }, 500));

                form.addEventListener('submit', () => {
                    setTimeout(() => {
                        form.querySelectorAll('input, textarea, select').forEach(input => {
                            if (input.name) {
                                Preferences.remove(`form_${formId}_${input.name}`);
                            }
                        });
                    }, 1000);
                });
            }

            const inputs = form.querySelectorAll('input[required], textarea[required], select[required]');
            inputs.forEach(input => {
                input.addEventListener('blur', function() {
                    if (this.value.trim()) {
                        this.classList.add('valid');
                        this.classList.remove('invalid');
                    } else {
                        this.classList.add('invalid');
                        this.classList.remove('valid');
                    }
                });
            });
        });
    }

    function initBackToTop() {
        const backToTop = document.createElement('button');
        backToTop.innerHTML = '↑';
        backToTop.className = 'back-to-top';
        backToTop.setAttribute('aria-label', 'Back to top');
        backToTop.style.cssText = `
            position: fixed;
            bottom: 140px;
            right: 20px;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            border: 2px solid var(--accent-gold);
            background: rgba(10, 10, 10, 0.9);
            color: var(--accent-gold);
            font-size: 1.5rem;
            cursor: pointer;
            z-index: 9999;
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
        `;

        backToTop.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });

        const toggleBackToTop = throttle(() => {
            if (window.pageYOffset > 300) {
                backToTop.style.opacity = '1';
                backToTop.style.visibility = 'visible';
            } else {
                backToTop.style.opacity = '0';
                backToTop.style.visibility = 'hidden';
            }
        }, 100);

        window.addEventListener('scroll', toggleBackToTop);
        document.body.appendChild(backToTop);
    }

    function initReadingProgress() {
        const progressBar = document.createElement('div');
        progressBar.className = 'reading-progress';
        progressBar.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            height: 3px;
            background: linear-gradient(90deg, var(--accent-gold), #ffd700);
            z-index: 10000;
            width: 0%;
            transition: width 0.1s ease;
        `;
        document.body.appendChild(progressBar);

        const updateProgress = throttle(() => {
            const windowHeight = window.innerHeight;
            const documentHeight = document.documentElement.scrollHeight - windowHeight;
            const scrolled = window.pageYOffset;
            const progress = (scrolled / documentHeight) * 100;
            progressBar.style.width = Math.min(progress, 100) + '%';
        }, 50);

        window.addEventListener('scroll', updateProgress);
    }

    function initErrorHandling() {
        window.addEventListener('error', (e) => {
            console.error('Global error caught:', e.error);
        });

        window.addEventListener('unhandledrejection', (e) => {
            console.error('Unhandled promise rejection:', e.reason);
        });
    }

    function initTimeTracker() {
        let startTime = Date.now();
        let trackerElement = null;

        function createTracker() {
            const navbar = document.querySelector('.navbar, .header');
            if (!navbar) return null;

            const tracker = document.createElement('div');
            tracker.className = 'time-tracker';
            
            const currentDate = new Date();
            const dateStr = currentDate.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric' 
            });
            
            tracker.innerHTML = `
                <span class="time-tracker-icon">📅</span>
                <span class="time-tracker-date">${dateStr}</span>
                <span class="time-tracker-separator">|</span>
                <span class="time-tracker-icon">⏱️</span>
                <span class="time-tracker-text">00:00:00</span>
            `;

            const navRight = navbar.querySelector('.nav-right, .nav-links');
            if (navRight) {
                navRight.insertBefore(tracker, navRight.firstChild);
            } else {
                navbar.appendChild(tracker);
            }

            return tracker;
        }

        function formatTime(seconds) {
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            const secs = seconds % 60;
            return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        }

        function updateTime() {
            if (!trackerElement) {
                trackerElement = createTracker();
                if (!trackerElement) return;
            }

            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            const textElement = trackerElement.querySelector('.time-tracker-text');
            if (textElement) {
                textElement.textContent = formatTime(elapsed);
            }
        }

        let hiddenTime = 0;
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                hiddenTime = Date.now();
            } else if (hiddenTime > 0) {
                startTime += (Date.now() - hiddenTime);
                hiddenTime = 0;
            }
        });

        setInterval(updateTime, 1000);
        
        setTimeout(updateTime, 100);

        console.log('⏱️ Time tracker with date initialized');
    }

    function init() {
        console.log('🎯 SportsInfo Optimization Script Loaded');

        initCookieConsent();
        initCookieTracking();

        initPrefetching();
        initLazyLoading();
        trackPageVisit();
        saveLanguagePreference();

        initThemeToggle();
        initBackToTop();
        initReadingProgress();
        initPageTransitions();
        initTimeTracker();

        initAccessibility();

        initNetworkStatus();
        logPerformanceMetrics();
        initErrorHandling();

        enhanceForms();

        console.log('✅ All optimizations initialized');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideUp {
            from { transform: translateY(100%); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }

        @keyframes slideDown {
            from { transform: translateY(0); opacity: 1; }
            to { transform: translateY(100%); opacity: 0; }
        }

        .cookie-consent-banner .cookie-content {
            max-width: 1200px;
            margin: 0 auto;
            display: flex;
            align-items: center;
            gap: 1.5rem;
            flex-wrap: wrap;
        }

        .cookie-consent-banner .cookie-icon {
            font-size: 2rem;
        }

        .cookie-consent-banner .cookie-text {
            flex: 1;
            min-width: 300px;
        }

        .cookie-consent-banner .cookie-text strong {
            color: var(--accent-gold);
            font-size: 1.1rem;
            display: block;
            margin-bottom: 0.5rem;
        }

        .cookie-consent-banner .cookie-text p {
            margin: 0;
            color: #ccc;
            font-size: 0.9rem;
        }

        .cookie-consent-banner .cookie-actions {
            display: flex;
            gap: 1rem;
        }

        .cookie-consent-banner .btn-accept {
            background: var(--accent-gold);
            color: black;
            padding: 0.75rem 2rem;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-weight: bold;
            transition: all 0.3s ease;
        }

        .cookie-consent-banner .btn-accept:hover {
            background: #ffd700;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(212, 175, 55, 0.4);
        }

        .cookie-consent-banner .btn-decline {
            background: transparent;
            color: #ccc;
            padding: 0.75rem 2rem;
            border: 1px solid #555;
            border-radius: 5px;
            cursor: pointer;
            transition: all 0.3s ease;
        }

        .cookie-consent-banner .btn-decline:hover {
            border-color: #999;
            color: white;
        }

        .form-group input[type="file"] {
            padding: 0.75rem;
            border: 2px dashed var(--accent-gold);
            border-radius: 8px;
            background: rgba(255, 255, 255, 0.05);
            color: white;
            cursor: pointer;
            transition: all 0.3s ease;
        }

        .form-group input[type="file"]:hover {
            border-color: #ffd700;
            background: rgba(212, 175, 55, 0.1);
        }

        .form-group input[type="file"]::file-selector-button {
            background: var(--accent-gold);
            color: black;
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 5px;
            margin-right: 1rem;
            cursor: pointer;
            font-weight: bold;
            transition: all 0.3s ease;
        }

        .form-group input[type="file"]::file-selector-button:hover {
            background: #ffd700;
            transform: scale(1.05);
        }

        .keyboard-nav *:focus {
            outline: 3px solid var(--accent-gold) !important;
            outline-offset: 2px;
        }

        input.valid, textarea.valid, select.valid {
            border-color: #4CAF50 !important;
        }

        input.invalid, textarea.invalid, select.invalid {
            border-color: #ff4444 !important;
        }

        body {
            transition: opacity 0.3s ease, background-color 0.3s ease, color 0.3s ease;
        }

        body.light-mode .sport-card::before {
            background: rgba(0, 0, 0, 0.2);
        }

        body.light-mode .sport-card:hover::before {
            background: rgba(0, 0, 0, 0.05);
        }

        body.light-mode .feedback-btn {
            box-shadow: 0 4px 15px rgba(212, 175, 55, 0.5);
        }

        body.light-mode .feedback-btn:hover {
            box-shadow: 0 6px 20px rgba(212, 175, 55, 0.7);
        }

        body.light-mode .theme-toggle,
        body.light-mode .back-to-top {
            background: rgba(255, 255, 255, 0.95);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        body.light-mode .btn-primary {
            box-shadow: 0 2px 8px rgba(212, 175, 55, 0.3);
        }

        body.light-mode .btn-primary:hover {
            box-shadow: 0 5px 15px rgba(212, 175, 55, 0.5);
        }

        .loading-skeleton {
            background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
            background-size: 200% 100%;
            animation: loading 1.5s infinite;
        }

        @keyframes loading {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
        }

        @media (prefers-reduced-motion: reduce) {
            *, *::before, *::after {
                animation-duration: 0.01ms !important;
                animation-iteration-count: 1 !important;
                transition-duration: 0.01ms !important;
            }
        }
    `;
    document.head.appendChild(style);

})();
