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
      json: 'تصدير JSON', native: 'مشاركة عبر التطبيقات',
    },

    s: {
      title: 'الإعدادات',
      language: 'اللغة',
      unit: 'وحدة العرض',
      duration: 'مدة كل مرحلة',
      d1: 'سريع', d2: 'قياسي', d3: 'موسّع',
      streams: 'الاتصالات المتوازية',
      streamsHint: 'عدد الاتصالات المتزامنة أثناء التنزيل والرفع — قيمة أعلى تعبئة أوسع للشبكة، وقيمة أقل أقرب لسلوك الاستخدام الفردي.',
      loaded: 'قياس الاستجابة أثناء الحمل',
      loadedHint: 'عينات إضافية لزمن الاستجابة أثناء إشغال الخط بالتنزيل والرفع (Bufferbloat).',
      loss: 'اختبار فقدان الحزم',
      lossHint: 'إرسال دفعة طلبات قصيرة لحساب نسبة الفشل التقديرية للحزم.',
      applies: 'سيُطبَّق التغيير في الاختبار القادم',
      reset: 'استعادة الافتراضي',
      how: 'كيف نقيس؟',
      howBody: 'يُجرى القياس عبر طلبات HTTP متوازية إلى أقرب نقطة Cloudflare، مع استبعاد مرحلة التسارع الأولى وحساب المتوسط على النافذة المستقرة، وقياس الاستجابة من زمن أول بايت.',
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
      server: 'خادم القياس',
      proto: 'البروتوكول',
      conn: 'عنوانك',
      date: 'تاريخ الاختبار',
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
      sharedNote: 'تعرض هذه النتيجة مشارَكة من جهاز آخر',
      runYours: 'أجرِ اختبارك',
    },

    f: { tag: 'أداة مفتوحة المصدر لقياس سرعة الإنترنت', dev: 'من تطوير' },

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
      json: 'Export JSON', native: 'Share via apps',
    },

    s: {
      title: 'Settings',
      language: 'Language',
      unit: 'Display unit',
      duration: 'Phase duration',
      d1: 'Quick', d2: 'Standard', d3: 'Thorough',
      streams: 'Parallel connections',
      streamsHint: 'Concurrent connections during download/upload — higher saturates the line, lower is closer to single-stream usage.',
      loaded: 'Measure latency under load',
      loadedHint: 'Extra latency samples while the line is busy (bufferbloat).',
      loss: 'Packet loss test',
      lossHint: 'Sends a burst of short requests to estimate the failure rate.',
      applies: 'Will apply on the next test',
      reset: 'Reset to defaults',
      how: 'How we measure',
      howBody: 'Measurements run as parallel HTTP requests to the nearest Cloudflare edge. The initial ramp-up is excluded and the average is taken over the stable window; latency is measured as time-to-first-byte.',
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
      server: 'Test server', proto: 'Protocol', conn: 'Your address', date: 'Test date',
      samples: 'samples', of: 'of', failed: 'failed',
    },

    cap: {
      stream4k: '4K streaming', streamHD: 'HD streaming', calls: 'HD video calls',
      gameComp: 'Competitive gaming', game: 'Casual gaming', bigDl: 'Large downloads',
    },

    grade: { exc: 'Excellent', vg: 'Very good', good: 'Good', fair: 'Fair', poor: 'Poor' },

    conn: { waiting: 'Identifying connection…', fail: 'Could not identify connection', ip: 'IP', server: 'Server' },

    t: {
      copied: 'Copied', copyFail: 'Copy failed', aborted: 'Test stopped',
      netErr: 'Could not reach the measurement server — check your connection',
      noData: 'No data was received during the test',
      saved: 'File saved', resetDone: 'Settings restored', cleared: 'History cleared',
      sharedNote: 'This result was shared from another device',
      runYours: 'Run your own test',
    },

    f: { tag: 'Open-source internet speed test', dev: 'Developed by' },

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
