/* SPOS Net — i18n dictionary (ar / en) */

export const DICT = {
  ar: {
    title: 'SPOS Net — اختبار سرعة الإنترنت: تنزيل، رفع، استجابة، تذبذب',
    docTitleRun: 'جارٍ القياس… {v} — SPOS Net',

    phase: { ping: 'الاستجابة', download: 'التنزيل', upload: 'الرفع' },
    m: { ping: 'الاستجابة', jitter: 'التذبذب', loss: 'فقدان الحزم', download: 'التنزيل', upload: 'الرفع' },

    gauge: {
      idle: 'اختبار سرعة الإنترنت',
      ping: 'زمن الاستجابة',
      download: 'سرعة التنزيل',
      upload: 'سرعة الرفع',
      done: 'سرعة التنزيل',
      shared: 'نتيجة مشارَكة',
      scaleHint: 'مقياس العداد غير خطي حتى 1000 Mbps',
    },

    a: { share: 'مشاركة النتيجة', details: 'التفاصيل والإحصاءات', again: 'إعادة الاختبار' },
    sh: {
      link: 'نسخ رابط النتيجة', text: 'نسخ الملخص نصياً', png: 'حفظ كصورة PNG',
      img: 'مشاركة كصورة',
      json: 'تصدير JSON', native: 'مشاركة عبر التطبيقات',
      wa: 'مشاركة عبر واتساب', x: 'مشاركة عبر X', tg: 'مشاركة عبر تيليجرام',
    },

    s: {
      title: 'الإعدادات',
      language: 'اللغة',
      unit: 'وحدة العرض',
      duration: 'مدة كل مرحلة',
      d1: 'سريع', d2: 'قياسي', d3: 'موسّع',
      streams: 'التدفقات المتوازية',
      streamsHint: 'عدد التدفقات المتزامنة أثناء التنزيل والرفع — تُوزَّع تلقائياً على عدة اتصالات TCP مستقلة (حتى 6) لتعبئة الخط بالكامل مثل التطبيقات الاحترافية، ويمكن خفضها لمحاكاة الاستخدام الفردي.',
      loaded: 'قياس الاستجابة أثناء الحمل',
      loadedHint: 'عينات إضافية لزمن الاستجابة أثناء إشغال الخط بالتنزيل والرفع (Bufferbloat).',
      loss: 'اختبار فقدان الحزم',
      lossHint: 'إرسال دفعة طلبات قصيرة لحساب نسبة الفشل التقديرية للحزم.',
      applies: 'سيُطبَّق التغيير في الاختبار القادم',
      reset: 'استعادة الافتراضي',
      shortcuts: 'اختصارات لوحة المفاتيح',
      kStart: 'بدء/إيقاف الاختبار', kSettings: 'الإعدادات', kDetails: 'التفاصيل',
      how: 'كيف نقيس؟',
      howBody: 'يعمل التنزيل والرفع بتدفقات متوازية إلى أقرب نقطة Cloudflare، موزَّعة على عدة اتصالات TCP مستقلة (منافذ HTTPS متعددة). تبدأ الحسبة من أول بايت مستقبَل/مرسَل، وتُستبعد مرحلة تسارع TCP، ويُحسب المتوسط على النافذة المستقرة، وتُقاس الاستجابة من زمن أول بايت (TTFB).',
      whyDiff: 'لماذا قد تختلف النتيجة عن تطبيقات أخرى؟',
      whyDiffBody: 'تستخدم الأدوات المختلفة خوادم ومناهج مختلفة: بعضها يقيس إلى خادم محلي قريب من مزوّدك فيُظهر أرقاماً أعلى، بينما يقيس SPOS Net إلى أقرب نقطة Cloudflare العالمية عبر مسار واقعي شامل. فروقات صغيرة (±10%) طبيعية بين أي أداتين، أما الفروقات الكبيرة فسببها غالباً اختلاف طول المسار أو منهجية التسارع والمتوسط. يستخدم SPOS Net — مثل التطبيقات الرائدة — اتصالات متوازية متعددة لتعبئة الخط كاملاً.',
    },

    d: {
      title: 'التفاصيل والإحصاءات',
      score: 'تقييم الاتصال',
      stats: 'إحصاءات القياس',
      caps: 'ملاءمة الاستخدام',
      history: 'سجل النتائج',
      clearHistory: 'مسح السجل',
      dlAvg: 'التنزيل — المتوسط',
      dlPeak: 'التنزيل — الذروة',
      ulAvg: 'الرفع — المتوسط',
      ulPeak: 'الرفع — الذروة',
      vol: 'حجم البيانات',
      dur: 'مدة القياس',
      pingMin: 'الاستجابة — الأدنى',
      pingMed: 'الاستجابة — الوسيط',
      pingAvg: 'الاستجابة — المتوسط',
      pingMax: 'الاستجابة — الأقصى',
      jitter: 'التذبذب',
      loss: 'فقدان الحزم (تقديري)',
      loaded: 'الاستجابة أثناء الحمل',
      loadedNo: 'غير مُفعَّل',
      bloat: 'درجة Bufferbloat',
      consistency: 'ثبات التنزيل (متوسط/ذروة)',
      server: 'خادم القياس',
      proto: 'البروتوكول',
      conn: 'عنوانك',
      date: 'تاريخ الاختبار',
      connCount: 'منهجية القياس',
      resultId: 'معرّف النتيجة',
      realWorld: 'أزمنة واقعية بهذه السرعة',
      file1gb: 'تنزيل ملف 1 GB',
      file10gb: 'تنزيل لعبة 10 GB',
      film4k: 'فيلم 4K (7 GB)',
      album: 'رفع 500 MB صور',
      sec: 'ث', min: 'د', hr: 'س',
      samples: 'عينة',
      of: 'من',
      failed: 'فشلت',
    },

    cap: {
      stream4k: 'بث 4K',
      streamHD: 'بث HD',
      calls: 'مكالمات فيديو HD',
      gameComp: 'ألعاب تنافسية',
      game: 'ألعاب عادية',
      bigDl: 'تنزيل الملفات الكبيرة',
    },

    grade: { exc: 'ممتاز', vg: 'جيد جداً', good: 'جيد', fair: 'مقبول', poor: 'ضعيف' },

    v: {
      exc: 'اتصال قوي — مؤهل للبث 4K والألعاب التنافسية ومكالمات الفيديو عالية الجودة.',
      good: 'اتصال جيد — يكفي للبث HD ومكالمات الفيديو والألعاب العادية.',
      fair: 'اتصال مقبول — يكفي للتصفح والبث HD غالباً، مع حدود عند الأحمال الثقيلة.',
      poor: 'اتصال ضعيف — قد تحدث تقطّعات في البث والمكالمات.',
      bloat: 'يُلاحَظ ارتفاع ملحوظ في زمن الاستجابة أثناء الحمل (Bufferbloat).',
    },

    conn: {
      waiting: 'جارٍ التعرف على الاتصال…',
      fail: 'تعذر التعرف على الاتصال',
      ip: 'IP',
      server: 'الخادم',
    },

    t: {
      copied: 'تم النسخ',
      copyFail: 'تعذر النسخ',
      aborted: 'تم إيقاف الاختبار',
      netErr: 'تعذر الوصول إلى خادم القياس — تحقق من اتصالك',
      noData: 'لم تُستقبل أي بيانات أثناء القياس',
      saved: 'تم حفظ الملف',
      resetDone: 'أُعيدت الإعدادات الافتراضية',
      cleared: 'تم مسح السجل',
      installed: 'تم تثبيت التطبيق',
      iosInstall: 'في سفاري: زر المشاركة ⬆︎ ثم «إضافة إلى الشاشة الرئيسية»',
      imgFallback: 'تم حفظ الصورة — شاركها من معرض الصور',
      online: 'عاد الاتصال بالإنترنت',
      offline: 'لا يوجد اتصال بالإنترنت — قد لا تكون النتائج دقيقة',
      sharedNote: 'تعرض هذه النتيجة مشارَكة من جهاز آخر',
      runYours: 'أجرِ اختبارك',
    },

    f: { tag: 'أداة مفتوحة المصدر لقياس سرعة الإنترنت', dev: 'من تطوير', install: 'تثبيت' },

    aria: {
      settings: 'الإعدادات', close: 'إغلاق', gauge: 'عداد السرعة',
      metrics: 'النتائج', start: 'ابدأ الاختبار', stop: 'إيقاف الاختبار',
    },

    u: { mbps: 'Mbps', mbytes: 'MB/s', kbps: 'kbps' },
    monthNames: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
  },

  en: {
    title: 'SPOS Net — Internet Speed Test: Download, Upload, Latency, Jitter',
    docTitleRun: 'Testing… {v} — SPOS Net',

    phase: { ping: 'Latency', download: 'Download', upload: 'Upload' },
    m: { ping: 'Ping', jitter: 'Jitter', loss: 'Packet loss', download: 'Download', upload: 'Upload' },

    gauge: {
      idle: 'Internet Speed Test',
      ping: 'Latency',
      download: 'Download speed',
      upload: 'Upload speed',
      done: 'Download speed',
      shared: 'Shared result',
      scaleHint: 'Non-linear dial scale up to 1000 Mbps',
    },

    a: { share: 'Share result', details: 'Details & stats', again: 'Test again' },
    sh: {
      link: 'Copy result link', text: 'Copy summary text', png: 'Save as PNG',
      img: 'Share as image',
      json: 'Export JSON', native: 'Share via apps',
      wa: 'Share via WhatsApp', x: 'Share via X', tg: 'Share via Telegram',
    },

    s: {
      title: 'Settings',
      language: 'Language',
      unit: 'Display unit',
      duration: 'Phase duration',
      d1: 'Quick', d2: 'Standard', d3: 'Thorough',
      streams: 'Parallel streams',
      streamsHint: 'Concurrent streams during download/upload — automatically spread across up to 6 independent TCP connections to fill the line like professional test apps; lower it to mimic single-stream usage.',
      loaded: 'Measure latency under load',
      loadedHint: 'Extra latency samples while the line is busy (bufferbloat).',
      loss: 'Packet loss test',
      lossHint: 'Sends a burst of short requests to estimate the failure rate.',
      applies: 'Will apply on the next test',
      reset: 'Reset to defaults',
      shortcuts: 'Keyboard shortcuts',
      kStart: 'start/stop the test', kSettings: 'settings', kDetails: 'details',
      how: 'How we measure',
      howBody: 'Download and upload run as parallel streams to the nearest Cloudflare edge, spread across several independent TCP connections (multiple HTTPS ports). The clock starts at the first byte, the TCP ramp-up window is excluded, the average is taken over the stable window, and latency is measured as time-to-first-byte.',
      whyDiff: 'Why can results differ from other apps?',
      whyDiffBody: 'Tools differ in servers and methods: some test against an ISP-local server over a short path and therefore show higher numbers, while SPOS Net measures to the nearest global Cloudflare edge over a realistic end-to-end path. Small differences (±10%) are normal between any two tools; large gaps usually come from path length or ramp-up/averaging methods. Like leading apps, SPOS Net uses multiple parallel connections to fill the line.',
    },

    d: {
      title: 'Details & stats',
      score: 'Connection score',
      stats: 'Measurement statistics',
      caps: 'Suitability',
      history: 'Test history',
      clearHistory: 'Clear history',
      dlAvg: 'Download — average', dlPeak: 'Download — peak',
      ulAvg: 'Upload — average', ulPeak: 'Upload — peak',
      vol: 'Data volume', dur: 'Test duration',
      pingMin: 'Ping — min', pingMed: 'Ping — median', pingAvg: 'Ping — avg', pingMax: 'Ping — max',
      jitter: 'Jitter',
      loss: 'Packet loss (est.)',
      loaded: 'Latency under load',
      loadedNo: 'Not enabled',
      bloat: 'Bufferbloat grade',
      consistency: 'Download consistency (avg/peak)',
      server: 'Test server', proto: 'Protocol', conn: 'Your address', date: 'Test date',
      connCount: 'Measurement method',
      resultId: 'Result ID',
      realWorld: 'Real-world times at this speed',
      file1gb: '1 GB file download',
      file10gb: '10 GB game download',
      film4k: '4K movie (7 GB)',
      album: 'Upload 500 MB of photos',
      sec: 's', min: 'min', hr: 'h',
      samples: 'samples', of: 'of', failed: 'failed',
    },

    cap: {
      stream4k: '4K streaming', streamHD: 'HD streaming', calls: 'HD video calls',
      gameComp: 'Competitive gaming', game: 'Casual gaming', bigDl: 'Large downloads',
    },

    grade: { exc: 'Excellent', vg: 'Very good', good: 'Good', fair: 'Fair', poor: 'Poor' },

    v: {
      exc: 'Strong connection — ready for 4K streaming, competitive gaming and HD video calls.',
      good: 'Good connection — enough for HD streaming, video calls and casual gaming.',
      fair: 'Fair connection — fine for browsing and mostly HD streaming; struggles under heavy load.',
      poor: 'Weak connection — expect interruptions in streaming and calls.',
      bloat: 'Latency rises noticeably under load (bufferbloat).',
    },

    conn: { waiting: 'Identifying connection…', fail: 'Could not identify connection', ip: 'IP', server: 'Server' },

    t: {
      copied: 'Copied', copyFail: 'Copy failed', aborted: 'Test stopped',
      netErr: 'Could not reach the measurement server — check your connection',
      noData: 'No data was received during the test',
      saved: 'File saved', resetDone: 'Settings restored', cleared: 'History cleared',
      installed: 'App installed',
      iosInstall: 'In Safari: tap Share ⬆︎ then “Add to Home Screen”',
      imgFallback: 'Image saved — share it from your gallery',
      online: 'Back online',
      offline: 'You are offline — results may not be accurate',
      sharedNote: 'This result was shared from another device',
      runYours: 'Run your own test',
    },

    f: { tag: 'Open-source internet speed test', dev: 'Developed by', install: 'Install' },

    aria: {
      settings: 'Settings', close: 'Close', gauge: 'Speed gauge',
      metrics: 'Results', start: 'Start test', stop: 'Stop test',
    },

    u: { mbps: 'Mbps', mbytes: 'MB/s', kbps: 'kbps' },
    monthNames: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  },
};

let lang = 'ar';

export function getLang() { return lang; }

export function setLang(l) {
  lang = DICT[l] ? l : 'ar';
  return lang;
}

export function t(path) {
  let node = DICT[lang];
  for (const k of String(path).split('.')) {
    if (node == null) return path;
    node = node[k];
  }
  return node ?? path;
}
