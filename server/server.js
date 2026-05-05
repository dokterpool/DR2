const express = require('express');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const multer = require('multer');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const SITE_URL = process.env.SITE_URL || 'https://dokterpool.com';

// Enable gzip compression
app.use(compression());

// Middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com", "https://unpkg.com"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://cdn.tiny.cloud", "https://unpkg.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
            imgSrc: ["'self'", "data:", "blob:", "https:"],
            connectSrc: ["'self'"],
        },
    },
}));

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cache control for static assets
const cacheControl = (maxAge) => (req, res, next) => {
    res.setHeader('Cache-Control', `public, max-age=${maxAge}`);
    next();
};

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'dokterpool-secret-key-2024',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000
    }
}));

// Static files with caching
app.use(express.static(path.join(__dirname, '../public'), { maxAge: '1h' }));
app.use('/admin', express.static(path.join(__dirname, '../admin'), { maxAge: '1h' }));
app.use('/css', cacheControl(86400), express.static(path.join(__dirname, '../css')));
app.use('/js', cacheControl(86400), express.static(path.join(__dirname, '../js')));
app.use('/uploads', cacheControl(604800), express.static(path.join(__dirname, '../uploads')));

// Database connection
const db = require('./db');

// Multer configuration for file uploads
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => ({
        folder: `dokterpool/${req.params.type || 'general'}` ,
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp']
    })
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        }
        cb(new Error('Only image files are allowed'));
    }
});

// Authentication middleware
const requireAuth = (req, res, next) => {
    if (req.session && req.session.userId) {
        next();
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
};

// ============ PROJECT DETAIL PAGE ROUTE ============
app.get('/project/:slug', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/project.html'));
});

// ============ SITEMAP GENERATION ============
app.get('/sitemap.xml', async (req, res) => {
    const baseUrl = SITE_URL;
    const today = new Date().toISOString().split('T')[0];

    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
        <loc>${baseUrl}/</loc>
        <lastmod>${today}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>1.0</priority>
    </url>
    <url>
        <loc>${baseUrl}/services.html</loc>
        <lastmod>${today}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.8</priority>
    </url>
    <url>
        <loc>${baseUrl}/gallery.html</loc>
        <lastmod>${today}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.9</priority>
    </url>
    <url>
        <loc>${baseUrl}/blog.html</loc>
        <lastmod>${today}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.7</priority>
    </url>
    <url>
        <loc>${baseUrl}/about.html</loc>
        <lastmod>${today}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.6</priority>
    </url>
    <url>
        <loc>${baseUrl}/contact.html</loc>
        <lastmod>${today}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.8</priority>
    </url>`;

    // Add project pages
    const projects = await new Promise((resolve, reject) => {
        db.all('SELECT slug, updated_at FROM projects ORDER BY created_at DESC', [], (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });

    projects.forEach(project => {
        const lastmod = project.updated_at ? project.updated_at.split('T')[0] : today;
        sitemap += `
    <url>
        <loc>${baseUrl}/project/${project.slug}</loc>
        <lastmod>${lastmod}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.8</priority>
    </url>`;
    });

    // Add blog articles
    const articles = await new Promise((resolve, reject) => {
        db.all('SELECT slug, updated_at FROM articles WHERE status = "published" ORDER BY published_at DESC', [], (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });

    articles.forEach(article => {
        const lastmod = article.updated_at ? article.updated_at.split('T')[0] : today;
        sitemap += `
    <url>
        <loc>${baseUrl}/blog.html?slug=${article.slug}</loc>
        <lastmod>${lastmod}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.6</priority>
    </url>`;
    });

    sitemap += '\n</urlset>';

    res.setHeader('Content-Type', 'application/xml');
    res.send(sitemap);
});

// ============ AUTH ROUTES ============

app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isValid = await bcrypt.compare(password, user.password);

        if (!isValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        req.session.userId = user.id;
        req.session.username = user.username;

        res.json({
            success: true,
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            }
        });
    });
});

app.post('/api/auth/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

app.get('/api/auth/status', (req, res) => {
    if (req.session && req.session.userId) {
        res.json({
            authenticated: true,
            user: {
                id: req.session.userId,
                username: req.session.username
            }
        });
    } else {
        res.json({ authenticated: false });
    }
});

// ============ SETTINGS ROUTES ============

app.get('/api/settings', (req, res) => {
    db.all('SELECT * FROM settings', [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        const settings = {};
        rows.forEach(row => {
            settings[row.key] = row.value;
        });
        res.json(settings);
    });
});

app.post('/api/settings', requireAuth, (req, res) => {
    const settings = req.body;

    const stmt = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP');

    Object.entries(settings).forEach(([key, value]) => {
        stmt.run(key, value);
    });

    stmt.finalize((err) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to update settings' });
        }
        res.json({ success: true });
    });
});

// ============ PROJECTS ROUTES ============

// Get all projects (public)
app.get('/api/projects', (req, res) => {
    const { featured, limit = 50 } = req.query;
    let query = 'SELECT * FROM projects';
    const params = [];

    if (featured === 'true') {
        query += ' WHERE is_featured = 1';
    }

    query += ' ORDER BY is_featured DESC, display_order, created_at DESC LIMIT ?';
    params.push(parseInt(limit));

    db.all(query, params, (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(rows);
    });
});

// Get single project by slug with images
app.get('/api/projects/slug/:slug', (req, res) => {
    db.get('SELECT * FROM projects WHERE slug = ?', [req.params.slug], (err, project) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        // Get project images
        db.all('SELECT * FROM project_images WHERE project_id = ? ORDER BY display_order, id', [project.id], (err, images) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }

            project.images = images || [];
            project.beforeImages = images?.filter(img => img.is_before) || [];
            project.afterImages = images?.filter(img => img.is_after) || [];
            project.galleryImages = images?.filter(img => !img.is_before && !img.is_after) || [];

            res.json(project);
        });
    });
});

// Get single project by ID (protected)
app.get('/api/projects/:id', requireAuth, (req, res) => {
    db.get('SELECT * FROM projects WHERE id = ?', [req.params.id], (err, project) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        db.all('SELECT * FROM project_images WHERE project_id = ? ORDER BY display_order, id', [project.id], (err, images) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            project.images = images || [];
            res.json(project);
        });
    });
});

// Create project (protected)
app.post('/api/projects', requireAuth, (req, res) => {
    const { title, slug, location, pool_type, year, description, specifications, featured_image, is_featured, has_before_after, meta_title, meta_description } = req.body;

    db.run(`
        INSERT INTO projects (title, slug, location, pool_type, year, description, specifications, featured_image, is_featured, has_before_after, meta_title, meta_description)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [title, slug, location, pool_type, year || null, description, specifications, featured_image || null, is_featured || 0, has_before_after || 0, meta_title, meta_description], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Failed to create project' });
        }
        res.json({ success: true, id: this.lastID });
    });
});

// Update project (protected)
app.put('/api/projects/:id', requireAuth, (req, res) => {
    const { title, slug, location, pool_type, year, description, specifications, featured_image, is_featured, has_before_after, meta_title, meta_description } = req.body;

    db.run(`
        UPDATE projects SET
            title = ?,
            slug = ?,
            location = ?,
            pool_type = ?,
            year = ?,
            description = ?,
            specifications = ?,
            featured_image = ?,
            is_featured = ?,
            has_before_after = ?,
            meta_title = ?,
            meta_description = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `, [title, slug, location, pool_type, year || null, description, specifications, featured_image || null, is_featured, has_before_after, meta_title, meta_description, req.params.id], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Failed to update project' });
        }
        res.json({ success: true });
    });
});

// Delete project (protected)
app.delete('/api/projects/:id', requireAuth, (req, res) => {
    db.all('SELECT image_path FROM project_images WHERE project_id = ?', [req.params.id], (err, images) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }

        // Delete all project image files
        images.forEach(img => {
            if (img.image_path) {
                const imagePath = path.join(__dirname, '..', img.image_path);
                if (fs.existsSync(imagePath)) {
                    fs.unlinkSync(imagePath);
                }
            }
        });

        db.run('DELETE FROM projects WHERE id = ?', [req.params.id], function(err) {
            if (err) {
                return res.status(500).json({ error: 'Failed to delete project' });
            }
            res.json({ success: true });
        });
    });
});

// ============ PROJECT IMAGES ROUTES ============

// Add image to project via JSON (for CMS image path saving)
app.post('/api/projects/:id/images-json', requireAuth, (req, res) => {
    const { image_path, caption, is_before, is_after, display_order } = req.body;
    
    if (!image_path) {
        return res.status(400).json({ error: 'image_path is required' });
    }

    db.run(`
        INSERT INTO project_images (project_id, image_path, caption, is_before, is_after, display_order)
        VALUES (?, ?, ?, ?, ?, ?)
    `, [req.params.id, image_path, caption || '', is_before || 0, is_after || 0, display_order || 0], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Failed to add image' });
        }
        res.json({ success: true, id: this.lastID, path: image_path });
    });
});

// Add image to project via file upload
app.post('/api/projects/:id/images', requireAuth, upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const { caption, is_before, is_after, display_order } = req.body;
    const imagePath = req.file.path;

    db.run(`
        INSERT INTO project_images (project_id, image_path, caption, is_before, is_after, display_order)
        VALUES (?, ?, ?, ?, ?, ?)
    `, [req.params.id, imagePath, caption || '', is_before || 0, is_after || 0, display_order || 0], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Failed to add image' });
        }
        res.json({ success: true, id: this.lastID, path: imagePath });
    });
});

// Update project image metadata (protected)
app.put('/api/project-images/:id', requireAuth, (req, res) => {
    const { caption, is_before, is_after, display_order } = req.body;

    db.run(`
        UPDATE project_images SET
            caption = ?,
            is_before = ?,
            is_after = ?,
            display_order = ?
        WHERE id = ?
    `, [caption || '', is_before || 0, is_after || 0, display_order || 0, req.params.id], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Failed to update image' });
        }
        res.json({ success: true });
    });
});

// Delete project image (protected)
app.delete('/api/project-images/:id', requireAuth, (req, res) => {
    db.get('SELECT image_path FROM project_images WHERE id = ?', [req.params.id], (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }

        if (row && row.image_path) {
            const imagePath = path.join(__dirname, '..', row.image_path);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        db.run('DELETE FROM project_images WHERE id = ?', [req.params.id], function(err) {
            if (err) {
                return res.status(500).json({ error: 'Failed to delete image' });
            }
            res.json({ success: true });
        });
    });
});

// Set featured image for project
app.put('/api/projects/:id/featured-image', requireAuth, (req, res) => {
    const { featured_image } = req.body;
    
    db.run('UPDATE projects SET featured_image = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', 
        [featured_image || null, req.params.id], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Failed to update featured image' });
        }
        res.json({ success: true });
    });
});

// Reorder project images
app.put('/api/projects/:id/reorder-images', requireAuth, (req, res) => {
    const { image_orders } = req.body;
    
    if (!Array.isArray(image_orders)) {
        return res.status(400).json({ error: 'image_orders must be an array' });
    }

    const stmt = db.prepare('UPDATE project_images SET display_order = ? WHERE id = ?');
    image_orders.forEach(({ id, order }) => {
        stmt.run(order, id);
    });
    stmt.finalize((err) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to reorder images' });
        }
        res.json({ success: true });
    });
});

// ============ ARTICLES/BLOG ROUTES ============

app.get('/api/articles', (req, res) => {
    const { status, limit = 10, offset = 0 } = req.query;
    let query = 'SELECT * FROM articles';
    let params = [];

    if (!req.session.userId) {
        query += ' WHERE status = "published"';
    } else if (status) {
        query += ' WHERE status = ?';
        params.push(status);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    db.all(query, params, (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(rows);
    });
});

app.get('/api/articles/slug/:slug', (req, res) => {
    db.get('SELECT * FROM articles WHERE slug = ?', [req.params.slug], (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        if (!row) {
            return res.status(404).json({ error: 'Article not found' });
        }
        if (row.status !== 'published' && !req.session.userId) {
            return res.status(404).json({ error: 'Article not found' });
        }
        res.json(row);
    });
});

app.post('/api/articles', requireAuth, (req, res) => {
    const { title, slug, content, excerpt, featured_image, meta_title, meta_description, keywords, status } = req.body;

    const publishedAt = status === 'published' ? new Date().toISOString() : null;

    db.run(`
        INSERT INTO articles (title, slug, content, excerpt, featured_image, meta_title, meta_description, keywords, status, published_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [title, slug, content, excerpt, featured_image, meta_title, meta_description, keywords, status || 'draft', publishedAt], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Failed to create article' });
        }
        res.json({ success: true, id: this.lastID });
    });
});

app.put('/api/articles/:id', requireAuth, (req, res) => {
    const { title, slug, content, excerpt, featured_image, meta_title, meta_description, keywords, status } = req.body;

    db.get('SELECT status, published_at FROM articles WHERE id = ?', [req.params.id], (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }

        let publishedAt = row.published_at;
        if (status === 'published' && row.status !== 'published') {
            publishedAt = new Date().toISOString();
        }

        db.run(`
            UPDATE articles SET
                title = ?,
                slug = ?,
                content = ?,
                excerpt = ?,
                featured_image = ?,
                meta_title = ?,
                meta_description = ?,
                keywords = ?,
                status = ?,
                published_at = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [title, slug, content, excerpt, featured_image, meta_title, meta_description, keywords, status, publishedAt, req.params.id], function(err) {
            if (err) {
                return res.status(500).json({ error: 'Failed to update article' });
            }
            res.json({ success: true });
        });
    });
});

app.delete('/api/articles/:id', requireAuth, (req, res) => {
    db.get('SELECT featured_image FROM articles WHERE id = ?', [req.params.id], (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }

        if (row && row.featured_image) {
            const imagePath = path.join(__dirname, '..', row.featured_image);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        db.run('DELETE FROM articles WHERE id = ?', [req.params.id], function(err) {
            if (err) {
                return res.status(500).json({ error: 'Failed to delete article' });
            }
            res.json({ success: true });
        });
    });
});

// ============ SERVICES ROUTES ============

app.get('/api/services', (req, res) => {
    db.all('SELECT * FROM services WHERE is_active = 1 ORDER BY display_order', [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(rows);
    });
});

// ============ SEO SETTINGS ROUTES ============

app.get('/api/seo/:pageKey', (req, res) => {
    db.get('SELECT * FROM seo_settings WHERE page_key = ?', [req.params.pageKey], (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(row || {});
    });
});

app.post('/api/seo/:pageKey', requireAuth, (req, res) => {
    const { meta_title, meta_description, og_title, og_description, og_image, schema_markup, canonical_url } = req.body;

    db.run(`
        INSERT INTO seo_settings (page_key, meta_title, meta_description, og_title, og_description, og_image, schema_markup, canonical_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(page_key) DO UPDATE SET
            meta_title = excluded.meta_title,
            meta_description = excluded.meta_description,
            og_title = excluded.og_title,
            og_description = excluded.og_description,
            og_image = excluded.og_image,
            schema_markup = excluded.schema_markup,
            canonical_url = excluded.canonical_url,
            updated_at = CURRENT_TIMESTAMP
    `, [req.params.pageKey, meta_title, meta_description, og_title, og_description, og_image, schema_markup, canonical_url], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Failed to update SEO settings' });
        }
        res.json({ success: true });
    });
});

// ============ FILE UPLOAD ROUTES ============

app.post('/api/upload/:type', requireAuth, upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const relativePath = req.file.path;
    res.json({
        success: true,
        path: relativePath,
        filename: req.file.filename
    });
});

// ============ AI ASSISTANCE ROUTES ============

app.post('/api/ai/generate-ideas', requireAuth, async (req, res) => {
    const { topic, count = 5 } = req.body;

    const poolTopics = [
        'Cara Membersihkan Kolam Renang Secara Rutin',
        'Tips Menjaga Kualitas Air Kolam Renang',
        'Panduan Lengkap Perawatan Kolam Renang Musim Hujan',
        'Cara Mengatasi Air Kolam Keruh dan Berbusa',
        'Pemilihan Chlorine Terbaik untuk Kolam Renang',
        'Maintenance Equipment Kolam Renang: Pompa dan Filter',
        'Cara Mengatasi Kolam Renang Bocor',
        'Renovasi Kolam Renang: Kapan dan Mengapa',
        'Perawatan Kolam Renang untuk Hotel dan Apartemen',
        'DIY vs Professional: Kapan Harus Panggil Ahli Kolam',
        'Cara Menghitung Biaya Perawatan Kolam Renang Bulanan',
        'Tips Menghemat Biaya Perawatan Kolam Renang',
        'Perbedaan Kolam Renang Garam dan Chlorine',
        'Cara Mengatasi Lumut di Dinding Kolam Renang',
        'Panduan Memilih Jasa Perawatan Kolam Renang Terpercaya'
    ];

    let ideas = poolTopics;
    if (topic) {
        ideas = poolTopics.filter(t =>
            t.toLowerCase().includes(topic.toLowerCase())
        );
    }

    ideas = ideas.sort(() => 0.5 - Math.random()).slice(0, parseInt(count));

    res.json({
        success: true,
        ideas: ideas.map((title, i) => ({
            id: i + 1,
            title,
            slug: title.toLowerCase()
                .replace(/[^a-z0-9\s]/g, '')
                .replace(/\s+/g, '-')
        }))
    });
});

app.post('/api/ai/generate-outline', requireAuth, (req, res) => {
    const { title } = req.body;

    const outline = {
        title: title || 'Artikel Perawatan Kolam Renang',
        sections: [
            {
                heading: 'Pendahuluan',
                points: [
                    'Pentingnya perawatan kolam renang yang rutin',
                    'Dampak tidak merawat kolam renang',
                    'Ringkasan topik yang akan dibahas'
                ]
            },
            {
                heading: 'Manfaat Perawatan Rutin',
                points: [
                    'Air tetap jernih dan sehat',
                    'Meningkatkan umur pakai kolam',
                    'Menghemat biaya perbaikan di masa depan'
                ]
            },
            {
                heading: 'Langkah-langkah Perawatan',
                points: [
                    'Pembersihan fisik (skimming, vacuuming)',
                    'Pengecekan kualitas air',
                    'Penambahan bahan kimia yang tepat',
                    'Pembersihan filter dan equipment'
                ]
            },
            {
                heading: 'Jadwal Perawatan yang Tepat',
                points: [
                    'Perawatan harian',
                    'Perawatan mingguan',
                    'Perawatan bulanan',
                    'Perawatan musiman'
                ]
            },
            {
                heading: 'Kesimpulan',
                points: [
                    'Ringkasan poin penting',
                    'Call to action',
                    'Informasi kontak untuk layanan profesional'
                ]
            }
        ]
    };

    res.json({ success: true, outline });
});

app.post('/api/ai/generate-article', requireAuth, (req, res) => {
    const { title, keywords, tone = 'professional' } = req.body;

    const articleTitle = title || 'Panduan Lengkap Perawatan Kolam Renang';
    const keywordList = keywords ? keywords.split(',').map(k => k.trim()) : ['perawatan kolam renang', 'tips kolam renang'];

    const content = `
<h1>${articleTitle}</h1>

<p>Kolam renang yang terawat dengan baik tidak hanya menyenangkan untuk digunakan, tetapi juga penting untuk kesehatan dan keamanan penggunanya. Dalam artikel ini, kami akan membahas ${keywordList.join(', ')} secara lengkap dan praktis.</p>

<h2>Mengapa Perawatan Kolam Renang Penting?</h2>

<p>Perawatan kolam renang yang rutin adalah investasi jangka panjang yang memberikan banyak manfaat:</p>

<ul>
<li><strong>Air yang sehat dan bersih</strong> - Mencegah pertumbuhan bakteri dan algae</li>
<li><strong>Equipment yang awet</strong> - Pompa, filter, dan heater berfungsi optimal lebih lama</li>
<li><strong>Penghematan biaya</strong> - Mencegah kerusakan besar yang membutuhkan biaya tinggi</li>
<li><strong>Estetika terjaga</strong> - Kolam selalu terlihat menarik dan siap digunakan</li>
</ul>

<p><a href="services.html">Pelajari lebih lanjut tentang layanan perawatan kami →</a></p>

<h2>Jadwal Perawatan Harian</h2>

<p>Setiap hari, lakukan tugas-tugas berikut untuk menjaga kualitas kolam:</p>

<ol>
<li><strong>Skimming permukaan</strong> - Buang daun, serangga, dan kotoran mengambang</li>
<li><strong>Pengecekan level air</strong> - Pastikan air pada level yang tepat</li>
<li><strong>Visual inspection</strong> - Periksa kejernihan air dan kondisi equipment</li>
</ol>

<h2>Perawatan Mingguan yang Harus Dilakukan</h2>

<p>Setiap minggu, lakukan perawatan lebih mendalam:</p>

<ul>
<li>Test kualitas air (pH, chlorine, alkalinitas)</li>
<li>Backwash filter jika diperlukan</li>
<li>Brushing dinding dan lantai kolam</li>
<li>Vacuuming kolam untuk kotoran yang mengendap</li>
<li>Kosongkan skimmer dan pompa basket</li>
</ul>

<p><a href="gallery.html">Lihat hasil perawatan kolam kami →</a></p>

<h2>Perawatan Bulanan dan Musiman</h2>

<p>Beberapa perawatan hanya perlu dilakukan secara berkala:</p>

<h3>Perawatan Bulanan</h3>
<ul>
<li>Pembersihan filter cartridge</li>
<li>Pengecekan dan pelumasan O-ring</li>
<li>Inspeksi equipment secara menyeluruh</li>
</ul>

<h3>Perawatan Musiman</h3>
<ul>
<li>Opening pool di awal musim panas</li>
<li>Closing pool di akhir musim</li>
<li>Winterizing untuk kolam di daerah dingin</li>
</ul>

<h2>Masalah Umum dan Solusinya</h2>

<h3>Air Kolam Keruh</h3>
<p>Air keruh biasanya disebabkan oleh keseimbangan kimia yang tidak tepat atau filter yang kotor. Solusi: Test dan sesuaikan keseimbangan kimia, bersihkan atau ganti filter.</p>

<h3>Algae di Dinding Kolam</h3>
<p>Pertumbuhan algae menandakan level chlorine yang tidak cukup. Solusi: Shock treatment dengan chlorine tinggi dan brushing dinding kolam.</p>

<h3>Equipment Tidak Berfungsi</h3>
<p>Pompa atau filter yang tidak berfungsi bisa disebabkan oleh macetnya debris atau kerusakan mekanis. Solusi: Bersihkan basket dan periksa motor, hubungi teknisi jika perlu.</p>

<p><a href="contact.html">Butuh bantuan? Hubungi kami sekarang →</a></p>

<h2>Kapan Harus Memanggil Profesional?</h2>

<p>Meskipun banyak perawatan yang bisa dilakukan sendiri, beberapa situasi memerlukan bantuan ahli:</p>

<ul>
<li>Kebocoran yang tidak terdeteksi lokasinya</li>
<li>Kerusakan equipment elektrikal</li>
<li>Renovasi atau upgrade sistem</li>
<li>Opening dan closing pool kompleks</li>
<li>Masalah kualitas air yang persisten</li>
</ul>

<h2>Kesimpulan</h2>

<p>Perawatan kolam renang yang konsisten adalah kunci untuk menikmati kolam yang bersih, aman, dan awet. Dengan mengikuti jadwal perawatan yang tepat dan menangani masalah sejak dini, Anda dapat menghemat waktu dan biaya dalam jangka panjang.</p>

<p>Jika Anda membutuhkan bantuan profesional untuk perawatan kolam renang, jangan ragu untuk menghubungi tim Dokter Pool. Kami siap membantu menjaga kolam renang Anda dalam kondisi prima!</p>

<div class="faq-section">
<h2>Pertanyaan yang Sering Diajukan (FAQ)</h2>

<h3>Berapa biaya perawatan kolam renang per bulan?</h3>
<p>Biaya perawatan kolam renang bervariasi tergantung ukuran kolam dan layanan yang dibutuhkan. Rata-rata berkisar antara Rp 500.000 - Rp 2.000.000 per bulan untuk perawatan rutin.</p>

<h3>Seberapa sering harus mengganti air kolam?</h3>
<p>Untuk kolam renang pribadi, air biasanya perlu diganti setiap 3-5 tahun tergantung frekuensi penggunaan dan kualitas perawatan. Kolam yang dirawat dengan baik bisa lebih lama tanpa ganti air penuh.</p>

<h3>Apakah bisa merawat kolam sendiri tanpa jasa profesional?</h3>
<p>Ya, banyak pemilik kolam yang berhasil merawat kolam sendiri dengan belajar dasar-dasar perawatan. Namun, untuk masalah teknis atau perawatan kompleks, disarankan menggunakan jasa profesional.</p>

<h3>Berapa lama waktu yang dibutuhkan untuk merawat kolam setiap minggu?</h3>
<p>Perawatan mingguan dasar biasanya membutuhkan waktu 1-2 jam, tergantung ukuran kolam dan kondisi airnya.</p>
</div>
    `.trim();

    const metaDescription = `Pelajari cara merawat kolam renang dengan benar. Tips praktis tentang ${keywordList.join(', ')} dari ahli kolam renang profesional.`;

    res.json({
        success: true,
        article: {
            title: articleTitle,
            content: content,
            excerpt: metaDescription.substring(0, 160),
            meta_title: articleTitle + ' | Dokter Pool',
            meta_description: metaDescription,
            keywords: keywordList.join(', ')
        }
    });
});

// ============ ERROR HANDLING ============

// 404 handler - must be after all other routes
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Admin dashboard: http://localhost:${PORT}/admin`);
    console.log(`Website: http://localhost:${PORT}`);
    console.log(`Sitemap: http://localhost:${PORT}/sitemap.xml`);
});

module.exports = app;
