# Pengujian

## Perintah

```sh
npm ci
npm run format:check
npm run typecheck
npm run lint
npm test
npm run build
```

Tes browser terhadap server produksi (server dimulai dan dihentikan oleh Playwright):

```sh
npx playwright install chromium
npm run test:e2e
```

Di Linux, gunakan `npx playwright install --with-deps chromium` jika dependensi sistem belum tersedia. Perintah npm di atas juga dapat dijalankan melalui Command Prompt Windows.

`npm run test:browser` menyediakan pemeriksaan browser dengan bundle React dan route interception tanpa server HTTP. `npm run test:e2e -- --list` hanya memuat konfigurasi dan mendaftar skenario; perintah tersebut tidak menjalankan browser.

## Cakupan

| Area | Pemeriksaan |
| --- | --- |
| Workspace | CRUD, pengurutan, nomor Summary, delete/Undo, autosave dan persistensi. |
| Editor | Stabilitas DOM saat berpindah catatan/fokus, format teks, Enter, gambar, tabel dan reload. |
| Dokumen | Markdown, schema Tiptap, HTML/tautan tak tepercaya, ZIP dan remap aset. |
| AI | Origin/proxy, payload, instruksi per tahap, konteks tanpa Summary lama, batas output, retry dan abort. |
| Vault | Enkripsi/dekripsi, passphrase salah, dan pengecualian key dari ekspor. |
| Motion | Seed, budget partikel, geometri, reduced motion, penghentian render dan transisi. |
| Witch | Idle delay, cooldown, IME, visibility, focus/dialog pause, penutupan dan cleanup timer. |
| Browser | Pengetikan/shortcut native, CRUD, Summary, gambar/ZIP, Motion Lab, tabel, dan viewport 320/375/414/768 px. |

Tes DOM memakai editor Tiptap/ProseMirror asli, fake-indexeddb, dan renderer VFX simulasi. Tes AI tidak menjalankan request berbayar. [Fixture materi belajar](../tests/fixtures/study-summary.md) memeriksa format dan penyimpanan, bukan kualitas model nyata.

## CI Windows dan Linux

[Workflow CI](../.github/workflows/ci.yml) memakai Node.js 22 pada `ubuntu-latest` dan `windows-latest`. Setiap job memeriksa format, tipe, lint, unit/DOM tests, build produksi dan browser integration. Hasil browser, trace kegagalan, dan screenshot responsif tersedia sebagai artifact per sistem operasi.

Playwright menjalankan satu worker dengan timeout keseluruhan dan satu retry di CI. Service worker diblokir agar request pengujian mencapai mock provider; tidak diperlukan API key. CI tidak menerbitkan atau melakukan deployment aplikasi.

## Status verifikasi lokal

- **100 tes unit/DOM lulus** dalam 14 berkas pada mode CI setelah refaktor.
- Format, typecheck, lint, build produksi, dan browser bundle lulus. Konfigurasi browser berhasil memuat 13 skenario; eksekusinya belum diverifikasi lokal.
- Pengujian Windows dan eksekusi browser penuh belum memiliki hasil di lingkungan pengembangan ini: socket server dan peluncuran Chrome diblokir sandbox. Workflow yang disediakan harus dijalankan di GitHub untuk mendapatkan hasil lintas sistem operasi.
- Kualitas materi AI, input IME native, frame time, dan reload service worker offline tetap perlu diuji pada perangkat/model yang digunakan.

Untuk mencoba model nyata, gunakan tombol Uji koneksi dan AI Summary dengan key sendiri. Kegagalan provider tidak boleh membuat hasil Summary palsu. Kriteria penilaian isi ada di [STUDY-SUMMARY.md](STUDY-SUMMARY.md).
