// DOM Elements
const hamburger = document.querySelector('.hamburger');
const mobileMenu = document.querySelector('.mobile-menu');
const mobileLinks = document.querySelectorAll('.mobile-link');
const navLinks = document.querySelectorAll('.nav-links a, .mobile-link');
const navbar = document.querySelector('.navbar');
const quoteForm = document.getElementById('quote-form');
const stickyCtaButton = document.querySelector('.sticky-cta');

// Mobile Menu Toggle
function toggleMobileMenu() {
    hamburger.classList.toggle('active');
    mobileMenu.classList.toggle('active');
    document.body.style.overflow = mobileMenu.classList.contains('active') ? 'hidden' : 'auto';
}

// Close Mobile Menu
function closeMobileMenu() {
    hamburger.classList.remove('active');
    mobileMenu.classList.remove('active');
    document.body.style.overflow = 'auto';
}

// Smooth Scrolling for Navigation Links
function smoothScroll(targetId) {
    const target = document.querySelector(targetId);
    if (target) {
        const offsetTop = target.offsetTop - 80; // Account for fixed navbar
        window.scrollTo({
            top: offsetTop,
            behavior: 'smooth'
        });
    }
}

// Navbar Scroll Effect
function handleNavbarScroll() {
    if (window.scrollY > 100) {
        navbar.style.padding = '0.5rem 0';
        navbar.style.backdropFilter = 'blur(10px)';
    } else {
        navbar.style.padding = '1rem 0';
        navbar.style.backdropFilter = 'none';
    }
}

// Form Submission Handler
function handleFormSubmission(e) {
    e.preventDefault();

    // Get form data
    const formData = new FormData(quoteForm);
    const data = Object.fromEntries(formData);

    // Basic validation
    if (!data.name || !data.phone || !data.email || !data['move-type']) {
        showNotification('Please fill in all required fields.', 'error');
        return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
        showNotification('Please enter a valid email address.', 'error');
        return;
    }

    // Phone validation (basic)
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    const cleanPhone = data.phone.replace(/[\s\-\(\)]/g, '');
    if (!phoneRegex.test(cleanPhone)) {
        showNotification('Please enter a valid phone number.', 'error');
        return;
    }

    // Simulate form submission
    showNotification('Thank you! We\'ll contact you within 24 hours with your free quote.', 'success');

    // Reset form
    quoteForm.reset();

    // Log data (in real implementation, send to server)
    console.log('Quote Request:', data);
}

// Show Notification
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    // Create notification
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">&times;</button>
        </div>
    `;

    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 1002;
        max-width: 350px;
        animation: slideInRight 0.3s ease;
        font-family: inherit;
    `;

    // Add notification styles to head if not exists
    if (!document.querySelector('#notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            .notification-content {
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 1rem;
            }
            .notification-close {
                background: none;
                border: none;
                color: white;
                font-size: 1.5rem;
                cursor: pointer;
                padding: 0;
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: background-color 0.2s;
            }
            .notification-close:hover {
                background-color: rgba(255,255,255,0.2);
            }
        `;
        document.head.appendChild(style);
    }

    document.body.appendChild(notification);

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Sticky CTA Animation
function animateStickyButton() {
    const scrolled = window.scrollY;
    const rate = scrolled * -0.02;

    if (stickyCtaButton) {
        stickyCtaButton.style.transform = `translateY(${rate}px) scale(${1 + Math.sin(scrolled * 0.01) * 0.05})`;
    }
}

// Intersection Observer for Animations
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animation = 'fadeInUp 0.8s ease forwards';
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe elements for animation
    const animatedElements = document.querySelectorAll('.service-card, .feature-card, .tip-card');
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        observer.observe(el);
    });
}

// Initialize Particle Background (Optional Enhancement)
function initParticleBackground() {
    const hero = document.querySelector('.hero');
    const particleCount = 50;

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.cssText = `
            position: absolute;
            width: 2px;
            height: 2px;
            background: rgba(255, 215, 0, 0.3);
            border-radius: 50%;
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            animation: float ${3 + Math.random() * 4}s ease-in-out infinite;
            animation-delay: ${Math.random() * 2}s;
        `;
        hero.appendChild(particle);
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    // Mobile menu toggle
    if (hamburger) {
        hamburger.addEventListener('click', toggleMobileMenu);
    }

    // Close mobile menu when clicking on links
    mobileLinks.forEach(link => {
        link.addEventListener('click', closeMobileMenu);
    });

    // Smooth scrolling for all navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId.startsWith('#')) {
                smoothScroll(targetId);
                closeMobileMenu();
            }
        });
    });

    // Form submission
    if (quoteForm) {
        quoteForm.addEventListener('submit', handleFormSubmission);
    }

    // Scroll events
    window.addEventListener('scroll', function() {
        handleNavbarScroll();
        animateStickyButton();
    });

    // Close mobile menu on window resize
    window.addEventListener('resize', function() {
        if (window.innerWidth > 1024) {
            closeMobileMenu();
        }
    });

    // Initialize animations
    initScrollAnimations();

    // Initialize particle background (optional)
    // initParticleBackground();

    // Close mobile menu when clicking outside
    document.addEventListener('click', function(e) {
        if (mobileMenu.classList.contains('active') &&
            !mobileMenu.contains(e.target) &&
            !hamburger.contains(e.target)) {
            closeMobileMenu();
        }
    });

    // Keyboard navigation for mobile menu
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && mobileMenu.classList.contains('active')) {
            closeMobileMenu();
        }
    });

    // Initialize date picker with minimum date as today
    const dateInput = document.getElementById('move-date');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.setAttribute('min', today);
    }
});

// Utility Functions
function formatPhoneNumber(phone) {
    const cleaned = phone.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
        return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    return phone;
}

function validateZipCode(zip) {
    return /^\d{5}(-\d{4})?$/.test(zip);
}

// Add phone number formatting on input
document.addEventListener('DOMContentLoaded', function() {
    const phoneInput = document.getElementById('phone');
    if (phoneInput) {
        phoneInput.addEventListener('input', function(e) {
            e.target.value = formatPhoneNumber(e.target.value);
        });
    }

    // Add zip code validation
    const zipInputs = document.querySelectorAll('#from-zip, #to-zip');
    zipInputs.forEach(input => {
        input.addEventListener('blur', function(e) {
            if (e.target.value && !validateZipCode(e.target.value)) {
                e.target.style.borderColor = '#f44336';
                showNotification('Please enter a valid zip code (e.g., 12345 or 12345-6789)', 'error');
            } else {
                e.target.style.borderColor = '#e1e8ed';
            }
        });
    });
});

// Performance optimization - Throttle scroll events
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
    }
}

// Apply throttling to scroll events
window.addEventListener('scroll', throttle(function() {
    handleNavbarScroll();
    animateStickyButton();
}, 16)); // ~60fps