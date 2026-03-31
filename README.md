# Frontend

This folder contains the Next.js web interface for the Online Exam System. It delivers the student, instructor, and dean experiences for registration, approvals, dashboards, exams, grading, announcements, and reports.

## Scripts

- `npm run dev`: start the local development server
- `npm run build`: build the production bundle
- `npm run start`: serve the production build
- `npm run lint`: run ESLint

## Local Setup

1. Install dependencies with `npm install`.
2. Create `frontend/.env.local`.
3. Start the app with `npm run dev`.
4. Open `http://localhost:3000`.

## Main Areas

- `app/`: routes, layouts, role dashboards, and feature pages
- `components/`: reusable UI shells, forms, cards, and navigation
- `lib/`: helpers and shared client-side utilities
- `public/`: static assets

## Notes

- This app is intended to run alongside the Django backend in `../backend/`.
- Environment-specific secrets and URLs should stay in `.env.local`.
- Generated folders such as `.next/` and `node_modules/` should not be committed.

For the full project setup and role documentation, use the repository-level docs:

- [README.md](/c:/Users/hanz/OneDrive/Documents/onlineexam/onlineexam/README.md)
- [SETUP_GUIDE.md](/c:/Users/hanz/OneDrive/Documents/onlineexam/onlineexam/SETUP_GUIDE.md)
# SCSITonlineexam
