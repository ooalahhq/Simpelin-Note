# Arsitektur Simpelin

Simpelin memakai Next.js, React, dan TypeScript. Node.js minimal 22.13 diperlukan untuk build dan menjalankan server. Panduan pemakaian ada di [README](../README.md); panduan pengembangan di [CONTRIBUTING](../CONTRIBUTING.md).

## Komponen dan alur data

| Bagian | Tanggung jawab |
| --- | --- |
| `src/components/WorkspaceApp.tsx` | State tampilan, pemilihan catatan, koordinasi dialog, delete/Undo, dan impor. |
| `src/components/workspace/` | Sidebar, timeline, panel catatan, pencarian, dan dialog pengelolaan entitas. Callback menghubungkan komponen ke state workspace. |
| `src/components/NoteEditor.tsx` | Lifecycle Tiptap, pergantian dokumen, upload, slash commands, input/IME, dan event efek. |
| `src/components/editor/` | Toolbar beserta state seleksi, custom node gambar/callout/kode, dan daftar slash commands. |
| `src/lib/workspace.ts` | Pembaruan immutable, state terbaru, dan antrean penulisan IndexedDB. |
| `src/lib/model.ts` | Model data, pengurutan material/Summary, preferensi, dan pemulihan entitas. |
| `src/lib/backup.ts` | ZIP dokumen/aset, preview impor, remap ID, dan transaksi penyimpanan. |
| `src/features/motion/` | Koreografi, renderer PixiJS/Canvas, transisi, dan batas partikel. |

Pergantian catatan memakai `setContent` pada editor yang sama. Perubahan mode fokus mengubah ukuran panel, tanpa membuat ulang editor. Penulisan IndexedDB diserialkan agar autosave tidak saling menimpa.

## Stylesheet

`src/app/globals.css` menjadi titik masuk dengan urutan impor yang eksplisit. `src/styles/` memisahkan dasar, workspace/editor, dialog, Motion Lab, responsive rules, tema fantasy, transisi, companion, dan tabel materi belajar. Urutan cascade dipertahankan saat pemisahan.

Warna, font dan timing bersumber dari [tokens.css](../tokens.css). Aturan desain ada di [design.md](../design.md). Pembaca catatan memakai permukaan perkamen; scenery tidak masuk ke lapisan teks.

## AI

- `ai.ts` menyiapkan konteks catatan, chunking, penggabungan, dan satu retry untuk output terpotong. Topik kategori menyertai setiap tahap.
- `ai-prompts.ts` memisahkan uji koneksi, pemadatan sumber, dan penjelasan akhir. [Materi pelengkap](STUDY-SUMMARY.md) diberi label.
- `markdown.ts` membentuk JSON Tiptap dari token Markdown; HTML mentah tetap teks dan tautan disanitasi.
- `/api/ai` memvalidasi origin/payload, membatasi ukuran dan output, lalu meneruskan request ke endpoint provider yang tetap. Timeout, pembatalan, kuota, dan output parsial diteruskan sebagai kegagalan.
- Reverse proxy harus menimpa `X-Forwarded-Host` dan `X-Forwarded-Proto` dengan host/protokol publik yang benar.

Key disimpan di memori sesi secara default. Opsi Remember key memakai vault terenkripsi dengan passphrase. Server tidak menulis key atau materi ke database/log aplikasi. Tes provider memakai respons simulasi.

## Penyimpanan dan batas perilaku

Dokumen, gambar dan preferensi berada di browser pengguna. ZIP mengecualikan key dan vault. Undo dapat mengembalikan entitas dan urutannya; blob gambar dipertahankan untuk pemulihan dan belum dibersihkan otomatis. Edit beberapa tab belum memiliki mekanisme penggabungan.

Shell produksi mendaftarkan service worker untuk cache aset. API dan key tidak dicache. E2E biasa memblokir service worker agar mock request dapat diamati secara konsisten; verifikasi reload offline memerlukan pemeriksaan tersendiri.

## Verifikasi

GitHub Actions menjalankan pemeriksaan pada Ubuntu dan Windows. Daftar perintah, cakupan dan batas hasil pengujian tercatat di [QA](QA.md). Konfigurasi CI tidak dianggap sebagai bukti bahwa workflow sudah lulus.
