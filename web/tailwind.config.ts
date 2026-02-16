import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "var(--color-background)",
        foreground: "var(--color-foreground)",
        card: {
          DEFAULT: "var(--color-card)",
          foreground: "var(--color-card-foreground)",
        },
        muted: {
          DEFAULT: "var(--color-muted)",
          foreground: "var(--color-muted-foreground)",
        },
        primary: {
          DEFAULT: "var(--color-primary)",
          foreground: "var(--color-primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--color-secondary)",
          foreground: "var(--color-secondary-foreground)",
        },
        accent: {
          DEFAULT: "var(--color-accent)",
          foreground: "var(--color-accent-foreground)",
        },
        success: "var(--color-success)",
        warning: "var(--color-warning)",
        error: "var(--color-error)",
        info: "var(--color-info)",
        border: "var(--color-border)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
        display: ["var(--font-display)", "var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      borderRadius: {
        lg: "var(--radius-lg)",
        md: "var(--radius-md)",
        sm: "var(--radius-sm)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
      },
      animation: {
        'gradient-shift': 'gradient-shift 15s ease infinite',
        'gradient-shift-alt': 'gradient-shift-alt 20s ease infinite reverse',
        'blob': 'blob 7s infinite',
        'float': 'float 6s ease-in-out infinite',
        'float-wide': 'float-wide 8s ease-in-out infinite',
        'spin-slow': 'spin 12s linear infinite',
        'spin-medium': 'spin 8s linear infinite',
        'pulse-slow': 'pulse 4s ease-in-out infinite',
        'drift': 'drift 20s ease-in-out infinite',
        'drift-slow': 'drift-slow 40s linear infinite',
        'orbit': 'orbit 15s linear infinite',
        'twinkle': 'twinkle 3s ease-in-out infinite',
        'shooting-star': 'shooting-star 1s ease-out forwards',
        'shooting-star-diagonal': 'shooting-star-diagonal 3s linear infinite',
        'drift-star': 'drift-star 60s linear infinite',
      },
      keyframes: {
        'gradient-shift': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'gradient-shift-alt': {
          '0%, 100%': { backgroundPosition: '0% 0%' },
          '50%': { backgroundPosition: '100% 100%' },
        },
        'blob': {
          '0%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
          '100%': { transform: 'translate(0px, 0px) scale(1)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-20px) rotate(5deg)' },
        },
        'float-wide': {
          '0%, 100%': { transform: 'translate(0, 0) rotate(0deg)' },
          '25%': { transform: 'translate(30px, -40px) rotate(90deg)' },
          '50%': { transform: 'translate(0, -60px) rotate(180deg)' },
          '75%': { transform: 'translate(-30px, -40px) rotate(270deg)' },
        },
        'drift': {
          '0%, 100%': { transform: 'translate(0, 0) rotate(0deg)' },
          '25%': { transform: 'translate(50px, 30px) rotate(90deg)' },
          '50%': { transform: 'translate(20px, 60px) rotate(180deg)' },
          '75%': { transform: 'translate(-30px, 40px) rotate(270deg)' },
        },
        'drift-slow': {
          '0%': { transform: 'translateX(0) translateY(0)' },
          '100%': { transform: 'translateX(100vw) translateY(50px)' },
        },
        'orbit': {
          '0%': { transform: 'rotate(0deg) translateX(100px) rotate(0deg)' },
          '100%': { transform: 'rotate(360deg) translateX(100px) rotate(-360deg)' },
        },
        'twinkle': {
          '0%, 100%': { opacity: '0.3', transform: 'scale(0.8)' },
          '50%': { opacity: '1', transform: 'scale(1.2)' },
        },
        'shooting-star': {
          '0%': { transform: 'translateX(0) translateY(0) rotate(-45deg) scaleX(0)', opacity: '1' },
          '10%': { opacity: '1' },
          '100%': { transform: 'translateX(300px) translateY(300px) rotate(-45deg) scaleX(1)', opacity: '0' },
        },
        'shooting-star-diagonal': {
          '0%': { transform: 'translate(-100px, -100px) rotate(-45deg)', opacity: '0' },
          '10%': { opacity: '1' },
          '90%': { opacity: '1' },
          '100%': { transform: 'translate(100vw, 100vh) rotate(-45deg)', opacity: '0' },
        },
        'drift-star': {
          '0%': { transform: 'translateX(0) translateY(0)' },
          '100%': { transform: 'translateX(200vw) translateY(100px)' },
        },
      },
      animationDelay: {
        '500': '0.5s',
        '1000': '1s',
        '1500': '1.5s',
        '2000': '2s',
        '2500': '2.5s',
        '3000': '3s',
        '4000': '4s',
        '5000': '5s',
      },
    },
  },
  plugins: [],
};

export default config;
