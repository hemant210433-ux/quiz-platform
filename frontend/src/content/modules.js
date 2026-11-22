/**
 * O Level modules shown on the public site.
 * NOTE: No exam pattern (question count / duration / marking) is stated anywhere on purpose.
 * Candidates must check the official NIELIT notice for the current pattern.
 * `code` matches the optional `module` field on a quiz (see backend QUIZ_MODULES).
 */
const U = (hi, en) => ({ hi, en });

export const NIELIT_SYLLABUS_URL = 'https://www.nielit.gov.in/node/6706';
export const NIELIT_SITE_URL = 'https://www.nielit.gov.in';

/**
 * Module names and unit headings follow the NIELIT O Level (R5) syllabus.
 * The syllabus can be revised, so pages always point to NIELIT for the current version.
 * `focus*` are the plain-language search phrases students use for the module.
 */
const RAW = [
  {
    code: 'm1-r5',
    shortEn: 'IT Tools & Network Basics',
    short: 'M1-R5',
    hi: 'सूचना प्रौद्योगिकी उपकरण एवं नेटवर्क मूल बातें',
    en: 'Information Technology Tools and Network Basics',
    focusHi: 'कंप्यूटर, ऑपरेटिंग सिस्टम, Word, Excel, PowerPoint, इंटरनेट, ईमेल और साइबर सुरक्षा',
    focusEn: 'computers, operating systems, Word, Excel, PowerPoint, the internet, email and cyber security',
    units: [
      U('कंप्यूटर का परिचय', 'Introduction to Computer'),
      U('ऑपरेटिंग सिस्टम का परिचय', 'Introduction to Operating System'),
      U('वर्ड प्रोसेसिंग', 'Word Processing'),
      U('स्प्रेडशीट', 'Spreadsheet'),
      U('प्रेजेंटेशन', 'Presentation'),
      U('इंटरनेट और WWW का परिचय', 'Introduction to Internet and WWW'),
      U('ईमेल, सोशल नेटवर्किंग और ई-गवर्नेंस सेवाएँ', 'E-mail, Social Networking and e-Governance Services'),
      U('डिजिटल वित्तीय टूल्स और एप्लिकेशन', 'Digital Financial Tools and Applications'),
      U('फ्यूचरस्किल्स और साइबर सुरक्षा की रूपरेखा', 'Overview of FutureSkills & Cyber Security'),
    ],
  },
  {
    code: 'm2-r5',
    shortEn: 'Web Designing & Publishing',
    short: 'M2-R5',
    hi: 'वेब डिज़ाइन एवं पब्लिशिंग',
    en: 'Web Designing and Publishing',
    focusHi: 'HTML, CSS, JavaScript, फ़ोटो एडिटर और वेबसाइट पब्लिशिंग',
    focusEn: 'HTML, CSS, JavaScript, photo editing and web publishing',
    units: [
      U('वेब डिज़ाइन का परिचय', 'Introduction to Web Design'),
      U('एडिटर', 'Editors'),
      U('HTML की मूल बातें', 'HTML Basics'),
      U('कैस्केडिंग स्टाइल शीट्स (CSS)', 'Cascading Style Sheets (CSS)'),
      U('CSS फ्रेमवर्क', 'CSS Framework'),
      U('JavaScript और AngularJS', 'JavaScript and Angular JS'),
      U('फ़ोटो एडिटर', 'Photo Editor'),
      U('वेब पब्लिशिंग और ब्राउज़िंग', 'Web Publishing and Browsing'),
    ],
  },
  {
    code: 'm3-r5',
    shortEn: 'Python Programming',
    short: 'M3-R5',
    hi: 'प्रोग्रामिंग एवं समस्या समाधान (Python)',
    en: 'Programming and Problem Solving through Python',
    focusHi: 'Python प्रोग्रामिंग, एल्गोरिदम, फ़्लोचार्ट, फ़ंक्शन, फ़ाइल प्रोसेसिंग और NumPy',
    focusEn: 'Python programming, algorithms, flowcharts, functions, file processing and NumPy',
    units: [
      U('प्रोग्रामिंग का परिचय', 'Introduction to Programming'),
      U('एल्गोरिदम और फ़्लोचार्ट', 'Algorithm and Flowcharts to solve problems'),
      U('Python का परिचय', 'Introduction to Python'),
      U('ऑपरेटर, एक्सप्रेशन और Python स्टेटमेंट', 'Operators, Expressions and Python Statements'),
      U('सीक्वेंस डेटा टाइप', 'Sequence data types'),
      U('फ़ंक्शन', 'Functions'),
      U('फ़ाइल प्रोसेसिंग', 'File Processing'),
      U('मॉड्यूल', 'Modules'),
      U('NumPy की मूल बातें', 'NumPy Basics'),
    ],
  },
  {
    code: 'm4-r5',
    shortEn: 'IoT & its Applications',
    short: 'M4-R5',
    hi: 'इंटरनेट ऑफ़ थिंग्स (IoT) और उसके अनुप्रयोग',
    en: 'Internet of Things and its Applications',
    focusHi: 'IoT, सेंसर, एक्चुएटर, माइक्रोकंट्रोलर, प्रोटोकॉल और IoT सुरक्षा',
    focusEn: 'IoT, sensors, actuators, microcontrollers, protocols and IoT security',
    units: [
      U('IoT का परिचय: एप्लिकेशन/डिवाइस, प्रोटोकॉल और कम्युनिकेशन मॉडल', 'Introduction to IoT – Applications/Devices, Protocols and Communication Model'),
      U('थिंग्स और कनेक्शन', 'Things and Connections'),
      U('सेंसर, एक्चुएटर और माइक्रोकंट्रोलर', 'Sensors, Actuators and Microcontrollers'),
      U('IoT एप्लिकेशन बनाना', 'Building IoT Applications'),
      U('सुरक्षा और IoT इकोसिस्टम का भविष्य', 'Security and Future of IoT Ecosystem'),
      U('सॉफ़्ट स्किल्स और व्यक्तित्व विकास', 'Soft skills – Personality Development'),
    ],
  },
];

const join = (arr, lang) => arr.map((u) => u[lang]).join(', ');

export const MODULES = RAW.map((m) => ({
  ...m,
  slug: m.code,
  // short card/intro copy
  descHi: `${m.focusHi} पर मुफ़्त अभ्यास।`,
  descEn: `Free practice on ${m.focusEn}.`,
  topicsHi: m.units.map((u) => u.hi),
  topicsEn: m.units.map((u) => u.en),
  // search-result description (plain strings only: these objects are passed to client components)
  seoDescription: `${m.short} (${m.shortEn}) का मुफ़्त O Level ऑनलाइन मॉक टेस्ट – हिंदी और English में, बिना लॉगिन। जवाब और कमज़ोर विषय तुरंत।`,
  introHi: [
    `${m.short} NIELIT O Level (R5) का एक मॉड्यूल है: ${m.hi}। यहाँ आप इसके ${m.units.length} यूनिट पर अभ्यास टेस्ट दे सकते हैं।`,
    `टेस्ट हिंदी में हैं, मुफ़्त हैं और लॉगिन नहीं चाहिए। जमा करते ही हर सवाल का सही जवाब और कारण दिखता है, और रिपोर्ट बताती है कि किस विषय में अभी मेहनत बाकी है।`,
  ],
  introEn: [
    `${m.short} is a module of the NIELIT O Level (R5) course: ${m.en}. Here you can practise on its ${m.units.length} units.`,
    `The tests are in Hindi, free, and need no login. The moment you submit you see the right answer and reason for each question, and the report shows which topics still need work.`,
  ],
  faq: [
    {
      q: [`${m.short} क्या है और इसमें क्या-क्या पढ़ना होता है?`, `What is ${m.short} and what does it cover?`],
      a: [
        `${m.short} NIELIT O Level (R5) का मॉड्यूल "${m.en}" है। NIELIT के सिलेबस के यूनिट: ${join(m.units, 'hi')}। नवीनतम सिलेबस के लिए NIELIT की वेबसाइट देखें।`,
        `${m.short} is the NIELIT O Level (R5) module "${m.en}". Units in the NIELIT syllabus: ${join(m.units, 'en')}. See the NIELIT website for the latest syllabus.`,
      ],
    },
    {
      q: [`${m.short} का ऑनलाइन मॉक टेस्ट मुफ़्त कहाँ दे सकते हैं?`, `Where can I take a free ${m.short} online mock test?`],
      a: [
        `इसी पेज पर। टेस्ट मुफ़्त हैं, लॉगिन नहीं चाहिए, मोबाइल पर भी चलते हैं, और जमा करते ही जवाब तथा कमज़ोर विषय दिखते हैं।`,
        `Right on this page. The tests are free, need no login, work on mobile, and show answers and weak topics the moment you submit.`,
      ],
    },
    {
      q: [`${m.short} की परीक्षा में कितने प्रश्न आते हैं और कितना समय मिलता है?`, `How many questions and how much time does the ${m.short} exam have?`],
      a: [
        `परीक्षा का वर्तमान पैटर्न NIELIT की आधिकारिक सूचना में देखें। यहाँ के टेस्ट सिर्फ़ अभ्यास के लिए हैं और हर टेस्ट पर उसके प्रश्न और समय लिखे होते हैं।`,
        `Check the current exam pattern in the official NIELIT notice. The tests here are for practice only, and each test shows its own number of questions and time.`,
      ],
    },
  ],
}));

/** Search-result title. The year is computed when the page is generated so it never goes stale. */
export const moduleSeoTitle = (m, year) => `${m.short} Mock Test ${year} – ${m.shortEn} (Hindi)`;

export const getModule = (slug) => MODULES.find((m) => m.slug === slug) || null;

export const DISCLAIMER_HI = 'यह एक स्वतंत्र अभ्यास प्लेटफ़ॉर्म है और NIELIT से संबद्ध नहीं है।';
export const DISCLAIMER_EN = 'This is an independent practice platform and is not affiliated with NIELIT.';
export const SITE_NAME_HI = 'O Level मॉक टेस्ट';
export const SITE_NAME_EN = 'O Level Mock Test';
