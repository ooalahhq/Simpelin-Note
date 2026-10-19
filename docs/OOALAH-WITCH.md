# Ooalah witch

## Asset dan integrasi

- Asal aset: ilustrasi dibuat dengan bantuan AI (image generation). Prompt sumber disimpan di bawah untuk dokumentasi aset.
- Asset final: [`public/characters/ooalah-witch-sprites.png`](../public/characters/ooalah-witch-sprites.png).
- PNG RGBA 1536 × 1024, empat kolom dan dua baris; tiap sel 384 × 512.
- Baris pertama: empat pose idle, termasuk kedipan. Baris kedua: empat pose melambaikan tangan.
- Transparansi diperiksa: alpha 0 pada background, dimensi dan pembagian grid sesuai. Sprite sumber dipakai tanpa recolor atau crop destruktif.
- Komponen: [`OoalahWitch.tsx`](../src/components/OoalahWitch.tsx), dipasang sebagai sibling sidebar tanpa slot layout atau tombol karakter permanen. Tampilan 90 × 120 dengan `image-rendering: pixelated`, CSS atlas frames, kedipan dan breathing kecil. Meluncur dari balik batas kanan sidebar ke sisi kiri area kerja, memberi tip, lalu mundur kembali. Pada mobile, bubble berada di atas karakter agar tetap muat di layar kecil.
- Kemunculan pertama: 14 detik setelah sprite siap dan navigasi terlihat, dengan minimal 8 detik tanpa input. Tip berikutnya berjarak minimal 150 detik. Maksimal tiga kemunculan per sesi tab; hitungan dan cooldown disimpan di sessionStorage, terpisah dari catatan. Tip bergantian: pencarian, slash command blok kode, dan ekspor cadangan.
- Perkenalan **“Hai, aku Ooalah witch.”** hanya menyertai kemunculan pertama; penandanya dicatat di localStorage saat tip benar-benar ditampilkan. Lambaian dua siklus saat muncul, kemudian idle.
- Tip menutup otomatis setelah sembilan detik, bisa ditutup dengan tombol atau Escape. Timer penutupan berhenti selama hover/fokus keyboard, lalu dimulai kembali setelah ditinggalkan. Kemunculan tidak mengambil fokus keyboard.
- Input keyboard/paste dan composition/IME menunda kemunculan dan menyembunyikan tip yang sedang tampil. Focus Mode, editor diperbesar, dialog pengaturan/AI/pencarian/manajemen, tab browser tersembunyi, dan navigasi mobile tertutup menonaktifkan tips sementara. Saat aktif kembali, tunggu setidaknya 14 detik.
- Reduced motion OS/manual menghentikan animasi sprite dan memakai fade tanpa geser. Saat tersembunyi, sprite tidak beranimasi dan kontrol bubble `inert`/tersembunyi dari pembaca layar. Tidak ada JavaScript idle render loop atau suara otomatis.
- Service worker produksi memasukkan asset karakter dalam cache shell; belum diverifikasi offline pada browser asli di lingkungan ini.

<details>
<summary>Prompt sumber aset</summary>

```text
Use case: game-asset. Asset type: production pixel-art character animation sprite atlas for a fantasy note-taking web app. Create Ooalah witch, an original friendly adult chibi pixel witch in sage-green clothing. She has a large floppy pointed sage-green witch hat, a sage cloak and dress with darker moss shadows, a small bronze clasp, ivory silver hair, warm light skin, brown boots, and a wooden staff topped by a tiny amber crystal. Warm readable silhouette, 16-bit fantasy RPG pixel art with crisp square pixel clusters, no anti-aliasing, no painterly rendering. Full body, three-quarter view facing toward the right, expressive kind face. Actual transparent background, no ground, no shadow outside her sprite. IMPORTANT ATLAS COMPOSITION: one landscape sprite sheet 1536x1024 pixels, exactly FOUR equal columns and TWO equal rows, eight cells of exactly 384x512. NO margins between cells, no drawn grid. Every frame contains the SAME witch at the SAME scale, feet registered at the same position inside each cell, staff fully inside cell, generous transparent padding on all four sides so no clipping. Top row columns 1-4: four subtle seamless idle animation frames: neutral breathing, gentle cloak/hat sway, a blink, breathing returns. Bottom row columns 1-4: four friendly hand-wave animation frames: free hand lifts, hand waves right, hand waves left, hand lowers. Staff remains held in other hand. Keep feet, face, hat and body aligned across frames, animate only enough for a polished compact UI companion. No text, no labels, no words, no watermark, no character variations. This is a raster sprite atlas used via CSS background-position, not a mockup.
```

</details>
