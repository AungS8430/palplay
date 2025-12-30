# 🎵 PalPlay

A music-based social platform that lets you share playlists, chat with songs, and discover what your friends are listening to!

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4-38B2AC?style=flat-square&logo=tailwind-css)
![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?style=flat-square&logo=prisma)
![License](https://img.shields.io/badge/License-GPL--3.0-green?style=flat-square)

## ✨ Features

- **🎶 Share Music** — Share songs and discuss with your friends by attaching songs with your messages or posts
- **👥 Collaborative Playlists** — Create and share collaborative playlists with your group in real-time
- **📊 Group Statistics** — See what your group listens to the most with detailed statistics and insights
- **💬 Real-time Chat** — Chat with your group members with song embeds from Spotify and YouTube
- **🔐 Secure Authentication** — Login with Spotify or Google via NextAuth.js with encrypted token storage

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Database**: PostgreSQL with [Prisma ORM](https://www.prisma.io/)
- **Authentication**: [NextAuth.js](https://next-auth.js.org/) with Spotify & Google OAuth
- **Real-time**: [Supabase Realtime](https://supabase.com/docs/guides/realtime)
- **UI Components**: [Radix UI](https://www.radix-ui.com/) + Custom components

## 📋 Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm
- PostgreSQL database
- Supabase project (for realtime features)
- Spotify Developer credentials
- Google Developer credentials

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/AungS8430/palplay.git
cd palplay
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Set up environment variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/palplay"
DIRECT_URL="postgresql://user:password@localhost:5432/palplay"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret"

# Spotify OAuth
SPOTIFY_CLIENT_ID="your-spotify-client-id"
SPOTIFY_CLIENT_SECRET="your-spotify-client-secret"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Supabase (for realtime)
NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"

# Encryption key for storing provider tokens
ENCRYPTION_KEY="your-32-byte-encryption-key"
```

### 4. Set up the database

```bash
# Generate Prisma client
pnpm prisma generate

# Run database migrations
pnpm prisma migrate dev
```

### 5. Run the development server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see PalPlay in action!

## 📁 Project Structure

```
palplay/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── auth/          # NextAuth authentication
│   │   └── v1/            # REST API v1 endpoints
│   └── app/               # Protected app pages
│       └── groups/        # Group pages
├── components/            # React components
│   ├── app/               # App-specific components
│   │   ├── chat/          # Chat components
│   │   ├── embeds/        # Spotify/YouTube embeds
│   │   ├── groups/        # Group components
│   │   └── playlist/      # Playlist components
│   ├── home/              # Landing page components
│   ├── icons/             # Icon components
│   └── ui/                # Reusable UI components
├── hooks/                 # Custom React hooks
├── lib/                   # Utility libraries
│   ├── crypto.ts          # Encryption utilities
│   ├── prisma.ts          # Prisma client
│   ├── realtime.ts        # Supabase realtime
│   └── supabase.ts        # Supabase client
├── prisma/                # Prisma schema & migrations
├── public/                # Static assets
└── types/                 # TypeScript type definitions
```

## 📖 API Documentation

See [API_ROUTE_V1.md](./API_ROUTE_V1.md) for detailed API documentation.

### Key Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/health` | GET | Health check |
| `/api/v1/groups` | POST | Create a new group |
| `/api/v1/groups/:groupId` | GET | Get group details |
| `/api/v1/groups/:groupId/join` | POST | Join a group |
| `/api/v1/songs` | GET | Search/get song details |
| `/api/v1/invites` | POST | Create invite link |

## 🧪 Development Scripts

```bash
# Start development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Run linter
pnpm lint

# Fix lint issues
pnpm lint:fix
```

## 🔒 Security

- Provider tokens (Spotify, Google) are encrypted at rest using AES-256
- Plaintext tokens are cleared from the database after encryption
- All API endpoints require authentication where appropriate

## 📄 License

This project is licensed under the **GNU General Public License v3.0** - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [Radix UI](https://www.radix-ui.com/) and [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/)

---

Made with ❤️ by [AungS8430](https://github.com/AungS8430)

