# EduHive Admin Panel Setup Guide

## Overview

The admin panel is a Next.js web application that allows admins and teachers to manage the EduHive learning platform.

## Features

- **Dashboard**: View platform statistics (courses, lectures, users)
- **Course Management**: Create, edit, delete, and manage courses
- **Lecture Management**: Add, edit, and delete lectures for each course
- **User Management**: Create, edit, delete users with role management (admin/teacher/user)

## Setup Instructions

### 1. Backend Setup

The admin panel connects to your existing Express backend server.

Make sure your backend is running on `http://localhost:4000` (or update the API URL in admin panel).

### 2. Create Admin User

Run this command to create your first admin user:

```bash
cd server
npm run create:admin
```

Or with custom credentials:

```bash
npm run create:admin your-email@example.com your-password "Your Name"
```

Default credentials:
- Email: `admin@eduhive.com`
- Password: `admin123`
- Role: `admin`

### 3. Admin Panel Setup

1. Navigate to the admin folder:
```bash
cd admin
```

2. Install dependencies (if not already done):
```bash
npm install
```

3. Create `.env.local` file:
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

6. Login with your admin credentials

## User Roles

- **admin**: Full access to all features
- **teacher**: Can manage courses and lectures (same as admin for now)
- **user**: Regular app users (cannot access admin panel)

## Admin Panel Routes

- `/` - Redirects to login or dashboard
- `/login` - Admin login page
- `/dashboard` - Main dashboard with statistics
- `/courses` - List all courses
- `/courses/new` - Create new course
- `/courses/[id]` - Edit course
- `/courses/[id]/lectures` - Manage lectures for a course
- `/users` - List all users
- `/users/new` - Create new user
- `/users/[id]` - Edit user

## API Endpoints

All admin endpoints are prefixed with `/api/admin`:

- `GET /api/admin/stats` - Get dashboard statistics
- `GET /api/admin/courses` - Get all courses
- `POST /api/admin/courses` - Create course
- `PUT /api/admin/courses/:id` - Update course
- `DELETE /api/admin/courses/:id` - Delete course
- `GET /api/admin/courses/:id/lectures` - Get lectures for a course
- `POST /api/admin/courses/:id/lectures` - Create lecture
- `PUT /api/admin/lectures/:id` - Update lecture
- `DELETE /api/admin/lectures/:id` - Delete lecture
- `GET /api/admin/users` - Get all users
- `POST /api/admin/users` - Create user
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user

## Security

- All admin routes are protected with JWT authentication
- Only users with `admin` or `teacher` role can access the admin panel
- Tokens are stored in localStorage (for development)
- In production, consider using httpOnly cookies

## Production Deployment

When ready to deploy:

1. Build the admin panel:
```bash
cd admin
npm run build
```

2. Set environment variables:
```env
NEXT_PUBLIC_API_URL=https://your-api-domain.com
```

3. Deploy to Vercel, Netlify, or your preferred hosting platform

## Troubleshooting

### Cannot login
- Make sure backend server is running
- Check that admin user exists in database
- Verify API URL in `.env.local`

### API errors
- Check CORS settings in backend
- Verify JWT_SECRET is set in backend
- Check MongoDB connection

### Build errors
- Make sure all dependencies are installed
- Check TypeScript errors
- Verify path aliases in `tsconfig.json`

