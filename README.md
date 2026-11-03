<div align="center">

# 🔢 NOMRO PRO
### Ultimate Number Counter & Precision Timer Suite for Adobe After Effects
**أقوى حزمة احترافية لإنشاء وتحريك عدادات الأرقام والمؤقتات الزمنية وساعات الإيقاف لأدوبي أفتر إفكتس**

<p align="center">
  <img src="https://img.shields.io/badge/NOMRO_PRO-v4.1.0-10b981?style=for-the-badge&logoColor=white" alt="NOMRO Pro v4.1.0"/>
  <img src="https://img.shields.io/badge/After_Effects-CC_2017_--_2026+-9999FF?style=for-the-badge&logo=adobeaftereffects&logoColor=white" alt="AE Compatibility"/>
  <img src="https://img.shields.io/badge/CEP-Panel_7.0+-2ECC71?style=for-the-badge" alt="CEP Panel"/>
  <img src="https://img.shields.io/badge/QA_Tests-117%2F117_Passing-10b981?style=for-the-badge" alt="Tests"/>
  <img src="https://img.shields.io/badge/Architecture-Embedded_Sliders-blue?style=for-the-badge" alt="Embedded Sliders"/>
  <img src="https://img.shields.io/badge/Language-English_%7C_%D8%B9%D8%B1%D8%A8%D9%8A-FFB300?style=for-the-badge" alt="Bilingual"/>
</p>

[English Guide](#-english-overview) • [الدليل باللغة العربية](#-نظرة-عامة-بالعربية) • [Installation / التثبيت](#-installation--التثبيت) • [Shortcuts / الاختصارات](#-shortcuts--الاختصارات)

---

</div>

## 🌐 English Overview

**NOMRO Pro** is an industrial-grade Adobe CEP extension engineered for motion designers, editors, and VFX artists who require precision, high-performance number counters, countdown timers, and stopwatches in **Adobe After Effects**.

### ⚡ Key Features

* **Embedded Sliders Architecture:** All animation and format controls reside directly on the text layer itself (`thisLayer`). Zero external Null layers required.
* **100% Deterministic Parity:** Real-time preview in the CEP panel perfectly matches After Effects timeline rendering down to the exact frame.
* **Large Numbers Engine:** Seamless handling of values exceeding millions ($1,000,000+$) without 32-bit AE slider clipping.
* **Negative Values & Zero Formatting:** Full support for negative currencies (`-$50 USD`), unsigned zero (`0`, `00:00:00`), and decimal split control.
* **Monospace Stability:** One-click toggle for equal-width figures to prevent horizontal layout shake and text jitter during rapid counting.
* **Timer & Stopwatch Subsystem:**
  * **4 Duration Modes:** Manual (Seconds), Auto (Match Layer Duration), Realtime (1s = 1s count), and Markers (IN/OUT layer tags).
  * **6 Timecode Formats:** `HH:MM:SS:FF`, `MM:SS:FF`, `SS:FF`, `HH:MM:SS`, `MM:SS`, `SS`.
  * **Comp Timeline Capture:** Instant playhead time grab for Start and End points.
* **24 Easing Curves & Dual-Phase Motion:** Single curve templates or independent Entry/Exit acceleration & deceleration curves with continuous interpolation.
* **Math-Enabled Input Fields:** Evaluate expressions on the fly directly inside input fields (e.g. `500*2`, `1000/4`, `25+75`).
* **Instant Presets:** Save, recall, and manage custom counter and timer configurations.

---

## 🌍 نظرة عامة بالعربية

إضافة **NOMRO Pro** هي الأداة الاحترافية المتكاملة لبرنامج **Adobe After Effects**، المصممة خصيصاً لمصممي الموشن جرافيك والمونتيرين لصناعة وإدارة عدادات الأرقام، المؤقتات التنازلية، وساعات الإيقاف بأعلى درجات الدقة والسرعة.

### ✨ أبرز المميزات

* **معمارية السلايدرات المدمجة (Embedded Controls):** تنشأ جميع السلايدرات والمتحكمات داخل الطبقة النصية ذاتها (`thisLayer`) دون الحاجة لطبقات Null خارجية.
* **مطابقة رياضية تامة (100% Parity):** توافق حسابي دقيق بين المعاينة الحية في الإضافة وكود التعبيرات (Expressions) داخل أفتر إفكتس حتى مستوى الفريم الواحد.
* **دعم الأرقام الفلكية (Millions Engine):** معالجة القيم المليونية الكبيرة دون التقيد بسقف سلايدرات AE التقليدية.
* **معالجة متقدمة للقيم السالبة:** دعم صحيح لتنسيق الأرقام والعملات السالبة (`-$50 USD`) دون تشويه، مع الحفاظ على الصفر المحايد وضبط المنازل العشرية.
* **أرقام متساوية العرض (Monospace Toggle):** زر فوري لتثبيت عرض الخانات ومنع اهتزاز وارتجاج النصوص أثناء العد السريع.
* **نظام المؤقتات وساعات الإيقاف:**
  * **4 أوضاع تشغيل:** التحديد اليدوي، مطابقة مدة الطبقة تلقائياً (Auto)، التوقيت الواقعي (Realtime)، أو الربط بعلامات الطبقة (Markers).
  * **6 صيغ زمنية:** تشمل الساعات والدقائق والثواني والفريمات (`HH:MM:SS:FF` حتى `SS`).
  * **التقاط التوقيت من التايملاين:** أزرار مباشرة لالتقاط موقع المؤشر الحالي لبداية ونهاية العد.
* **24 منحنى تسارع ومنظومة المنحنى المزدوج (Dual Easing):** تحكم كامل في منحنيات الدخول والخروج والتسارع لتوليد حركات بصرية انسيابية.
* **خانات ذكية تدعم العمليات الحسابية:** إمكانية كتابة معادلات مباشرة داخل خانات الإدخال مثل (`500*2` أو `120/4`).
* **مدير قوالب مدمج (Presets):** حفظ واسترجاع إعداداتك المفضلة بضغطة زر واحدة.

---

## 🚀 Installation • التثبيت

### Path • المسار

Copy the `NOMRO` directory to the Adobe CEP extensions folder:
انقل مجلد `NOMRO` إلى مسار إضافات CEP الخاص بجهازك:

* **Windows:**  
  `C:\Program Files (x86)\Common Files\Adobe\CEP\extensions\NOMRO`
* **macOS:**  
  `~/Library/Application Support/Adobe/CEP/extensions/NOMRO`

### Enable Debug Mode • تفعيل وضع المطور
Ensure `PlayerDebugMode` is set to `1` in Windows Registry / macOS plist:
تأكد من تفعيل وضع المطور لبرامج أدوبي عبر السجل:
* **Windows (Registry):**  
  `HKEY_CURRENT_USER\Software\Adobe\CSXS.7` (through `CSXS.12`) ➔ `PlayerDebugMode = "1"`

### Launch • التشغيل
In After Effects, open:  
داخل برنامج After Effects، افتح:  
`Window` ➔ `Extensions` ➔ `NOMRO Pro`

---

## ⌨️ Shortcuts • الاختصارات

| Shortcut • الاختصار | Action • الوظيفة |
| :--- | :--- |
| <kbd>Enter</kbd> | Create / Apply Counter or Timer • إنشاء أو تطبيق العداد/المؤقت |
| <kbd>Space</kbd> | Play / Pause Live Preview • تشغيل أو إيقاف المعاينة الحية |
| <kbd>R</kbd> | Reset Preview to Beginning • إعادة ضبط المعاينة للبداية |
| <kbd>Shift</kbd> + <kbd>▲</kbd> / <kbd>▼</kbd> | Step value by 10 • زيادة/نقصان القيمة بمقدار 10 |
| <kbd>Alt</kbd> + <kbd>▲</kbd> / <kbd>▼</kbd> | Step value by 0.1 • زيادة/نقصان القيمة بمقدار 0.1 |

---

## 🧪 Automated Testing • جناح الاختبارات والتحقق

NOMRO Pro includes a comprehensive continuous integration and parity verification harness:

```bash
# Full Architectural & Regression Harness (67 Tests)
node nomro_full_qa_harness.js

# Timer Parity & Frame Math Harness (50 Tests)
node timer_parity_harness.js
```

```
===============================================================
TOTAL TESTS RUN : 117
TESTS PASSED    : 117 (100%)
TESTS FAILED    : 0
===============================================================
```

---

<div align="center">
<sub>Engineered with precision for the Motion Design Community • تطوير احترافي لمجتمع الموشن جرافيك</sub><br/>
<sub>© wittybrandcode. Licensed under the MIT License.</sub>
</div>
