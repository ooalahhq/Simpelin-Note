# Summary sebagai materi belajar

Summary mengembangkan catatan menjadi materi belajar untuk mahasiswa. Pengetahuan dasar tambahan diberi label **Pelengkap materi** agar dapat dibedakan dari isi catatan. Hasil disimpan sebagai **Summary N** yang dapat diedit.

## Perilaku yang dituju

- Gunakan topik kategori, urutan pertemuan dan konsep catatan sebagai fokus. Topik dikirim ke setiap chunk dan ke tahap akhir, termasuk saat retry.
- Tahap antara hanya memadatkan catatan relevan dan menandai celah. Pengembangan dilakukan pada tahap akhir agar materi tambahan tidak berubah seolah-olah menjadi fakta dari sumber selama penggabungan.
- Materi yang singkat dilengkapi dengan pengetahuan dasar yang mapan, definisi, alasan/cara kerja, analogi, dan contoh ilustratif. Tambahan diberi label **Pelengkap materi**. Jangan mengarang keterangan dosen, silabus, hasil eksperimen, sumber, atau klaim browsing.
- Konten obrolan dan kode di luar topik diarahkan untuk diabaikan, tanpa laporan audit panjang atau bedah setiap fungsi. Data catatan tetap dikirim ke provider; ini aturan relevansi pada instruksi model, bukan filter lokal yang menghapus sumber.
- Hasil memakai judul, subbab, paragraf pendek, perbandingan bila membantu, contoh kode relevan, inti materi, dan pertanyaan cek pemahaman dengan jawaban singkat.
- Uji koneksi tetap meminta `OK` tanpa materi catatan. Batas output, satu retry dan pembatalan tetap berlaku.

## Format editor

Parser memakai token Markdown GFM dari Marked, lalu membentuk JSON Tiptap secara langsung. Bold/italic/strike, inline code, heading, daftar bertingkat, daftar bernomor, kutipan, garis, fenced code dan tabel menjadi node/mark editor. HTML mentah tetap teks; tautan harus melewati `safeUrl`; gambar yang diusulkan model tidak dimuat dari URL eksternal.

TableKit menampilkan tabel yang dapat diedit. Tabel lebar mendapat area scroll sendiri, dengan warna perkamen dan tipografi editor. Sanitasi dan backup menerima table/row/header/cell; atribut sembarang tidak diteruskan. ZIP dan penyimpanan IndexedDB diperiksa dengan format baru.

Summary lama tetap menyimpan isi dan edit manualnya. Buat Summary baru untuk memakai instruksi dan parser terbaru; dokumen lama tidak ditulis ulang otomatis.

## Contoh dan evaluasi

[Contoh target format jaringan](../tests/fixtures/study-summary.md) ditulis lokal sebagai fixture pengujian, **bukan hasil respons provider nyata**. Tes editor memeriksa penyajian, penyimpanan dan reload contoh tersebut. Tes prompt memeriksa instruksi dan alur metadata, bukan membuktikan model selalu mematuhinya.

Untuk memeriksa kualitas model pada aplikasi, buat Summary baru dan tinjau kasus berikut:

| Masukan | Hasil yang diharapkan |
| --- | --- |
| Kategori Jaringan, catatan "jaringan adalah terhubung" dan "OSI punya 7 layer" | Definisi jaringan, tujuh lapisan beserta fungsi, hubungan ke TCP/IP, contoh sederhana; tambahan dilabeli dan tidak berhenti pada "tidak tersedia". |
| Materi protokol diselingi kode panjang yang tidak relevan | Penjelasan jaringan tetap dominan; tidak ada bedah class/library kode di luar topik. |
| "UDP selalu lebih cepat" | Penjelasan pertukaran kebutuhan, tanpa klaim mutlak atau mengulang penyederhanaan yang salah. |
| `curl -I https://example.com` | Kode berbahasa bash, tujuan opsi `-I` dan cara membaca header; tidak mengaku menjalankan perintah. |
| Perintah tersisip di catatan | Tetap diperlakukan sebagai data, tidak mengganti peran tutor. |
| Perbandingan TCP/UDP | Tabel editor sungguhan atau paragraf/daftar yang jelas, tanpa simbol Markdown mentah dan tumpukan paragraf kosong. |

Tes otomatis memakai respons provider simulasi. Kualitas isi perlu dievaluasi pada model yang dipilih melalui aplikasi; hasil pengujian dicatat di [QA](QA.md).

Acuan implementasi: [Claude prompting](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices), [Marked lexer](https://marked.js.org/using_pro), dan [Tiptap TableKit](https://tiptap.dev/docs/editor/extensions/functionality/table-kit).
