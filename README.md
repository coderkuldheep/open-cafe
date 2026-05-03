# Open Cafe

Production-ready React + Vite + Tailwind cafe landing page with:

- Live menu from Firebase Firestore
- Photo gallery from Firebase Firestore
- Table reservation saved to Firestore
- WhatsApp confirmation redirect
- Owner admin panel for menu/photos
- Mobile responsive layout

## Run locally

```bash
npm install
npm run dev
```

## Firebase setup

1. Create a Firebase project.
2. Create a Web App in Firebase.
3. Enable Firestore Database.
4. Copy `.env.example` to `.env` and fill your Firebase values.
5. Create Firestore collections: `menu`, `photos`, `reservations`.

For quick testing, you can use Firestore test rules temporarily. For real production, add Firebase Auth and restrict admin writes.

## WhatsApp note

This frontend opens WhatsApp with a pre-filled confirmation message. Fully automatic WhatsApp sending needs WhatsApp Business API and a backend server.
# open-cafe
