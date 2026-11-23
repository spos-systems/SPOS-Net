# SPOS Net

**اختبار سرعة إنترنت مفتوح المصدر — An open-source internet speed test**

قياس احترافي كامل: سرعة التنزيل والرفع، زمن الاستجابة (خامل وأثناء الحمل)، التذبذب، وفقدان الحزم التقديري — مع رسم بياني حي، درجة Bufferbloat، وخيارات متقدمة ومشاركة وتصدير النتائج.

A complete professional measurement: download and upload speed, latency (idle and under load), jitter and estimated packet loss — with a live speed graph, a bufferbloat grade, advanced options, sharing and export.

**الرابط / Live**: <https://net.spos.ly/> (نطاق فرعي من spos.ly — a subdomain of spos.ly)

---

## المزايا | Features

| | |
|---|---|
| محرك متعدد الاتصالات | حتى 6 اتصالات TCP مستقلة (منافذ HTTPS متعددة) — نفس منهجية التطبيقات الرائدة لتعبئة الخط كاملاً، مع تسخين الاتصالات مسبقاً ورفع بقياس لحظي (`upload.onprogress`)
| سرعة التنزيل والرفع | تدفقات متوازية، حسبة من أول بايت، استبعاد مرحلة التسارع، **نتيجة بمنهجية أدوات القياس العالمية الموثقة** (استبعاد الأبطأ ~22% وحذف أسرع عينتين) + المستدام والذروة |
| رسم بياني حي | مخطط فوري لسرعة التنزيل والرفع أثناء الاختبار |
| زمن الاستجابة | أدنى / وسيط / متوسط / أقصى (زمن أول بايت) |
| التذبذب | متوسط الفروق بين العينات المتتالية |
| فقدان الحزم | تقدير عبر دفعة طلبات قصيرة (تقدير HTTP) |
| الاستجابة أثناء الحمل | درجة Bufferbloat من A+ إلى F مع مقدار الزيادة |
| معرّف النتيجة | رمز قصير (SP-XXXXXXXX) لكل نتيجة في التفاصيل والبطاقة والروابط |
| أزمنة واقعية | زمن تنزيل ملف 1GB / لعبة 10GB / فيلم 4K ورفع 500MB صور من سرعتك الفعلية |
| خيارات احترافية | الوحدة، مدة المراحل (8/12/20 ث)، عدد التدفقات (1–16)، مفاتيح تفعيل |
| المشاركة والتصدير | صورة نتيجة بثلاث صيغ (مربع 1:1 / طولي 9:16 / عريض 16:9) مع معاينة حية، رابط نتيجة، ملخص نصي، PNG، JSON، واتساب / X / تيليجرام، مشاركة نظامية |
| معلومات الاتصال | IP (مقنّع افتراضياً)، المزود/ASN، الخادم، البروتوكول، نوع الشبكة، الاستجابة أثناء التنزيل/الرفع — لوحة في الصفحة الرئيسية بعد الاختبار |
| تقييم الاتصال | درجة 0–100 + خلاصة بشرية + ملاءمة الاستخدام (بث 4K، مكالمات، ألعاب…) |
| سجل النتائج | آخر 20 اختباراً محلياً في المتصفح فقط — يظهر في الصفحة الرئيسية مع مخطط اتجاه وأفضل سرعة وتصدير CSV |
| اختصارات ومعاملات | `Space` بدء/إيقاف · `S` الإعدادات · `D` التفاصيل · `?lang=ar\|en` · `?auto=1` بدء تلقائي |
| PWA كامل | يعمل بلا اتصال بعد أول زيارة (service worker)، زر تثبيت دائم في الشريط العلوي مع دليل خطوات لكل منصة (أندرويد/iPhone/سطح المكتب) |
| شعار الشركة | شعار SPOS في الترويسة والتذييل وبطاقة المشاركة |

خط عربي حديث (IBM Plex Sans Arabic) مستضاف ذاتياً · Zero dependencies · No build step · No ads · No tracking · MIT license

## الصفحة | Screenshots

<p align="center">
  <img src="docs/screenshots/desktop-ar.png" width="860" alt="SPOS Net — desktop (Arabic)">
  <br>
  <img src="docs/screenshots/result-ar.png" width="860" alt="SPOS Net — result">
  <br>
  <img src="docs/screenshots/mobile-ar.png" width="300" alt="SPOS Net — mobile (Arabic)">
</p>

## كيف يعمل؟ | How it works

الموقع ثابت بالكامل (HTML/CSS/JS بدون أي مكتبات) ويجري كل القياسات من متصفح الزائر نحو نقاط قياس Cloudflare العامة المفعّل بها CORS:

- `GET /__down?bytes=N` — تنزيل واستجابة (على المنافذ 443 / 2053 / 2083 / 2087 / 2096 / 8443 — المنافذ المتعددة تفتح اتصالات TCP مستقلة)
- `POST /__up` — رفع بقياس لحظي للتقدم
- `GET /meta` — معلومات الاتصال (مع بديل احتياطي عبر ترويسات `cf-meta-*`)

لا حسابات، لا إعلانات، لا تسجيل على الخادم — والسجل والإعدادات لا تغادر المتصفح. التفاصيل الكاملة في [llms-full.txt](llms-full.txt).

### معاملات URL | URL parameters

| المعامل | الوصف |
|---|---|
| `?lang=ar` أو `?lang=en` | فتح الأداة بلغة محددة |
| `?auto=1` | بدء الاختبار تلقائياً بعد التحميل (أكشاك / تضمين) |
| `#r=…` | رابط نتيجة مشارَكة (ينشئه زر المشاركة) |

## التشغيل محلياً | Run locally

```bash
git clone https://github.com/spos-systems/SPOS-Net.git
cd SPOS-Net
python3 -m http.server 8000
# open http://localhost:8000
```

## البنية | Structure

```
index.html              الصفحة الوحيدة (شاشة واحدة)
assets/css/style.css    نظام التصميم
assets/css/fonts.css    خطوط ذاتية الاستضافة (IBM Plex Sans Arabic)
assets/js/engine.js     محرك القياس متعدد الاتصالات
assets/js/gauge.js      العداد الدائري (SVG)
assets/js/i18n.js       العربية / English
assets/js/app.js        واجهة التحكم
sw.js                   service worker (PWA بلا اتصال)
manifest.webmanifest    بيان التطبيق للتثبيت
llms.txt, llms-full.txt توثيق لمحرّكات الذكاء الاصطناعي (GEO)
```

## المساهمة | Contributing

انظر [CONTRIBUTING.md](CONTRIBUTING.md). التقارير الأمنية في [SECURITY.md](SECURITY.md).

## الترخيص | License

[MIT](LICENSE) © SPOS — [صولة للأنظمة](https://spos.ly)

<p align="center"><sub>من تطوير صولة للأنظمة SPOS · spos.ly</sub></p>
