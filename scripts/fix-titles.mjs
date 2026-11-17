import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();
const manifestPath = path.join(rootDir, 'src', 'data', 'manifest.json');
const questionsDir = path.join(rootDir, 'src', 'data', 'questions');

export const SUBUNIT_TITLES = {
  "1.1": {
    "title_hi": "पुस्तकालय के प्रकार, उनके कार्य व उद्देश्य",
    "title_en": "Types of Libraries, Functions and Objectives"
  },
  "1.2": {
    "title_hi": "डॉ. एस.आर. रंगनाथन की जीवनी, योगदान एवं पाँच सूत्र",
    "title_en": "Dr. S.R. Ranganathan, Contributions and Five Laws of Library Science"
  },
  "1.3": {
    "title_hi": "भारत में पुस्तकालय आंदोलन, शिक्षा एवं पुस्तकालय अधिनियम",
    "title_en": "Library Movement, Education and Legislation in India & Bihar"
  },
  "1.4": {
    "title_hi": "राष्ट्रीय एवं अंतरराष्ट्रीय पुस्तकालय संघ",
    "title_en": "National and International Library Associations & Organizations"
  },
  "2.1": {
    "title_hi": "संग्रह विकास एवं अधिग्रहण प्रक्रिया",
    "title_en": "Collection Development and Acquisition Process"
  },
  "2.2": {
    "title_hi": "परिसंचरण तंत्र — चार्जिंग व डिस्चार्जिंग विधियां",
    "title_en": "Circulation Systems (Browne, Newark & Modern Methods)"
  },
  "2.3": {
    "title_hi": "पुस्तकालय बजट, वित्तीय प्रबंधन, भंडार सत्यापन एवं निरसन",
    "title_en": "Library Budgeting, Financial Management, Stock Verification & Weeding"
  },
  "2.4": {
    "title_hi": "मानव संसाधन प्रबंधन एवं संपूर्ण गुणवत्ता प्रबंधन (TQM)",
    "title_en": "Human Resource Management, Staff Formula and Total Quality Management (TQM)"
  },
  "3.1": {
    "title_hi": "ज्ञान जगत एवं वर्गीकरण पद्धतियां (DDC, UDC, CC)",
    "title_en": "Universe of Knowledge and Classification Schemes (DDC, UDC, CC)"
  },
  "3.2": {
    "title_hi": "सूचीकरण, मेटाडेटा मानक एवं अनुक्रमणीकरण पद्धतियां",
    "title_en": "Cataloguing, Metadata Standards (MARC-21, RDA) and Indexing Systems"
  },
  "4.1": {
    "title_hi": "सूचना स्रोतों के प्रकार (प्राथमिक, द्वितीयक एवं तृतीयक)",
    "title_en": "Types of Information Sources (Primary, Secondary and Tertiary)"
  },
  "4.2": {
    "title_hi": "प्रमुख संदर्भ स्रोत एवं इलेक्ट्रॉनिक संसाधन",
    "title_en": "Reference Sources, Directories, Dictionaries, Encyclopedias & Electronic Resources"
  },
  "4.3": {
    "title_hi": "संदर्भ सेवाएं, सामयिक अभिज्ञता सेवा (CAS) एवं चयनित सूचना प्रसार (SDI)",
    "title_en": "Reference Services, Current Awareness Service (CAS) and Selective Dissemination of Information (SDI)"
  },
  "4.4": {
    "title_hi": "दस्तावेज वितरण, अंतर-पुस्तकालय ऋण, उपयोगकर्ता शिक्षा एवं जनसंपर्क",
    "title_en": "Document Delivery Services (DDS), Inter-Library Loan, User Education & Public Relations"
  },
  "5.1": {
    "title_hi": "पुस्तकालय स्वचालन एवं प्रमुख सॉफ्टवेयर (कोहा, सोल, ई-ग्रंथालय)",
    "title_en": "Library Automation and Integrated Library Software (Koha, SOUL, e-Granthalaya)"
  },
  "5.2": {
    "title_hi": "बारकोड एवं आरएफआईडी (RFID) तकनीक",
    "title_en": "Barcode and RFID Technology in Libraries"
  },
  "5.3": {
    "title_hi": "डिजिटल एवं वर्चुअल पुस्तकालय, डिजिटल रिपॉजिटरी",
    "title_en": "Digital and Virtual Libraries, Institutional Repositories and Metadata (Dublin Core)"
  },
  "5.4": {
    "title_hi": "पुस्तकालय नेटवर्क एवं संसाधन साझाकरण (Consortia)",
    "title_en": "Library Networks and Information Consortia (INFLIBNET, DELNET, OCLC)"
  },
  "6.1": {
    "title_hi": "ग्रंथमिति (Bibliometrics), साइंटोमेट्रिक्स एवं शोध मीट्रिक्स",
    "title_en": "Bibliometrics, Scientometrics, Informetrics and Research Metrics"
  },
  "6.2": {
    "title_hi": "अंतरराष्ट्रीय मानक (ISBN, ISSN), कॉपीराइट एवं बौद्धिक संपदा अधिकार (IPR)",
    "title_en": "International Standards (ISBN, ISSN), Copyright Act, Intellectual Property Rights (IPR) & Ethics"
  },
  "7.1": {
    "title_hi": "बिहार का इतिहास एवं स्वतंत्रता संग्राम में बिहार का योगदान",
    "title_en": "History of Bihar and Role of Bihar in the National Freedom Movement"
  },
  "7.2": {
    "title_hi": "बिहार का भौतिक भूगोल, नदियां, खनिज एवं जनगणना 2011",
    "title_en": "Physical Geography, River Systems, Mineral Wealth & Census 2011 of Bihar"
  },
  "7.3": {
    "title_hi": "बिहार की कला, संस्कृति, मेले, त्योहार एवं प्रमुख व्यक्तित्व",
    "title_en": "Art, Culture, Paintings, Fairs, Festivals, Tourism & Famous Personalities of Bihar"
  },
  "8.1": {
    "title_hi": "भारतीय संविधान, राजव्यवस्था एवं बिहार पंचायती राज प्रणाली",
    "title_en": "Indian Constitution, Polity, Governance and Bihar Panchayati Raj System"
  },
  "8.2": {
    "title_hi": "दैनिक सामान्य विज्ञान एवं पर्यावरणीय पारिस्थितिकी",
    "title_en": "General Science (Physics, Chemistry, Biology) and Environmental Ecology"
  },
  "8.3": {
    "title_hi": "समसामयिकी (बिहार, राष्ट्रीय, अंतरराष्ट्रीय) एवं प्रमुख सरकारी योजनाएं",
    "title_en": "Current Affairs (Bihar, National, International) & Flagship Government Schemes"
  },
  "9.1": {
    "title_hi": "कंप्यूटर की बुनियादी संरचना, पीढ़ियां, हार्डवेयर एवं मेमोरी",
    "title_en": "Computer Architecture, Generations, Hardware Components & Memory Hierarchy"
  },
  "9.2": {
    "title_hi": "ऑपरेटिंग सिस्टम, एमएस ऑफिस, इंटरनेट, ईमेल एवं साइबर सुरक्षा",
    "title_en": "Operating Systems, MS Office Suite, Internet, Email & Cyber Security Fundamentals"
  },
  "10.1": {
    "title_hi": "मौखिक तर्कशक्ति (श्रृंखला, कोडिंग-डिकोडिंग, रक्त संबंध, दिशा एवं रैंकिंग)",
    "title_en": "Verbal Reasoning (Number & Letter Series, Coding-Decoding, Blood Relations, Direction & Ranking)"
  },
  "10.2": {
    "title_hi": "विश्लेषणात्मक एवं गैर-मौखिक तर्कशक्ति (न्याय निगमन, वेन आरेख, दर्पण एवं पासा)",
    "title_en": "Analytical & Non-Verbal Reasoning (Syllogisms, Venn Diagrams, Matrix & Spatial Logic)"
  }
};

// 1. Update manifest.json
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
for (const unit of manifest) {
  for (const sub of unit.subUnits) {
    if (SUBUNIT_TITLES[sub.subUnitNum]) {
      sub.title_hi = SUBUNIT_TITLES[sub.subUnitNum].title_hi;
      sub.title_en = SUBUNIT_TITLES[sub.subUnitNum].title_en;
    }
  }
}
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf-8');
console.log('Updated manifest.json successfully');

// 2. Update questions files
const questionFiles = fs.readdirSync(questionsDir).filter(f => f.endsWith('.json'));
for (const file of questionFiles) {
  const filePath = path.join(questionsDir, file);
  const questions = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  for (const q of questions) {
    if (SUBUNIT_TITLES[q.subUnitNum]) {
      q.subUnitTitle_hi = SUBUNIT_TITLES[q.subUnitNum].title_hi;
      q.subUnitTitle_en = SUBUNIT_TITLES[q.subUnitNum].title_en;
    }
  }
  fs.writeFileSync(filePath, JSON.stringify(questions, null, 2) + '\n', 'utf-8');
}
console.log(`Updated ${questionFiles.length} question JSON files successfully`);
