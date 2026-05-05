/**
 * DOKTER POOL - Main JavaScript
 * Frontend functionality for the website
 */

// API Base URL
const API_BASE_URL = '';

// DOM Ready
document.addEventListener('DOMContentLoaded', function() {
    initNavigation();
    loadDynamicContent();
    initContactForm();
    initSmoothScroll();
});

// Navigation
function initNavigation() {
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (navToggle) {
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            navToggle.classList.toggle('active');
        });
    }
    
    // Close menu on link click
    const navLinks = document.querySelectorAll('.nav-menu a');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
            navToggle.classList.remove('active');
        });
    });
    
    // Navbar scroll effect
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                navbar.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.1)';
            } else {
                navbar.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
            }
        });
    }
    
    // Active nav link
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    navLinks.forEach(link => {
        const linkPage = link.getAttribute('href');
        if (linkPage === currentPage || 
            (currentPage === '' && linkPage === 'index.html') ||
            (currentPage === '/' && linkPage === 'index.html')) {
            link.classList.add('active');
        }
    });
}

// Smooth scroll for anchor links
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Load dynamic content from API
async function loadDynamicContent() {
    // Load settings
    await loadSettings();
    
    // Load content based on page
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    switch(currentPage) {
        case 'index.html':
        case '':
        case '/':
            await loadHomepageContent();
            await loadServicesPreview();
            await loadBlogPreview();
            break;
        case 'services.html':
            await loadServices();
            break;
        case 'gallery.html':
            await loadGallery();
            break;
        case 'blog.html':
            await loadBlogPosts();
            break;
        case 'about.html':
            await loadAboutContent();
            break;
        case 'contact.html':
            await loadContactContent();
            break;
    }
}

// Load settings
async function loadSettings() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/settings`);
        if (!response.ok) return;
        
        const settings = await response.json();
        
        // Update company info in footer and contact page
        updateCompanyInfo(settings);
        
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

// Update company information
function updateCompanyInfo(settings) {
    // Update footer company name
    const footerCompanyName = document.querySelector('.footer-brand .logo-text');
    if (footerCompanyName && settings.company_name) {
        footerCompanyName.textContent = settings.company_name;
    }
    
    // Update footer address
    const footerAddress = document.querySelector('.footer-address');
    if (footerAddress && settings.company_address) {
        footerAddress.textContent = settings.company_address;
    }
    
    // Update footer phone
    const footerPhone = document.querySelector('.footer-phone');
    if (footerPhone && settings.company_phone) {
        footerPhone.textContent = settings.company_phone;
    }
    
    // Update footer email
    const footerEmail = document.querySelector('.footer-email');
    if (footerEmail && settings.company_email) {
        footerEmail.textContent = settings.company_email;
    }
    
    // Update social links
    if (settings.facebook_url) {
        const fbLink = document.querySelector('a[href*="facebook"]');
        if (fbLink) fbLink.href = settings.facebook_url;
    }
    if (settings.instagram_url) {
        const igLink = document.querySelector('a[href*="instagram"]');
        if (igLink) igLink.href = settings.instagram_url;
    }
    if (settings.youtube_url) {
        const ytLink = document.querySelector('a[href*="youtube"]');
        if (ytLink) ytLink.href = settings.youtube_url;
    }
}

// Load homepage content
async function loadHomepageContent() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/content/home`);
        if (!response.ok) return;
        
        const content = await response.json();
        
        // Update hero section
        const heroTitle = document.querySelector('.hero h1');
        const heroDesc = document.querySelector('.hero p');
        
        if (heroTitle && content.title) {
            heroTitle.textContent = content.title;
        }
        if (heroDesc && content.content) {
            heroDesc.textContent = content.content;
        }
        
        // Update meta tags
        updateMetaTags(content);
        
    } catch (error) {
        console.error('Error loading homepage content:', error);
    }
}

// Load services preview (homepage)
async function loadServicesPreview() {
    const container = document.querySelector('.services-grid');
    if (!container) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/services`);
        if (!response.ok) return;
        
        const services = await response.json();
        
        if (services.length === 0) return;
        
        container.innerHTML = services.slice(0, 4).map(service => `
            <div class="service-card">
                <div class="service-icon">
                    <i class="fas fa-${service.icon || 'swimming-pool'}"></i>
                </div>
                <h3>${service.title}</h3>
                <p>${service.description}</p>
                <a href="services.html" class="read-more">
                    Pelajari Lebih Lanjut <i class="fas fa-arrow-right"></i>
                </a>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading services preview:', error);
    }
}

// Load all services (services page)
async function loadServices() {
    const container = document.querySelector('.services-grid');
    if (!container) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/services`);
        if (!response.ok) return;
        
        const services = await response.json();
        
        if (services.length === 0) {
            container.innerHTML = '<p class="text-center">Tidak ada layanan tersedia.</p>';
            return;
        }
        
        container.innerHTML = services.map(service => `
            <div class="service-card">
                <div class="service-icon">
                    <i class="fas fa-${service.icon || 'swimming-pool'}"></i>
                </div>
                <h3>${service.title}</h3>
                <p>${service.description}</p>
                <div class="service-content">
                    ${service.content || ''}
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading services:', error);
        container.innerHTML = '<p class="text-center">Gagal memuat layanan.</p>';
    }
}

// Load blog preview (homepage)
async function loadBlogPreview() {
    const container = document.querySelector('.blog-grid');
    if (!container) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/articles?limit=3`);
        if (!response.ok) return;
        
        const articles = await response.json();
        
        if (articles.length === 0) return;
        
        container.innerHTML = articles.map(article => `
            <article class="blog-card">
                <div class="blog-image">
                    <img src="${article.featured_image || '/uploads/blog/default.jpg'}" 
                         alt="${article.title}" 
                         loading="lazy">
                </div>
                <div class="blog-content">
                    <div class="blog-meta">
                        <span><i class="far fa-calendar"></i> ${formatDate(article.published_at || article.created_at)}</span>
                    </div>
                    <h3>${article.title}</h3>
                    <p>${article.excerpt || stripHtml(article.content).substring(0, 150)}...</p>
                    <a href="blog.html?slug=${article.slug}" class="read-more">
                        Baca Selengkapnya <i class="fas fa-arrow-right"></i>
                    </a>
                </div>
            </article>
        `).join('');
        
    } catch (error) {
        console.error('Error loading blog preview:', error);
    }
}

// Load all blog posts (blog page)
async function loadBlogPosts() {
    const container = document.querySelector('.blog-grid');
    const articleContainer = document.querySelector('.article-content');
    
    // Check if viewing single article
    const urlParams = new URLSearchParams(window.location.search);
    const slug = urlParams.get('slug');
    
    if (slug && articleContainer) {
        // Load single article
        try {
            const response = await fetch(`${API_BASE_URL}/api/articles/slug/${slug}`);
            if (!response.ok) throw new Error('Article not found');
            
            const article = await response.json();
            
            // Hide blog list, show article
            const blogSection = document.querySelector('.blog-list');
            if (blogSection) blogSection.style.display = 'none';
            
            articleContainer.innerHTML = `
                <article>
                    <header class="article-header">
                        <nav class="breadcrumb">
                            <a href="index.html">Beranda</a>
                            <span class="breadcrumb-separator">/</span>
                            <a href="blog.html">Blog</a>
                            <span class="breadcrumb-separator">/</span>
                            <span class="breadcrumb-current">${article.title}</span>
                        </nav>
                        <h1>${article.title}</h1>
                        <div class="article-meta">
                            <span><i class="far fa-calendar"></i> ${formatDate(article.published_at || article.created_at)}</span>
                            <span><i class="far fa-user"></i> Admin</span>
                        </div>
                    </header>
                    ${article.featured_image ? `
                        <div class="article-image">
                            <img src="${article.featured_image}" alt="${article.title}">
                        </div>
                    ` : ''}
                    <div class="article-body">
                        ${article.content}
                    </div>
                    <div class="article-footer">
                        <a href="blog.html" class="btn btn-secondary">
                            <i class="fas fa-arrow-left"></i> Kembali ke Blog
                        </a>
                    </div>
                </article>
            `;
            
            // Update meta tags
            updateMetaTags({
                meta_title: article.meta_title || article.title,
                meta_description: article.meta_description || article.excerpt,
                keywords: article.keywords
            });
            
        } catch (error) {
            console.error('Error loading article:', error);
            articleContainer.innerHTML = '<p class="text-center">Artikel tidak ditemukan.</p>';
        }
        return;
    }
    
    // Load blog list
    if (!container) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/articles?limit=9`);
        if (!response.ok) return;
        
        const articles = await response.json();
        
        if (articles.length === 0) {
            container.innerHTML = '<p class="text-center">Belum ada artikel.</p>';
            return;
        }
        
        container.innerHTML = articles.map(article => `
            <article class="blog-card">
                <div class="blog-image">
                    <img src="${article.featured_image || '/uploads/blog/default.jpg'}" 
                         alt="${article.title}" 
                         loading="lazy">
                </div>
                <div class="blog-content">
                    <div class="blog-meta">
                        <span><i class="far fa-calendar"></i> ${formatDate(article.published_at || article.created_at)}</span>
                    </div>
                    <h3>${article.title}</h3>
                    <p>${article.excerpt || stripHtml(article.content).substring(0, 150)}...</p>
                    <a href="blog.html?slug=${article.slug}" class="read-more">
                        Baca Selengkapnya <i class="fas fa-arrow-right"></i>
                    </a>
                </div>
            </article>
        `).join('');
        
    } catch (error) {
        console.error('Error loading blog posts:', error);
        container.innerHTML = '<p class="text-center">Gagal memuat artikel.</p>';
    }
}

// Load gallery
async function loadGallery() {
    const container = document.querySelector('.gallery-grid');
    if (!container) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/gallery`);
        if (!response.ok) return;
        
        const images = await response.json();
        
        if (images.length === 0) {
            container.innerHTML = '<p class="text-center">Belum ada foto galeri.</p>';
            return;
        }
        
        container.innerHTML = images.map(img => `
            <div class="gallery-item">
                <img src="${img.image_path}" alt="${img.title}" loading="lazy">
                <div class="gallery-overlay">
                    <h4>${img.title}</h4>
                    <p>${img.location || ''} ${img.year ? `(${img.year})` : ''}</p>
                    ${img.pool_type ? `<p><small>${img.pool_type}</small></p>` : ''}
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading gallery:', error);
        container.innerHTML = '<p class="text-center">Gagal memuat galeri.</p>';
    }
}

// Load about content
async function loadAboutContent() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/content/about`);
        if (!response.ok) return;
        
        const content = await response.json();
        
        const aboutText = document.querySelector('.about-text');
        if (aboutText && content.content) {
            aboutText.innerHTML = content.content;
        }
        
        // Update meta tags
        updateMetaTags(content);
        
    } catch (error) {
        console.error('Error loading about content:', error);
    }
}

// Load contact content
async function loadContactContent() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/content/contact`);
        if (!response.ok) return;
        
        const content = await response.json();
        
        // Update meta tags
        updateMetaTags(content);
        
    } catch (error) {
        console.error('Error loading contact content:', error);
    }
}

// Initialize contact form
function initContactForm() {
    const form = document.getElementById('contactForm');
    if (!form) return;
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);
        
        // Simple validation
        if (!data.name || !data.email || !data.message) {
            showAlert('Harap isi semua field yang wajib diisi.', 'error');
            return;
        }
        
        // Show loading
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner" style="width: 20px; height: 20px; border-width: 2px;"></span> Mengirim...';
        
        // Simulate sending (replace with actual API call)
        setTimeout(() => {
            showAlert('Terima kasih! Pesan Anda telah terkirim. Kami akan menghubungi Anda segera.', 'success');
            form.reset();
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }, 1500);
    });
}

// Update meta tags
function updateMetaTags(content) {
    if (content.meta_title) {
        document.title = content.meta_title;
    }
    
    if (content.meta_description) {
        let metaDesc = document.querySelector('meta[name="description"]');
        if (!metaDesc) {
            metaDesc = document.createElement('meta');
            metaDesc.name = 'description';
            document.head.appendChild(metaDesc);
        }
        metaDesc.content = content.meta_description;
    }
    
    if (content.keywords) {
        let metaKeywords = document.querySelector('meta[name="keywords"]');
        if (!metaKeywords) {
            metaKeywords = document.createElement('meta');
            metaKeywords.name = 'keywords';
            document.head.appendChild(metaKeywords);
        }
        metaKeywords.content = content.keywords;
    }
}

// Show alert
function showAlert(message, type = 'success') {
    const existingAlert = document.querySelector('.alert');
    if (existingAlert) {
        existingAlert.remove();
    }
    
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    
    const form = document.getElementById('contactForm');
    if (form) {
        form.insertBefore(alert, form.firstChild);
    }
    
    setTimeout(() => {
        alert.remove();
    }, 5000);
}

// Utility: Format date
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Utility: Strip HTML tags
function stripHtml(html) {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
}

// Utility: Debounce
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

// Export functions for use in other scripts
window.DokterPool = {
    loadSettings,
    loadServices,
    loadGallery,
    loadBlogPosts,
    formatDate,
    stripHtml,
    showAlert
};