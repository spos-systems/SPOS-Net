'use strict';
/**
 * SPOS Net — bilingual dictionary (Arabic default / English)
 * All UI strings live here. Values may contain simple HTML (ours only).
 */
const I18N = {

  ar: {
    dir: 'rtl',
    lang: 'ar',
    docTitle: 'SPOS Net | اختبار سرعة الإنترنت — قياس التحميل والرفع والبنق وفقدان الحزم',
    docDesc: 'اختبر سرعة الإنترنت لديك مجاناً وبشكل فوري: سرعة التحميل والرفع، زمن الاستجابة (Ping)، التذبذب (Jitter) وفقدان الحزم. أداة مفتوحة المصدر سريعة من صولة للأنظمة SPOS — بدون تسجيل وبدون إعلانات.',
    strings: {
      'a11y.skip': 'تخطَّ إلى اختبار السرعة',
      'a11y.github': 'مستودع المشروع على GitHub',
      'a11y.theme': 'تبديل المظهر الفاتح والداكن',
      'a11y.gauge': 'عداد سرعة الاتصال المباشر',

      'hero.eyebrow': 'أداة مفتوحة المصدر من صولة للأنظمة SPOS',
      'hero.title': 'اختبار <span class="grad">سرعة الإنترنت</span>',
      'hero.lead': 'قياس فوري لسرعة التحميل والرفع، وزمن الاستجابة (Ping)، والتذبذب، وفقدان الحزم — مجاناً وبدون تسجيل، من أقرب خادم إليك عبر شبكة Cloudflare العالمية.',
      'hero.note': 'للحصول على أدق نتيجة: أوقف التنزيلات، واقترب من الراوتر أو استخدم كيبل، وأغلق النوافذ الأخرى.',

      'cta.start': 'ابدأ الاختبار',
      'cta.again': 'إعادة الاختبار',
      'cta.share': 'مشاركة النتيجة',
      'cta.copy': 'نسخ النتيجة',
      'cta.copied': 'تم النسخ',

      'phase.ping': 'زمن الاستجابة',
      'phase.loss': 'فقدان الحزم',
      'phase.down': 'سرعة التحميل',
      'phase.up': 'سرعة الرفع',

      'metric.down': 'التحميل',
      'metric.up': 'الرفع',
      'metric.ping': 'زمن الاستجابة',
      'metric.jitter': 'التذبذب',
      'metric.loss': 'فقدان الحزم',
      'metric.loaded': 'زمن الاستجابة أثناء الحمل',
      'results.title': 'نتائج الاختبار',

      'conn.title': 'تفاصيل الاتصال',
      'conn.ip': 'عنوان IP',
      'conn.isp': 'مزود الخدمة',
      'conn.server': 'خادم القياس',
      'conn.proto': 'البروتوكول',
      'conn.unknown': 'غير متاح',
      'conn.loadedUp': 'أثناء الرفع',

      'err.network': 'تعذر إتمام الاختبار — تحقق من اتصالك بالإنترنت ثم أعد المحاولة.',

      'hist.title': 'سجل اختباراتك',
      'hist.clear': 'حذف السجل',
      'hist.note': 'تُحفظ النتائج محلياً في متصفحك فقط ولا تُرسل إلى أي خادم.',
      'hist.empty': 'لا توجد اختبارات سابقة بعد — ابدأ أول قياس لك الآن.',
      'hist.when': 'التاريخ والوقت',

      'how.title': 'كيف يعمل الاختبار؟',
      'how.lead': 'شفافية كاملة في المنهجية — كل القياسات تتم داخل متصفحك عبر نقاط قياس عامة مفتوحة، دون أي برامج وسيطة.',
      'how.s1t': 'اتصال بأقرب خادم',
      'how.s1d': 'يعمل SPOS Net فوق شبكة Cloudflare العالمية المنتشرة في أكثر من 330 مدينة، فيصل طلبك تلقائياً إلى أقرب نقطة قياس ليعكس ذلك أداء اتصالك الفعلي بأقرب مركز بيانات.',
      'how.s2t': 'قياسات متتالية متعددة الاتصالات',
      'how.s2d': 'تُقاس الاستجابة والتذبذب عبر طلبات صغيرة متتالية، ثم يُفتح عدة اتصالات متوازية للتحميل والرفع مع تكيف حجم البيانات مع سرعتك، لقياس أقصى قدرة فعلية للخط.',
      'how.s3t': 'تقييم واضح لنتيجتك',
      'how.s3d': 'تحصل على النتائج الأساسية: التحميل، الرفع، البنق، التذبذب، فقدان الحزم، وزمن الاستجابة أثناء الحمل، مع تقييم فوري لجاهزية اتصالك لكل نشاط رقمي.',
      'how.note': 'ملاحظة منهجية: نظراً لقيود المتصفحات، يُقاس فقدان الحزم تقديرياً عبر فشل طلبات HTTP صغيرة متعددة وليس عبر ICMP، لذا تعكس النتيجة المؤشرات الحادة لفقدان الحزم أثناء الاختبار.',

      'guide.title': 'افهم نتائجك',
      'guide.lead': 'ماذا تعني كل قراءة، وما القيم الجيدة التي يُنصح بها لكل نشاط؟',
      'guide.d1t': 'سرعة التحميل (Download)',
      'guide.d1d': 'سرعة جلب البيانات من الإنترنت إلى جهازك، وتقاس بالميغابت في الثانية (Mbps). عليها يعتمد مشاهدة الفيديو وتحميل الملفات والتصفح.',
      'guide.d2t': 'سرعة الرفع (Upload)',
      'guide.d2d': 'سرعة إرسال البيانات من جهازك إلى الإنترنت، وأهميتها في المكالمات المرئية والبث المباشر ورفع الملفات والعمل السحابي.',
      'guide.d3t': 'زمن الاستجابة (Ping)',
      'guide.d3d': 'الوقت بالمللي ثانية الذي يستغرقه طلب صغير للوصول إلى الخادم والعودة. القيم تحت 30ms ممتازة، وتحت 60ms جيدة جداً للألعاب.',
      'guide.d4t': 'التذبذب (Jitter)',
      'guide.d4d': 'تفاوت زمن الاستجابة بين الطلبات المتتالية. التذبذب المنخفض (أقل من 15ms) يعني اتصالاً مستقراً بلا تقطيع في المكالمات.',
      'guide.d5t': 'فقدان الحزم (Packet Loss)',
      'guide.d5d': 'نسبة الحزم التي لا تصل إلى وجهتها. المثالي 0%، وأي قيمة فوق 1-2% تسبب مشاكل ملحوظة في الاتصالات الفورية.',
      'guide.d6t': 'الاستجابة أثناء الحمل',
      'guide.d6d': 'زمن الاستجابة أثناء إشباع الخط بالتحميل أو الرفع؛ ارتفاعه الكبير عن القيمة الأساسية يشير إلى ازدحام في الشبكة (Bufferbloat).',
      'guide.tblTitle': 'السرعات الموصى بها لكل نشاط',
      'guide.tblActivity': 'النشاط',
      'guide.tblDown': 'التحميل (Mbps)',
      'guide.tblUp': 'الرفع (Mbps)',
      'guide.tblNote': 'ملاحظات',
      'guide.r1t': 'تصفح الويب ومواقع التواصل', 'guide.r1n': 'استخدام يومي مريح',
      'guide.r2t': 'بث فيديو HD', 'guide.r2n': 'نتفليكس ويوتيوب بجودة عادية',
      'guide.r3t': 'بث فيديو 4K', 'guide.r3n': 'توصية نتفليكس 25 Mbps مع هامش أمان',
      'guide.r4t': 'الألعاب التنافسية', 'guide.r4n': 'مع بنق أقل من 60ms وفقدان أقل من 1%',
      'guide.r5t': 'مكالمات فيديو شخصية', 'guide.r5n': 'واتساب وزووم وتيمز',
      'guide.r6t': 'اجتماعات فيديو جماعية', 'guide.r6n': 'عدة مشاركين مع مشاركة شاشة',
      'guide.r7t': 'بث مباشر (يوتيوب/تويتش)', 'guide.r7n': 'جودة 1080p60',
      'guide.r8t': 'العمل عن بُعد والخدمات السحابية', 'guide.r8n': 'رفع ملفات مع اجتماعات متزامنة',

      'faq.title': 'الأسئلة الشائعة',
      'faq.lead': 'إجابات مباشرة عن أكثر ما يُسأل حول قياس سرعة الإنترنت.',
      'faq.q1': 'كيف يعمل اختبار السرعة في SPOS Net؟',
      'faq.a1': 'يُجري SPOS Net سلسلة من القياسات داخل متصفحك مباشرة: أولاً يرسل عدة طلبات صغيرة لقياس زمن الاستجابة (Ping) والتذبذب (Jitter)، ثم يفتح عدة اتصالات متوازية لتنزيل بيانات من أقرب نقطة شبكة (Edge) إليك عبر شبكة Cloudflare لقياس سرعة التحميل، ويرفع بيانات لقياس سرعة الرفع، وأخيراً يرسل مجموعات من الطلبات الصغيرة لحساب نسبة فقدان الحزم التقديرية. لا يحتاج الموقع إلى أي إضافات أو برامج خارجية.',
      'faq.q2': 'ما هي سرعة الإنترنت الجيدة؟',
      'faq.a2': 'تعتمد على استخدامك: للتصفح ومواقع التواصل تكفي سرعة تحميل 10 ميغابت/ثانية، لبث الفيديو بدقة HD يُنصح بـ 10 ميغابت/ثانية، ولبدقة 4K تحتاج 35 ميغابت/ثانية على الأقل، أما الألعاب التنافسية فالأهم فيها زمن الاستجابة (أقل من 60 مللي ثانية) وفقدان حزم منخفض أكثر من سرعة التحميل.',
      'faq.q3': 'ما هو زمن الاستجابة (Ping) وما هو التذبذب (Jitter)؟',
      'faq.a3': 'زمن الاستجابة هو الوقت الذي يستغرقه طلب صغير للذهاب إلى الخادم والعودة ويقاس بالمللي ثانية؛ كلما انخفض كان الاتصال أكثر استجابة، وهو عامل حاسم في الألعاب والمكالمات. أما التذبذب فهو تفاوت زمن الاستجابة بين الطلبات المتتالية، والتذبذب المرتفع يسبب تقطعاً في المكالمات والفيديو حتى لو كان زمن الاستجابة جيداً.',
      'faq.q4': 'ما هو فقدان الحزم (Packet Loss)؟',
      'faq.a4': 'فقدان الحزم يعني ضياع جزء من حزم البيانات أثناء انتقالها بين جهازك والخادم، وتسببه عادة مشاكل في الشبكة المحلية (واي فاي ضعيف) أو ازدحام لدى مزود الخدمة. النسب فوق 1% تسبب تقطعاً ملحوظاً في المكالمات والألعاب. ولأن المتصفحات لا تستطيع إرسال ICMP، يقيسه SPOS Net تقديرياً عبر فشل أو انتهاء مهلة طلبات HTTP صغيرة متعددة.',
      'faq.q5': 'لماذا تختلف النتيجة عن أدوات أخرى مثل Speedtest أو Fast.com؟',
      'faq.a5': 'الاختلاف طبيعي وأسبابه: خوادم مختلفة في مواقع جغرافية وبأحمال مختلفة، توقيت مختلف للاختبار، بروتوكولات مختلفة (HTTP/2 مقابل HTTP/3)، طريقة الاتصال (واي فاي مقابل كيبل)، وحالة الشبكة لحظة القياس. الأفضل إجراء الاختبار عدة مرات في أوقات مختلفة والاعتماد على المتوسط، مع إغلاق التطبيقات التي تستهلك الاتصال أثناء القياس.',
      'faq.q6': 'هل الأداة مجانية؟ وهل يتم جمع بياناتي؟',
      'faq.a6': 'SPOS Net مجاني تماماً، بدون إعلانات وبدون تسجيل وبدون تتبع. لا تُرسل نتائجك إلى أي خادم يخصنا؛ سجل اختباراتك محفوظ محلياً في متصفحك فقط ويمكنك حذفه في أي وقت. تُجرى القياسات عبر شبكة Cloudflare العامة التي ترى عنوان IP الخاص بك لتوجيه الطلب فقط.',
      'faq.q7': 'هل يعمل SPOS Net على الجوال؟',
      'faq.a7': 'نعم، الموقع متجاوب مع كل المقاسات ويعمل على متصفحات الجوال والحاسوب، ويمكن تثبيته كتطبيق (PWA) من قائمة المتصفح ليظهر كتطبيق مستقل على جهازك.',

      'about.title': 'من وراء SPOS Net؟',
      'about.p1': 'SPOS Net مشروع مفتوح المصدر تطوره <strong>صولة للأنظمة (SPOS)</strong> — نشاط ليبوي متخصص في بناء الحلول البرمجية المتكاملة: تطبيقات الويب والجوال، الأنظمة الإدارية، والحلول التقنية المخصصة، من الفكرة إلى الإطلاق.',
      'about.p2': 'أردنا أداة قياس عربية سريعة وصادقة بلا إعلانات ولا تتبع، فبنيناها وأهديناها للجميع تحت رخصة MIT.',
      'about.site': 'زيارة موقع صولة للأنظمة',
      'about.whatsapp': 'تواصل عبر واتساب',
      'about.call': 'اتصل بنا',
      'about.source': 'الكود المصدري على GitHub',

      'footer.tagline': 'أداة قياس سرعة إنترنت مفتوحة المصدر — بدون إعلانات، بدون تتبع.',
      'footer.links': 'روابط سريعة',
      'footer.l1': 'اختبار السرعة',
      'footer.l2': 'كيف يعمل',
      'footer.l3': 'افهم نتائجك',
      'footer.l4': 'الأسئلة الشائعة',
      'footer.whatsapp': 'واتساب: 0935535606',
      'footer.rights': '© 2026 صولة للأنظمة SPOS — جميع الحقوق محفوظة',

      'grade.5': 'استثنائي',
      'grade.4': 'ممتاز',
      'grade.3': 'جيد جداً',
      'grade.2': 'جيد',
      'grade.1': 'مقبول',
      'grade.0': 'ضعيف',

      'suit.browsing': 'تصفح ومواقع تواصل',
      'suit.hd': 'بث HD',
      'suit.uhd': 'بث 4K',
      'suit.gaming': 'ألعاب أونلاين',
      'suit.calls': 'مكالمات فيديو',
      'suit.meetings': 'اجتماعات فيديو',
      'suit.streaming': 'بث مباشر',
      'suit.remote': 'عمل عن بُعد',

      'verdict.strong': 'اتصالك قوي وممتاز — جاهز لكل الاستخدامات المتقدمة: بث 4K، ألعاب تنافسية، وعمل سحابي ثقيل دون مشاكل.',
      'verdict.good': 'اتصالك جيد جداً — يدعم بث الفيديو بجودة عالية والاجتماعات والألعاب بأريحية.',
      'verdict.ok': 'اتصالك مقبول — يكفي للتصفح وبث HD، وقد تواجه انتظاراً في المهام الثقيلة.',
      'verdict.weak': 'اتصالك ضعيف — يُنصح بإعادة تشغيل الراوتر أو مراجعة مزود الخدمة لتحسين التجربة.',

      'live.phase': 'جارٍ قياس',
      'live.done': 'اكتمل',
      'graph.down': 'التحميل',
      'graph.up': 'الرفع',

      'share.text': 'نتيجة اختبار الإنترنت عندي عبر SPOS Net — التحميل: {down} Mbps | الرفع: {up} Mbps | البنق: {ping} ms | فقدان الحزم: {loss}% — قِس سرعتك مجاناً من:',
      'share.copied': 'تم نسخ النتيجة — شاركها مع أصدقائك',
    }
  },

  en: {
    dir: 'ltr',
    lang: 'en',
    docTitle: 'SPOS Net | Internet Speed Test — Download, Upload, Ping & Packet Loss',
    docDesc: 'Test your internet speed instantly and free: download and upload speed, latency (ping), jitter and packet loss. A fast open-source tool by SPOS — no sign-up, no ads.',
    strings: {
      'a11y.skip': 'Skip to the speed test',
      'a11y.github': 'Project repository on GitHub',
      'a11y.theme': 'Toggle light and dark appearance',
      'a11y.gauge': 'Live connection speed gauge',

      'hero.eyebrow': 'Open-source tool by SPOS — Solut Systems',
      'hero.title': 'Internet <span class="grad">Speed Test</span>',
      'hero.lead': 'Instant measurement of download and upload speed, latency (ping), jitter and packet loss — free, no sign-up, from the nearest server to you via the global Cloudflare network.',
      'hero.note': 'For the most accurate result: stop downloads, move close to your router or use a cable, and close other tabs.',

      'cta.start': 'Start Test',
      'cta.again': 'Test Again',
      'cta.share': 'Share Result',
      'cta.copy': 'Copy Result',
      'cta.copied': 'Copied',

      'phase.ping': 'Latency',
      'phase.loss': 'Packet Loss',
      'phase.down': 'Download Speed',
      'phase.up': 'Upload Speed',

      'metric.down': 'Download',
      'metric.up': 'Upload',
      'metric.ping': 'Latency (Ping)',
      'metric.jitter': 'Jitter',
      'metric.loss': 'Packet Loss',
      'metric.loaded': 'Latency Under Load',
      'results.title': 'Test Results',

      'conn.title': 'Connection Details',
      'conn.ip': 'IP Address',
      'conn.isp': 'ISP',
      'conn.server': 'Test Server',
      'conn.proto': 'Protocol',
      'conn.unknown': 'Unavailable',
      'conn.loadedUp': 'while uploading',

      'err.network': 'Could not complete the test — check your internet connection and try again.',

      'hist.title': 'Your Test History',
      'hist.clear': 'Clear History',
      'hist.note': 'Results are stored locally in your browser only and are never sent to any server.',
      'hist.empty': 'No previous tests yet — start your first measurement now.',
      'hist.when': 'Date & Time',

      'how.title': 'How Does the Test Work?',
      'how.lead': 'Full methodology transparency — every measurement happens inside your browser over open public endpoints, with no middleman software.',
      'how.s1t': 'Connected to the nearest server',
      'how.s1d': 'SPOS Net runs on Cloudflare\u2019s global network spanning 330+ cities, so your request automatically reaches the nearest measurement point, reflecting your real connection to the closest data center.',
      'how.s2t': 'Sequential, multi-connection measurements',
      'how.s2d': 'Latency and jitter are measured with small sequential requests, then several parallel connections are opened for download and upload with payload sizes that adapt to your speed, to measure the true maximum capacity of your line.',
      'how.s3t': 'A clear rating of your result',
      'how.s3d': 'You get the core metrics: download, upload, ping, jitter, packet loss and latency under load, plus an instant rating of how ready your connection is for every digital activity.',
      'how.note': 'Methodology note: due to browser limitations, packet loss is estimated through multiple small HTTP request failures rather than ICMP, so the result reflects sharp packet-loss indicators during the test.',

      'guide.title': 'Understand Your Results',
      'guide.lead': 'What each reading means, and the recommended values for every activity.',
      'guide.d1t': 'Download Speed',
      'guide.d1d': 'How fast data reaches your device from the internet, measured in megabits per second (Mbps). Video streaming, file downloads and browsing all depend on it.',
      'guide.d2t': 'Upload Speed',
      'guide.d2d': 'How fast data leaves your device toward the internet — critical for video calls, live streaming, file uploads and cloud work.',
      'guide.d3t': 'Latency (Ping)',
      'guide.d3d': 'The time in milliseconds for a small request to reach the server and return. Under 30ms is excellent; under 60ms is very good for gaming.',
      'guide.d4t': 'Jitter',
      'guide.d4d': 'The variation of latency between consecutive requests. Low jitter (below 15ms) means a stable connection with no call dropouts.',
      'guide.d5t': 'Packet Loss',
      'guide.d5d': 'The share of packets that never reach their destination. Ideally 0%; anything above 1-2% causes noticeable issues in real-time communication.',
      'guide.d6t': 'Latency Under Load',
      'guide.d6d': 'Latency while the line is saturated with download or upload traffic; a big jump from the idle value indicates network congestion (bufferbloat).',
      'guide.tblTitle': 'Recommended Speeds per Activity',
      'guide.tblActivity': 'Activity',
      'guide.tblDown': 'Download (Mbps)',
      'guide.tblUp': 'Upload (Mbps)',
      'guide.tblNote': 'Notes',
      'guide.r1t': 'Web browsing & social media', 'guide.r1n': 'Comfortable everyday use',
      'guide.r2t': 'HD video streaming', 'guide.r2n': 'Netflix / YouTube at HD',
      'guide.r3t': '4K video streaming', 'guide.r3n': 'Netflix recommends 25 Mbps + margin',
      'guide.r4t': 'Competitive gaming', 'guide.r4n': 'With ping under 60ms and loss under 1%',
      'guide.r5t': 'Personal video calls', 'guide.r5n': 'WhatsApp, Zoom, Teams',
      'guide.r6t': 'Group video meetings', 'guide.r6n': 'Several participants + screen sharing',
      'guide.r7t': 'Live streaming (YouTube/Twitch)', 'guide.r7n': '1080p60 quality',
      'guide.r8t': 'Remote work & cloud services', 'guide.r8n': 'File uploads with simultaneous meetings',

      'faq.title': 'Frequently Asked Questions',
      'faq.lead': 'Direct answers to the most common questions about internet speed testing.',
      'faq.q1': 'How does the SPOS Net speed test work?',
      'faq.a1': 'SPOS Net runs a series of measurements directly in your browser: it first sends several small requests to measure latency (ping) and jitter, then opens parallel connections to download data from your nearest Cloudflare network edge point, uploads data to measure upload speed, and finally sends groups of tiny requests to estimate packet loss. The site needs no extensions or external software.',
      'faq.q2': 'What is a good internet speed?',
      'faq.a2': 'It depends on your usage: 10 Mbps download is enough for browsing and social media, HD streaming benefits from 10 Mbps, and 4K streaming needs at least 35 Mbps, while competitive gaming depends more on latency (under 60ms) and low packet loss than on download speed.',
      'faq.q3': 'What are latency (ping) and jitter?',
      'faq.a3': 'Latency is the time a small request takes to reach the server and come back, measured in milliseconds; the lower it is, the more responsive the connection — a decisive factor in gaming and calls. Jitter is the variation of latency between consecutive requests, and high jitter causes call and video dropouts even when latency is good.',
      'faq.q4': 'What is packet loss?',
      'faq.a4': 'Packet loss means part of the data packets never make it between your device and the server, usually caused by local network issues (weak Wi-Fi) or ISP congestion. Rates above 1% cause noticeable call and game interruptions. Because browsers cannot send ICMP, SPOS Net estimates it via failures or timeouts of many small HTTP requests.',
      'faq.q5': 'Why does my result differ from Speedtest or Fast.com?',
      'faq.a5': 'Differences are normal: different servers in different locations and loads, different test times, different protocols (HTTP/2 vs HTTP/3), connection type (Wi-Fi vs cable), and network conditions at the moment. Test several times at different hours and rely on the average, with bandwidth-hungry apps closed.',
      'faq.q6': 'Is the tool free? Is my data collected?',
      'faq.a6': 'SPOS Net is completely free, with no ads, no sign-up and no tracking. Your results are never sent to our servers; your test history is stored locally in your browser only and can be deleted anytime. Measurements run over the public Cloudflare network, which sees your IP only to route the request.',
      'faq.q7': 'Does SPOS Net work on mobile?',
      'faq.a7': 'Yes — the site is fully responsive and works on mobile and desktop browsers, and can be installed as an app (PWA) from the browser menu to appear as a standalone app on your device.',

      'about.title': 'Who Is Behind SPOS Net?',
      'about.p1': 'SPOS Net is an open-source project developed by <strong>Solut Systems (SPOS)</strong> — a Libyan software house building complete software solutions: web and mobile apps, administrative systems, and custom technology, from idea to launch.',
      'about.p2': 'We wanted a fast, honest, ad-free, tracker-free speed test in Arabic, so we built it and gave it to everyone under the MIT license.',
      'about.site': 'Visit the SPOS website',
      'about.whatsapp': 'Chat on WhatsApp',
      'about.call': 'Call Us',
      'about.source': 'Source Code on GitHub',

      'footer.tagline': 'Open-source internet speed test — no ads, no tracking.',
      'footer.links': 'Quick Links',
      'footer.l1': 'Speed Test',
      'footer.l2': 'How It Works',
      'footer.l3': 'Understand Results',
      'footer.l4': 'FAQ',
      'footer.whatsapp': 'WhatsApp: +218 93 553 5606',
      'footer.rights': '© 2026 Solut Systems SPOS — All rights reserved',

      'grade.5': 'Exceptional',
      'grade.4': 'Excellent',
      'grade.3': 'Very Good',
      'grade.2': 'Good',
      'grade.1': 'Fair',
      'grade.0': 'Poor',

      'suit.browsing': 'Browsing & Social',
      'suit.hd': 'HD Streaming',
      'suit.uhd': '4K Streaming',
      'suit.gaming': 'Online Gaming',
      'suit.calls': 'Video Calls',
      'suit.meetings': 'Video Meetings',
      'suit.streaming': 'Live Streaming',
      'suit.remote': 'Remote Work',

      'verdict.strong': 'Your connection is strong and excellent — ready for every heavy use: 4K streaming, competitive gaming and heavy cloud work.',
      'verdict.good': 'Your connection is very good — it comfortably supports high-quality streaming, meetings and gaming.',
      'verdict.ok': 'Your connection is fair — enough for browsing and HD streaming, with some waiting on heavy tasks.',
      'verdict.weak': 'Your connection is weak — consider restarting your router or contacting your ISP to improve the experience.',

      'live.phase': 'Measuring',
      'live.done': 'Done',
      'graph.down': 'Download',
      'graph.up': 'Upload',

      'share.text': 'My internet speed test result via SPOS Net — Download: {down} Mbps | Upload: {up} Mbps | Ping: {ping} ms | Packet loss: {loss}% — Test yours free at:',
      'share.copied': 'Result copied — share it with your friends',
    }
  }
};

/**
 * i18n helpers.
 * Usage: t('faq.q1')  → string for the active language.
 * apply() rewrites every element carrying [data-i18n] / [data-aria].
 */
const i18n = (() => {
  let current = 'ar';

  function available() { return Object.keys(I18N); }

  function get() { return current; }

  function t(key) {
    const d = I18N[current];
    return (d && d.strings[key]) || I18N.ar.strings[key] || key;
  }

  function fill(str, vars) {
    return Object.entries(vars || {}).reduce((s, [k, v]) => s.replace(`{${k}}`, v), str);
  }

  function set(lang) {
    if (!I18N[lang]) lang = 'ar';
    current = lang;
    const d = I18N[lang];
    document.documentElement.lang = d.lang;
    document.documentElement.dir = d.dir;
    document.title = d.docTitle;
    const md = document.querySelector('meta[name="description"]');
    if (md) md.setAttribute('content', d.docDesc);
    try { localStorage.setItem('sposnet_lang', lang); } catch (e) { /* private mode */ }
    apply();
    document.dispatchEvent(new CustomEvent('sposnet:lang', { detail: { lang } }));
  }

  function apply() {
    document.querySelectorAll('[data-i18n]').forEach(el => { el.innerHTML = t(el.dataset.i18n); });
    document.querySelectorAll('[data-aria]').forEach(el => { el.setAttribute('aria-label', t(el.dataset.aria)); });
  }

  return { t, fill, set, get, apply, available };
})();
