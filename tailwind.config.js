import forms from '@tailwindcss/forms';
import containerQueries from '@tailwindcss/container-queries';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./App.tsx",
        "./index.tsx",
        "./components/**/*.{ts,tsx}",
        "./lib/**/*.{ts,tsx}",
        "./services/**/*.{ts,tsx}",
    ],
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                "primary": "#802e53",
                "secondary": "#a66384",
                "gas": "#f97316",
                "water": "#1132d4",
                "background-light": "#f8f9fa",
                "background-dark": "#101322",
                "surface-light": "#ffffff",
                "surface-dark": "#1e2130",
            },
            fontFamily: {
                sans: ["Inter", "sans-serif"],
            },
        },
    },
    plugins: [
        forms,
        containerQueries,
    ],
};
