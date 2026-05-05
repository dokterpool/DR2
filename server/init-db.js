const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '../database/database.sqlite');

// Ensure database directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err);
        process.exit(1);
    }
    console.log('Connected to SQLite database');
});

// Create tables
const createTables = () => {
    return new Promise((resolve, reject) => {
        db.exec(`
            -- Users table for admin authentication
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                email TEXT UNIQUE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            -- Website settings table
            CREATE TABLE IF NOT EXISTS settings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                key TEXT UNIQUE NOT NULL,
                value TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            -- Content pages table
            CREATE TABLE IF NOT EXISTS content_pages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                page_key TEXT UNIQUE NOT NULL,
                title TEXT,
                content TEXT,
                meta_title TEXT,
                meta_description TEXT,
                keywords TEXT,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            -- Blog articles table
            CREATE TABLE IF NOT EXISTS articles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                slug TEXT UNIQUE NOT NULL,
                content TEXT,
                excerpt TEXT,
                featured_image TEXT,
                meta_title TEXT,
                meta_description TEXT,
                keywords TEXT,
                status TEXT DEFAULT 'draft',
                published_at DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            -- Projects table (enhanced gallery with multiple images)
            CREATE TABLE IF NOT EXISTS projects (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                slug TEXT UNIQUE NOT NULL,
                location TEXT,
                pool_type TEXT,
                year INTEGER,
                description TEXT,
                specifications TEXT,
                featured_image TEXT,
                is_featured INTEGER DEFAULT 0,
                has_before_after INTEGER DEFAULT 0,
                display_order INTEGER DEFAULT 0,
                meta_title TEXT,
                meta_description TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            -- Project images table (multiple images per project)
            CREATE TABLE IF NOT EXISTS project_images (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                project_id INTEGER NOT NULL,
                image_path TEXT NOT NULL,
                caption TEXT,
                is_before INTEGER DEFAULT 0,
                is_after INTEGER DEFAULT 0,
                display_order INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
            );

            -- SEO settings table
            CREATE TABLE IF NOT EXISTS seo_settings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                page_key TEXT UNIQUE NOT NULL,
                meta_title TEXT,
                meta_description TEXT,
                og_title TEXT,
                og_description TEXT,
                og_image TEXT,
                schema_markup TEXT,
                canonical_url TEXT,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            -- Services table
            CREATE TABLE IF NOT EXISTS services (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                slug TEXT UNIQUE NOT NULL,
                description TEXT,
                icon TEXT,
                content TEXT,
                display_order INTEGER DEFAULT 0,
                is_active INTEGER DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            -- Legacy gallery table (keep for backward compatibility)
            CREATE TABLE IF NOT EXISTS gallery (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT,
                location TEXT,
                pool_type TEXT,
                year INTEGER,
                image_path TEXT NOT NULL,
                description TEXT,
                display_order INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `, (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
};

// Insert default data
const insertDefaultData = async () => {
    // Create default admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    return new Promise((resolve, reject) => {
        db.run(`
            INSERT OR IGNORE INTO users (username, password, email) 
            VALUES (?, ?, ?)
        `, ['admin', hashedPassword, 'admin@dokterpool.com'], (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
};

// Insert default settings
const insertDefaultSettings = () => {
    const defaultSettings = [
        ['company_name', 'Dokter Pool'],
        ['company_address', 'Jl. Sudirman No. 123, Jakarta'],
        ['company_phone', '+62 21 1234 5678'],
        ['company_whatsapp', '+62 812 3456 7890'],
        ['company_email', 'info@dokterpool.com'],
        ['facebook_url', 'https://facebook.com/dokterpool'],
        ['instagram_url', 'https://instagram.com/dokterpool'],
        ['youtube_url', 'https://youtube.com/dokterpool'],
        ['homepage_headline', 'Ahli Perawatan Kolam Renang Profesional'],
        ['homepage_description', 'Kami menyediakan layanan perawatan kolam renang berkualitas tinggi untuk rumah, hotel, dan fasilitas komersial.'],
        ['projects_completed', '150+'],
        ['years_experience', '10+'],
        ['happy_clients', '500+'],
        ['hero_images', '["https://images.unsplash.com/photo-1572331165267-854da2b10ccc?w=1920","https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1920","https://images.unsplash.com/photo-1575429198097-0414ec08e8cd?w=1920"]']
    ];

    const stmt = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
    defaultSettings.forEach(([key, value]) => {
        stmt.run(key, value);
    });
    stmt.finalize();
};

// Insert default content pages
const insertDefaultContent = () => {
    const defaultContent = [
        ['home', 'Beranda', 'Selamat datang di Dokter Pool', 'Dokter Pool - Ahli Perawatan Kolam Renang', 'Layanan perawatan kolam renang profesional untuk rumah dan bisnis Anda', 'kolam renang, perawatan kolam, jasa kolam renang'],
        ['about', 'Tentang Kami', 'Dokter Pool adalah perusahaan perawatan kolam renang terpercaya...', 'Tentang Dokter Pool', 'Kenali tim profesional di balik layanan perawatan kolam renang terbaik', 'tentang dokter pool, tim kami'],
        ['services', 'Layanan Kami', 'Kami menawarkan berbagai layanan perawatan kolam renang...', 'Layanan Perawatan Kolam Renang', 'Layanan lengkap perawatan kolam renang dari Dokter Pool', 'layanan kolam renang, perawatan kolam'],
        ['contact', 'Hubungi Kami', 'Hubungi kami untuk konsultasi gratis...', 'Hubungi Dokter Pool', 'Hubungi tim Dokter Pool untuk layanan perawatan kolam renang', 'kontak dokter pool, hubungi kami']
    ];

    const stmt = db.prepare('INSERT OR IGNORE INTO content_pages (page_key, title, content, meta_title, meta_description, keywords) VALUES (?, ?, ?, ?, ?, ?)');
    defaultContent.forEach(([pageKey, title, content, metaTitle, metaDesc, keywords]) => {
        stmt.run(pageKey, title, content, metaTitle, metaDesc, keywords);
    });
    stmt.finalize();
};

// Insert default services
const insertDefaultServices = () => {
    const defaultServices = [
        ['Perawatan Rutin', 'perawatan-rutin', 'Layanan perawatan mingguan/bulanan untuk menjaga kualitas air kolam', 'pool', 'Pembersihan rutin, pengecekan kualitas air, dan perawatan equipment.', 1],
        ['Renovasi Kolam', 'renovasi-kolam', 'Jasa renovasi dan perbaikan kolam renang', 'tools', 'Perbaikan kebocoran, penggantian keramik, dan upgrade sistem.', 2],
        ['Instalasi Baru', 'instalasi-baru', 'Pembuatan dan instalasi kolam renang baru', 'construction', 'Desain dan pembangunan kolam renang sesuai kebutuhan Anda.', 3],
        ['Perbaikan Equipment', 'perbaikan-equipment', 'Service dan perbaikan peralatan kolam renang', 'wrench', 'Perbaikan pompa, filter, heater, dan peralatan lainnya.', 4]
    ];

    const stmt = db.prepare('INSERT OR IGNORE INTO services (title, slug, description, icon, content, display_order) VALUES (?, ?, ?, ?, ?, ?)');
    defaultServices.forEach(([title, slug, desc, icon, content, order]) => {
        stmt.run(title, slug, desc, icon, content, order);
    });
    stmt.finalize();
};

// Insert sample projects
const insertSampleProjects = () => {
    const sampleProjects = [
        ['Kolam Renang Pribadi - BSD', 'kolam-bsd', 'BSD City, Tangerang', 'Pribadi', 2024, 'Renovasi kolam renang pribadi dengan sistem filter modern dan lighting LED.', '{"size": "8x4 meter", "depth": "1.2-1.8 meter", "features": "Infinity edge, LED lighting, heating system"}', 1, 1],
        ['Kolam Hotel Bintang 5', 'kolam-hotel-jakarta', 'Jakarta Selatan', 'Hotel', 2023, 'Pembuatan kolam renang untuk hotel bintang 5 dengan desain mewah.', '{"size": "15x8 meter", "depth": "1.0-2.0 meter", "features": "Jacuzzi, waterfall, underwater seating"}', 1, 0],
        ['Kolam Apartemen Elite', 'kolam-apartemen', 'Jakarta Pusat', 'Apartemen', 2023, 'Perawatan rutin kolam renang apartemen elite dengan kualitas air premium.', '{"size": "12x6 meter", "depth": "1.2-1.5 meter", "features": "Salt chlorination, auto cover"}', 0, 0]
    ];

    const stmt = db.prepare('INSERT OR IGNORE INTO projects (title, slug, location, pool_type, year, description, specifications, is_featured, has_before_after) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
    sampleProjects.forEach(project => {
        stmt.run(...project);
    });
    stmt.finalize();
};

// Initialize database
const initDatabase = async () => {
    try {
        await createTables();
        console.log('Tables created successfully');
        
        await insertDefaultData();
        console.log('Default admin user created');
        
        insertDefaultSettings();
        console.log('Default settings inserted');
        
        insertDefaultContent();
        console.log('Default content inserted');
        
        insertDefaultServices();
        console.log('Default services inserted');
        
        insertSampleProjects();
        console.log('Sample projects inserted');
        
        console.log('\n========================================');
        console.log('Database initialized successfully!');
        console.log('========================================');
        console.log('Default login: admin / admin123');
        console.log('Please change the default password after first login.');
        console.log('========================================\n');
        
        db.close();
    } catch (error) {
        console.error('Error initializing database:', error);
        db.close();
        process.exit(1);
    }
};

initDatabase();