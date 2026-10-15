import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// The Aivarnix marketing site. Port 5175 keeps it clear of the Expo web app (8081).
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5175 },
  preview: { port: 5175 },
});
