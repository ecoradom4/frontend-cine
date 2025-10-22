// src/vite-env.d.ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: 'https://backend-cine-b0xw.onrender.com'
  // puedes agregar más variables de entorno aquí si las necesitas
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}