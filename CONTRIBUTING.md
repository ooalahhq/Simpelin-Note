# Mengembangkan Simpelin

Gunakan Node.js 22.13 atau lebih baru. Dari folder proyek:

```sh
npm ci
npm run dev
```

Buka http://localhost:3000. Motion Lab tersedia di `/motion-lab`.

## Sebelum mengirim perubahan

```sh
npm run format
npm run format:check
npm run typecheck
npm run lint
npm test
npm run build
```

Untuk perubahan interaksi atau tampilan, jalankan juga:

```sh
npx playwright install chromium
npm run test:e2e
```

Di Linux, instal dependensi browser dengan `npx playwright install --with-deps chromium` bila diperlukan. Server produksi dijalankan otomatis oleh konfigurasi Playwright; build harus selesai terlebih dahulu. Gunakan `npm run test:browser` bila hanya membutuhkan fixture React tanpa server.

## Menempatkan perubahan

- Komponen workspace berada di `src/components/workspace/`.
- Lifecycle editor berada di `NoteEditor.tsx`; toolbar dan node khusus berada di `src/components/editor/`.
- Logika dokumen, storage dan adapter AI berada di `src/lib/`.
- VFX berada di `src/features/motion/`; stylesheet berada di `src/styles/` dengan urutan impor pada `src/app/globals.css`.

Pertahankan DOM editor, caret, undo, dan input IME saat menambah animasi. Hormati reduced motion. Tulis tes regresi untuk perubahan perilaku dan gunakan respons provider simulasi, tanpa key atau request berbayar.

GitHub Actions memeriksa Ubuntu dan Windows pada push/pull request. Sertakan alasan perubahan dan pemeriksaan yang benar-benar dijalankan. Dokumentasi arsitektur ada di [IMPLEMENTATION](docs/IMPLEMENTATION.md); cakupan dan batas verifikasi ada di [QA](docs/QA.md).
