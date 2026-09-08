'use client';
import BrandImage from './brand-image';
import { useEffect, useState, type SyntheticEvent } from 'react';
import {
  Download,
  LockKeyhole,
  ArrowLeft,
  Check,
  ImagePlus,
  LogOut,
} from 'lucide-react';
import {
  DEFAULT_NAME,
  DEFAULT_PIN_HASH,
  DEFAULT_INTRO,
  hashPin,
  normalizePin,
  validPin,
} from '@/lib/preferences';
export const defaultLogo = () => `${import.meta.env.BASE_URL}brand.png`;
type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
};
export function InstallApp() {
  const [prompt, setPrompt] = useState<InstallEvent | null>(null),
    [help, setHelp] = useState(false);
  useEffect(() => {
    const capture = (event: Event) => {
        event.preventDefault();
        setPrompt(event as InstallEvent);
      },
      installed = () => {
        setPrompt(null);
        setHelp(false);
      };
    window.addEventListener('beforeinstallprompt', capture);
    window.addEventListener('appinstalled', installed);
    if ('serviceWorker' in navigator && import.meta.env.PROD) {
      navigator.serviceWorker
        .register(`${import.meta.env.BASE_URL}sw.js`, {
          scope: import.meta.env.BASE_URL,
          updateViaCache: 'none',
        })
        .catch(() => setHelp(true));
    }
    return () => {
      window.removeEventListener('beforeinstallprompt', capture);
      window.removeEventListener('appinstalled', installed);
    };
  }, []);
  async function install() {
    if (!prompt) {
      setHelp(true);
      return;
    }
    await prompt.prompt();
    await prompt.userChoice;
    setPrompt(null);
  }
  return (
    <div className="install-app">
      <button
        type="button"
        className="soft save"
        onClick={() => void install()}
      >
        <Download size={18} /> تثبيت التطبيق على الهاتف
      </button>
      {help && (
        <p className="install-help">
          من قائمة المتصفح اختر «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية».
          على iPhone افتح الموقع في Safari ثم «مشاركة» ← «إضافة إلى الشاشة
          الرئيسية». إذا كان مثبتًا بالفعل افتحه من أيقونته.
        </p>
      )}
    </div>
  );
}
export function Welcome({
  name,
  logo,
  pinHash,
  onEnter,
}: {
  name: string;
  logo: string;
  pinHash: string;
  onEnter: (hash: string) => void;
}) {
  const [pin, setPin] = useState(''),
    [confirm, setConfirm] = useState(''),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  async function enter(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    if (!validPin(pin)) {
      setError('الرمز يجب أن يتكوّن من 4 إلى 8 أرقام');
      return;
    }
    if (!pinHash && normalizePin(pin) !== normalizePin(confirm)) {
      setError('الرمزان غير متطابقين');
      return;
    }
    setBusy(true);
    try {
      const hash = await hashPin(pin);
      if (pinHash && hash !== pinHash) {
        setError('رمز الدخول غير صحيح');
        return;
      }
      setPin('');
      setConfirm('');
      onEnter(hash);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="welcome">
      <section className="welcome-card">
        <div className="welcome-photo">
          <BrandImage src={logo} alt={name} />
          <div className="welcome-overlay">
            <span>أهلًا وسهلًا بك</span>
            <h1>{name}</h1>
            <p>الزبائن والمخزون والحسابات، في مكان واحد.</p>
          </div>
        </div>
        <div className="welcome-content">
          <span className="welcome-lock">
            <LockKeyhole size={22} />
          </span>
          <h2>{pinHash ? 'مرحبًا بعودتك' : 'لنبدأ يومًا مرتبًا'}</h2>
          <p>
            {pinHash
              ? 'أدخل رمزك لفتح الحسابات.'
              : 'عيّن رمز دخول لهذه الجلسة لتجربة التطبيق.'}
          </p>
          <form onSubmit={enter}>
            <label>
              {pinHash ? 'رمز الدخول' : 'رمز الدخول الجديد'}
              <input
                type="password"
                inputMode="numeric"
                autoComplete="off"
                maxLength={8}
                required
                value={pin}
                onChange={(e) => setPin(e.target.value)}
              />
            </label>
            {!pinHash && (
              <label>
                تأكيد الرمز
                <input
                  type="password"
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={8}
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
              </label>
            )}
            {error && (
              <p role="alert" className="error">
                {error}
              </p>
            )}
            <button disabled={busy} className="primary save" type="submit">
              {busy ? 'جارٍ الفتح…' : 'دخول التطبيق'}
              <ArrowLeft size={19} />
            </button>
          </form>
          <InstallApp />
          <p className="session-note">
            نسخة معاينة: الرمز والبيانات مؤقتة وتُمسح عند إعادة التحميل. ربط حساب
            الزبون وقاعدة البيانات هو المرحلة التالية.
          </p>
        </div>
      </section>
    </main>
  );
}
export function useAppPreferences() {
  const [name, setName] = useState(DEFAULT_NAME),
    [intro, setIntro] = useState(DEFAULT_INTRO),
    [logo, setLogo] = useState(defaultLogo),
    [logoFile, setLogoFile] = useState<File | null>(null),
    [pinHash, setPinHash] = useState(DEFAULT_PIN_HASH),
    [unlocked, setUnlocked] = useState(false);
  useEffect(() => {
    document.title = `${name} | دفتر الديون`;
  }, [name]);
  useEffect(() => {
    let active = true;
    fetch(defaultLogo())
      .then((r) => {
        if (!r.ok) throw Error('Logo unavailable');
        return r.blob();
      })
      .then((blob) => {
        if (active)
          setLogoFile(
            (current) =>
              current ||
              new File([blob], 'شعار-المجمع.png', { type: 'image/png' }),
          );
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  useEffect(
    () => () => {
      if (logo.startsWith('blob:')) URL.revokeObjectURL(logo);
    },
    [logo],
  );
  return {
    name,
    setName,
    intro,
    setIntro,
    logo,
    setLogo,
    logoFile,
    setLogoFile,
    pinHash,
    setPinHash,
    unlocked,
    setUnlocked,
  };
}
type Prefs = ReturnType<typeof useAppPreferences>;
export function SettingsPanel({ prefs }: { prefs: Prefs }) {
  const [name, setName] = useState(prefs.name),
    [intro, setIntro] = useState(prefs.intro),
    [file, setFile] = useState<File | null>(null),
    [preview, setPreview] = useState(prefs.logo),
    [current, setCurrent] = useState(''),
    [next, setNext] = useState(''),
    [repeat, setRepeat] = useState(''),
    [message, setMessage] = useState(''),
    [pinMessage, setPinMessage] = useState(''),
    [busy, setBusy] = useState(false);
  useEffect(
    () => () => {
      if (preview.startsWith('blob:') && preview !== prefs.logo)
        URL.revokeObjectURL(preview);
    },
    [preview, prefs.logo],
  );
  function chooseLogo(selected?: File) {
    if (!selected) return;
    if (
      !['image/png', 'image/jpeg', 'image/webp'].includes(selected.type) ||
      selected.size > 5 * 1024 * 1024
    ) {
      setMessage('اختر صورة PNG أو JPG أو WebP بحجم أقل من 5 ميغابايت');
      return;
    }
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setMessage('');
  }
  function saveBrand(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!name.trim()) {
      setMessage('اكتب اسم التطبيق');
      return;
    }
    prefs.setName(name.trim());
    prefs.setIntro(intro.trim());
    if (file) {
      prefs.setLogo(URL.createObjectURL(file));
      prefs.setLogoFile(file);
    }
    setMessage('تم تطبيق الإعدادات لهذه الجلسة');
  }
  async function changePin(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setPinMessage('');
    if (!validPin(next)) {
      setPinMessage('الرمز الجديد يجب أن يتكوّن من 4 إلى 8 أرقام');
      return;
    }
    if (normalizePin(next) !== normalizePin(repeat)) {
      setPinMessage('تأكيد الرمز غير مطابق');
      return;
    }
    setBusy(true);
    try {
      if ((await hashPin(current)) !== prefs.pinHash) {
        setPinMessage('الرمز الحالي غير صحيح');
        return;
      }
      prefs.setPinHash(await hashPin(next));
      setCurrent('');
      setNext('');
      setRepeat('');
      setPinMessage('تم تغيير رمز الدخول لهذه الجلسة');
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="section-heading">
        <div>
          <h2>الإعدادات</h2>
          <p>هوية التطبيق ورمز الدخول ورسائل واتساب</p>
        </div>
      </div>
      <section className="settings-card">
        <h3>
          <ImagePlus size={20} /> اسم التطبيق والشعار
        </h3>
        <form onSubmit={saveBrand}>
          <div className="logo-preview">
            <BrandImage src={preview} alt="معاينة الشعار" />
          </div>
          <label>
            تغيير الشعار
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => chooseLogo(e.target.files?.[0])}
            />
          </label>
          <label>
            اسم التطبيق
            <input
              required
              maxLength={70}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label>
            مقدمة رسالة واتساب
            <textarea
              maxLength={500}
              value={intro}
              onChange={(e) => setIntro(e.target.value)}
              placeholder="اكتب الرسالة التي تسبق تفاصيل الحساب"
            />
          </label>
          <div className="message-preview">
            <strong>معاينة بداية الرسالة</strong>
            <p>
              {name}
              {'\n'}
              {intro}
            </p>
            <small>تليها بيانات الزبون والمعاملة والدين المتبقي.</small>
          </div>
          <p className="settings-hint">
            الاسم والمقدمة يرافقان الرسالة. على الهواتف الداعمة تُفتح المشاركة مع
            صورة الشعار لتختار واتساب؛ وإلا تُفتح رسالة واتساب نصية.
          </p>
          <button className="primary save" type="submit">
            <Check size={18} /> حفظ الإعدادات
          </button>
          {message && <output className="settings-result">{message}</output>}
        </form>
      </section>
      <section className="settings-card">
        <h3>
          <LockKeyhole size={20} /> تغيير رمز الدخول
        </h3>
        <form onSubmit={changePin}>
          <label>
            الرمز الحالي
            <input
              type="password"
              inputMode="numeric"
              autoComplete="off"
              required
              maxLength={8}
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
            />
          </label>
          <label>
            الرمز الجديد
            <input
              type="password"
              inputMode="numeric"
              autoComplete="off"
              required
              maxLength={8}
              value={next}
              onChange={(e) => setNext(e.target.value)}
            />
          </label>
          <label>
            تأكيد الرمز الجديد
            <input
              type="password"
              inputMode="numeric"
              autoComplete="off"
              required
              maxLength={8}
              value={repeat}
              onChange={(e) => setRepeat(e.target.value)}
            />
          </label>
          <button disabled={busy} className="primary save" type="submit">
            تغيير الرمز
          </button>
          {pinMessage && (
            <output className="settings-result">{pinMessage}</output>
          )}
        </form>
        <p className="settings-hint">
          هذا قفل تجريبي لهذه الجلسة، وليس نظام مصادقة لحفظ بيانات حقيقية.
        </p>
        <button className="soft save" onClick={() => prefs.setUnlocked(false)}>
          <LogOut size={18} /> قفل التطبيق
        </button>
      </section>
      <section className="settings-card">
        <h3>التطبيق على هاتفك</h3>
        <InstallApp />
        <p className="settings-hint">
          اسم وأيقونة التطبيق المثبّت ثابتان لهذه النسخة. تغيير الاسم والشعار أعلاه
          يخص الواجهة ورسالة المشاركة.
        </p>
      </section>
    </>
  );
}
