import { defineConfig, type PluginOption } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(({ mode }) => {
  const plugins: PluginOption[] = [react()];


  return {
    server: {
      host: "::",
      port: 8080,
      hmr: {
        overlay: false,
      },
      // Same-origin API during dev → avoids CORS when the UI is opened as localhost OR 127.0.0.1
      proxy: {
        "/socket.io": {
          target: "http://localhost:5000",
          ws: true,
          changeOrigin: true,
        },
        "/tasks": { target: "http://localhost:5000", changeOrigin: true },
        "/task": { target: "http://localhost:5000", changeOrigin: true },
        "/api": { target: "http://localhost:5000", changeOrigin: true },
        "/uploads": { target: "http://localhost:5000", changeOrigin: true },
      },
    },
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
      dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
    },
  };
});
