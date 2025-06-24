# AIDM Client Portal

A comprehensive AI Data Management Client Portal built with React, TypeScript, and Supabase.

## 🔐 Security & Environment Setup

### Quick Start
1. Copy environment template:
   ```bash
   cp .env.example .env
   ```

2. Configure your Supabase credentials in `.env`:
   ```bash
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_SUPABASE_FUNCTION_URL=your_supabase_function_url
   VITE_NODE_ENV=development
   ```

3. Install dependencies and start:
   ```bash
   npm install
   npm run dev
   ```

### 🚨 Important Security Notes
- **Never commit `.env` files** to version control
- All credentials are now environment-based for security
- See `SECURITY.md` for comprehensive security guidelines
- Use `.env.example` as template for required variables

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI**: Shadcn UI, Tailwind CSS, Radix UI
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **Real-time**: Supabase Realtime subscriptions
- **Deployment**: Vercel/Netlify ready

## Features

### User Portal
- 🔐 Secure authentication with role-based access
- 📚 Course management and progress tracking
- 📁 File management with upload/download
- 💬 AI prompt library with favorites
- 📊 Personal dashboard with analytics
- 🎯 Service assignment and tracking

### Admin Portal  
- 👥 User management (create, edit, delete)
- 📖 Course and lesson management
- 🔒 Lesson access control (lock/unlock)
- 📈 Real-time analytics dashboard
- 🗂️ File management system
- ⚙️ Service assignment management
- 📝 Prompt library administration

## Environment Variables

Required environment variables (see `.env.example`):

```bash
# Supabase Configuration
VITE_SUPABASE_URL=          # Your Supabase project URL
VITE_SUPABASE_ANON_KEY=     # Your Supabase anonymous key
VITE_SUPABASE_FUNCTION_URL= # Supabase Edge Functions URL

# Environment
VITE_NODE_ENV=              # development/production
```

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Deployment

### Vercel (Recommended)
1. Connect your GitHub repository
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push

### Netlify
1. Connect repository or drag build folder
2. Set environment variables in site settings
3. Configure build command: `npm run build`

## Database Schema

The application uses Supabase with the following key tables:
- `profiles` - User profiles and roles
- `courses` - Course information
- `lessons` - Individual lesson content
- `user_course_assignments` - Course enrollments
- `user_progress` - Learning progress tracking
- `user_lesson_locks` - Lesson access control
- `services` - Available services
- `user_services` - Service assignments
- `files` - File metadata and storage
- `prompts` - AI prompt library
- `favorites` - User favorites

## Security Features

- 🔐 Environment-based credential management
- 🛡️ Row Level Security (RLS) policies
- 🔑 JWT-based authentication
- 👥 Role-based access control (admin/user)
- 🚫 Credential exposure prevention
- 📝 Comprehensive security documentation

## Contributing

1. Fork the repository
2. Create a feature branch
3. Configure environment variables
4. Make your changes
5. Submit a pull request

## Support

For support or questions:
- Check `SECURITY.md` for security-related setup
- Review environment variable configuration
- Ensure all required variables are set

---

⚠️ **Security Reminder**: Always use environment variables for sensitive data. Never commit credentials to version control.
