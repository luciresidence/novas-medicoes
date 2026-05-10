<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1n5wBV9ElipWzXxe5jJSEBGh2FthxRC-J

## Run Locally

**Prerequisites:** Node.js

1. Copy `.env.example` to `.env` and fill in your Firebase values.
2. Install dependencies:
   `npm install`
3. Run the app:
   `npm run dev`

## Environment

The app expects the following environment variables in a `.env` file:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

## Useful scripts

- `npm run dev` — inicia o servidor de desenvolvimento
- `npm run build` — gera o build de produção
- `npm run preview` — pré-visualiza o build de produção
- `npm run audit` — verifica vulnerabilidades do npm
