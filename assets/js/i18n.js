/* SPOS Net — i18n dictionary (ar / en) */

export const DICT = {
  ar: {
    title: 'SPOS Net — اختبار سرعة الإنترنت: تنزيل، رفع، استجابة، تذبذب',
    docTitleRun: 'جارٍ القياس… {v} — SPOS Net',

    phase: { ping: 'الاستجابة', download: 'التنزيل', upload: 'الرفع' },
    m: { ping: 'الاستجابة', jitter: 'التذبذب', loss: 'فقدان الحزم', download: 'التنزيل', upload: 'الرفع' },

    gauge: {
      idle: 'اختبار سرعة الإنترنت',
      hint: 'اضغط لبدء الاختبار',
      ping: 'زمن الاستجابة',
      download: 'سرعة التنزيل',
      upload: 'سرعة الرفع',
      done: 'سرعة التنزيل',
      shared: 'نتيجة مشارَكة',
      scaleHint: 'مقياس العداد غير خطي حتى 1000 Mbps',
    },

    a: { share: 'مشاركة النتيجة', details: 'التفاصيل والإحصاءات', again: 'إعادة الاختبار' },
    sh: {
      title: 'مشاركة النتيجة',
      fmt: 'صيغة الصورة',
      fmtSquare: 'مربع', fmtPortrait: 'طولي', fmtLandscape: 'عريض',
      link: 'نسخ الرابط', text: 'نسخ النص', png: 'حفظ PNG',
      img: 'مشاركة كصورة',
      json: 'تصدير JSON', native: 'مشاركة عبر التطبيقات',
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
      howBody: 'يعمل التنزيل والرفع بتدفقات متوازية موزَّعة على عدة اتصالات TCP مستقلة، مع استبعاد مرحلة التسارع، ثم حساب النتيجة بمنهجية الوسط المقتطع المعتمدة عالمياً: ترتيب العينات، استبعاد الأبطأ (~22%)، حذف أسرع عينتين، ومتوسط الباقي.',
      whyDiff: 'لماذا قد تختلف النتيجة عن تطبيقات أخرى؟',
      whyDiffBody: 'نعتمد منهجية الوسط المقتطع المعتمدة في أشهر أدوات قياس السرعة عالمياً: تُستبعد أبطأ العينات وأسرعها ثم يُحسب وسط الباقي، لذا قد تختلف نتيجتنا قليلاً عن أدوات تعرض المتوسط البسيط',
    },

    d: {
      title: 'التفاصيل والإحصاءات',
      score: 'تقييم الاتصال',
      stats: 'إحصاءات القياس',
      caps: 'ملاءمة الاستخدام',
      history: 'سجل النتائج',
      clearHistory: 'مسح السجل',
      dlAvg: 'التنزيل — المتوسط',
      dlSustained: 'التنزيل — المستدام',
      dlPeak: 'التنزيل — الذروة',
      ulAvg: 'الرفع — المتوسط',
      ulSustained: 'الرفع — المستدام',
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
      title: 'ملاءمة الاستخدام',
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

    c: {
      title: 'معلومات الاتصال',
      ip: 'عنوان IP',
      ipShow: 'إظهار',
      ipHide: 'إخفاء',
      isp: 'مزود الخدمة',
      asn: 'المشغّل (ASN)',
      server: 'خادم القياس',
      proto: 'البروتوكول',
      net: 'نوع الشبكة',
      loadedDl: 'الاستجابة أثناء التنزيل',
      loadedUl: 'الاستجابة أثناء الرفع',
      bloat: 'درجة الاستجابة (Bufferbloat)',
    },

    h: {
      title: 'آخر القياسات',
      clear: 'مسح',
      clearConfirm: 'اضغط مجدداً للمسح',
      note: 'تُحفظ القياسات على جهازك فقط ولا تُرسَل إلى أي خادم.',
      csvAria: 'تصدير CSV',
      best: 'أفضل سرعة',
      count: 'قياس',
    },

    ins: {
      title: 'تثبيت التطبيق',
      aria: 'تثبيت التطبيق',
      do: 'تثبيت الآن',
      blurb: 'اختبار السرعة كتطبيق — يعمل من الشاشة الرئيسية، يفتح فوراً ويعرض آخر نتائجك حتى دون اتصال.',
      iosTitle: 'على iPhone (سفاري):',
      ios1: 'اضغط زر المشاركة',
      ios2: 'مرر واختر «إضافة إلى الشاشة الرئيسية»',
      ios3: 'اضغط «إضافة» — ستجد التطبيق على شاشتك',
      andTitle: 'على أندرويد (كروم):',
      and1: 'افتح قائمة النقاط الثلاث ⋮ أعلى المتصفح',
      and2: 'اختر «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية»',
      and3: 'أو استخدم زر «تثبيت الآن» بالأسفل إن ظهر',
      deskTitle: 'على الكمبيوتر:',
      desk1: 'اضغط أيقونة التثبيت في شريط العنوان',
      desk2: 'أو من قائمة المتصفح اختر «تثبيت SPOS Net»',
      otherTitle: 'إضافة يدوية',
      other1: 'أضف الصفحة إلى المفضلة أو الشاشة الرئيسية من قائمة المتصفح',
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
      dismissed: 'يمكنك تثبيت التطبيق لاحقاً من زر «تثبيت» بالأعلى',
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

    cap: {
      stream4k: '4K streaming', streamHD: 'HD streaming', calls: 'HD video calls',
      gameComp: 'Competitive gaming', game: 'Casual gaming', bigDl: 'Large downloads',
      title: 'Suitability',
    },

    gauge: {
      idle: 'Internet Speed Test',
      hint: 'Tap to start the test',
      ping: 'Latency',
      download: 'Download speed',
      upload: 'Upload speed',
      done: 'Download speed',
      shared: 'Shared result',
      scaleHint: 'Non-linear dial scale up to 1000 Mbps',
    },

    a: { share: 'Share result', details: 'Details & stats', again: 'Test again' },
    sh: {
      title: 'Share result',
      fmt: 'Image format',
      fmtSquare: 'Square', fmtPortrait: 'Portrait', fmtLandscape: 'Wide',
      link: 'Copy link', text: 'Copy text', png: 'Save PNG',
      img: 'Share as image',
      json: 'Export JSON', native: 'Share via apps',
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
      howBody: 'Download and upload run as parallel streams spread across several independent TCP connections, the ramp-up window is excluded, and the final figure follows the industry-standard trimmed-mean method: samples are sorted, the slowest ~22% are discarded, the two fastest are removed, and the mean of the rest is reported.',
      whyDiff: 'Why can results differ from other apps?',
      whyDiffBody: 'We compute the final number with the trimmed-mean methodology used by the major global speed-test tools: the slowest samples and the two fastest are discarded, then the mean of the rest is reported — so our figure can differ slightly from tools that show a plain average',
    },

    d: {
      title: 'Details & stats',
      score: 'Connection score',
      stats: 'Measurement statistics',
      caps: 'Suitability',
      history: 'Test history',
      clearHistory: 'Clear history',
      dlAvg: 'Download — average', dlSustained: 'Download — sustained', dlPeak: 'Download — peak',
      ulAvg: 'Upload — average', ulSustained: 'Upload — sustained', ulPeak: 'Upload — peak',
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
      title: 'Suitability',
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

    c: {
      title: 'Connection info',
      ip: 'IP address',
      ipShow: 'Show', ipHide: 'Hide',
      isp: 'ISP',
      asn: 'Network (ASN)',
      server: 'Test server',
      proto: 'Protocol',
      net: 'Network type',
      loadedDl: 'Latency while downloading',
      loadedUl: 'Latency while uploading',
      bloat: 'Responsiveness (Bufferbloat)',
    },

    h: {
      title: 'Recent tests',
      clear: 'Clear',
      clearConfirm: 'Tap again to clear',
      note: 'Tests are stored on your device only and never sent to any server.',
      csvAria: 'Export CSV',
      best: 'Best speed',
      count: 'tests',
    },

    ins: {
      title: 'Install the app',
      aria: 'Install app',
      do: 'Install now',
      blurb: 'The speed test as an app — launches from your home screen, opens instantly and shows your last results even offline.',
      iosTitle: 'On iPhone (Safari):',
      ios1: 'Tap the Share button',
      ios2: 'Scroll and choose “Add to Home Screen”',
      ios3: 'Tap “Add” — the app appears on your home screen',
      andTitle: 'On Android (Chrome):',
      and1: 'Open the three-dot menu ⋮ at the top',
      and2: 'Choose “Install app” or “Add to Home screen”',
      and3: 'Or use the “Install now” button below when available',
      deskTitle: 'On desktop:',
      desk1: 'Click the install icon in the address bar',
      desk2: 'Or choose “Install SPOS Net” from the browser menu',
      otherTitle: 'Manual add',
      other1: 'Bookmark this page or add it to your home screen from the browser menu',
    },

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
      dismissed: 'You can install the app later from the “Install” button above',
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
