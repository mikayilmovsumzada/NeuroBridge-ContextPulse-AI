const { useState, useEffect, useRef } = React;

// ============ XSS təmizləyici ============
function sanitizeInput(str) {
    if (typeof str !== 'string') return '';
    return str.replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}

// ============ DİL (AZ / EN) ============
const I18N = {
    az: {
        brandSub: 'Enterprise Context Platform', devPanel: 'İşçi Paneli', mgrPanel: 'Menecer Paneli', logout: 'Çıxış',
        live: 'Canlı', connecting: 'Qoşulur…', offlineDemo: 'Oflayn demo', loading: 'Yüklənir...',
        homeBadge: 'Zero Spyware • K-Anonimlik Metodologiyası',
        homeTitle: 'Kontekst İtkisini Sıfıra Endirən Süni İntellekt Platforması',
        homeSub: 'Ekran çəkən və ya keylogger istifadə etmədən, yalnız IDE metadataları əsasında inkişaf tıxanmalarını aşkar edin.',
        devCardTitle: 'İşçi Paneli (Dev View)', devCardText: 'Canlı IDE telemeteriya baxışı, uzaqda olma tarixçəsi və şəxsi kontekst bərpa vasitələri.',
        goDev: 'İşçi Panelinə Keçid', loginDev: 'İşçi Kimi Giriş Et (Parol ilə)',
        mgrCardTitle: 'Menecer Paneli (Secure)', mgrCardText: 'K-anonimlik qorunması ilə komanda səviyyəsində tıxanmaların canlı analitikası.',
        goMgr: 'Menecer Panelinə Keçid', loginMgr: 'Menecer Kimi Giriş Et (Parol ilə)',
        loginTitleDev: 'İşçi Panelinə Giriş', loginTitleMgr: 'Menecer Panelinə Giriş', loginSub: 'Şirkət e-poçtu və parolunuzu daxil edin',
        email: 'Şirkət E-poçtu', password: 'Parol', demoCreds: 'Demo Giriş Məlumatları:', cancel: 'İmtina', submit: 'Daxil Ol',
        loginErr: 'Səhv e-poçt və ya parol!', loginOkDev: 'İşçi Panelinə uğurla daxil oldunuz!',
        loginOkMgr: 'Menecer Panelinə təhlükəsiz giriş edildi!', logoutToast: 'Sistemdən çıxış edildi.', cookieSaved: 'Kuki seçimləriniz yadda saxlanıldı.',
        devTitle: 'İşçi Paneli (Developer View)', devSub: 'Canlı IDE metadata axını və fərdi re-engagement göstəriciləri',
        simBtn: 'Fasilə / Uzaqlaşmanı Simulyasiya Et', liveTitle: 'Canlı IDE Siqnalı (yalnız metadata)',
        file: 'Fayl', firstErr: 'İlk xəta', tests: 'Testlər', pr: 'Pull Request', line: 'sətir', errorsWord: 'xəta',
        passed: 'uğurlu', failed: 'uğursuz', unresolved: 'həll olunmamış şərh',
        privacyLine: 'ekran: yox · klaviatura: yox · kod məzmunu: yox',
        historyTitle: 'Uzaqda Olma və Fasilə Tarixçəniz', duration: 'Müddət', min: 'dəq', simSuffix: '(Simulyasiya)',
        idleTitle: 'Fasilə və Ya Uzaqlaşma Diagnostikası', idleText: 'Sistem son aktivlikdən sonra fasilə qeydə aldı. Səbəbi seçin:',
        whereLeft: 'Harada qalmışdın', aiReading: 'AI son kontekstinizi oxuyur...', pickReason: 'Səbəbi Seçin:', selectPh: '-- Səbəb seçin --',
        close: 'Bağla', record: 'Tarixçəyə Qeyd Et', recorded: 'Səbəbiniz tarixçəyə əlavə edildi və menecer panelinə anonim göndərildi.',
        serverFail: 'Server cavab vermədi, cavab qeyd olunmadı.',
        badge_gemini: 'Gemini · faktlara qarşı doğrulanıb', badge_no_key: 'hazır mətn (API açarı yoxdur)',
        badge_invalid: 'hazır mətn (AI cavabı doğrulamadan keçmədi)', badge_error: 'hazır mətn (AI əlçatmaz)',
        badge_timeout: 'hazır mətn (AI gec cavab verdi)', badge_offline: 'oflayn demo · hazır mətn', badge_srvfail: 'hazır mətn (server cavab vermədi)',
        mgrTitle: 'Menecer Analitika Paneli',
        mgrSub: (k) => `K-Anonimlik (K=${k}) çərçivəsində komanda səviyyəsində tıxanmalar. Fərdi işçi məlumatı bu paneldə yoxdur.`,
        teamSize: 'Komanda ölçüsü', last7: 'son 7 gün', responses: 'Cavablar', anonAnswers: 'anonim cavablar',
        kLabel: 'K həddi', minGroup: 'minimum qrup ölçüsü', hiddenGroups: 'Gizlədilən qruplar',
        analyticsTitle: 'Anonimləşdirilmiş Tıxanma (Blocker) Analitikası',
        insufficient: 'Cavabların sayı K həddindən azdır, heç bir qrup göstərilmir.', employees: 'işçi', avgStall: 'orta dayanma',
        hiddenRow: (k) => `Gizlədilib: qrup ölçüsü K=${k} həddindən azdır`,
        kReached: (k, l) => `K=${k} həddinə çatdı, qrup göründü: ${l}`,
        cat_PR_REVIEW_WAIT: 'PR review gözləməsi', sig_PR_REVIEW_WAIT: 'Median PR gözləməsi 26,4 saat',
        cat_CI_FLAKY: 'Qeyri-sabit CI testləri', sig_CI_FLAKY: '7 flaky test, 3 pipeline təkrar işə düşüb',
        cat_MEETING_LOAD: 'Görüşlər arası parçalanma', sig_MEETING_LOAD: 'Gündə orta 3,1 görüş',
        cat_UNCLEAR_REQUIREMENTS: 'Aydın olmayan tələb', sig_UNCLEAR_REQUIREMENTS: '2 task açıq sualla bağlanıb',
        cat_TOOLING: 'Mühit / alət problemləri', sig_TOOLING: 'Lokal mühit qurulumu və asılılıq xətaları',
        reason_pr: 'PR review gözləməsi', reason_ci: 'Qeyri-sabit CI / test problemi', reason_meet: 'Görüşlər arası parçalanma',
        reason_req: 'Aydın olmayan tələb', reason_tool: 'Mühit / alət problemi', reason_break: 'Şəxsi fasilə (çay / istirahət)',
        footerCopy: '© 2026 ContextPulse AI. Bütün hüquqlar qorunur.', privacyLink: 'Məxfilik Siyasəti', termsLink: 'İstifadə Şərtləri', cookiesLink: 'Kuki Siyasəti',
        cookieTitle: 'Kuki İcazələri Və Məxfilik', cookieText: 'Saytımızın düzgün çalışması üçün minimal funksional kukilərdən istifadə edirik. 3rd-party izləyici analitikalar tətbiq edilmir.',
        accept: 'Qəbul Et', readMore: 'Ətraflı Oxu',
        privacyTitle: 'Məxfilik Siyasəti (Privacy Policy)',
        privacyP1: 'ContextPulse AI platforması Zero Spyware prinsipi ilə çalışır. Sistem heç bir halda klaviaturanızın düymələrini (keylogger) izləmir və ekran şəkli (screenshot) çəkmir.',
        privacyP2: 'Menecer panelində yalnız anonimləşdirilmiş (K-Anonimlik, K=5) məlumatlar təqdim olunur.',
        termsTitle: 'İstifadə Şərtləri (Terms & Conditions)',
        termsP1: 'Bu platformadan istifadə edərkən verilənlərin yalnız müəssisədaxili effektivlik və kontekst bərpası məqsədilə emal edildiyini qəbul edirsiniz.',
        cookiePolTitle: 'Kuki Siyasəti (Cookie Policy)',
        cookiePolP1: 'Sistemdə yalnız dil və tema (dark/light) seçimlərinin, kuki razılığının saxlanılması üçün lokal yaddaşdan (localStorage) istifadə olunur. Məlumatlar 3rd-party qurumlara ötürülmür.',
        notFoundTitle: 'Səhifə Tapılmadı və ya Giriş Qadağandır',
        notFoundText: 'Axtardığınız keçid mövcud deyil və ya bu rol üçün icazə verilmir. İşçi və menecer panelləri bir-birindən tam ayrılıb.',
        backHome: 'Ana Səhifəyə Qayıt', themeAria: 'Temanı dəyiş', langAria: 'Dil',
        featSpyTitle: 'Sıfır Casus Proqram', featSpyText: 'Ekran qeydi və ya keylogger yoxdur. Yalnız təmiz metadata telemetriya axını.',
        featReTitle: '0 Saniyəlik Geri Dönüş', featReText: 'Boş vəziyyətdən qayıdan kimi süni intellekt konteksti dərhal bərpa edir.',
        featKTitle: 'K-Anonimlik Prinsipləri', featKText: 'Şəxsi məlumatlar maskalanır, komanda səviyyəli maneələr isə ağıllı şəkildə həll olunur.'
    },
    en: {
        brandSub: 'Enterprise Context Platform', devPanel: 'Employee Panel', mgrPanel: 'Manager Panel', logout: 'Log out',
        live: 'Live', connecting: 'Connecting…', offlineDemo: 'Offline demo', loading: 'Loading...',
        homeBadge: 'Zero Spyware • K-Anonymity Methodology',
        homeTitle: 'The AI Platform That Brings Context Loss to Zero',
        homeSub: 'Detect development blockers using only IDE metadata, with no screen capture and no keylogger.',
        devCardTitle: 'Employee Panel (Dev View)', devCardText: 'Live IDE telemetry view, away history and personal context recovery tools.',
        goDev: 'Open Employee Panel', loginDev: 'Log in as Employee (Password)',
        mgrCardTitle: 'Manager Panel (Secure)', mgrCardText: 'Live team-level blocker analytics protected by K-anonymity.',
        goMgr: 'Open Manager Panel', loginMgr: 'Log in as Manager (Password)',
        loginTitleDev: 'Employee Panel Login', loginTitleMgr: 'Manager Panel Login', loginSub: 'Enter your company email and password',
        email: 'Company Email', password: 'Password', demoCreds: 'Demo Credentials:', cancel: 'Cancel', submit: 'Log In',
        loginErr: 'Wrong email or password!', loginOkDev: 'Signed in to the Employee Panel!',
        loginOkMgr: 'Securely signed in to the Manager Panel!', logoutToast: 'You have been signed out.', cookieSaved: 'Your cookie preferences were saved.',
        devTitle: 'Employee Panel (Developer View)', devSub: 'Live IDE metadata stream and personal re-engagement indicators',
        simBtn: 'Simulate Break / Away', liveTitle: 'Live IDE Signal (metadata only)',
        file: 'File', firstErr: 'First error', tests: 'Tests', pr: 'Pull Request', line: 'line', errorsWord: 'errors',
        passed: 'passed', failed: 'failed', unresolved: 'unresolved comments',
        privacyLine: 'screen: none · keyboard: none · code content: none',
        historyTitle: 'Your Away and Break History', duration: 'Duration', min: 'min', simSuffix: '(simulation)',
        idleTitle: 'Break and Away Diagnostics', idleText: 'The system detected a break after your last activity. Choose the reason:',
        whereLeft: 'Where you left off', aiReading: 'AI is reading your latest context...', pickReason: 'Choose a reason:', selectPh: '-- Choose a reason --',
        close: 'Close', record: 'Save to History', recorded: 'Your reason was added to history and sent anonymously to the manager view.',
        serverFail: 'The server did not respond, your answer was not recorded.',
        badge_gemini: 'Gemini · verified against the facts', badge_no_key: 'template text (no API key)',
        badge_invalid: 'template text (AI answer failed verification)', badge_error: 'template text (AI unavailable)',
        badge_timeout: 'template text (AI responded too slowly)', badge_offline: 'offline demo · template text', badge_srvfail: 'template text (server did not respond)',
        mgrTitle: 'Manager Analytics Panel',
        mgrSub: (k) => `Team-level blockers under K-anonymity (K=${k}). No individual employee data appears in this panel.`,
        teamSize: 'Team size', last7: 'last 7 days', responses: 'Responses', anonAnswers: 'anonymous answers',
        kLabel: 'K threshold', minGroup: 'minimum group size', hiddenGroups: 'Hidden groups',
        analyticsTitle: 'Anonymized Blocker Analytics',
        insufficient: 'The number of responses is below K, so no group is shown.', employees: 'employees', avgStall: 'avg stall',
        hiddenRow: (k) => `Hidden: group size is below the K=${k} threshold`,
        kReached: (k, l) => `K=${k} reached, group now visible: ${l}`,
        cat_PR_REVIEW_WAIT: 'Waiting for PR review', sig_PR_REVIEW_WAIT: 'Median PR wait 26.4 hours',
        cat_CI_FLAKY: 'Flaky CI tests', sig_CI_FLAKY: '7 flaky tests, 3 pipelines re-run',
        cat_MEETING_LOAD: 'Fragmentation between meetings', sig_MEETING_LOAD: '3.1 meetings per day on average',
        cat_UNCLEAR_REQUIREMENTS: 'Unclear requirements', sig_UNCLEAR_REQUIREMENTS: '2 tasks closed with open questions',
        cat_TOOLING: 'Environment / tooling problems', sig_TOOLING: 'Local setup and dependency errors',
        reason_pr: 'Waiting for PR review', reason_ci: 'Flaky CI / test problem', reason_meet: 'Fragmentation between meetings',
        reason_req: 'Unclear requirements', reason_tool: 'Environment / tooling problem', reason_break: 'Personal break (tea / rest)',
        footerCopy: '© 2026 ContextPulse AI. All rights reserved.', privacyLink: 'Privacy Policy', termsLink: 'Terms', cookiesLink: 'Cookie Policy',
        cookieTitle: 'Cookie Permissions & Privacy', cookieText: 'We use minimal functional cookies so the site works correctly. No third-party tracking analytics are used.',
        accept: 'Accept', readMore: 'Read More',
        privacyTitle: 'Privacy Policy',
        privacyP1: 'ContextPulse AI works on the Zero Spyware principle. The system never tracks your keystrokes (keylogger) and never takes screenshots.',
        privacyP2: 'The manager panel only shows anonymized data (K-anonymity, K=5).',
        termsTitle: 'Terms & Conditions',
        termsP1: 'By using this platform you accept that data is processed only for in-company efficiency and context recovery.',
        cookiePolTitle: 'Cookie Policy',
        cookiePolP1: 'The system only uses local storage (localStorage) to remember your language, theme (dark/light) and cookie consent. No data is passed to third parties.',
        notFoundTitle: 'Page Not Found or Access Denied',
        notFoundText: 'The page does not exist or is not allowed for this role. The employee and manager panels are fully separated.',
        backHome: 'Back to Home', themeAria: 'Toggle theme', langAria: 'Language',
        featSpyTitle: 'Zero Spyware', featSpyText: 'No screen recording or keyloggers. Pure metadata telemetry stream.',
        featReTitle: '0-Second Re-engagement', featReText: 'Instant context restoration by AI immediately upon returning from idle state.',
        featKTitle: 'K-Anonymity Principles', featKText: 'Personal data is masked while team-level blockers are intelligently resolved.'
    }
};
function translate(lang, key, ...args) {
    const v = (I18N[lang] && I18N[lang][key] !== undefined) ? I18N[lang][key] : I18N.az[key];
    return typeof v === 'function' ? v(...args) : v;
}
const LangCtx = React.createContext({ lang: 'az', t: (k) => k });
const useT = () => React.useContext(LangCtx);

// ============ BACKEND (FastAPI) KÖMƏKÇİLƏRİ ============
const REASONS = [
    { id: 'pr', cat: 'PR_REVIEW_WAIT' }, { id: 'ci', cat: 'CI_FLAKY' }, { id: 'meet', cat: 'MEETING_LOAD' },
    { id: 'req', cat: 'UNCLEAR_REQUIREMENTS' }, { id: 'tool', cat: 'TOOLING' }, { id: 'break', cat: null }
];
async function api(path, opts) {
    const r = await fetch(path, opts);
    if (!r.ok) throw new Error(path + ' ' + r.status);
    return r.json();
}
const postJson = (path, body) => api(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

// Oflayn demo (backend yoxdursa, məsələn GitLab Pages): eyni məntiq brauzerdə
const K_ANON = 5, TEAM_SIZE = 40;
const BLOCKER_META = {
    PR_REVIEW_WAIT: { avg: 74, trend: '+18%' }, CI_FLAKY: { avg: 52, trend: '+6%' }, MEETING_LOAD: { avg: 38, trend: '-4%' },
    UNCLEAR_REQUIREMENTS: { avg: 61, trend: '+2%' }, TOOLING: { avg: 45, trend: '+3%' }
};
const SEED_EVENT = {
    event_id: 'evt_8f31c2a7', developer_ref: 'dev_a91f',
    workspace: { repo: 'payments-service', branch: 'feature/refund-idempotency' },
    last_meaningful_action: { type: 'EDIT_FUNCTION', file: 'src/refunds/processRefund.ts', symbol: 'processRefund', line_range: [48, 71], lines_added: 14, lines_removed: 3 },
    diagnostics: { errors: 2, warnings: 1, first_error: { code: 'TS2345', line: 63 } },
    test_state: { runner: 'jest', passed: 18, failed: 1, failing_test: 'rejects duplicate idempotency key' },
    pull_request: { id: 412, title: 'Refund idempotency keys', status: 'changes_requested', unresolved_comments: 3 }
};
function localTeam(st) {
    const insufficient = st.respondents < K_ANON;
    let hidden = 0;
    const shown = [];
    Object.keys(BLOCKER_META).forEach((cat) => {
        const n = st.counts[cat] || 0;
        if (insufficient || n < K_ANON) { hidden += 1; return; }
        const m = BLOCKER_META[cat];
        shown.push({ category: cat, affected_count: n, share: Math.round(n / st.respondents * 100) / 100, avg_stall_minutes: m.avg, trend_7d: m.trend, suppressed: false });
    });
    shown.sort((a, b) => b.affected_count - a.affected_count);
    const blockers = shown.concat(Array.from({ length: hidden }, (_, i) => ({ group: 'suppressed_' + (i + 1), suppressed: true })));
    return { k_threshold: K_ANON, population: { team_size: TEAM_SIZE, respondents: st.respondents }, blockers, suppressed_groups: hidden, insufficient_data: insufficient };
}
function localReminder(ev, lang) {
    const a = ev.last_meaningful_action, d = ev.diagnostics.first_error, t = ev.test_state, pr = ev.pull_request;
    const f = a.file.split('/').pop(), rng = f + ':' + a.line_range[0] + '–' + a.line_range[1];
    const p = [];
    if (lang === 'en') {
        p.push('Last time you were editing `' + a.symbol + '` (`' + rng + '`).', 'Error `' + d.code + '` is open at line ' + d.line + '.');
        if (t.failed) p.push(t.failed + ' test(s) failing: `' + t.failing_test + '`.');
        if (pr.unresolved_comments) p.push('PR #' + pr.id + ' has ' + pr.unresolved_comments + ' unresolved comment(s).');
        p.push('Nearest next step: check the error at line ' + d.line + '.');
    } else {
        p.push('Sonuncu dəfə `' + a.symbol + '` funksiyasını dəyişirdin (`' + rng + '`).', 'Sətir ' + d.line + '-də `' + d.code + '` xətası açıqdır.');
        if (t.failed) p.push(t.failed + ' test uğursuzdur: `' + t.failing_test + '`.');
        if (pr.unresolved_comments) p.push('PR #' + pr.id + ' üzrə həll olunmamış ' + pr.unresolved_comments + ' şərh var.');
        p.push('Ən yaxın addım: sətir ' + d.line + '-dəki xətanı yoxlamaq.');
    }
    return p.join(' ');
}
function getStoredLang() {
    try { const v = localStorage.getItem('cp_lang'); if (v === 'az' || v === 'en') return v; } catch (e) { /* yoxdur */ }
    return 'az';
}

// ============ İKONLAR ============
const Ico = ({ d, className = 'w-5 h-5' }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={d} /></svg>
);
const IconTerminal = (p) => <Ico {...p} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />;
const IconUsers = (p) => <Ico {...p} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />;
const IconSun = (p) => <Ico {...p} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />;
const IconMoon = (p) => <Ico {...p} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />;
const IconLock = (p) => <Ico {...p} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />;
const IconClock = (p) => <Ico {...p} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />;

// ============ ORTAQ KOMPONENTLƏR ============
function LivePill({ live, offline }) {
    const { t } = useT();
    const ok = live && !offline;
    return (
        <span className={'px-3 py-1.5 rounded-full text-[11px] font-mono font-semibold ' + (ok ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400')}>
            ● {offline ? t('offlineDemo') : live ? t('live') : t('connecting')}
        </span>
    );
}
function Stat({ label, value, sub, bump }) {
    return (
        <div className="p-4 bg-slate-50 dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] uppercase font-mono text-slate-400">{label}</span>
            <p className="text-sm font-bold text-slate-900 dark:text-white mt-1 break-words">
                {value}
                {bump ? <span className="ml-2 px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-mono animate-pulse">+{bump}</span> : null}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 break-words">{sub}</p>
        </div>
    );
}
function RichText({ text }) {
    return (
        <span>
            {String(text).split('`').map((p, i) => i % 2
                ? <code key={i} className="px-1.5 py-0.5 rounded-md bg-sky-500/10 text-sky-700 dark:text-sky-300 font-mono text-[12px]">{p}</code>
                : <span key={i}>{p}</span>)}
        </span>
    );
}
function LangSwitch({ lang, onChange }) {
    const { t } = useT();
    return (
        <div role="group" aria-label={t('langAria')} className="flex items-center bg-slate-100 dark:bg-slate-900 rounded-xl p-1">
            {['az', 'en'].map((l) => (
                <button key={l} onClick={() => onChange(l)} aria-pressed={lang === l}
                    className={'px-2.5 py-1.5 rounded-lg text-[11px] font-bold font-mono transition-all ' + (lang === l ? 'bg-sky-600 text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800')}>
                    {l.toUpperCase()}
                </button>
            ))}
        </div>
    );
}

// ============ ƏSAS TƏTBİQ ============
function App() {
    const [theme, setTheme] = useState('dark');
    const [lang, setLang] = useState(getStoredLang);
    const [currentRoute, setCurrentRoute] = useState('home');
    const [userRole, setUserRole] = useState(null); // null | 'employee' | 'manager'

    const [loginModalType, setLoginModalType] = useState(null);
    const [emailInput, setEmailInput] = useState('');
    const [passwordInput, setPasswordInput] = useState('');
    const [loginError, setLoginError] = useState(false);

    const [cookieConsent, setCookieConsent] = useState(() => { try { return localStorage.getItem('cookieConsentGiven') === 'true'; } catch (e) { return false; } });

    const [isIdleModalOpen, setIsIdleModalOpen] = useState(false);
    const [selectedReason, setSelectedReason] = useState('');
    const [awayHistory, setAwayHistory] = useState([
        { id: 1, iso: '2026-10-09T10:15:00', minutes: 25, sim: false, reasonId: 'pr' },
        { id: 2, iso: '2026-10-08T14:30:00', minutes: 40, sim: false, reasonId: 'ci' }
    ]);
    const [toastMsg, setToastMsg] = useState(null);

    // Backend vəziyyəti
    const [ideEvent, setIdeEvent] = useState(null);
    const [team, setTeam] = useState(null);
    const [live, setLive] = useState(false);
    const [offline, setOffline] = useState(false);
    const [reminder, setReminder] = useState(null);
    const [bumps, setBumps] = useState({});
    const teamRef = useRef(null);
    const langRef = useRef(lang);
    langRef.current = lang;
    const offlineState = useRef({ counts: { PR_REVIEW_WAIT: 8, CI_FLAKY: 6, MEETING_LOAD: 5, UNCLEAR_REQUIREMENTS: 5, TOOLING: 2 }, respondents: 26 });

    const t = (key, ...args) => translate(lang, key, ...args);
    const ctx = { lang, t };

    useEffect(() => { document.documentElement.classList.toggle('dark', theme === 'dark'); }, [theme]);
    useEffect(() => {
        document.documentElement.lang = lang;
        try { localStorage.setItem('cp_lang', lang); } catch (e) { /* yoxdur */ }
    }, [lang]);

    const showToast = (msg) => { setToastMsg(msg); setTimeout(() => setToastMsg(null), 4000); };

    // Yeni komanda məlumatı: say artımlarını və yeni açılan qrupu aşkar edir
    const applyTeam = (p) => {
        const prev = teamRef.current;
        const b = {};
        let fresh = null;
        if (prev) {
            const old = {};
            prev.blockers.forEach((x) => { if (!x.suppressed) old[x.category] = x.affected_count; });
            p.blockers.forEach((x) => {
                if (x.suppressed) return;
                if (!(x.category in old)) fresh = x;
                else if (x.affected_count > old[x.category]) b[x.category] = x.affected_count - old[x.category];
            });
            if (p.population.respondents > prev.population.respondents) b.respondents = p.population.respondents - prev.population.respondents;
        }
        teamRef.current = p;
        setTeam(p);
        const keys = Object.keys(b);
        if (keys.length) {
            setBumps((cur) => Object.assign({}, cur, b));
            setTimeout(() => setBumps((cur) => { const c = Object.assign({}, cur); keys.forEach((k) => delete c[k]); return c; }), 4000);
        }
        if (fresh) showToast(translate(langRef.current, 'kReached', p.k_threshold, translate(langRef.current, 'cat_' + fresh.category)));
    };

    useEffect(() => {
        let es = null;
        api('/api/bootstrap')
            .then((d) => { setIdeEvent(d.event); teamRef.current = d.team; setTeam(d.team); })
            .catch(() => {
                setOffline(true);
                setIdeEvent(SEED_EVENT);
                const tm = localTeam(offlineState.current);
                teamRef.current = tm;
                setTeam(tm);
            });
        if (window.EventSource) {
            es = new EventSource('/api/stream');
            es.onopen = () => setLive(true);
            es.onerror = () => setLive(false);
            es.addEventListener('team', (m) => applyTeam(JSON.parse(m.data)));
            es.addEventListener('event', (m) => {
                const e = JSON.parse(m.data);
                setIdeEvent((prev) => (!prev || e.developer_ref === prev.developer_ref) ? e : prev);
            });
        }
        return () => { if (es) es.close(); };
    }, []);

    // ---- AI xatırlatması (seçilmiş dildə) ----
    const loadReminder = (l) => {
        if (!ideEvent) { setReminder(null); return; }
        if (offline) { setReminder({ text: localReminder(ideEvent, l), code: 'offline' }); return; }
        setReminder({ loading: true });
        postJson('/api/reminder', { developer_ref: ideEvent.developer_ref, lang: l })
            .then((d) => setReminder({ text: d.text, code: d.code || (d.source === 'gemini' ? 'gemini' : 'no_key') }))
            .catch(() => setReminder({ text: localReminder(ideEvent, l), code: 'srvfail' }));
    };
    const openIdle = () => { setIsIdleModalOpen(true); loadReminder(lang); };
    useEffect(() => { if (isIdleModalOpen) loadReminder(lang); }, [lang]);

    // ---- Rol ayrılığı: işçi yalnız işçi panelinə, menecer yalnız menecer panelinə ----
    const ownRoute = userRole === 'manager' ? 'manager-portal' : userRole === 'employee' ? 'dev-portal' : 'home';
    const navigateTo = (route) => {
        if (route === 'manager-portal' && userRole !== 'manager') { setCurrentRoute('404'); return; }
        if (route === 'dev-portal' && userRole !== 'employee') { setCurrentRoute('404'); return; }
        setCurrentRoute(route);
    };

    const handleLoginSubmit = (e) => {
        e.preventDefault();
        const mail = sanitizeInput(emailInput).trim(), pass = sanitizeInput(passwordInput).trim();
        const okDev = loginModalType === 'employee' && mail === 'dev@company.com' && pass === 'emp123';
        const okMgr = loginModalType === 'manager' && mail === 'manager@company.com' && pass === 'admin123';
        if (okDev || okMgr) {
            setUserRole(okMgr ? 'manager' : 'employee');
            setCurrentRoute(okMgr ? 'manager-portal' : 'dev-portal');
            setLoginModalType(null); setLoginError(false); setEmailInput(''); setPasswordInput('');
            showToast(t(okMgr ? 'loginOkMgr' : 'loginOkDev'));
        } else { setLoginError(true); }
    };
    const handleLogout = () => { setUserRole(null); setCurrentRoute('home'); setIsIdleModalOpen(false); showToast(t('logoutToast')); };
    const acceptCookies = () => { try { localStorage.setItem('cookieConsentGiven', 'true'); } catch (e) { /* yoxdur */ } setCookieConsent(true); showToast(t('cookieSaved')); };

    // ---- Səbəbin qeydi: tarixçə + backend (menecer paneli SSE ilə eyni anda yenilənir) ----
    const handleRecordAway = () => {
        const reason = REASONS.find((r) => r.id === selectedReason);
        if (!reason) return;
        setAwayHistory([{ id: Date.now(), iso: new Date().toISOString(), minutes: 15, sim: true, reasonId: reason.id }, ...awayHistory]);
        if (offline) {
            const st = offlineState.current;
            st.respondents += 1;
            if (reason.cat) st.counts[reason.cat] = (st.counts[reason.cat] || 0) + 1;
            applyTeam(localTeam(st));
        } else if (ideEvent) {
            postJson('/api/survey', { developer_ref: ideEvent.developer_ref, reason_id: reason.id, category: reason.cat })
                .catch(() => showToast(t('serverFail')));
        }
        setIsIdleModalOpen(false); setSelectedReason(''); showToast(t('recorded'));
    };

    const tabCls = (active) => 'px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ' + (active ? 'bg-sky-600 text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800');

    return (
        <LangCtx.Provider value={ctx}>
        <div className="min-h-screen flex flex-col justify-between relative">
            {toastMsg && (
                <div className="fixed top-6 right-6 z-50 bg-slate-900 border border-sky-500/50 text-sky-300 px-5 py-3 rounded-2xl shadow-2xl flex items-center space-x-3 max-w-sm">
                    <span className="w-2.5 h-2.5 bg-sky-400 rounded-full animate-ping shrink-0"></span>
                    <span className="text-sm font-medium">{toastMsg}</span>
                </div>
            )}

            <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-3">
                    <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigateTo(ownRoute)}>
                        <div className="bg-sky-600 p-2.5 rounded-2xl text-white shadow-lg shadow-sky-600/20"><IconTerminal className="w-6 h-6" /></div>
                        <div>
                            <h1 className="text-xl font-extrabold tracking-wider text-slate-900 dark:text-white">ContextPulse AI</h1>
                            <span className="text-[10px] uppercase font-mono text-sky-600 dark:text-sky-400">{t('brandSub')}</span>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2 sm:space-x-3">
                        {userRole && (
                            <>
                                <button onClick={() => navigateTo(ownRoute)} className={tabCls(currentRoute === ownRoute)}>
                                    {userRole === 'manager' ? t('mgrPanel') : t('devPanel')}
                                </button>
                                <button onClick={handleLogout} className="px-3.5 py-2 bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 rounded-xl text-xs font-semibold transition-all">{t('logout')}</button>
                            </>
                        )}
                        <LivePill live={live} offline={offline} />
                        <LangSwitch lang={lang} onChange={setLang} />
                        <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label={t('themeAria')}
                            className="p-2.5 bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 transition-all cursor-pointer">
                            {theme === 'dark' ? <IconSun className="w-5 h-5 text-amber-400" /> : <IconMoon className="w-5 h-5 text-slate-700" />}
                        </button>
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {currentRoute === 'home' && <HomeView userRole={userRole} onOpenLogin={(ty) => { setLoginModalType(ty); setLoginError(false); }} onNavigate={navigateTo} />}
                {currentRoute === 'dev-portal' && <DevPortalView awayHistory={awayHistory} event={ideEvent} live={live} offline={offline} onTriggerIdle={openIdle} />}
                {currentRoute === 'manager-portal' && <ManagerPortalView team={team} bumps={bumps} live={live} offline={offline} />}
                {currentRoute === 'privacy' && <LegalPage title={t('privacyTitle')} paras={[t('privacyP1'), t('privacyP2')]} />}
                {currentRoute === 'terms' && <LegalPage title={t('termsTitle')} paras={[t('termsP1')]} />}
                {currentRoute === 'cookies' && <LegalPage title={t('cookiePolTitle')} paras={[t('cookiePolP1')]} />}
                {currentRoute === '404' && <Custom404Page onGoHome={() => setCurrentRoute(ownRoute)} />}
            </main>

            {loginModalType && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
                    <div className="glass-panel rounded-3xl max-w-md w-full p-8 shadow-2xl relative">
                        <div className="flex items-center space-x-3 mb-6">
                            <div className="p-3 bg-sky-500/10 text-sky-600 dark:text-sky-400 rounded-2xl"><IconLock className="w-6 h-6" /></div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{loginModalType === 'manager' ? t('loginTitleMgr') : t('loginTitleDev')}</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">{t('loginSub')}</p>
                            </div>
                        </div>
                        <form onSubmit={handleLoginSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase mb-1">{t('email')}</label>
                                <input type="email" required value={emailInput} onChange={(e) => setEmailInput(e.target.value)}
                                    placeholder={loginModalType === 'manager' ? 'manager@company.com' : 'dev@company.com'}
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-sky-500 font-mono" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase mb-1">{t('password')}</label>
                                <input type="password" required value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} placeholder="••••••••"
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-sky-500 font-mono" />
                            </div>
                            {loginError && <p className="text-xs text-rose-500 font-medium">{t('loginErr')}</p>}
                            <div className="p-3 bg-sky-500/10 rounded-xl text-xs text-sky-700 dark:text-sky-300 space-y-1 font-mono">
                                <p className="font-bold">{t('demoCreds')}</p>
                                {loginModalType === 'manager' ? <p>Email: <b>manager@company.com</b> | {t('password')}: <b>admin123</b></p> : <p>Email: <b>dev@company.com</b> | {t('password')}: <b>emp123</b></p>}
                            </div>
                            <div className="flex items-center justify-end space-x-3 pt-2">
                                <button type="button" onClick={() => setLoginModalType(null)} className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold">{t('cancel')}</button>
                                <button type="submit" className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-sky-600/20">{t('submit')}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isIdleModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
                    <div className="glass-panel rounded-3xl max-w-lg w-full p-8 shadow-2xl relative">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{t('idleTitle')}</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">{t('idleText')}</p>
                        {reminder && (
                            <div className="mb-6 p-4 rounded-2xl bg-sky-500/10 border border-sky-500/20">
                                <p className="text-[10px] uppercase font-mono text-sky-600 dark:text-sky-400 mb-1.5">{t('whereLeft')}</p>
                                {reminder.loading ? (
                                    <p className="text-xs text-slate-500 dark:text-slate-400 animate-pulse">{t('aiReading')}</p>
                                ) : (
                                    <>
                                        <p className="text-sm leading-relaxed text-slate-800 dark:text-slate-200"><RichText text={reminder.text} /></p>
                                        <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-2">{t('badge_' + reminder.code)}</p>
                                    </>
                                )}
                            </div>
                        )}
                        <div className="space-y-4 mb-6">
                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase">{t('pickReason')}</label>
                            <select value={selectedReason} onChange={(e) => setSelectedReason(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-sky-500">
                                <option value="">{t('selectPh')}</option>
                                {REASONS.map((r) => (<option key={r.id} value={r.id}>{t('reason_' + r.id)}</option>))}
                            </select>
                        </div>
                        <div className="flex items-center justify-end space-x-3">
                            <button onClick={() => setIsIdleModalOpen(false)} className="px-4 py-2.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold">{t('close')}</button>
                            <button onClick={handleRecordAway} disabled={!selectedReason} className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-lg shadow-sky-600/20">{t('record')}</button>
                        </div>
                    </div>
                </div>
            )}

            <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 py-8 mt-12">
                <div className="max-w-7xl mx-auto px-4 text-center sm:text-left sm:flex sm:items-center sm:justify-between text-xs text-slate-500 dark:text-slate-400">
                    <p>{t('footerCopy')}</p>
                    <div className="flex justify-center space-x-6 mt-4 sm:mt-0 font-medium">
                        <button onClick={() => navigateTo('privacy')} className="hover:text-sky-500">{t('privacyLink')}</button>
                        <button onClick={() => navigateTo('terms')} className="hover:text-sky-500">{t('termsLink')}</button>
                        <button onClick={() => navigateTo('cookies')} className="hover:text-sky-500">{t('cookiesLink')}</button>
                    </div>
                </div>
            </footer>

            {!cookieConsent && (
                <div className="fixed bottom-4 left-4 right-4 md:left-8 md:right-auto md:max-w-md z-50 p-6 glass-panel rounded-2xl shadow-2xl border border-sky-500/30">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2">{t('cookieTitle')}</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">{t('cookieText')}</p>
                    <div className="flex items-center space-x-3">
                        <button onClick={acceptCookies} className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow-md">{t('accept')}</button>
                        <button onClick={() => navigateTo('cookies')} className="px-3 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:underline">{t('readMore')}</button>
                    </div>
                </div>
            )}
        </div>
        </LangCtx.Provider>
    );
}

// ============ ANA SƏHİFƏ: 3 xüsusiyyət kartı (AZ / EN dil dəstəyi ilə) ============
const FeatIcon = ({ kind }) => {
    const p = { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };
    if (kind === 'spy') return (<svg {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" /></svg>);
    if (kind === 're') return (<svg {...p}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>);
    return (<svg {...p}><circle cx="9" cy="7" r="3" /><path d="M3 21v-1a6 6 0 0 1 12 0v1" /><circle cx="17" cy="9" r="2.5" /><path d="M17 14.5a4.5 4.5 0 0 1 4.5 4.5V20" /></svg>);
};
function FeatureCards() {
    const { t } = useT();
    const items = [
        { kind: 'spy', title: t('featSpyTitle'), text: t('featSpyText'), color: 'text-cyan-600 dark:text-cyan-400' },
        { kind: 're', title: t('featReTitle'), text: t('featReText'), color: 'text-purple-600 dark:text-purple-400' },
        { kind: 'k', title: t('featKTitle'), text: t('featKText'), color: 'text-emerald-600 dark:text-emerald-400' }
    ];
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
            {items.map((it) => (
                <div key={it.kind} className="feature-card rounded-2xl p-5 transition-all duration-300">
                    <div className={'flex items-center gap-2.5 mb-2 ' + it.color}>
                        <FeatIcon kind={it.kind} />
                        <h3 className="text-base font-semibold">{it.title}</h3>
                    </div>
                    <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">{it.text}</p>
                </div>
            ))}
        </div>
    );
}

// ============ ANA SƏHİFƏ: yalnız öz rolunun kartı ============
function HomeView({ userRole, onOpenLogin, onNavigate }) {
    const { t } = useT();
    const card = (icon, title, text, btn) => (
        <div className="glass-panel p-6 rounded-3xl soft-glow-sky border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
            <div>
                <div className="p-3 bg-sky-500/10 text-sky-600 dark:text-sky-400 rounded-2xl w-fit mb-4">{icon}</div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-6">{text}</p>
            </div>
            {btn}
        </div>
    );
    const devCard = card(<IconTerminal className="w-6 h-6" />, t('devCardTitle'), t('devCardText'),
        userRole === 'employee'
            ? <button onClick={() => onNavigate('dev-portal')} className="w-full py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs">{t('goDev')}</button>
            : <button onClick={() => onOpenLogin('employee')} className="w-full py-3 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white font-bold rounded-xl text-xs">{t('loginDev')}</button>);
    const mgrCard = card(<IconUsers className="w-6 h-6" />, t('mgrCardTitle'), t('mgrCardText'),
        userRole === 'manager'
            ? <button onClick={() => onNavigate('manager-portal')} className="w-full py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs">{t('goMgr')}</button>
            : <button onClick={() => onOpenLogin('manager')} className="w-full py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs">{t('loginMgr')}</button>);
    return (
        <div className="py-12 text-center max-w-4xl mx-auto space-y-12">
            <div className="space-y-4">
                <span className="px-4 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-600 dark:text-sky-400 text-xs font-mono">{t('homeBadge')}</span>
                <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white">{t('homeTitle')}</h1>
                <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl mx-auto">{t('homeSub')}</p>
            </div>
            {/* Giriş edən istifadəçi yalnız öz rolunun kartını görür */}
            <div className={'grid grid-cols-1 gap-6 text-left ' + (userRole ? 'max-w-md mx-auto' : 'sm:grid-cols-2')}>
                {userRole !== 'manager' && devCard}
                {userRole !== 'employee' && mgrCard}
            </div>
            <FeatureCards />
        </div>
    );
}

// ============ İŞÇİ PANELİ ============
function DevPortalView({ awayHistory, event, live, offline, onTriggerIdle }) {
    const { t, lang } = useT();
    const loc = lang === 'az' ? 'az-AZ' : 'en-GB';
    const a = event && event.last_meaningful_action;
    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-panel p-6 rounded-3xl">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t('devTitle')}</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{t('devSub')}</p>
                </div>
                <button onClick={onTriggerIdle} className="px-5 py-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-bold rounded-2xl text-xs transition-all cursor-pointer flex items-center space-x-2">
                    <IconClock className="w-4 h-4" /><span>{t('simBtn')}</span>
                </button>
            </div>

            <div className="glass-panel p-6 rounded-3xl">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">{t('liveTitle')}</h3>
                    <LivePill live={live} offline={offline} />
                </div>
                {!event ? <p className="text-xs text-slate-500 dark:text-slate-400">{t('loading')}</p> : (
                    <div key={event.event_id} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        <Stat label={t('file')} value={a.file.split('/').pop()} sub={a.symbol + ' · +' + a.lines_added + ' / -' + a.lines_removed} />
                        <Stat label={t('firstErr')} value={event.diagnostics.first_error.code} sub={t('line') + ' ' + event.diagnostics.first_error.line + ' · ' + event.diagnostics.errors + ' ' + t('errorsWord')} />
                        <Stat label={t('tests')} value={event.test_state.passed + ' ' + t('passed') + ' / ' + event.test_state.failed + ' ' + t('failed')} sub={event.test_state.failing_test} />
                        <Stat label={t('pr')} value={'#' + event.pull_request.id} sub={event.pull_request.unresolved_comments + ' ' + t('unresolved')} />
                    </div>
                )}
                <p className="text-[10px] font-mono text-slate-400 mt-3">developer_ref: {event ? event.developer_ref : '-'} · {t('privacyLine')}</p>
            </div>

            <div className="glass-panel p-6 rounded-3xl">
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center space-x-2">
                    <IconClock className="w-5 h-5 text-sky-500" /><span>{t('historyTitle')}</span>
                </h3>
                <div className="space-y-3">
                    {awayHistory.map((item) => (
                        <div key={item.id} className="p-4 bg-slate-50 dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                                <span className="text-xs font-mono text-sky-600 dark:text-sky-400 font-bold block">{new Date(item.iso).toLocaleString(loc, { hour12: false })}</span>
                                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{t('reason_' + item.reasonId)}</p>
                            </div>
                            <span className="px-3 py-1 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-mono rounded-full w-fit">
                                {t('duration')}: {item.minutes} {t('min')}{item.sim ? ' ' + t('simSuffix') : ''}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ============ MENECER PANELİ (yalnız serverin K-anonim məlumatı, işçi məlumatı yoxdur) ============
function ManagerPortalView({ team, bumps, live, offline }) {
    const { t } = useT();
    const shown = team ? team.blockers.filter((b) => !b.suppressed) : [];
    const hidden = team ? team.blockers.filter((b) => b.suppressed) : [];
    const max = Math.max(1, ...shown.map((b) => b.affected_count));
    return (
        <div className="space-y-8">
            <div className="glass-panel p-6 rounded-3xl flex items-start justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t('mgrTitle')}</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{t('mgrSub', team ? team.k_threshold : K_ANON)}</p>
                </div>
                <LivePill live={live} offline={offline} />
            </div>
            {!team ? <div className="glass-panel p-6 rounded-3xl text-xs text-slate-500 dark:text-slate-400">{t('loading')}</div> : (
                <>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        <Stat label={t('teamSize')} value={team.population.team_size} sub={t('last7')} />
                        <Stat label={t('responses')} value={team.population.respondents} sub={t('anonAnswers')} bump={bumps.respondents} />
                        <Stat label={t('kLabel')} value={team.k_threshold} sub={t('minGroup')} />
                        <Stat label={t('hiddenGroups')} value={team.suppressed_groups} sub="n < k" />
                    </div>
                    <div className="glass-panel p-6 rounded-3xl">
                        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">{t('analyticsTitle')}</h3>
                        {team.insufficient_data && <p className="text-xs text-amber-600 dark:text-amber-400 mb-4">{t('insufficient')}</p>}
                        <div className="space-y-3">
                            {shown.map((b) => (
                                <div key={b.category} className="p-4 bg-slate-50 dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-800">
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">{t('cat_' + b.category)}</h4>
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400">{t('sig_' + b.category)}</p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <span className="px-3 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-mono rounded-full">
                                                {b.affected_count} {t('employees')} · {Math.round(b.share * 100)}%
                                            </span>
                                            {bumps[b.category] ? <span className="ml-2 px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-mono animate-pulse">+{bumps[b.category]}</span> : null}
                                            <p className="text-[10px] font-mono text-slate-400 mt-1">{t('avgStall')} {b.avg_stall_minutes} {t('min')} · {b.trend_7d}</p>
                                        </div>
                                    </div>
                                    <div className="h-2 mt-3 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                                        <div className="h-full bg-sky-500 transition-all duration-700" style={{ width: Math.round(b.affected_count / max * 100) + '%' }}></div>
                                    </div>
                                </div>
                            ))}
                            {hidden.map((b) => (
                                <div key={b.group} className="p-4 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 flex items-center space-x-3 text-slate-500 dark:text-slate-400">
                                    <IconLock className="w-4 h-4" /><span className="text-xs font-mono">{t('hiddenRow', team.k_threshold)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

// ============ HÜQUQİ SƏHİFƏLƏR VƏ 404 ============
function LegalPage({ title, paras }) {
    return (
        <div className="glass-panel p-8 rounded-3xl max-w-3xl mx-auto space-y-4">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{title}</h2>
            {paras.map((p, i) => <p key={i} className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{p}</p>)}
        </div>
    );
}
function Custom404Page({ onGoHome }) {
    const { t } = useT();
    return (
        <div className="py-20 text-center space-y-6">
            <div className="inline-block p-6 bg-rose-500/10 text-rose-500 rounded-full font-mono text-4xl font-extrabold">404</div>
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">{t('notFoundTitle')}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">{t('notFoundText')}</p>
            <button onClick={onGoHome} className="px-6 py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-2xl text-xs shadow-lg shadow-sky-600/20">{t('backHome')}</button>
        </div>
    );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);