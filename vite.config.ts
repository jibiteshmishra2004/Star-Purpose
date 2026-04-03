import { defineConfig, type PluginOption } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
// lovable-tagger is ESM-only; load it dynamically so Vite can bundle this config.
export default defineConfig(async ({ mode }) => {
  const plugins: PluginOption[] = [react()];
  if (mode === "development") {
    const { componentTagger } = await import("lovable-tagger");
    plugins.push(componentTagger());
  }

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
          target: "http://localhost:3000",
          ws: true,
          changeOrigin: true,
        },
        "/tasks": { target: "http://localhost:3000", changeOrigin: true },
        "/task": { target: "http://localhost:3000", changeOrigin: true },
        "/api": { target: "http://localhost:3000", changeOrigin: true },
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
