# Frontend Developer Prompt - EduHive Learning App

You are an expert React Native frontend developer. Your task is to review, fix, and enhance the EduHive mobile learning application to make it professional, polished, and user-friendly.

## Current Issues to Fix

### 1. Button Styling Issues
- **Problem**: Buttons look unprofessional, white buttons without proper styling
- **Fix**: 
  - All buttons should have proper gradient backgrounds or solid colors
  - Primary buttons: Use emerald/green gradient (#14B8A6 to #10B981)
  - Secondary buttons: Use outlined style with proper borders
  - Text should be properly centered, no wrapping issues
  - Add proper shadows and elevation
  - Minimum height: 48px for touch targets
  - Proper font weight (700 for primary, 600 for secondary)

### 2. Profile Update Endpoint (404 Error)
- **Problem**: PUT /api/me returns 404 on deployed server
- **Fix**: Ensure server has the route properly configured
- **Location**: `server/src/index.js` - PUT /api/me route exists but may need deployment

### 3. Name Display After Registration
- **Problem**: Shows "Learner" instead of registered name
- **Fix**: 
  - Ensure AuthContext properly fetches user data after registration
  - Update ProfileScreen to show user.name correctly
  - Remove "Learner" fallback, use "User" or actual name

### 4. Dark Mode Toggle
- **Problem**: Dark mode toggle not working properly
- **Fix**: 
  - Ensure ThemeContext properly updates when toggled
  - All components should respect dark mode
  - Test all screens in both light and dark modes

### 5. WalletTopUp Screen Layout
- **Current Order**: About section → UPI section → Enter Amount
- **Required Order**: Enter Amount → UPI Apps section
- **Fix**: Reorder sections as requested

### 6. Course Cards
- **Problem**: Plain white rectangles, not attractive
- **Fix**:
  - Add proper shadows and borders
  - Improve thumbnail display with fallback icons
  - Better price badge styling
  - Improved typography and spacing
  - Add hover/press animations
  - Better color scheme

### 7. Transaction History
- **Fix**: Clicking on transaction should show detailed modal/sheet with:
  - Full transaction details
  - Date and time
  - Status with proper colors
  - UTR number if available
  - Description

## UI/UX Improvements Needed

### 1. Overall Design System
- **Colors**:
  - Primary: Emerald/Green (#10B981, #14B8A6)
  - Secondary: Blue (#3B82F6)
  - Background: White (#FFFFFF) / Dark (#0B0F17)
  - Text: Neutral-900 (light) / White (dark)
  - Accent: Emerald shades

- **Typography**:
  - Headings: Bold, 24-32px
  - Body: Regular/Medium, 16px
  - Small text: 12-14px
  - Proper line heights (1.5x font size)

- **Spacing**:
  - Consistent padding: 16px, 20px, 24px
  - Card margins: 12-16px
  - Section spacing: 24-32px

- **Shadows**:
  - Cards: shadowOffset {0, 4}, opacity 0.1, radius 12
  - Buttons: shadowOffset {0, 4}, opacity 0.2, radius 8
  - Elevation: 4-6 for cards, 5-8 for buttons

### 2. Button Components
- **Primary Button**:
  - Gradient background (emerald)
  - White text, bold, 16px
  - Rounded corners (12px)
  - Proper padding (16px vertical, 24px horizontal)
  - Shadow with elevation
  - Disabled state: 60% opacity

- **Secondary Button**:
  - Outlined style
  - Border: 2px solid emerald
  - Transparent background
  - Emerald text
  - Same padding and rounded corners

- **Ghost Button**:
  - No background
  - Emerald text
  - Minimal padding

### 3. Card Components
- **Course Cards**:
  - White background with subtle border
  - Rounded corners (16px)
  - Proper shadow
  - Thumbnail with gradient overlay
  - Price badge with gradient
  - Cart button with shadow
  - Clean typography
  - Proper spacing

- **Info Cards**:
  - White/dark background
  - Rounded corners (20px)
  - Proper padding (20-24px)
  - Shadow for depth
  - Clear hierarchy

### 4. Input Fields
- **Text Inputs**:
  - Light gray background (#F3F4F6)
  - Border: 2px solid neutral-200
  - Rounded corners (12px)
  - Padding: 12-16px
  - Proper placeholder styling
  - Focus state: border color change

### 5. Navigation
- **Header Bar**:
  - Clean, minimal design
  - Logo on left
  - Icons on right (search, theme, cart, profile)
  - Proper spacing
  - Border bottom for separation

## Features to Add/Improve

### 1. Learning App Specific Features
- **Progress Tracking**:
  - Visual progress bars for courses
  - Completion percentage
  - Time spent tracking
  - Last watched position

- **Course Categories**:
  - Filter by category
  - Search by category
  - Category badges on cards

- **Ratings & Reviews**:
  - Star ratings display
  - Review count
  - User reviews section

- **Course Details**:
  - Course curriculum/syllabus
  - Instructor information
  - Course duration
  - Prerequisites
  - Learning outcomes

- **My Learning**:
  - Continue watching section
  - Recently viewed
  - Bookmarked courses
  - Learning path suggestions

### 2. Enhanced Course Cards
- Show course difficulty level
- Display course duration
- Show enrollment count
- Add "New" or "Popular" badges
- Category tags
- Instructor name/avatar

### 3. Search & Filter
- Advanced search with filters
- Filter by price (Free/Paid)
- Filter by category
- Sort options (Newest, Popular, Price)
- Search history

### 4. Profile Enhancements
- Profile picture upload
- Achievement badges
- Learning statistics
- Certificates section
- Social sharing

### 5. Notifications
- Course completion notifications
- New course alerts
- Price drop alerts
- Learning reminders

## Code Quality Standards

### 1. Component Structure
- Use functional components with hooks
- Proper prop types or TypeScript
- Clean, readable code
- Consistent naming (camelCase for variables, PascalCase for components)

### 2. Styling
- Use NativeWind/Tailwind for consistency
- Avoid inline styles where possible
- Use style objects for complex styles
- Consistent spacing using Tailwind classes

### 3. State Management
- Use Context API properly
- Avoid unnecessary re-renders
- Proper loading states
- Error handling

### 4. Performance
- Optimize images
- Lazy loading for lists
- Memoization where needed
- Proper key props

## Specific Files to Review

1. **app/src/components/Button.js** - Fix all button variants
2. **app/src/components/CourseCard.js** - Improve card design
3. **app/src/screens/WalletTopUpScreen.js** - Fix layout order
4. **app/src/screens/ProfileScreen.js** - Fix name display
5. **app/src/screens/CoursesScreen.js** - Improve course listing
6. **app/src/screens/WalletScreen.js** - Add transaction details modal
7. **app/src/context/ThemeContext.js** - Fix dark mode
8. **app/src/context/AuthContext.js** - Fix user data fetching

## Testing Checklist

- [ ] All buttons work and look professional
- [ ] Dark mode works on all screens
- [ ] Profile update works correctly
- [ ] Name displays correctly after registration
- [ ] Course cards look attractive
- [ ] Transaction details show on click
- [ ] WalletTopUp screen has correct order
- [ ] All text is readable and properly styled
- [ ] No white rectangles or placeholder issues
- [ ] All navigation works smoothly
- [ ] Loading states are properly handled
- [ ] Error messages are user-friendly

## Design Principles

1. **Consistency**: Same components look the same everywhere
2. **Clarity**: Clear visual hierarchy and readable text
3. **Feedback**: Visual feedback for all interactions
4. **Accessibility**: Proper touch targets (min 44x44px)
5. **Performance**: Smooth animations and transitions
6. **Professional**: Clean, modern, polished appearance

## Final Notes

- Make the app look like a premium learning platform
- All UI elements should be polished and professional
- Follow Material Design or iOS Human Interface Guidelines
- Ensure responsive design for different screen sizes
- Test on both light and dark modes
- Ensure all interactions feel smooth and responsive

---

**Priority**: Fix all button styling issues first, then improve course cards, then add learning-specific features.

**Goal**: Create a professional, polished, and user-friendly learning app that users will love to use.

