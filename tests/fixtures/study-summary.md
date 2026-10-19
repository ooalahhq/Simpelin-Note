# Memahami jaringan komputer

Jaringan komputer menghubungkan perangkat agar bisa bertukar data dan berbagi sumber daya. Setelah mempelajari bagian ini, kamu dapat menjelaskan perjalanan permintaan web dan membedakan peran protokol pada tiap lapisan.

## 1. Mengapa perangkat membutuhkan protokol?

**Protokol** adalah kesepakatan tentang format dan urutan pesan. Bayangkan percakapan lewat telepon: kedua pihak harus memahami bahasa yang sama dan tahu kapan berbicara atau mendengarkan. Pada jaringan, kesepakatan itu diwujudkan dalam aturan teknis.

> **Pelengkap materi:** Penjelasan berikut melengkapi istilah OSI yang baru disebut singkat dalam catatan. Model ini membantu kita membahas fungsi jaringan secara bertahap.

## 2. Model OSI dan TCP/IP

OSI membagi fungsi komunikasi menjadi **tujuh lapisan**. Lapisan adalah pembagian tugas konseptual, bukan berarti setiap perangkat menjalankan tujuh program terpisah.

| Lapisan OSI     | Peran utama                             | Contoh konsep             |
| --------------- | --------------------------------------- | ------------------------- |
| 7. Application  | Layanan komunikasi untuk aplikasi       | HTTP                      |
| 6. Presentation | Representasi dan pengodean data         | Format data               |
| 5. Session      | Mengatur dialog antarsistem             | Sesi komunikasi           |
| 4. Transport    | Pengiriman data antaraplikasi           | TCP, UDP                  |
| 3. Network      | Pengalamatan dan perutean antarjaringan | IP                        |
| 2. Data Link    | Pengiriman frame pada satu tautan       | Ethernet                  |
| 1. Physical     | Mengirim bit sebagai sinyal             | Sinyal listrik atau radio |

Model TCP/IP lazim dijelaskan dengan empat lapisan: application, transport, internet, dan link. Pemetaan ke OSI bersifat pendekatan: beberapa fungsi lapisan atas OSI digabung ke application.

## 3. TCP, UDP, dan komunikasi web

**TCP** menyediakan aliran byte yang berurutan dan mekanisme pengiriman ulang. **UDP** mengirim datagram tanpa menjanjikan pengurutan atau pengiriman ulang pada lapisan transport; aplikasi dapat menambahkan mekanisme tersebut bila diperlukan. Jadi, UDP bukan jaminan bahwa setiap aplikasi selalu lebih cepat.

### Contoh ilustratif: melihat header HTTP

Perintah berikut meminta header respons dari sebuah situs:

```bash
curl -I https://example.com
```

Opsi `-I` meminta header, bukan isi halaman. Perhatikan status respons dan nama-nama header; `https://` menunjukkan penggunaan perlindungan TLS dalam komunikasi web ini.

## Inti yang perlu diingat

- Protokol menentukan cara perangkat bertukar pesan.
- Model berlapis memisahkan tanggung jawab agar masalah lebih mudah dipahami.
- TCP dan UDP menyediakan perilaku transport yang berbeda.
- HTTP mengatur pertukaran pesan web; HTTPS melindungi komunikasi HTTP dengan TLS.

## Cek pemahaman

1. **Mengapa TCP tidak sama dengan HTTP?** TCP mengatur transport aliran byte, sedangkan HTTP mengatur pesan pada lapisan aplikasi.
2. **Mengapa OSI berguna ketika koneksi bermasalah?** Pembagian tugas membantu mempersempit pemeriksaan, misalnya dari sinyal fisik ke pengalamatan dan aplikasi.
