// ===== GLOBAL VARIABLES =====
let isScrolling = false;
let ticking = false;

// ===== DOM CONTENT LOADED =====
document.addEventListener('DOMContentLoaded', function() {
    initializeWebsite();
});

// ===== MAIN INITIALIZATION =====
function initializeWebsite() {
    // Initialize all components
    initParticles();
    initAOS();
    initNavigation();
    initScrollEffects();
    initTypingEffect();
    initContactForm();
    initThemeToggle();
    initLoadingScreen();
    initMouseEffects();
    initTechInteractions();
    initYouTubeModal();
    initPDFViewer();
    initImageModal();
    initFloatingNav();
    initAboutInteractions();
    
    // Premium interaction upgrades (Tier 1-2)
    initCustomCursor();
    initHeroParallax();
    initScrollProgressRing();
    initSkillScrollReveal();
    initEnhancedVanillaTilt();

    // Aesthetic enhancement pack v2.0
    initLenis();
    initSpotlightCards();
    initHeroScrollFade();
    initStaggeredCards();
    

    // Add event listeners
    addEventListeners();
    
    console.log('🚀 Website initialized successfully!');
}

// ===== PARTICLES.JS CONFIGURATION =====
function initParticles() {
    if (typeof particlesJS !== 'undefined') {
        // Performance budget: cut particle count from 120 -> 56 on desktop,
        // and further down to 24 on touch/coarse-pointer/small devices where
        // the canvas + line-linking math is the heaviest jank source.
        const isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches
            || window.innerWidth < 768;
        const particleCount = isTouch ? 24 : 56;

        particlesJS('particles-js', {
            particles: {
                number: {
                    value: particleCount,
                    density: {
                        enable: true,
                        value_area: 900
                    }
                },
                color: {
                    value: ['#6366f1', '#ec4899', '#06b6d4']
                },
                shape: {
                    type: 'circle',
                    stroke: {
                        width: 0,
                        color: '#000000'
                    }
                },
                opacity: {
                    value: 0.6,
                    random: true,
                    anim: {
                        enable: true,
                        speed: 1,
                        opacity_min: 0.2,
                        sync: false
                    }
                },
                size: {
                    value: 3,
                    random: true,
                    anim: {
                        enable: false,
                        speed: 40,
                        size_min: 0.1,
                        sync: false
                    }
                },
                line_linked: {
                    enable: true,
                    distance: 140,
                    color: '#6366f1',
                    opacity: 0.5,
                    width: 1
                },
                move: {
                    enable: true,
                    speed: 3,
                    direction: 'none',
                    random: true,
                    straight: false,
                    out_mode: 'out',
                    bounce: false,
                    attract: {
                        enable: false,
                        rotateX: 600,
                        rotateY: 1200
                    }
                }
            },
            interactivity: {
                detect_on: 'canvas',
                events: {
                    onhover: {
                        enable: true,
                        mode: 'grab'
                    },
                    onclick: {
                        enable: true,
                        mode: 'push'
                    },
                    resize: true
                },
                modes: {
                    grab: {
                        distance: 180,
                        line_linked: {
                            opacity: 0.8
                        }
                    },
                    bubble: {
                        distance: 400,
                        size: 40,
                        duration: 2,
                        opacity: 8,
                        speed: 3
                    },
                    repulse: {
                        distance: 200,
                        duration: 0.4
                    },
                    push: {
                        particles_nb: 4
                    },
                    remove: {
                        particles_nb: 2
                    }
                }
            },
            retina_detect: true
        });
    }
}

// ===== AOS INITIALIZATION =====
function initAOS() {
    if (typeof AOS !== 'undefined') {
        AOS.init({
            duration: 1000,
            easing: 'ease-in-out',
            once: true,
            mirror: false,
            offset: 100
        });
    }

    // Reveal fail-safe: if AOS fails to load or an observer never fires
    // (e.g. element below an off-screen container), never leave content
    // permanently invisible. Force-reveal anything still hidden after 3s.
    setTimeout(() => {
        document.querySelectorAll('[data-aos]:not(.aos-animate)').forEach(el => {
            el.classList.add('aos-animate');
        });
    }, 3000);
}

// ===== NAVIGATION FUNCTIONALITY =====
function initNavigation() {
    const navbar = document.getElementById('navbar');
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    // Mobile menu toggle
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
    }

    // Close mobile menu when clicking on a link
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            hamburger?.classList.remove('active');
            navMenu?.classList.remove('active');
            // Prevent body scroll when menu is open
            document.body.style.overflow = 'auto';
        });
    });
    
    // Handle mobile menu body scroll
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            const isActive = navMenu.classList.contains('active');
            if (isActive) {
                document.body.style.overflow = 'auto';
            } else {
                document.body.style.overflow = 'hidden';
            }
        });
    }
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
        if (navMenu?.classList.contains('active') && 
            !navMenu.contains(e.target) && 
            !hamburger?.contains(e.target)) {
            hamburger?.classList.remove('active');
            navMenu?.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    });

    // Hero scroll-down arrow: scroll to #about (route through Lenis for smooth,
    // accurate landing — matches the anchor handler offset of -80).
    const scrollIndicator = document.querySelector('.scroll-indicator');
    if (scrollIndicator) {
        scrollIndicator.style.cursor = 'pointer';
        scrollIndicator.setAttribute('role', 'button');
        scrollIndicator.setAttribute('aria-label', 'Scroll to About section');
        scrollIndicator.setAttribute('tabindex', '0');
        const goToAbout = () => {
            const about = document.getElementById('about');
            if (!about) return;
            if (window._lenis && typeof window._lenis.scrollTo === 'function') {
                window._lenis.scrollTo(about, { offset: -80, duration: 1.2 });
            } else {
                window.scrollTo({ top: about.offsetTop - 80, behavior: 'smooth' });
            }
        };
        scrollIndicator.addEventListener('click', goToAbout);
        scrollIndicator.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                goToAbout();
            }
        });
    }

    // Navbar scroll effect (optimized)
    let lastScrollTop = 0;
    let navbarTicking = false;
    
    window.addEventListener('scroll', () => {
        if (!navbarTicking) {
            requestAnimationFrame(() => {
                const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                
                if (scrollTop > 100) {
                    navbar?.classList.add('scrolled');
                } else {
                    navbar?.classList.remove('scrolled');
                }

                // Hide/show navbar on scroll
                if (scrollTop > lastScrollTop && scrollTop > 200) {
                    navbar.style.transform = 'translateY(-100%)';
                } else {
                    navbar.style.transform = 'translateY(0)';
                }
                
                lastScrollTop = scrollTop;
                navbarTicking = false;
            });
            navbarTicking = true;
        }
    }, { passive: true });

    // Active link highlighting will be handled in the combined scroll handler
}

// ===== SCROLL EFFECTS =====
function initScrollEffects() {
    // NOTE: smooth anchor scrolling is owned by Lenis (see initLenis()).
    // The previous native scrollIntoView handlers were removed here so the
    // two systems no longer both preventDefault and fight over scrolling.

    // Combined scroll handler for better performance
    window.addEventListener('scroll', throttle(() => {
        handleParallax();
        handleScrollAnimations();
        updateActiveNavLink();
    }, 16), { passive: true });
}

// ===== ENHANCED PARALLAX EFFECTS =====
function handleParallax() {
    if (!ticking) {
        requestAnimationFrame(() => {
            const scrolled = window.pageYOffset;
            const windowHeight = window.innerHeight;
            
            // Only apply parallax if user hasn't disabled motion
            if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                // Enhanced parallax elements
                const parallaxElements = document.querySelectorAll('.parallax');
                parallaxElements.forEach(element => {
                    const speed = element.dataset.speed || 0.5;
                    const yPos = -(scrolled * speed);
                    element.style.transform = `translate3d(0, ${yPos}px, 0)`;
                });

                // Hero section sophisticated parallax
                const hero = document.querySelector('.hero');
                if (hero && scrolled < windowHeight) {
                    const heroOffset = scrolled * 0.2;
                    const heroRotation = scrolled * 0.01;
                    hero.style.transform = `translate3d(0, ${heroOffset}px, 0) rotateX(${heroRotation}deg)`;
                }

                // Tech grid animation based on scroll
                const techGrid = document.querySelector('.tech-grid');
                if (techGrid) {
                    const gridOffset = scrolled * 0.1;
                    techGrid.style.transform = `translate3d(${gridOffset}px, ${gridOffset}px, 0)`;
                }

                // Data visualization bars animation
                const chartBars = document.querySelectorAll('.chart-bar');
                chartBars.forEach((bar, index) => {
                    const intensity = Math.sin(scrolled * 0.01 + index) * 0.2 + 1;
                    bar.style.transform = `scaleY(${intensity})`;
                });
            }
            
            ticking = false;
        });
        ticking = true;
    }
}

// ===== SCROLL ANIMATIONS =====
function handleScrollAnimations() {
    const elements = document.querySelectorAll('.fade-in');
    const windowHeight = window.innerHeight;
    
    elements.forEach(element => {
        const elementTop = element.getBoundingClientRect().top;
        const elementVisible = 150;
        
        if (elementTop < windowHeight - elementVisible) {
            element.classList.add('visible');
        }
    });
}

// ===== TYPING EFFECT =====
function initTypingEffect() {
    const typingElement = document.querySelector('.hero-subtitle');
    if (!typingElement) return;

    const texts = [
        'I turn research into production AI that ships',
        'Computer Vision · Multimodal Deep Learning · Agentic Systems',
        'Edge-ready perception · 95% fewer cloud calls',
        'From IEEE research to deployed MLOps pipelines'
    ];
    
    let textIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let typeSpeed = 100;

    function typeWriter() {
        const currentText = texts[textIndex];
        
        if (isDeleting) {
            typingElement.textContent = currentText.substring(0, charIndex - 1);
            charIndex--;
            typeSpeed = 50;
        } else {
            typingElement.textContent = currentText.substring(0, charIndex + 1);
            charIndex++;
            typeSpeed = 100;
        }

        if (!isDeleting && charIndex === currentText.length) {
            typeSpeed = 2000;
            isDeleting = true;
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            textIndex = (textIndex + 1) % texts.length;
            typeSpeed = 500;
        }

        setTimeout(typeWriter, typeSpeed);
    }

    // Start typing effect after a delay
    setTimeout(typeWriter, 1000);
}

// ===== CONTACT FORM =====
// Wired to the same POST /api/book endpoint the "Ask Reshad" widget's booking card uses
// (see assistant-widget.js) -- both are the same underlying action, "get a message to
// Reshad". This used to fake a 2-second spinner then claim success without sending
// anything anywhere; found by actually reading the handler, not by testing the UI, since a
// fake success looks identical to a real one from the visitor's side.
function contactApiBase() {
    return /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname)
        ? 'http://localhost:8000'
        : 'https://enterprise-ai-document-assistant-8baj.onrender.com';
}

function initContactForm() {
    const contactForm = document.getElementById('contact-form');
    if (!contactForm) return;

    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const formData = new FormData(this);
        const data = Object.fromEntries(formData);

        if (!validateForm(data)) return;

        showFormLoading(true);
        const form = this;

        fetch(contactApiBase() + '/api/book', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: data.name,
                email: data.email,
                purpose: `[${data.subject}] ${data.message}`,
                website: data.website || '' // honeypot
            })
        })
            .then(function (res) {
                if (!res.ok) throw new Error('bad status ' + res.status);
                showFormLoading(false);
                showFormSuccess();
                form.reset();
            })
            .catch(function () {
                showFormLoading(false);
                showFormErrors(['Something went wrong sending your message. Please try again, or email reshad.sazid@gmail.com directly.']);
            });
    });
}

// ===== FORM VALIDATION =====
function validateForm(data) {
    const errors = [];
    
    if (!data.name || data.name.trim().length < 2) {
        errors.push('Name must be at least 2 characters long');
    }
    
    if (!data.email || !isValidEmail(data.email)) {
        errors.push('Please enter a valid email address');
    }
    
    if (!data.subject || data.subject.trim().length < 3) {
        errors.push('Subject must be at least 3 characters long');
    }
    
    if (!data.message || data.message.trim().length < 10) {
        errors.push('Message must be at least 10 characters long');
    }
    
    if (errors.length > 0) {
        showFormErrors(errors);
        return false;
    }
    
    return true;
}

// ===== FORM UTILITIES =====
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function showFormLoading(isLoading) {
    const submitBtn = document.querySelector('#contact-form button[type="submit"]');
    if (!submitBtn) return;
    
    if (isLoading) {
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
        submitBtn.disabled = true;
    } else {
        submitBtn.innerHTML = 'Send Message';
        submitBtn.disabled = false;
    }
}

function showFormSuccess() {
    showNotification('Message sent successfully! I\'ll get back to you soon.', 'success');
}

function showFormErrors(errors) {
    const errorMessage = errors.join('\n');
    showNotification(errorMessage, 'error');
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            <span>${message}</span>
            <button class="notification-close">&times;</button>
        </div>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : '#ef4444'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 0.5rem;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        z-index: 10000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        max-width: 400px;
        word-wrap: break-word;
    `;
    
    // Add to DOM
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Close functionality
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => notification.remove(), 300);
    });
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

// ===== THEME TOGGLE =====
function initThemeToggle() {
    // Create theme toggle button
    const themeToggle = document.createElement('button');
    themeToggle.className = 'theme-toggle';
    themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    themeToggle.setAttribute('aria-label', 'Toggle dark mode');
    themeToggle.setAttribute('title', 'Toggle dark/light mode');
    
    // Add styles with responsive positioning
    const updateThemeTogglePosition = () => {
        const isMobile = window.innerWidth <= 768;
        const floatingNav = document.querySelector('.floating-nav');
        
        let bottomPosition = '20px';
        let rightPosition = '20px';
        
        if (isMobile) {
            // Position above floating nav on mobile
            bottomPosition = floatingNav ? '140px' : '80px';
            rightPosition = '15px';
        }
        
        themeToggle.style.cssText = `
            position: fixed;
            bottom: ${bottomPosition};
            right: ${rightPosition};
            width: ${isMobile ? '45px' : '50px'};
            height: ${isMobile ? '45px' : '50px'};
            border-radius: 50%;
            border: none;
            background: var(--primary-color);
            color: white;
            font-size: ${isMobile ? '1.1rem' : '1.2rem'};
            cursor: pointer;
            box-shadow: var(--shadow-large);
            transition: all var(--transition-medium);
            z-index: 1001;
            display: flex;
            align-items: center;
            justify-content: center;
            transform: scale(1);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
        `;
    };
    
    updateThemeTogglePosition();
    
    // Update position on resize
    window.addEventListener('resize', updateThemeTogglePosition);
    
    // Add hover effect
    themeToggle.addEventListener('mouseenter', () => {
        themeToggle.style.transform = 'scale(1.1)';
    });
    
    themeToggle.addEventListener('mouseleave', () => {
        themeToggle.style.transform = 'scale(1)';
    });
    
    document.body.appendChild(themeToggle);
    
    // Check for saved theme preference or system preference
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
    
    document.documentElement.setAttribute('data-theme', initialTheme);
    updateThemeIcon(themeToggle, initialTheme);
    updateParticlesTheme(initialTheme);
    
    // Theme toggle functionality
    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(themeToggle, newTheme);
        updateParticlesTheme(newTheme);
        
        // Add a subtle animation feedback
        themeToggle.style.transform = 'scale(0.9)';
        setTimeout(() => {
            themeToggle.style.transform = 'scale(1)';
        }, 150);
    });
    
    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) {
            const newTheme = e.matches ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', newTheme);
            updateThemeIcon(themeToggle, newTheme);
            updateParticlesTheme(newTheme);
        }
    });
}

function updateThemeIcon(button, theme) {
    const icon = button.querySelector('i');
    if (theme === 'dark') {
        icon.className = 'fas fa-sun';
        button.setAttribute('aria-label', 'Switch to light mode');
        button.setAttribute('title', 'Switch to light mode');
    } else {
        icon.className = 'fas fa-moon';
        button.setAttribute('aria-label', 'Switch to dark mode');
        button.setAttribute('title', 'Switch to dark mode');
    }
}

function updateParticlesTheme(theme) {
    if (typeof pJSDom !== 'undefined' && pJSDom[0]) {
        const particles = pJSDom[0].pJS;
        const newColor = theme === 'dark' ? '#6366f1' : '#6366f1';
        
        // Update particle colors
        particles.particles.color.value = newColor;
        particles.particles.line_linked.color = newColor;
        
        // Update particles
        particles.fn.particlesRefresh();
    }
}

// ===== LOADING SCREEN =====
function initLoadingScreen() {
    // Create loading screen
    const loadingScreen = document.createElement('div');
    loadingScreen.className = 'loading';
    loadingScreen.innerHTML = `
        <div class="spinner"></div>
    `;
    
    document.body.appendChild(loadingScreen);

    let hidden = false;
    const hide = () => {
        if (hidden) return;
        hidden = true;
        loadingScreen.classList.add('hidden');
        setTimeout(() => loadingScreen.remove(), 500);
    };

    // Hide when the page has loaded — or immediately if it already has
    // (subpage navigations can run this after 'load' has fired).
    if (document.readyState === 'complete') {
        hide();
    } else {
        window.addEventListener('load', hide);
    }
    // Safety net: a slow/hung CDN or image must never keep the full-screen
    // overlay up and block the whole view.
    setTimeout(hide, 2500);
}

// ===== ACTIVE NAV LINK =====
function updateActiveNavLink() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');
    
    let current = '';
    const scrollPosition = window.pageYOffset + 200;
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        
        if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
            current = section.getAttribute('id');
        }
    });
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
}

// ===== SKILL TAGS ANIMATION =====
function initSkillTagsAnimation() {
    const skillTags = document.querySelectorAll('.skill-tag');
    
    skillTags.forEach((tag, index) => {
        tag.style.animationDelay = `${index * 0.1}s`;
        
        tag.addEventListener('mouseenter', () => {
            tag.style.transform = 'translateY(-5px) scale(1.05)';
        });
        
        tag.addEventListener('mouseleave', () => {
            tag.style.transform = 'translateY(0) scale(1)';
        });
    });
}

// ===== INTERSECTION OBSERVER FOR ANIMATIONS =====
function initIntersectionObserver() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);
    
    // Observe elements
    document.querySelectorAll('.project-card, .timeline-item, .stat-card').forEach(el => {
        observer.observe(el);
    });
}

// ===== UTILITY FUNCTIONS =====
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

function debounce(func, wait, immediate) {
    let timeout;
    return function() {
        const context = this;
        const args = arguments;
        const later = function() {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
    };
}

// ===== EVENT LISTENERS =====
function addEventListeners() {
    // Resize handler
    window.addEventListener('resize', debounce(() => {
        // Reinitialize particles on resize
        if (typeof pJSDom !== 'undefined' && pJSDom[0]) {
            pJSDom[0].pJS.fn.particlesRefresh();
        }
        
        // Close mobile menu on resize
        const hamburger = document.getElementById('hamburger');
        const navMenu = document.getElementById('nav-menu');
        if (window.innerWidth > 768) {
            hamburger?.classList.remove('active');
            navMenu?.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    }, 250));
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            // Close mobile menu
            const hamburger = document.getElementById('hamburger');
            const navMenu = document.getElementById('nav-menu');
            hamburger?.classList.remove('active');
            navMenu?.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    });
    
    // Touch events for better mobile interaction
    let touchStartY = 0;
    let touchEndY = 0;
    
    document.addEventListener('touchstart', (e) => {
        touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });
    
    document.addEventListener('touchend', (e) => {
        touchEndY = e.changedTouches[0].screenY;
        handleSwipe();
    }, { passive: true });
    
    function handleSwipe() {
        const swipeThreshold = 50;
        const diff = touchStartY - touchEndY;
        
        // Swipe up to close mobile menu
        if (diff > swipeThreshold) {
            const navMenu = document.getElementById('nav-menu');
            const hamburger = document.getElementById('hamburger');
            if (navMenu?.classList.contains('active')) {
                hamburger?.classList.remove('active');
                navMenu?.classList.remove('active');
                document.body.style.overflow = 'auto';
            }
        }
    }
    
    // Prevent right-click on images (optional)
    document.querySelectorAll('img').forEach(img => {
        img.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
    });
    
    // Add touch feedback for buttons
    document.querySelectorAll('.btn, .social-link, .project-link').forEach(element => {
        element.addEventListener('touchstart', () => {
            element.style.transform = 'scale(0.95)';
        }, { passive: true });
        
        element.addEventListener('touchend', () => {
            setTimeout(() => {
                element.style.transform = '';
            }, 150);
        }, { passive: true });
    });
}

// ===== PERFORMANCE OPTIMIZATION =====
function optimizePerformance() {
    // Lazy load images
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                    imageObserver.unobserve(img);
                }
            });
        });
        
        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    }
}

// ===== EASTER EGG =====
function initEasterEgg() {
    let konamiCode = [];
    const konamiSequence = [
        'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
        'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
        'KeyB', 'KeyA'
    ];
    
    document.addEventListener('keydown', (e) => {
        konamiCode.push(e.code);
        
        if (konamiCode.length > konamiSequence.length) {
            konamiCode.shift();
        }
        
        if (konamiCode.join(',') === konamiSequence.join(',')) {
            showEasterEgg();
            konamiCode = [];
        }
    });
}

function showEasterEgg() {
    const easterEgg = document.createElement('div');
    easterEgg.innerHTML = `
        <div style="
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #6366f1, #ec4899);
            color: white;
            padding: 2rem;
            border-radius: 1rem;
            text-align: center;
            z-index: 10000;
            box-shadow: 0 20px 40px rgba(0,0,0,0.3);
        ">
            <h3>🎉 Easter Egg Found!</h3>
            <p>You discovered the Konami Code!</p>
            <p>Thanks for exploring my website thoroughly! 🚀</p>
            <button onclick="this.parentElement.parentElement.remove()" style="
                background: rgba(255,255,255,0.2);
                border: none;
                color: white;
                padding: 0.5rem 1rem;
                border-radius: 0.5rem;
                cursor: pointer;
                margin-top: 1rem;
            ">Close</button>
        </div>
    `;
    
    document.body.appendChild(easterEgg);
    
    // Auto remove after 10 seconds
    setTimeout(() => {
        if (easterEgg.parentNode) {
            easterEgg.remove();
        }
    }, 10000);
}

// ===== INITIALIZE ADDITIONAL FEATURES =====
document.addEventListener('DOMContentLoaded', () => {
    initSkillTagsAnimation();
    initIntersectionObserver();
    optimizePerformance();
    initEasterEgg();
});

// ===== MOUSE TRACKING EFFECTS (kept for floating icon delta, legacy) =====
function initMouseEffects() {
    // Magnetic button base setup — enhanced version now lives in initMagneticButtons()
    // called via initializeWebsite -> initCustomCursor chain
}

// ===== TECH INTERACTIONS =====
function initTechInteractions() {
    // Add click interactions to tech icons
    const techIcons = document.querySelectorAll('.tech-icon');
    techIcons.forEach(icon => {
        icon.addEventListener('click', () => {
            const techType = icon.dataset.tech;
            showTechInfo(techType);
            
            // Add ripple effect
            createRippleEffect(icon);
        });
    });
    
    // Code animation interaction
    const codeLines = document.querySelectorAll('.code-line');
    codeLines.forEach((line, index) => {
        line.addEventListener('mouseenter', () => {
            line.style.background = 'rgba(99, 102, 241, 0.2)';
            line.style.transform = 'translateX(5px)';
        });
        
        line.addEventListener('mouseleave', () => {
            line.style.background = 'rgba(0, 0, 0, 0.2)';
            line.style.transform = 'translateX(0)';
        });
    });
}

function showTechInfo(techType) {
    const techInfo = {
        'AI': 'Artificial Intelligence - Building intelligent systems that can learn and adapt',
        'ML': 'Machine Learning - Creating algorithms that improve through experience',
        'IoT': 'Internet of Things - Connecting devices for smart automation',
        'CV': 'Computer Vision - Teaching machines to see and understand images',
        'ROS': 'Robot Operating System - Framework for robotics development'
    };
    
    const message = techInfo[techType] || 'Exploring cutting-edge technology';
    showNotification(message, 'info');
}

function createRippleEffect(element) {
    const ripple = document.createElement('div');
    ripple.style.cssText = `
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.6);
        transform: scale(0);
        animation: ripple 0.6s linear;
        pointer-events: none;
        width: 20px;
        height: 20px;
        left: 50%;
        top: 50%;
        margin-left: -10px;
        margin-top: -10px;
    `;
    
    element.style.position = 'relative';
    element.appendChild(ripple);
    
    setTimeout(() => {
        ripple.remove();
    }, 600);
}

// Add ripple animation CSS
const rippleCSS = `
@keyframes ripple {
    to {
        transform: scale(4);
        opacity: 0;
    }
}
`;

const style = document.createElement('style');
style.textContent = rippleCSS;
document.head.appendChild(style);

// ===== YOUTUBE MODAL FUNCTIONALITY =====
function initYouTubeModal() {
    const modal = document.getElementById('youtube-modal');
    const iframe = document.getElementById('youtube-iframe');
    const closeBtn = document.querySelector('.youtube-modal-close');
    const youtubeButtons = document.querySelectorAll('.youtube-modal-btn');
    const youtubePreviews = document.querySelectorAll('.youtube-preview');
    
    // Open modal when clicking YouTube buttons
    youtubeButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const videoId = btn.dataset.videoId;
            const startTime = btn.dataset.startTime || 0;
            openYouTubeModal(videoId, startTime);
        });
    });
    
    // Open modal when clicking YouTube previews
    youtubePreviews.forEach(preview => {
        preview.addEventListener('click', () => {
            const videoId = preview.dataset.videoId;
            const startTime = preview.dataset.startTime || 0;
            openYouTubeModal(videoId, startTime);
        });
    });
    
    // Close modal functionality
    closeBtn?.addEventListener('click', closeYouTubeModal);
    
    // Close modal when clicking outside
    modal?.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeYouTubeModal();
        }
    });
    
    // Close modal with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal?.classList.contains('active')) {
            closeYouTubeModal();
        }
    });
    
    function openYouTubeModal(videoId, startTime = 0) {
        if (!modal || !iframe) return;
        
        const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&start=${startTime}&rel=0&modestbranding=1`;
        iframe.src = embedUrl;
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Add loading state
        iframe.style.opacity = '0';
        iframe.onload = () => {
            iframe.style.opacity = '1';
        };
    }
    
    function closeYouTubeModal() {
        if (!modal || !iframe) return;
        
        modal.classList.remove('active');
        iframe.src = '';
        document.body.style.overflow = 'auto';
    }
}

// ===== PDF VIEWER FUNCTIONALITY =====
function initPDFViewer() {
    // Set PDF.js worker
    if (typeof pdfjsLib !== 'undefined') {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }
    
    const modal = document.getElementById('pdf-modal');
    const canvas = document.getElementById('pdf-canvas');
    const ctx = canvas?.getContext('2d');
    const loading = document.getElementById('pdf-loading');
    const title = document.getElementById('pdf-title');
    const pageInfo = document.getElementById('pdf-page-info');
    const zoomLevel = document.getElementById('pdf-zoom-level');
    
    // Control buttons
    const closeBtn = document.querySelector('.pdf-modal-close');
    const prevBtn = document.getElementById('pdf-prev');
    const nextBtn = document.getElementById('pdf-next');
    const zoomInBtn = document.getElementById('pdf-zoom-in');
    const zoomOutBtn = document.getElementById('pdf-zoom-out');
    const fullscreenBtn = document.getElementById('pdf-fullscreen');
    const downloadBtn = document.getElementById('pdf-download');
    
    // PDF viewer buttons
    const pdfButtons = document.querySelectorAll('.pdf-viewer-btn');
    const pdfThumbs = document.querySelectorAll('.pdf-thumb');
    
    // PDF state
    let currentPDF = null;
    let currentPage = 1;
    let totalPages = 0;
    let currentScale = 1.0;
    let currentPDFUrl = '';
    
    // Define before first use and also expose globally
    function initPDFButtons() {
        const allPdfButtons = document.querySelectorAll('.pdf-viewer-btn');
        allPdfButtons.forEach(btn => {
            // Remove existing listeners to avoid duplicates
            btn.removeEventListener('click', handlePDFButtonClick);
            btn.addEventListener('click', handlePDFButtonClick);
        });
    }
    window.initPDFButtons = initPDFButtons;

    // Initialize PDF viewer buttons
    initPDFButtons();
    renderPDFThumbnails();
    
    // Reinitialize PDF buttons after a short delay to ensure all elements are loaded
    setTimeout(() => {
        initPDFButtons();
        renderPDFThumbnails();
    }, 100);
    
    // Function initPDFButtons already defined above

    // Render small PDF previews (first page) inside elements with class .pdf-thumb
    async function renderPDFThumbnails() {
        try {
            const thumbs = document.querySelectorAll('.pdf-thumb');
            if (!thumbs || thumbs.length === 0) return;

            thumbs.forEach(async (thumb) => {
                // Avoid duplicate renders
                if (thumb.dataset.rendered === 'true') return;

                const pdfUrl = thumb.getAttribute('data-pdf');
                if (!pdfUrl) return;

                // Create canvas
                const canvas = document.createElement('canvas');
                canvas.width = 320; // small preview
                canvas.height = 200;
                canvas.className = 'pdf-thumb-canvas';
                thumb.innerHTML = '';
                thumb.appendChild(canvas);

                const ctx = canvas.getContext('2d');
                try {
                    const loadingTask = pdfjsLib.getDocument(pdfUrl);
                    const pdf = await loadingTask.promise;
                    const page = await pdf.getPage(1);
                    const viewport = page.getViewport({ scale: 0.3 });

                    // Resize canvas to aspect of page
                    const scale = Math.min(canvas.width / viewport.width, canvas.height / viewport.height);
                    const scaledViewport = page.getViewport({ scale: 0.3 * scale * (320/ canvas.width) });
                    canvas.width = Math.floor(scaledViewport.width);
                    canvas.height = Math.floor(scaledViewport.height);

                    await page.render({ canvasContext: ctx, viewport: scaledViewport }).promise;
                    thumb.dataset.rendered = 'true';
                } catch (err) {
                    // Fallback icon if PDF fails to render
                    thumb.innerHTML = '<div class="pdf-thumb-fallback"><i class="fas fa-file-pdf"></i></div>';
                }
            });
        } catch (e) {
            // Silently ignore thumbnail errors to not break the page
        }
    }
    
    function handlePDFButtonClick(e) {
        e.preventDefault();
        const pdfUrl = e.target.closest('.pdf-viewer-btn').dataset.pdf;
        const pdfTitle = e.target.closest('.pdf-viewer-btn').dataset.title;
        openPDFModal(pdfUrl, pdfTitle);
    }
    
    // Close modal functionality
    closeBtn?.addEventListener('click', closePDFModal);
    
    // Close modal when clicking outside
    modal?.addEventListener('click', (e) => {
        if (e.target === modal) {
            closePDFModal();
        }
    });
    
    // Control button events
    prevBtn?.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderPage();
        }
    });
    
    nextBtn?.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            renderPage();
        }
    });
    
    zoomInBtn?.addEventListener('click', () => {
        currentScale = Math.min(currentScale + 0.25, 3.0);
        renderPage();
        updateZoomLevel();
    });
    
    zoomOutBtn?.addEventListener('click', () => {
        currentScale = Math.max(currentScale - 0.25, 0.5);
        renderPage();
        updateZoomLevel();
    });
    
    fullscreenBtn?.addEventListener('click', () => {
        if (modal) {
            if (document.fullscreenElement) {
                document.exitFullscreen();
            } else {
                modal.requestFullscreen();
            }
        }
    });
    
    downloadBtn?.addEventListener('click', () => {
        if (currentPDFUrl) {
            const link = document.createElement('a');
            link.href = currentPDFUrl;
            link.download = currentPDFUrl.split('/').pop();
            link.click();
        }
    });
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (!modal?.classList.contains('active')) return;
        
        switch(e.key) {
            case 'Escape':
                closePDFModal();
                break;
            case 'ArrowLeft':
                if (currentPage > 1) {
                    currentPage--;
                    renderPage();
                }
                break;
            case 'ArrowRight':
                if (currentPage < totalPages) {
                    currentPage++;
                    renderPage();
                }
                break;
            case '+':
            case '=':
                currentScale = Math.min(currentScale + 0.25, 3.0);
                renderPage();
                updateZoomLevel();
                break;
            case '-':
                currentScale = Math.max(currentScale - 0.25, 0.5);
                renderPage();
                updateZoomLevel();
                break;
        }
    });
    
    // Mouse wheel zoom
    canvas?.addEventListener('wheel', (e) => {
        if (e.ctrlKey) {
            e.preventDefault();
            if (e.deltaY < 0) {
                currentScale = Math.min(currentScale + 0.1, 3.0);
            } else {
                currentScale = Math.max(currentScale - 0.1, 0.5);
            }
            renderPage();
            updateZoomLevel();
        }
    });
    
    async function openPDFModal(pdfUrl, pdfTitle) {
        if (!modal || !canvas || !ctx) return;
        
        currentPDFUrl = pdfUrl;
        title.textContent = pdfTitle || 'Research Paper';
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Show loading
        loading.style.display = 'block';
        canvas.style.display = 'none';
        
        try {
            // Load PDF
            const loadingTask = pdfjsLib.getDocument(pdfUrl);
            currentPDF = await loadingTask.promise;
            totalPages = currentPDF.numPages;
            currentPage = 1;
            currentScale = 1.0;
            
            // Hide loading
            loading.style.display = 'none';
            canvas.style.display = 'block';
            
            // Render first page
            await renderPage();
            updateControls();
            updateZoomLevel();
            
        } catch (error) {
            console.error('Error loading PDF:', error);
            showNotification('Error loading PDF. Please try again.', 'error');
            closePDFModal();
        }
    }
    
    function closePDFModal() {
        if (!modal) return;
        
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
        
        // Clean up
        if (currentPDF) {
            currentPDF = null;
        }
        currentPage = 1;
        totalPages = 0;
        currentScale = 1.0;
        currentPDFUrl = '';
    }
    
    async function renderPage() {
        if (!currentPDF || !canvas || !ctx) return;
        
        try {
            const page = await currentPDF.getPage(currentPage);
            const viewport = page.getViewport({ scale: currentScale });
            
            // Set canvas dimensions
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            
            // Render page
            const renderContext = {
                canvasContext: ctx,
                viewport: viewport
            };
            
            await page.render(renderContext).promise;
            updateControls();
            
        } catch (error) {
            console.error('Error rendering page:', error);
        }
    }
    
    function updateControls() {
        if (pageInfo) {
            pageInfo.textContent = `${currentPage} / ${totalPages}`;
        }
        
        if (prevBtn) {
            prevBtn.disabled = currentPage <= 1;
        }
        
        if (nextBtn) {
            nextBtn.disabled = currentPage >= totalPages;
        }
    }
    
    function updateZoomLevel() {
        if (zoomLevel) {
            zoomLevel.textContent = `${Math.round(currentScale * 100)}%`;
        }
    }
}

// ===== IMAGE MODAL FUNCTIONALITY =====
function initImageModal() {
    const imageModal = document.getElementById('image-modal');
    const modalImage = document.getElementById('modal-image');
    const imageTitle = document.getElementById('image-title');
    const imageLoading = document.getElementById('image-loading');
    const imageViewer = document.querySelector('.image-viewer-container');
    const closeBtn = document.querySelector('.image-modal-close');
    const zoomInBtn = document.getElementById('image-zoom-in');
    const zoomOutBtn = document.getElementById('image-zoom-out');
    const zoomLevel = document.getElementById('image-zoom-level');
    const fullscreenBtn = document.getElementById('image-fullscreen');
    const downloadBtn = document.getElementById('image-download');
    
    let currentScale = 1;
    let isDragging = false;
    let startX, startY, translateX = 0, translateY = 0;
    
    // Add click listeners to all clickable images
    const clickableImages = document.querySelectorAll('.clickable-image');
    clickableImages.forEach(img => {
        img.addEventListener('click', () => {
            openImageModal(img.src, img.dataset.title || img.alt);
        });
    });
    
    // Close modal events
    if (closeBtn) {
        closeBtn.addEventListener('click', closeImageModal);
    }
    
    if (imageModal) {
        imageModal.addEventListener('click', (e) => {
            if (e.target === imageModal) {
                closeImageModal();
            }
        });
    }
    
    // Zoom controls
    if (zoomInBtn) {
        zoomInBtn.addEventListener('click', () => {
            currentScale = Math.min(currentScale * 1.2, 5);
            updateImageTransform();
            updateZoomLevel();
        });
    }
    
    if (zoomOutBtn) {
        zoomOutBtn.addEventListener('click', () => {
            currentScale = Math.max(currentScale / 1.2, 0.5);
            updateImageTransform();
            updateZoomLevel();
        });
    }
    
    // Fullscreen toggle
    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', toggleFullscreen);
    }
    
    // Download functionality
    if (downloadBtn) {
        downloadBtn.addEventListener('click', downloadImage);
    }
    
    // Mouse wheel zoom
    if (modalImage) {
        modalImage.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            currentScale = Math.max(0.5, Math.min(5, currentScale * delta));
            updateImageTransform();
            updateZoomLevel();
        });
        
        // Drag functionality
        modalImage.addEventListener('mousedown', startDrag);
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', endDrag);
    }
    
    // Keyboard controls
    document.addEventListener('keydown', (e) => {
        if (imageModal && imageModal.classList.contains('active')) {
            switch(e.key) {
                case 'Escape':
                    closeImageModal();
                    break;
                case '+':
                case '=':
                    currentScale = Math.min(currentScale * 1.2, 5);
                    updateImageTransform();
                    updateZoomLevel();
                    break;
                case '-':
                    currentScale = Math.max(currentScale / 1.2, 0.5);
                    updateImageTransform();
                    updateZoomLevel();
                    break;
                case '0':
                    resetImageTransform();
                    break;
            }
        }
    });
    
    function openImageModal(imageSrc, title) {
        if (!imageModal || !modalImage) return;
        
        // Show loading
        if (imageLoading) imageLoading.style.display = 'flex';
        if (modalImage) modalImage.style.display = 'none';
        
        // Set title
        if (imageTitle) imageTitle.textContent = title || 'Image Preview';
        
        // Reset transform
        resetImageTransform();
        
        // Load image
        const img = new Image();
        img.onload = () => {
            modalImage.src = imageSrc;
            modalImage.alt = title || 'Image Preview';
            
            // Hide loading, show image
            if (imageLoading) imageLoading.style.display = 'none';
            if (modalImage) modalImage.style.display = 'block';
            
            // Show modal
            imageModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        };
        
        img.onerror = () => {
            if (imageLoading) imageLoading.style.display = 'none';
            console.error('Failed to load image:', imageSrc);
            closeImageModal();
        };
        
        img.src = imageSrc;
    }
    
    function closeImageModal() {
        if (imageModal) {
            imageModal.classList.remove('active');
            document.body.style.overflow = 'auto';
            
            // Reset transform
            resetImageTransform();
            
            // Clear image source
            if (modalImage) {
                modalImage.src = '';
                modalImage.style.display = 'none';
            }
        }
    }
    
    function updateImageTransform() {
        if (modalImage) {
            modalImage.style.transform = `scale(${currentScale}) translate(${translateX}px, ${translateY}px)`;
        }
    }
    
    function resetImageTransform() {
        currentScale = 1;
        translateX = 0;
        translateY = 0;
        updateImageTransform();
        updateZoomLevel();
    }
    
    function updateZoomLevel() {
        if (zoomLevel) {
            zoomLevel.textContent = `${Math.round(currentScale * 100)}%`;
        }
    }
    
    function startDrag(e) {
        if (currentScale > 1) {
            isDragging = true;
            startX = e.clientX - translateX;
            startY = e.clientY - translateY;
            modalImage.style.cursor = 'grabbing';
        }
    }
    
    function drag(e) {
        if (isDragging && currentScale > 1) {
            e.preventDefault();
            translateX = e.clientX - startX;
            translateY = e.clientY - startY;
            updateImageTransform();
        }
    }
    
    function endDrag() {
        isDragging = false;
        if (modalImage) {
            modalImage.style.cursor = currentScale > 1 ? 'grab' : 'default';
        }
    }
    
    function toggleFullscreen() {
        if (!document.fullscreenElement) {
            imageModal.requestFullscreen().catch(err => {
                console.log(`Error attempting to enable fullscreen: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    }
    
    function downloadImage() {
        if (modalImage && modalImage.src) {
            const link = document.createElement('a');
            link.href = modalImage.src;
            link.download = imageTitle.textContent || 'image';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }
}

// ===== FLOATING AUTO-SCROLL NAVIGATION =====
function initFloatingNav() {
    const floatingNav = document.getElementById('floating-nav');
    const autoScrollBtn = document.getElementById('auto-scroll-btn');
    const tooltipText = document.getElementById('tooltip-text');
    const dots = document.querySelectorAll('.dot');
    
    if (!floatingNav || !autoScrollBtn) return;
    
    const sections = ['home', 'about', 'experience', 'research', 'projects', 'awards', 'cultural', 'contact'];
    let currentSectionIndex = 0;
    let isAutoScrolling = false;
    let autoScrollInterval;
    let scrollTimeout;
    
    // Auto-scroll functionality
    function startAutoScroll() {
        if (isAutoScrolling) {
            stopAutoScroll();
            return;
        }
        
        isAutoScrolling = true;
        autoScrollBtn.classList.add('scrolling');
        tooltipText.textContent = 'Stop Auto-Scroll';
        
        // Start from current section or beginning
        const currentSection = getCurrentSection();
        currentSectionIndex = sections.indexOf(currentSection);
        if (currentSectionIndex === -1) currentSectionIndex = 0;
        
        autoScrollToNextSection();
        
        // Set interval for continuous scrolling
        autoScrollInterval = setInterval(() => {
            autoScrollToNextSection();
        }, 4000); // 4 seconds per section
    }
    
    function stopAutoScroll() {
        isAutoScrolling = false;
        autoScrollBtn.classList.remove('scrolling');
        tooltipText.textContent = 'Start Auto-Scroll';
        
        if (autoScrollInterval) {
            clearInterval(autoScrollInterval);
            autoScrollInterval = null;
        }
        
        if (scrollTimeout) {
            clearTimeout(scrollTimeout);
            scrollTimeout = null;
        }
    }
    
    function autoScrollToNextSection() {
        if (!isAutoScrolling) return;
        
        currentSectionIndex = (currentSectionIndex + 1) % sections.length;
        const targetSection = sections[currentSectionIndex];
        
        scrollToSection(targetSection, true);
        updateSectionIndicator(targetSection);
        
        // Add visual feedback
        const targetDot = document.querySelector(`.dot[data-section="${targetSection}"]`);
        if (targetDot) {
            targetDot.style.transform = 'scale(1.5)';
            setTimeout(() => {
                if (targetDot) {
                    targetDot.style.transform = '';
                }
            }, 300);
        }
    }
    
    function scrollToSection(sectionId, smooth = true) {
        const section = document.getElementById(sectionId);
        if (!section) return;
        
        // Calculate proper offset to center the section
        const navbarHeight = 80;
        const viewportHeight = window.innerHeight;
        const sectionHeight = section.offsetHeight;
        
        // Center the section in viewport, but ensure we don't scroll past the section
        let offsetTop = section.offsetTop - navbarHeight;
        
        // If section is smaller than viewport, center it
        if (sectionHeight < viewportHeight - navbarHeight) {
            offsetTop = section.offsetTop - (viewportHeight - sectionHeight) / 2;
        }
        
        // Ensure we don't scroll beyond document bounds
        const maxScroll = document.documentElement.scrollHeight - viewportHeight;
        offsetTop = Math.max(0, Math.min(offsetTop, maxScroll));

        // Lenis owns smooth scrolling — using native window.scrollTo({behavior:'smooth'})
        // fights Lenis's RAF loop and produces janky / non-arriving navigation.
        // Route through Lenis when present so section jumps land precisely.
        if (window._lenis && typeof window._lenis.scrollTo === 'function') {
            window._lenis.scrollTo(offsetTop, {
                duration: smooth ? 1.1 : 0,
                immediate: !smooth
            });
        } else if (smooth) {
            window.scrollTo({ top: offsetTop, behavior: 'smooth' });
        } else {
            window.scrollTo(0, offsetTop);
        }
    }
    
    function getCurrentSection() {
        const scrollPosition = window.scrollY + 100;
        
        for (let i = sections.length - 1; i >= 0; i--) {
            const section = document.getElementById(sections[i]);
            if (section && section.offsetTop <= scrollPosition) {
                return sections[i];
            }
        }
        
        return sections[0];
    }
    
    function updateSectionIndicator(activeSection) {
        dots.forEach(dot => {
            const sectionId = dot.getAttribute('data-section');
            dot.classList.remove('active');
            
            if (sectionId === activeSection) {
                dot.classList.add('active');
            }
            
            // Mark as visited if we've scrolled past it
            const sectionIndex = sections.indexOf(sectionId);
            const activeSectionIndex = sections.indexOf(activeSection);
            if (sectionIndex < activeSectionIndex) {
                dot.classList.add('visited');
            } else if (sectionIndex > activeSectionIndex) {
                dot.classList.remove('visited');
            }
        });
    }
    
    // Event listeners
    autoScrollBtn.addEventListener('click', startAutoScroll);
    
    // Manual section navigation via dots
    dots.forEach(dot => {
        dot.addEventListener('click', (e) => {
            e.stopPropagation();
            const sectionId = dot.getAttribute('data-section');
            
            // Stop auto-scroll if active
            if (isAutoScrolling) {
                stopAutoScroll();
            }
            
            scrollToSection(sectionId);
            updateSectionIndicator(sectionId);
            currentSectionIndex = sections.indexOf(sectionId);
        });
    });
    
    // Update indicator on manual scroll
    let scrollUpdateTimeout;
    window.addEventListener('scroll', () => {
        if (scrollUpdateTimeout) {
            clearTimeout(scrollUpdateTimeout);
        }
        
        scrollUpdateTimeout = setTimeout(() => {
            if (!isAutoScrolling) {
                const currentSection = getCurrentSection();
                updateSectionIndicator(currentSection);
                currentSectionIndex = sections.indexOf(currentSection);
            }
        }, 100);
    });
    
    // Stop auto-scroll on manual scroll (if user scrolls manually)
    let isUserScrolling = false;
    let userScrollTimeout;
    
    window.addEventListener('wheel', () => {
        if (isAutoScrolling) {
            isUserScrolling = true;
            
            if (userScrollTimeout) {
                clearTimeout(userScrollTimeout);
            }
            
            userScrollTimeout = setTimeout(() => {
                if (isUserScrolling) {
                    stopAutoScroll();
                    isUserScrolling = false;
                }
            }, 500);
        }
    });
    
    // Touch events for mobile
    let touchStartY = 0;
    window.addEventListener('touchstart', (e) => {
        touchStartY = e.touches[0].clientY;
    });
    
    window.addEventListener('touchmove', (e) => {
        if (isAutoScrolling) {
            const touchY = e.touches[0].clientY;
            const deltaY = Math.abs(touchY - touchStartY);
            
            if (deltaY > 10) { // Threshold for intentional scroll
                stopAutoScroll();
            }
        }
    });
    
    // Hide floating nav when modals are open
    const modals = ['youtube-modal', 'pdf-modal', 'image-modal'];
    modals.forEach(modalId => {
        const modal = document.getElementById(modalId);
        if (modal) {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                        const isModalActive = modal.classList.contains('active');
                        floatingNav.style.display = isModalActive ? 'none' : 'flex';
                        
                        if (isModalActive && isAutoScrolling) {
                            stopAutoScroll();
                        }
                    }
                });
            });
            
            observer.observe(modal, { attributes: true });
        }
    });
    
    // Initialize with current section
    const initialSection = getCurrentSection();
    updateSectionIndicator(initialSection);
    currentSectionIndex = sections.indexOf(initialSection);
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Space bar to toggle auto-scroll
        if (e.code === 'Space' && !e.target.matches('input, textarea')) {
            e.preventDefault();
            startAutoScroll();
        }
        
        // Escape to stop auto-scroll
        if (e.code === 'Escape' && isAutoScrolling) {
            stopAutoScroll();
        }
        
        // Arrow keys for manual navigation
        if (e.code === 'ArrowDown' || e.code === 'ArrowUp') {
            if (!e.target.matches('input, textarea')) {
                e.preventDefault();
                
                if (isAutoScrolling) {
                    stopAutoScroll();
                }
                
                const direction = e.code === 'ArrowDown' ? 1 : -1;
                const newIndex = Math.max(0, Math.min(sections.length - 1, currentSectionIndex + direction));
                
                if (newIndex !== currentSectionIndex) {
                    currentSectionIndex = newIndex;
                    const targetSection = sections[currentSectionIndex];
                    scrollToSection(targetSection);
                    updateSectionIndicator(targetSection);
                }
            }
        }
    });
}

// ===== ABOUT ME INTERACTIVE FEATURES =====
function initAboutInteractions() {
    initStatCounters();
    initSkillProgressBars();
    initProfileCardAnimations();
    initSkillCategoryInteractions();
    initEducationCardInteractions();
    initAboutScrollAnimations();
}

// ===== ANIMATED STAT COUNTERS =====
function initStatCounters() {
    const statItems = document.querySelectorAll('.stat-item');
    
    const observerOptions = {
        threshold: 0.5,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const statNumber = entry.target.querySelector('.stat-number');
                const targetValue = entry.target.dataset.count;
                
                if (statNumber && targetValue && !entry.target.classList.contains('animated')) {
                    entry.target.classList.add('animated');
                    animateCounter(statNumber, targetValue);
                }
            }
        });
    }, observerOptions);
    
    statItems.forEach(item => observer.observe(item));
}

function animateCounter(element, target) {
    const isDecimal = target.includes('.');
    const numericTarget = parseFloat(target);
    const duration = 2000;
    const startTime = performance.now();
    
    function updateCounter(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function for smooth animation
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const currentValue = numericTarget * easeOutQuart;
        
        if (isDecimal) {
            element.textContent = currentValue.toFixed(1);
        } else if (target.includes('+')) {
            element.textContent = Math.floor(currentValue) + '+';
        } else {
            element.textContent = Math.floor(currentValue);
        }
        
        if (progress < 1) {
            requestAnimationFrame(updateCounter);
        } else {
            element.textContent = target;
        }
    }
    
    requestAnimationFrame(updateCounter);
}

// ===== SKILL PROGRESS BARS =====
function initSkillProgressBars() {
    const skillCategories = document.querySelectorAll('.skill-category-card');
    
    skillCategories.forEach(category => {
        const progressCircle = category.querySelector('.progress-circle');
        const progressText = category.querySelector('.progress-text');
        const skillFills = category.querySelectorAll('.skill-fill');
        
        // Add hover event listeners
        category.addEventListener('mouseenter', () => {
            animateProgressCircle(progressCircle, progressText);
            animateSkillBars(skillFills);
        });
        
        category.addEventListener('mouseleave', () => {
            // Don't reset if the card was permanently revealed by scroll
            if (!category.dataset.scrollRevealed) {
                resetProgressAnimations(progressCircle, skillFills);
            }
        });
    });
}

function animateProgressCircle(circle, textElement) {
    if (!circle || !textElement) return;
    
    const progress = parseInt(circle.dataset.progress);
    const circumference = 2 * Math.PI * 25; // radius = 25
    const offset = circumference - (progress / 100) * circumference;
    
    circle.style.strokeDashoffset = offset;
    
    // Animate the text
    let currentProgress = 0;
    const duration = 1000;
    const startTime = performance.now();
    
    function updateText(currentTime) {
        const elapsed = currentTime - startTime;
        const progressRatio = Math.min(elapsed / duration, 1);
        const easeOutQuart = 1 - Math.pow(1 - progressRatio, 4);
        
        currentProgress = Math.floor(progress * easeOutQuart);
        textElement.textContent = `${currentProgress}%`;
        
        if (progressRatio < 1) {
            requestAnimationFrame(updateText);
        } else {
            textElement.textContent = `${progress}%`;
        }
    }
    
    requestAnimationFrame(updateText);
}

function animateSkillBars(skillFills) {
    skillFills.forEach((fill, index) => {
        setTimeout(() => {
            fill.style.width = fill.style.getPropertyValue('--width');
        }, index * 100);
    });
}

function resetProgressAnimations(circle, skillFills) {
    if (circle) {
        circle.style.strokeDashoffset = '157';
    }
    
    skillFills.forEach(fill => {
        fill.style.width = '0';
    });
}

// ===== PROFILE CARD ANIMATIONS =====
function initProfileCardAnimations() {
    const profileCard = document.querySelector('.profile-card');
    const avatar = document.querySelector('.avatar-image');
    const badges = document.querySelectorAll('.badge');
    
    if (profileCard) {
        // Add floating animation on hover
        profileCard.addEventListener('mouseenter', () => {
            profileCard.style.transform = 'translateY(-8px) scale(1.02)';
        });
        
        profileCard.addEventListener('mouseleave', () => {
            profileCard.style.transform = 'translateY(0) scale(1)';
        });
    }
    
    // Avatar click interaction
    if (avatar) {
        avatar.addEventListener('click', () => {
            avatar.style.transform = 'scale(1.1) rotate(5deg)';
            setTimeout(() => {
                avatar.style.transform = 'scale(1) rotate(0deg)';
            }, 300);
        });
    }
    
    // Badge interactions
    badges.forEach(badge => {
        badge.addEventListener('click', () => {
            badge.style.transform = 'scale(1.1)';
            setTimeout(() => {
                badge.style.transform = 'scale(1)';
            }, 200);
            
            // Show tooltip or info
            showBadgeInfo(badge);
        });
    });
}

function showBadgeInfo(badge) {
    const badgeText = badge.textContent.trim();
    let message = '';
    
    if (badgeText.includes('Mars Rover')) {
        message = '🚀 Core team member of BRAC University Mars Rover Team - MONGOL TORI';
                } else if (badgeText.includes('URC 2025')) {
                message = '🏆 Achieved Top 8 global ranking in University Rover Challenge 2025';
    }
    
    if (message) {
        showNotification(message, 'info');
    }
}

// ===== SKILL CATEGORY INTERACTIONS =====
function initSkillCategoryInteractions() {
    const skillCategories = document.querySelectorAll('.skill-category-card');
    
    skillCategories.forEach(category => {
        const categoryType = category.dataset.category;
        const skillsList = category.querySelector('.skills-list');
        
        // Add click to expand/collapse
        category.addEventListener('click', (e) => {
            // Don't trigger if clicking on skill bars
            if (e.target.closest('.skill-item')) return;
            
            toggleSkillCategory(category, skillsList);
        });
        
        // Add keyboard navigation
        category.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleSkillCategory(category, skillsList);
            }
        });
        
        // Make focusable
        category.setAttribute('tabindex', '0');
        category.setAttribute('role', 'button');
        category.setAttribute('aria-expanded', 'false');
    });
}

function toggleSkillCategory(category, skillsList) {
    const isExpanded = category.classList.contains('expanded');
    
    // Close all other categories first (but not scroll-revealed ones)
    document.querySelectorAll('.skill-category-card.expanded').forEach(cat => {
        if (cat !== category && !cat.dataset.scrollRevealed) {
            cat.classList.remove('expanded');
            cat.setAttribute('aria-expanded', 'false');
            const otherSkillsList = cat.querySelector('.skills-list');
            if (otherSkillsList) {
                otherSkillsList.style.maxHeight = '0';
                otherSkillsList.style.opacity = '0';
            }
        }
    });
    
    // Toggle current category (scroll-revealed cards only expand, never collapse)
    if (isExpanded && !category.dataset.scrollRevealed) {
        category.classList.remove('expanded');
        category.setAttribute('aria-expanded', 'false');
        skillsList.style.maxHeight = '0';
        skillsList.style.opacity = '0';
    } else {
        category.classList.add('expanded');
        category.setAttribute('aria-expanded', 'true');
        skillsList.style.maxHeight = '350px';
        skillsList.style.opacity = '1';
        
        // Animate skill bars
        const skillFills = skillsList.querySelectorAll('.skill-fill');
        animateSkillBars(skillFills);
        
        // Animate progress circle
        const progressCircle = category.querySelector('.progress-circle');
        const progressText = category.querySelector('.progress-text');
        animateProgressCircle(progressCircle, progressText);
    }
}

// ===== EDUCATION CARD INTERACTIONS =====
function initEducationCardInteractions() {
    const educationCard = document.querySelector('.education-card-modern');
    const achievementBadge = document.querySelector('.achievement-badge');
    const honorBadges = document.querySelectorAll('.honor-badge');
    
    if (educationCard) {
        educationCard.addEventListener('mouseenter', () => {
            educationCard.style.transform = 'translateY(-4px) scale(1.02)';
        });
        
        educationCard.addEventListener('mouseleave', () => {
            educationCard.style.transform = 'translateY(0) scale(1)';
        });
    }
    
    if (achievementBadge) {
        achievementBadge.addEventListener('click', () => {
            showNotification('🎓 Maintaining excellent academic performance with 3.89/4.00 CGPA', 'success');
        });
    }
    
    honorBadges.forEach(badge => {
        badge.addEventListener('click', () => {
            const badgeText = badge.textContent.trim();
            let message = '';
            
            if (badgeText.includes("Dean's List")) {
                message = '🏆 Recognized for outstanding academic achievement - Dean\'s List';
            } else if (badgeText.includes("Vice Chancellor's List")) {
                message = '🌟 Highest academic honor - Vice Chancellor\'s List recipient';
            }
            
            if (message) {
                showNotification(message, 'success');
            }
        });
    });
}

// ===== ENHANCED SCROLL ANIMATIONS FOR ABOUT SECTION =====
function initAboutScrollAnimations() {
    const aboutSection = document.getElementById('about');
    if (!aboutSection) return;
    
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Trigger staggered animations
                const profileCard = entry.target.querySelector('.profile-card');
                const skillsSection = entry.target.querySelector('.skills-section');
                
                if (profileCard) {
                    setTimeout(() => {
                        profileCard.classList.add('animate-in');
                    }, 200);
                }
                
                if (skillsSection) {
                    setTimeout(() => {
                        skillsSection.classList.add('animate-in');
                    }, 400);
                }
            }
        });
    }, observerOptions);
    
    observer.observe(aboutSection);
}

// ===== CONSOLE MESSAGE =====
console.log(`
🚀 Welcome to Reshad Ul Karim's Portfolio!
🤖 AI & Robotics Engineer
📚 Published IEEE Researcher
🏆 Mars Rover Team Member

Built with ❤️ using vanilla JavaScript, CSS3, and HTML5
Enhanced with sophisticated animations and interactions
`);

// ===== EXPORT FOR TESTING =====
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initializeWebsite,
        validateForm,
        isValidEmail,
        throttle,
        debounce
    };
}

// ============================================================
// ===== PREMIUM FEATURE UPGRADES (Priority 1-7) =====
// ============================================================

// ===== PRIORITY 1: CUSTOM CURSOR + MAGNETIC BUTTONS =====
function initCustomCursor() {
    // Only on true pointer devices
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    const cursor = document.getElementById('custom-cursor');
    const dot = document.getElementById('cursor-dot');
    if (!cursor || !dot) return;

    let cursorX = window.innerWidth / 2;
    let cursorY = window.innerHeight / 2;
    let dotX = cursorX;
    let dotY = cursorY;

    // Ring follows with lerp for smooth trailing
    function animateCursor() {
        cursorX += (dotX - cursorX) * 0.12;
        cursorY += (dotY - cursorY) * 0.12;
        cursor.style.left = cursorX + 'px';
        cursor.style.top = cursorY + 'px';
        requestAnimationFrame(animateCursor);
    }
    animateCursor();

    document.addEventListener('mousemove', (e) => {
        dotX = e.clientX;
        dotY = e.clientY;
        dot.style.left = dotX + 'px';
        dot.style.top = dotY + 'px';
    });

    // Hover state on interactive elements
    const hoverTargets = document.querySelectorAll(
        'a, button, .btn, .nav-link, .social-link, .project-link, ' +
        '.floating-icon, .skill-category-card, .badge, .stat-item, ' +
        '.gallery-item, .clickable-image, [data-tilt]'
    );
    hoverTargets.forEach(el => {
        el.addEventListener('mouseenter', () => {
            cursor.classList.add('cursor-hover');
            dot.classList.add('cursor-hover');
        });
        el.addEventListener('mouseleave', () => {
            cursor.classList.remove('cursor-hover');
            dot.classList.remove('cursor-hover');
        });
    });

    // Click burst
    document.addEventListener('mousedown', () => cursor.classList.add('cursor-click'));
    document.addEventListener('mouseup', () => cursor.classList.remove('cursor-click'));

    // Hide cursor when leaving window
    document.addEventListener('mouseleave', () => {
        cursor.style.opacity = '0';
        dot.style.opacity = '0';
    });
    document.addEventListener('mouseenter', () => {
        cursor.style.opacity = '1';
        dot.style.opacity = '1';
    });

    // Magnetic buttons — more powerful than old code
    initMagneticButtons();
}

function initMagneticButtons() {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    const magneticEls = document.querySelectorAll('.btn, .social-link, .nav-link');
    magneticEls.forEach(el => {
        el.addEventListener('mousemove', (e) => {
            const rect = el.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            const dx = e.clientX - cx;
            const dy = e.clientY - cy;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const maxDist = Math.max(rect.width, rect.height) * 0.75;

            if (dist < maxDist) {
                const strength = (1 - dist / maxDist) * 0.35;
                el.style.transform = `translate(${dx * strength}px, ${dy * strength}px) scale(1.04)`;
            }
        });
        el.addEventListener('mouseleave', () => {
            el.style.transform = '';
        });
        // Prevent transition during magnetic movement for buttery feel
        el.addEventListener('mouseenter', () => {
            el.style.transition = 'transform 0.05s ease, box-shadow 0.3s ease, background 0.3s ease';
        });
    });
}

// ===== PRIORITY 2: ENHANCED VANILLATILT ON SKILL / STAT / CERT CARDS =====
function initEnhancedVanillaTilt() {
    if (typeof VanillaTilt === 'undefined') return;
    if (window.matchMedia('(hover: none)').matches) return;

    // Skill category cards
    VanillaTilt.init(document.querySelectorAll('.skill-category-card'), {
        max: 8,
        speed: 400,
        glare: true,
        'max-glare': 0.12,
        scale: 1.02,
        gyroscope: false
    });

    // Experience stat cards
    VanillaTilt.init(document.querySelectorAll('.stat-card'), {
        max: 10,
        speed: 400,
        glare: true,
        'max-glare': 0.15,
        scale: 1.03,
        gyroscope: false
    });

    // Certification cards
    VanillaTilt.init(document.querySelectorAll('.cert-card'), {
        max: 7,
        speed: 400,
        glare: true,
        'max-glare': 0.1,
        scale: 1.02,
        gyroscope: false
    });

    // Contact info cards (if any)
    VanillaTilt.init(document.querySelectorAll('.contact-card'), {
        max: 6,
        speed: 400,
        glare: true,
        'max-glare': 0.08,
        scale: 1.01,
        gyroscope: false
    });
}

// ===== PRIORITY 3: HERO MOUSE PARALLAX (MULTI-LAYER DEPTH) =====
function initHeroParallax() {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const hero = document.getElementById('home');
    if (!hero) return;

    // Target dedicated inner parallax layers so we don't clobber the
    // AOS entrance transforms on the outer .hero-text / .hero-image.
    const heroText = hero.querySelector('.hero-text-parallax');
    const heroImage = hero.querySelector('.hero-image-parallax');
    const floatingIcons = hero.querySelectorAll('.floating-icon');
    const avatarContainer = hero.querySelector('.avatar-container');
    const codeAnimation = hero.querySelector('.code-animation');

    let targetX = 0, targetY = 0;
    let currentX = 0, currentY = 0;
    const lerp = 0.08;

    document.addEventListener('mousemove', (e) => {
        const cx = window.innerWidth / 2;
        const cy = window.innerHeight / 2;
        targetX = (e.clientX - cx) / cx;  // -1 to 1
        targetY = (e.clientY - cy) / cy;  // -1 to 1
    });

    function animateParallax() {
        currentX += (targetX - currentX) * lerp;
        currentY += (targetY - currentY) * lerp;

        if (heroText) {
            heroText.style.transform = `translate3d(${currentX * 8}px, ${currentY * 5}px, 0)`;
        }
        if (heroImage) {
            heroImage.style.transform = `translate3d(${-currentX * 14}px, ${-currentY * 10}px, 0)`;
        }
        if (avatarContainer) {
            avatarContainer.style.transform =
                `translate(-50%, -50%) translate3d(${currentX * 20}px, ${currentY * 16}px, 0) rotate(${currentX * 3}deg)`;
        }
        if (codeAnimation) {
            codeAnimation.style.transform = `translate3d(${currentX * -6}px, ${currentY * 4}px, 0)`;
        }
        floatingIcons.forEach((icon, i) => {
            const speed = 12 + i * 6;
            const dir = i % 2 === 0 ? 1 : -1;
            icon.style.transform = `translate3d(${currentX * speed * dir}px, ${currentY * speed}px, 0) rotate(${currentX * 4}deg)`;
        });

        requestAnimationFrame(animateParallax);
    }
    animateParallax();

    // FYI: the existing scroll-based handleParallax() still runs for scroll effects
}

// ===== PRIORITY 4: SKILL BAR SCROLL-TRIGGERED REVEAL =====
function initSkillScrollReveal() {
    const skillCards = document.querySelectorAll('.skill-category-card');
    if (!skillCards.length) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !entry.target.dataset.scrollRevealed) {
                entry.target.dataset.scrollRevealed = 'true';
                entry.target.classList.add('scroll-revealed');

                // Animate progress ring
                const progressCircle = entry.target.querySelector('.progress-circle');
                const progressText = entry.target.querySelector('.progress-text');
                if (progressCircle && progressText) {
                    setTimeout(() => animateProgressCircle(progressCircle, progressText), 200);
                }

                // Animate individual skill bars with stagger
                const skillFills = entry.target.querySelectorAll('.skill-fill');
                skillFills.forEach((fill, index) => {
                    setTimeout(() => {
                        fill.style.transitionDelay = `${index * 80}ms`;
                        fill.style.width = fill.style.getPropertyValue('--width') ||
                            getComputedStyle(fill).getPropertyValue('--width');
                    }, 300 + index * 80);
                });
            }
        });
    }, { threshold: 0.25, rootMargin: '0px 0px -60px 0px' });

    skillCards.forEach(card => observer.observe(card));
}

// ===== PRIORITY 6: SCROLL PROGRESS RING =====
function initScrollProgressRing() {
    const ring = document.getElementById('scroll-progress-ring');
    const fill = document.getElementById('spr-fill');
    if (!ring || !fill) return;

    const circumference = 2 * Math.PI * 20; // r=20 -> 125.66
    fill.style.strokeDasharray = circumference;
    fill.style.strokeDashoffset = circumference;

    function updateRing() {
        const scrollTop = window.pageYOffset;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = docHeight > 0 ? scrollTop / docHeight : 0;
        const offset = circumference - progress * circumference;
        fill.style.strokeDashoffset = offset;
    }

    window.addEventListener('scroll', updateRing, { passive: true });
    updateRing();

    // Click to scroll to top
    ring.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// ============================================================
// ===== AESTHETIC ENHANCEMENT PACK v2.0 =====
// ============================================================

// ===== LENIS SMOOTH SCROLL =====
function initLenis() {
    if (typeof Lenis === 'undefined') return;

    // lerp-based smoothing (frame-rate independent) feels smoother and more
    // responsive than fixed-duration easing — momentum without the lag.
    const lenis = new Lenis({
        lerp: 0.1,
        smoothWheel: true,
        wheelMultiplier: 1,
        touchMultiplier: 1.5,
        infinite: false,
    });

    // Tick Lenis on every RAF
    function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // Pause Lenis when a modal is open (prevents scroll-through)
    const modalObserver = new MutationObserver(() => {
        const anyModalOpen = document.querySelector(
            '.pdf-modal.active, .youtube-modal.active, .image-modal.active'
        );
        if (anyModalOpen) {
            lenis.stop();
        } else {
            lenis.start();
        }
    });
    modalObserver.observe(document.body, { subtree: true, attributes: true, attributeFilter: ['class'] });

    // Smooth anchor scroll via Lenis
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            const target = document.querySelector(anchor.getAttribute('href'));
            if (target) {
                e.preventDefault();
                lenis.scrollTo(target, { offset: -80, duration: 1.2 });
            }
        });
    });

    window._lenis = lenis; // expose for scroll-fade
}

// ===== SPOTLIGHT CARD EFFECT =====
function initSpotlightCards() {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    const cards = document.querySelectorAll(
        '.project-card, .research-area-card, .metric-card, .cert-card'
    );

    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            card.style.setProperty('--sx', x + 'px');
            card.style.setProperty('--sy', y + 'px');
        });
        card.addEventListener('mouseleave', () => {
            card.style.setProperty('--sx', '-200px');
            card.style.setProperty('--sy', '-200px');
        });
    });
}

// ===== HERO SCROLL FADE =====
function initHeroScrollFade() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const heroContent = document.querySelector('.hero-content');
    if (!heroContent) return;

    // Only GPU-composited props (opacity + translateY) — NO blur() filter.
    // Blurring the whole hero subtree on every scroll event was a major jank
    // source. rAF-throttled so we touch the DOM at most once per frame.
    let fadeTicking = false;
    function updateHeroFade() {
        const scrolled = window.pageYOffset;
        const windowHeight = window.innerHeight;

        if (scrolled < windowHeight) {
            const progress = scrolled / (windowHeight * 0.7);
            const opacity = Math.max(0, 1 - progress);
            const yShift = progress * 28;
            heroContent.style.opacity = opacity;
            heroContent.style.transform = `translate3d(0, ${yShift.toFixed(1)}px, 0)`;
        } else {
            heroContent.style.opacity = '0';
        }
    }

    window.addEventListener('scroll', () => {
        if (fadeTicking) return;
        fadeTicking = true;
        requestAnimationFrame(() => { updateHeroFade(); fadeTicking = false; });
    }, { passive: true });
    updateHeroFade();
}

// ===== TEXT SCRAMBLE — MATRIX-STYLE HERO NAME REVEAL =====
function initTextScramble() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const targets = [
        document.querySelector('.hero-title .name-first'),
        document.querySelector('.hero-title .name-last'),
    ].filter(Boolean);

    if (!targets.length) return;

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$!%&?';

    function scrambleElement(el, delayMs) {
        const original = el.textContent;

        setTimeout(() => {
            let iteration = 0;

            const interval = setInterval(() => {
                el.textContent = original
                    .split('')
                    .map((char, i) => {
                        if (char === ' ') return ' ';
                        if (i < Math.floor(iteration)) return original[i];
                        return chars[Math.floor(Math.random() * chars.length)];
                    })
                    .join('');

                iteration += 0.38;

                if (iteration >= original.length) {
                    clearInterval(interval);
                    el.textContent = original;
                }
            }, 28);
        }, delayMs);
    }

    // Fire after AOS fade-in plays (800ms base + stagger between words)
    scrambleElement(targets[0], 900);
    if (targets[1]) scrambleElement(targets[1], 1150);
}

// ===== STAGGERED CARD ENTRANCE =====
function initStaggeredCards() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const groups = [
        { grid: '.projects-grid',          card: '.project-card' },
        { grid: '.experience-grid',        card: '.experience-card' },
        { grid: '.research-metrics',       card: '.metric-card' },
        { grid: '.research-areas-grid',    card: '.research-area-card' },
        { grid: '.cultural-stats',         card: '.stat-card' },
    ];

    groups.forEach(({ grid, card }) => {
        const container = document.querySelector(grid);
        if (!container) return;

        const cards = Array.from(container.querySelectorAll(card));
        if (!cards.length) return;

        // Set initial invisible state
        cards.forEach(c => {
            c.style.opacity = '0';
            c.style.transform = 'translateY(36px) scale(0.96)';
        });

        const reveal = () => {
            cards.forEach((c, i) => {
                setTimeout(() => {
                    c.style.opacity = '1';
                    c.style.transform = 'translateY(0) scale(1)';
                }, i * 90);
            });
        };

        const observer = new IntersectionObserver((entries) => {
            if (!entries[0].isIntersecting) return;
            reveal();
            observer.disconnect();
        }, { threshold: 0.08 });

        observer.observe(container);

        // Fail-safe: if the observer never fires, never leave the cards
        // stuck at opacity:0. Force-reveal after 3s.
        setTimeout(() => {
            if (cards[0] && cards[0].style.opacity === '0') {
                reveal();
                observer.disconnect();
            }
        }, 3000);
    });
}