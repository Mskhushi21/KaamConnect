import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';

export function AboutPage() {
  const { t, language } = useApp();

  const copy = {
    en: {
      intro:
        'KaamConnect is a public local employment platform designed to bridge the gap between skilled local workers and the households, shops, restaurants, workshops, and small businesses that rely on them every day.',
      missionTitle: 'Our Mission',
      missionBody:
        'Across Karnataka and India, finding dependable local work often depends on word-of-mouth or middlemen who charge unfair commissions. KaamConnect gives workers and employers a clean, trilingual, direct platform where pay, working hours, and location are stated clearly upfront.',
      valuesTitle: 'What We Stand For',
      values: [
        'Zero recruitment or registration fees for workers.',
        'Support for English, Kannada (ಕನ್ನಡ), and Hindi (हिन्दी) across every screen.',
        'Respect for user privacy—we never collect Aadhaar numbers or banking passwords.',
        'Honest employer listings without fabricated verification badges or hidden terms.',
      ],
    },
    kn: {
      intro:
        'KaamConnect ಸ್ಥಳೀಯ ನುರಿತ ಕಾರ್ಮಿಕರು ಮತ್ತು ಅವರಿಗೆ ಉದ್ಯೋಗ ನೀಡುವ ಮನೆಗಳು, ಅಂಗಡಿಗಳು, ಹೋಟೆಲ್‌ಗಳು ಮತ್ತು ಸಣ್ಣ ವ್ಯಾಪಾರಗಳನ್ನು ನೇರವಾಗಿ ಸಂಪರ್ಕಿಸುವ ಸಾರ್ವಜನಿಕ ಸ್ಥಳೀಯ ಉದ್ಯೋಗ ವೇದಿಕೆಯಾಗಿದೆ.',
      missionTitle: 'ನಮ್ಮ ಗುರಿ',
      missionBody:
        'ಕರ್ನಾಟಕ ಮತ್ತು ಭಾರತದಾದ್ಯಂತ ಸ್ಥಳೀಯ ಕೆಲಸ ಹುಡುಕುವುದು ಅನೇಕ ಬಾರಿ ಮಧ್ಯವರ್ತಿಗಳ ಕಮಿಷನ್‌ಗೆ ಒಳಪಟ್ಟಿರುತ್ತದೆ. KaamConnect ಕಾರ್ಮಿಕರು ಮತ್ತು ಉದ್ಯೋಗದಾತರಿಗೆ ವೇತನ, ಕೆಲಸದ ಸಮಯ ಮತ್ತು ಸ್ಥಳದ ಸ್ಪಷ್ಟ ಮಾಹಿತಿಯೊಂದಿಗೆ ನೇರ ವೇದಿಕೆಯನ್ನು ನೀಡುತ್ತದೆ.',
      valuesTitle: 'ನಮ್ಮ ತತ್ವಗಳು',
      values: [
        'ಕಾರ್ಮಿಕರಿಗೆ ಯಾವುದೇ ನೋಂದಣಿ ಅಥವಾ ನೇಮಕಾತಿ ಶುಲ್ಕವಿಲ್ಲ.',
        'ಪ್ರತಿ ಪುಟದಲ್ಲೂ ಇಂಗ್ಲಿಷ್, ಕನ್ನಡ ಮತ್ತು ಹಿಂದಿ ಭಾಷಾ ಸೌಲಭ್ಯ.',
        'ಗೌಪ್ಯತೆಗೆ ಆದ್ಯತೆ — ನಾವು ಆಧಾರ್ ಸಂಖ್ಯೆ ಅಥವಾ ಬ್ಯಾಂಕ್ ಪಾಸ್‌ವರ್ಡ್ ಕೇಳುವುದಿಲ್ಲ.',
        'ಸ್ಪಷ್ಟ ವೇತನ ಮತ್ತು ಪ್ರಾಮಾಣಿಕ ಉದ್ಯೋಗ ಮಾಹಿತಿ.',
      ],
    },
    hi: {
      intro:
        'KaamConnect एक सार्वजनिक स्थानीय रोजगार मंच है जो कुशल कामगारों को घरों, दुकानों, होटलों, कार्यशालाओं और स्थानीय व्यवसायों से सीधे जोड़ता है।',
      missionTitle: 'हमारा उद्देश्य',
      missionBody:
        'कर्नाटक और पूरे भारत में स्थानीय रोजगार अक्सर बिचौलियों और कमीशन पर निर्भर रहता है। KaamConnect कामगारों और नियोक्ताओं को तीन भाषाओं में एक सीधा मंच देता है जहाँ वेतन, समय और स्थान पहले से स्पष्ट होते हैं।',
      valuesTitle: 'हमारे सिद्धांत',
      values: [
        'कामगारों के लिए कोई पंजीकरण या भर्ती शुल्क नहीं।',
        'हर स्क्रीन पर अंग्रेजी, कन्नड़ और हिंदी भाषा की सुविधा।',
        'डेटा गोपनीयता — हम कभी आधार नंबर या बैंक पासवर्ड नहीं मांगते।',
        'स्पष्ट वेतन विवरण और पारदर्शी कार्य शर्तें।',
      ],
    },
  }[language];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="space-y-3">
        <h1 className="text-3xl font-bold text-slate-900 font-display">{t.common.aboutUs}</h1>
        <p className="text-base sm:text-lg text-slate-700 leading-relaxed">{copy.intro}</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-4">
        <h2 className="text-xl font-bold text-slate-900 font-display">{copy.missionTitle}</h2>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">{copy.missionBody}</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-4">
        <h2 className="text-xl font-bold text-slate-900 font-display">{copy.valuesTitle}</h2>
        <ul className="space-y-2.5 text-sm sm:text-base text-slate-700 list-disc pl-5">
          {copy.values.map((v) => (
            <li key={v}>{v}</li>
          ))}
        </ul>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link to="/jobs" className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-900 rounded-lg">
          {t.nav.findJobs}
        </Link>
        <Link to="/contact" className="px-5 py-2.5 text-sm font-semibold text-slate-800 border border-slate-300 rounded-lg">
          {t.common.contactUs}
        </Link>
      </div>
    </div>
  );
}

export function HelpPage() {
  const { t, language } = useApp();

  const faqs = {
    en: [
      {
        q: 'Do workers have to pay any fee to use KaamConnect?',
        a: 'No. KaamConnect is completely free for workers. Never pay any registration, uniform, or deposit fee to an employer or agent.',
      },
      {
        q: 'How do I apply for a job?',
        a: 'Register a free Worker account, open any job listing on Find Jobs, and click Apply Now. You can track your application status inside your Worker Dashboard.',
      },
      {
        q: 'How do employers protect their phone number?',
        a: 'When posting a job, employers can check "Hide my phone number until I accept a worker application." Their phone number stays hidden until they mark an application Accepted.',
      },
      {
        q: 'What if I see a suspicious or fake job listing?',
        a: 'Open the job page and click Report Job or Report Employer. Our administrators review safety reports and remove fraudulent listings.',
      },
    ],
    kn: [
      {
        q: 'ಕಾರ್ಮಿಕರು KaamConnect ಬಳಸಲು ಯಾವುದೇ ಶುಲ್ಕ ಪಾವತಿಸಬೇಕೇ?',
        a: 'ಇಲ್ಲ. ಕಾರ್ಮಿಕರಿಗೆ KaamConnect ಸಂಪೂರ್ಣವಾಗಿ ಉಚಿತವಾಗಿದೆ. ಯಾರಿಗೂ ನೋಂದಣಿ ಅಥವಾ ನೇಮಕಾತಿ ಶುಲ್ಕ ನೀಡಬೇಡಿ.',
      },
      {
        q: 'ಕೆಲಸಕ್ಕೆ ಅರ್ಜಿ ಸಲ್ಲಿಸುವುದು ಹೇಗೆ?',
        a: 'ಉಚಿತ ಕಾರ್ಮಿಕ ಖಾತೆಯನ್ನು ರಚಿಸಿ, ಕೆಲಸವನ್ನು ಆಯ್ಕೆ ಮಾಡಿ ಮತ್ತು "ಈಗಲೇ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ" ಕ್ಲಿಕ್ ಮಾಡಿ. ನಿಮ್ಮ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ನಲ್ಲಿ ಸ್ಥಿತಿಯನ್ನು ನೋಡಬಹುದು.',
      },
      {
        q: 'ಉದ್ಯೋಗದಾತರು ತಮ್ಮ ಫೋನ್ ಸಂಖ್ಯೆಯನ್ನು ಹೇಗೆ ರಕ್ಷಿಸಬಹುದು?',
        a: 'ಕೆಲಸ ಪ್ರಕಟಿಸುವಾಗ "ಅರ್ಜಿಯನ್ನು ಸ್ವೀಕರಿಸುವವರೆಗೆ ಫೋನ್ ಸಂಖ್ಯೆ ಮರೆಮಾಡಿ" ಆಯ್ಕೆಯನ್ನು ಆರಿಸಬಹುದು.',
      },
      {
        q: 'ಸಂಶಯಾಸ್ಪದ ಜಾಹೀರಾತು ಕಂಡುಬಂದರೆ ಏನು ಮಾಡಬೇಕು?',
        a: 'ಕೆಲಸದ ವಿವರ ಪುಟದಲ್ಲಿ "ಕೆಲಸದ ಬಗ್ಗೆ ದೂರು ನೀಡಿ" ಕ್ಲಿಕ್ ಮಾಡಿ. ನಿರ್ವಾಹಕರು ಪರಿಶೀಲಿಸಿ ಕ್ರಮ ಕೈಗೊಳ್ಳುತ್ತಾರೆ.',
      },
    ],
    hi: [
      {
        q: 'क्या कामगारों को KaamConnect उपयोग करने के लिए कोई शुल्क देना होगा?',
        a: 'नहीं। कामगारों के लिए यह मंच पूरी तरह निःशुल्क है। किसी को भी रजिस्ट्रेशन या भर्ती शुल्क न दें।',
      },
      {
        q: 'नौकरी के लिए आवेदन कैसे करें?',
        a: 'निःशुल्क कामगार खाता बनाएँ, किसी भी नौकरी का विवरण खोलें और "अभी आवेदन करें" पर क्लिक करें।',
      },
      {
        q: 'नियोक्ता अपना फोन नंबर कैसे सुरक्षित रख सकते हैं?',
        a: 'नौकरी पोस्ट करते समय "आवेदन स्वीकार करने तक फोन नंबर छुपाएँ" विकल्प चुन सकते हैं।',
      },
      {
        q: 'यदि कोई नौकरी संदिग्ध या नकली लगे तो क्या करें?',
        a: 'नौकरी पृष्ठ पर "नौकरी की रिपोर्ट करें" पर क्लिक करें ताकि एडमिन टीम जांच कर सके।',
      },
    ],
  }[language];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 font-display">{t.common.helpSupport}</h1>
        <p className="text-sm sm:text-base text-slate-600 mt-1">{t.hero.safetyNotice}</p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <p className="text-sm text-amber-950">{t.jobs.safetyBoxBody}</p>
      </div>

      <div className="space-y-4">
        {faqs.map((item) => (
          <div key={item.q} className="bg-white border border-slate-200 rounded-xl p-6 space-y-2">
            <h2 className="text-base font-bold text-slate-900">{item.q}</h2>
            <p className="text-sm text-slate-600 leading-relaxed">{item.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PrivacyPage() {
  const { t } = useApp();
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
      <h1 className="text-3xl font-bold text-slate-900 font-display">{t.common.privacyPolicy}</h1>
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-4 text-sm sm:text-base text-slate-700 leading-relaxed">
        <p>
          <strong>1. Minimal Information Collection:</strong> KaamConnect collects only the details needed for local job matching—your name, email address, mobile number, city/locality, skills, and work preferences. We do not collect Aadhaar numbers, PAN numbers, bank passwords, or financial credentials.
        </p>
        <p>
          <strong>2. Contact Visibility Controls:</strong> Worker mobile numbers and email addresses are never shown in the public worker directory; they are shared with an employer only when a worker applies for that employer&apos;s job listing. Employers can also choose to hide their phone number until they accept an applicant.
        </p>
        <p>
          <strong>3. Password &amp; Session Security:</strong> Passwords are stored using secure one-way cryptographic hashing. Sessions use signed HTTP-only cookies.
        </p>
        <p>
          <strong>4. Language Preference:</strong> Your chosen language (English, Kannada, or Hindi) is stored in your browser and account profile solely to maintain your display preference.
        </p>
      </div>
    </div>
  );
}

export function TermsPage() {
  const { t } = useApp();
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
      <h1 className="text-3xl font-bold text-slate-900 font-display">{t.common.termsConditions}</h1>
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-4 text-sm sm:text-base text-slate-700 leading-relaxed">
        <p>
          <strong>1. Zero Recruitment Fee Policy:</strong> Employers and recruiters must not demand registration fees, security deposits, or advance payments from workers. Listings violating this rule will be removed and the associated account suspended.
        </p>
        <p>
          <strong>2. Accurate Job Information:</strong> All job listings must accurately describe the work role, working hours, location, and monthly salary or daily wage. Misleading pay claims are prohibited.
        </p>
        <p>
          <strong>3. Independent Verification:</strong> KaamConnect provides a platform for direct connection and community moderation, and does not claim government verification for private households or businesses. Users should verify workplace details before starting work.
        </p>
        <p>
          <strong>4. Account Moderation:</strong> Platform administrators reserve the right to flag, remove, or suspend accounts or listings reported for fraud, harassment, or unsafe practices.
        </p>
      </div>
    </div>
  );
}
