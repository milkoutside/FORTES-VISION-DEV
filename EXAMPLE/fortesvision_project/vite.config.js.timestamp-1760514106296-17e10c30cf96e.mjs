// vite.config.js
import { defineConfig } from "file:///var/www/node_modules/vite/dist/node/index.js";
import laravel from "file:///var/www/node_modules/laravel-vite-plugin/dist/index.js";
import vue from "file:///var/www/node_modules/@vitejs/plugin-vue/dist/index.mjs";
import path from "path";
var __vite_injected_original_dirname = "/var/www";
var vite_config_default = defineConfig({
  plugins: [
    vue({
      template: {
        transformAssetUrls: {
          includeAbsolute: false
        }
      }
    }),
    laravel({
      input: [
        "resources/css/app.css",
        "resources/js/app.js"
      ]
    })
  ],
  resolve: {
    alias: {
      "@": path.join(__vite_injected_original_dirname, "/resources/js"),
      // Исправленный алиас
      "~": path.join(__vite_injected_original_dirname, "/node_modules")
    }
  },
  build: {
    chunkSizeWarningLimit: 3200
    // Лимит размера чанка
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvdmFyL3d3d1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL3Zhci93d3cvdml0ZS5jb25maWcuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL3Zhci93d3cvdml0ZS5jb25maWcuanNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcbmltcG9ydCBsYXJhdmVsIGZyb20gJ2xhcmF2ZWwtdml0ZS1wbHVnaW4nO1xuaW1wb3J0IHZ1ZSBmcm9tICdAdml0ZWpzL3BsdWdpbi12dWUnO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gICAgcGx1Z2luczogW1xuICAgICAgICB2dWUoe1xuICAgICAgICAgICAgdGVtcGxhdGU6IHtcbiAgICAgICAgICAgICAgICB0cmFuc2Zvcm1Bc3NldFVybHM6IHtcbiAgICAgICAgICAgICAgICAgICAgaW5jbHVkZUFic29sdXRlOiBmYWxzZSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgfSksXG4gICAgICAgIGxhcmF2ZWwoe1xuICAgICAgICAgICAgaW5wdXQ6IFtcbiAgICAgICAgICAgICAgICAncmVzb3VyY2VzL2Nzcy9hcHAuY3NzJyxcbiAgICAgICAgICAgICAgICAncmVzb3VyY2VzL2pzL2FwcC5qcycsXG4gICAgICAgICAgICBdXG4gICAgICAgIH0pXG4gICAgXSxcbiAgICByZXNvbHZlOiB7XG4gICAgICAgIGFsaWFzOiB7XG4gICAgICAgICAgICAnQCc6IHBhdGguam9pbihfX2Rpcm5hbWUsICcvcmVzb3VyY2VzL2pzJyksIC8vIFx1MDQxOFx1MDQ0MVx1MDQzRlx1MDQ0MFx1MDQzMFx1MDQzMlx1MDQzQlx1MDQzNVx1MDQzRFx1MDQzRFx1MDQ0Qlx1MDQzOSBcdTA0MzBcdTA0M0JcdTA0MzhcdTA0MzBcdTA0NDFcbiAgICAgICAgICAgICd+JzogcGF0aC5qb2luKF9fZGlybmFtZSwgJy9ub2RlX21vZHVsZXMnKSxcbiAgICAgICAgfSxcbiAgICB9LFxuICAgIGJ1aWxkOiB7XG4gICAgICAgIGNodW5rU2l6ZVdhcm5pbmdMaW1pdDogMzIwMCwgLy8gXHUwNDFCXHUwNDM4XHUwNDNDXHUwNDM4XHUwNDQyIFx1MDQ0MFx1MDQzMFx1MDQzN1x1MDQzQ1x1MDQzNVx1MDQ0MFx1MDQzMCBcdTA0NDdcdTA0MzBcdTA0M0RcdTA0M0FcdTA0MzBcbiAgICB9LFxufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQTBNLFNBQVMsb0JBQW9CO0FBQ3ZPLE9BQU8sYUFBYTtBQUNwQixPQUFPLFNBQVM7QUFDaEIsT0FBTyxVQUFVO0FBSGpCLElBQU0sbUNBQW1DO0FBS3pDLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQ3hCLFNBQVM7QUFBQSxJQUNMLElBQUk7QUFBQSxNQUNBLFVBQVU7QUFBQSxRQUNOLG9CQUFvQjtBQUFBLFVBQ2hCLGlCQUFpQjtBQUFBLFFBQ3JCO0FBQUEsTUFDSjtBQUFBLElBQ0osQ0FBQztBQUFBLElBQ0QsUUFBUTtBQUFBLE1BQ0osT0FBTztBQUFBLFFBQ0g7QUFBQSxRQUNBO0FBQUEsTUFDSjtBQUFBLElBQ0osQ0FBQztBQUFBLEVBQ0w7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNMLE9BQU87QUFBQSxNQUNILEtBQUssS0FBSyxLQUFLLGtDQUFXLGVBQWU7QUFBQTtBQUFBLE1BQ3pDLEtBQUssS0FBSyxLQUFLLGtDQUFXLGVBQWU7QUFBQSxJQUM3QztBQUFBLEVBQ0o7QUFBQSxFQUNBLE9BQU87QUFBQSxJQUNILHVCQUF1QjtBQUFBO0FBQUEsRUFDM0I7QUFDSixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
