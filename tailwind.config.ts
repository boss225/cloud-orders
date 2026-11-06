import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        notebook: {
          paper: '#fdfbf7',
          grid: '#d5e1df',
          line: '#9ec5c8',
          margin: '#e57373',
          inkBlue: '#1a365d',
          inkRed: '#c53030',
          highlightOrange: '#fed7aa',
          highlightYellow: '#fef08a',
          highlightGreen: '#bbf7d0',
        }
      },
      backgroundImage: {
        'grid-pattern': "linear-gradient(to right, #e2e8f0 1px, transparent 1px), linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)",
        'notebook-grid': "linear-gradient(to right, rgba(148, 163, 184, 0.25) 1px, transparent 1px), linear-gradient(to bottom, rgba(148, 163, 184, 0.25) 1px, transparent 1px)",
      },
      backgroundSize: {
        'grid-pattern': '24px 24px',
        'notebook-grid': '20px 20px',
      }
    },
  },
  plugins: [],
};
export default config;
