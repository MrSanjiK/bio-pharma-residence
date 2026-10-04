# Bio Pharma Residence — taqdimot sayti

Imarat Development loyihasi uchun 35 slayddan iborat taqdimot sayti va undan olingan chop etishga tayyor PDF fayllar.

## Tuzilma

| Fayl | Vazifasi |
| --- | --- |
| `index.html` | Barcha slaydlar (35 ta, 8 bo‘lim) |
| `css/site.css` | Dizayn tizimi: 1920×1080 kanvas, ekran, telefon va chop etish rejimlari |
| `js/site.js` | Navigatsiya, mundarija (`M`), raqamlar animatsiyasi, lightbox, diagramma |
| `assets/opt/` | Sayt va PDF uchun optimallashtirilgan rasmlar (asl nusxalar `assets/` da) |
| `assets/fonts/` | Fraunces va Manrope shriftlari (lokal, oflayn va chop etish uchun) |
| `Bio_Pharma_Residence_A4.pdf` | A4 albom formatida, chop etish uchun |
| `Bio_Pharma_Residence_16x9.pdf` | 16:9 formatda, ekran va proyektor uchun |

## PDF’ni qayta yaratish

```bash
npm run pdf        # ikkala format
npm run pdf:a4     # faqat A4
npm run pdf:169    # faqat 16:9
```

Skript (`tools/export-pdf.cjs`) Playwright yoki Puppeteer orqali Chromium’da `index.html?pdf` sahifasini ochadi: har bir slayd bitta sahifaga to‘liq, animatsiyalarsiz chiqadi. Saytni brauzerda `Ctrl+P` bilan chop etish ham xuddi shu A4 tartibini beradi.

## Rasmlar

`npm run images` (`tools/optimize-images.py`, Pillow kerak) `assets/` dagi asl rasmlardan `assets/opt/` ga optimallashtirilgan nusxalarni yaratadi. Maktab interyeri kollaji olti alohida xonaga bo‘linadi. `genplan-full.jpg` va `genplan-edu.jpg` bosh reja PDF chizmasidan (A1) olingan va qo‘lda saqlangan.

## Ma’lumot manbalari

- Bosh reja (AutoCAD, A1): 13,98 ga hudud, 11 184 xonadon, 11 402 avtoturargoh, 469 686 m² turar joy maydoni, 50 blok, maktab (640 o‘rin) va MTM (360 o‘rin).
- Bloklar va balkonlar maydoni hisobi: 489 390 m² umumiy maydon; balkonlar (43 695 m²) chegirilib, jalyuzi (1/3) qo‘shilgach 460 260 m².
- Maktab va bog‘cha maydoni hisobi: maktab ~5 240 m² (4/3 qavat), bog‘cha ~1 520 m² (2 qavat), aniqlik ±2%.
