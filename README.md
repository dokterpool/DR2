# Dokter Pool CMS

Sistem Manajemen Konten (CMS) lengkap untuk website Dokter Pool - layanan perawatan kolam renang profesional.

## Fitur Utama

### 🎨 Frontend Website
- **Homepage** - Hero section, layanan, galeri, blog preview
- **Services** - Daftar layanan lengkap dengan paket harga
- **Gallery** - Galeri proyek dengan filter
- **Blog** - Artikel SEO-friendly dengan single article view
- **About** - Tentang perusahaan, tim, nilai-nilai
- **Contact** - Form kontak, informasi, peta lokasi

### 🔐 Admin Dashboard
- **Dashboard** - Statistik dan overview website
- **Content Editor** - Edit konten halaman (Home, About, Services, Contact)
- **Blog Manager** - CRUD artikel dengan rich text editor
- **Gallery Manager** - Upload dan kelola foto proyek
- **SEO Manager** - Meta tags, OG tags, Schema markup
- **Website Settings** - Pengaturan perusahaan dan kontak
- **AI Assistant** - Generate ide, outline, dan artikel

### 🤖 AI-Friendly Features
- Generate ide blog otomatis
- Generate outline artikel
- Generate artikel SEO lengkap
- Struktur heading hierarkis (H1, H2, H3)
- FAQ section untuk rich snippets
- Schema markup (Article, FAQ, LocalBusiness)

## Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript, Poppins Font
- **Backend**: Node.js, Express.js
- **Database**: SQLite3
- **Authentication**: bcryptjs, express-session
- **File Upload**: Multer
- **Rich Text Editor**: TinyMCE

## Instalasi

### 1. Clone Repository
```bash
cd dokterpool-cms
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Initialize Database
```bash
npm run init-db
```

### 4. Start Server
```bash
# Development mode
npm run dev

# Production mode
npm start
```

### 5. Access Application
- **Website**: http://localhost:3000
- **Admin Dashboard**: http://localhost:3000/admin

### Default Login
- **Username**: admin
- **Password**: admin123

> ⚠️ **Penting**: Ganti password default setelah login pertama!

## Struktur Folder

```
dokterpool-cms/
├── admin/
│   └── dashboard.html          # Admin dashboard UI
├── css/
│   └── style.css               # Main stylesheet
├── database/
│   └── database.sqlite         # SQLite database
├── js/
│   └── script.js               # Frontend JavaScript
├── public/
│   ├── index.html              # Homepage
│   ├── services.html           # Services page
│   ├── gallery.html            # Gallery page
│   ├── blog.html               # Blog page
│   ├── about.html              # About page
│   └── contact.html            # Contact page
├── server/
│   ├── server.js               # Main server file
│   └── init-db.js              # Database initialization
├── uploads/
│   ├── blog/                   # Blog images
│   └── gallery/                # Gallery images
├── .env                        # Environment variables
├── package.json                # Dependencies
└── README.md                   # This file
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/status` - Check auth status

### Settings
- `GET /api/settings` - Get all settings
- `GET /api/settings/:key` - Get single setting
- `POST /api/settings` - Update settings (auth required)

### Content Pages
- `GET /api/content` - Get all content pages
- `GET /api/content/:pageKey` - Get single page
- `PUT /api/content/:pageKey` - Update page (auth required)

### Articles
- `GET /api/articles` - Get all articles (published only for public)
- `GET /api/articles/slug/:slug` - Get article by slug
- `GET /api/articles/:id` - Get article by ID (auth required)
- `POST /api/articles` - Create article (auth required)
- `PUT /api/articles/:id` - Update article (auth required)
- `DELETE /api/articles/:id` - Delete article (auth required)

### Gallery
- `GET /api/gallery` - Get all gallery items
- `POST /api/gallery` - Create gallery item (auth required)
- `PUT /api/gallery/:id` - Update gallery item (auth required)
- `DELETE /api/gallery/:id` - Delete gallery item (auth required)

### Services
- `GET /api/services` - Get all services
- `GET /api/services/slug/:slug` - Get service by slug
- `POST /api/services` - Create service (auth required)
- `PUT /api/services/:id` - Update service (auth required)
- `DELETE /api/services/:id` - Delete service (auth required)

### SEO
- `GET /api/seo/:pageKey` - Get SEO settings
- `POST /api/seo/:pageKey` - Update SEO settings (auth required)

### Upload
- `POST /api/upload/:type` - Upload image (auth required)
- `DELETE /api/upload` - Delete uploaded file (auth required)

### AI Assistant
- `POST /api/ai/generate-ideas` - Generate blog ideas (auth required)
- `POST /api/ai/generate-outline` - Generate article outline (auth required)
- `POST /api/ai/generate-article` - Generate full article (auth required)

## Database Schema

### Tables
- **users** - Admin users
- **settings** - Website settings
- **content_pages** - Page content (home, about, etc.)
- **articles** - Blog articles
- **gallery** - Gallery images
- **services** - Services list
- **seo_settings** - SEO settings per page

## Color Palette

- **Primary**: #0077B6
- **Secondary**: #00B4D8
- **Dark**: #023E8A
- **Accent**: #90E0EF
- **Light**: #CAF0F8

## SEO Features

### Built-in SEO
- Meta title dan description per halaman
- Open Graph tags untuk social sharing
- Schema markup (JSON-LD) untuk rich snippets
- URL slug yang SEO-friendly
- Heading hierarchy (H1, H2, H3)
- FAQ section untuk FAQ schema

### AI-Generated Content Structure
- Heading hierarchy yang benar
- FAQ section otomatis
- Internal links
- Keyword optimization
- Semantic HTML

## Security

- Password hashing dengan bcryptjs
- Session-based authentication
- Helmet.js untuk security headers
- CSRF protection
- Input validation
- File upload restrictions

## Deployment

### Production Checklist
1. Ganti SESSION_SECRET di .env
2. Ganti password admin default
3. Set NODE_ENV=production
4. Konfigurasi HTTPS
5. Backup database secara berkala
6. Set up process manager (PM2)

### Using PM2
```bash
npm install -g pm2
pm2 start server/server.js --name dokterpool-cms
pm2 save
pm2 startup
```

## Maintenance

### Backup Database
```bash
cp database/database.sqlite database/backup-$(date +%Y%m%d).sqlite
```

### Update Dependencies
```bash
npm update
```

## Troubleshooting

### Database locked
```bash
# Restart server atau tunggu proses selesai
```

### Upload failed
- Cek folder uploads ada dan writable
- Cek file size tidak melebihi limit (5MB)
- Cek file type (hanya gambar)

### Session expired
- Login ulang ke admin dashboard
- Cek SESSION_SECRET di .env

## License

MIT License - Dokter Pool 2024

## Support

Untuk bantuan dan pertanyaan:
- Email: info@dokterpool.com
- WhatsApp: +62 812 3456 7890