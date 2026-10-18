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
        homeBadge: 'Yalnız metadata · K-anonim qruplaşdırma (K=5)',
        homeTitle: 'Fasilədən sonra kontekst bərpası, komanda üçün görünən tıxanmalar',
        homeSub: 'Platforma IDE və Pull Request metadatasını qəbul edir: işçi qayıdanda qısa xatırlatma alır, menecer isə tıxanmaları yalnız komanda səviyyəsində görür.',
        devCardTitle: 'İşçi Paneli (Dev View)', devCardText: 'Canlı IDE telemeteriya baxışı, uzaqda olma tarixçəsi və şəxsi kontekst bərpa vasitələri.',
        goDev: 'İşçi Panelinə Keçid', loginDev: 'İşçi Kimi Giriş Et (Parol ilə)',
        mgrCardTitle: 'Menecer Paneli', mgrCardText: 'Komanda səviyyəsində tıxanmaların canlı görünüşü, tədbir qeydləri və elanlar. Qruplar K=5 həddinə görə göstərilir.',
        goMgr: 'Menecer Panelinə Keçid', loginMgr: 'Menecer Kimi Giriş Et (Parol ilə)',
        loginTitleDev: 'İşçi Panelinə Giriş', loginTitleMgr: 'Menecer Panelinə Giriş', loginSub: 'Şirkət e-poçtu və parolunuzu daxil edin',
        email: 'Şirkət E-poçtu', password: 'Parol', demoCreds: 'Demo Giriş Məlumatları:', cancel: 'İmtina', submit: 'Daxil Ol',
        loginErr: 'Səhv e-poçt və ya parol!', loginOkDev: 'İşçi Panelinə uğurla daxil oldunuz!',
        loginOkMgr: 'Menecer Panelinə təhlükəsiz giriş edildi!', logoutToast: 'Sistemdən çıxış edildi.', cookieSaved: 'Kuki seçimləriniz yadda saxlanıldı.',
        devTitle: 'İşçi Paneli (Developer View)', devSub: 'Canlı IDE metadata axını və fərdi re-engagement göstəriciləri',
        simBtn: 'Fasilə / Uzaqlaşmanı Simulyasiya Et', liveTitle: 'Canlı IDE Siqnalı (yalnız metadata)',
        file: 'Fayl', firstErr: 'İlk xəta', tests: 'Testlər', pr: 'Pull Request', line: 'sətir', errorsWord: 'xəta',
        passed: 'uğurlu', failed: 'uğursuz', unresolved: 'həll olunmamış şərh',
        privacyLine: 'hadisə bəyanatı: ekran qeydi yox · klaviatura məzmunu yox · mənbə kodu yox',
        historyTitle: 'Uzaqda Olma və Fasilə Tarixçəniz', duration: 'Müddət', min: 'dəq', simSuffix: '(Simulyasiya)',
        idleTitle: 'Fasilə və Ya Uzaqlaşma Diagnostikası', idleText: 'Sistem son aktivlikdən sonra fasilə qeydə aldı. Səbəbi seçin:',
        whereLeft: 'Harada qalmışdın', aiReading: 'AI son kontekstinizi oxuyur...', pickReason: 'Səbəbi Seçin:', selectPh: '-- Səbəb seçin --',
        close: 'Bağla', record: 'Tarixçəyə Qeyd Et', recorded: 'Səbəbiniz tarixçəyə əlavə edildi və menecer panelinə qrup sayının bir hissəsi kimi daxil oldu.',
        serverFail: 'Server cavab vermədi, cavab qeyd olunmadı.',
        badge_gemini: 'Gemini · faktlara qarşı doğrulanıb', badge_no_key: 'hazır mətn (API açarı yoxdur)',
        badge_invalid: 'hazır mətn (AI cavabı doğrulamadan keçmədi)', badge_error: 'hazır mətn (AI əlçatmaz)',
        badge_timeout: 'hazır mətn (AI gec cavab verdi)', badge_offline: 'oflayn demo · hazır mətn', badge_srvfail: 'hazır mətn (server cavab vermədi)',
        mgrTitle: 'Menecer Analitika Paneli',
        mgrSub: (k) => `K-Anonimlik (K=${k}) çərçivəsində komanda səviyyəsində tıxanmalar. Fərdi işçi məlumatı bu paneldə yoxdur.`,
        teamSize: 'Komanda ölçüsü', last7: 'son 7 gün', responses: 'Cavablar', anonAnswers: 'qeydə alınmış cavablar',
        kLabel: 'K həddi', minGroup: 'minimum qrup ölçüsü', hiddenGroups: 'Gizlədilən qruplar',
        analyticsTitle: 'Komanda səviyyəsində tıxanmalar (K-həddi tətbiq olunur)',
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
        cookieTitle: 'Brauzer yaddaşı haqqında', cookieText: 'Bu sayt HTTP cookie qoymur. Dil və tema seçimlərinizi yalnız siz dəyişəndə brauzerin yerli yaddaşında saxlayırıq. Analitika və ya reklam alətləri yoxdur.',
        accept: 'Anladım', readMore: 'Ətraflı Oxu',
        notFoundTitle: 'Səhifə Tapılmadı və ya Giriş Qadağandır',
        notFoundText: 'Axtardığınız keçid mövcud deyil və ya bu rol üçün icazə verilmir. İşçi və menecer panelləri bir-birindən tam ayrılıb.',
        backHome: 'Ana Səhifəyə Qayıt', themeAria: 'Temanı dəyiş', langAria: 'Dil',
        status_none: 'Status yoxdur', status_investigating: 'Araşdırılır', status_planned: 'Tədbir planlanıb', status_resolved: 'Həll olunub',
        actionTitle: 'Tədbir izləmə', statusLabel: 'Status', ownerLabel: 'Məsul komanda / şəxs', ownerPh: 'məs. DevOps komandası',
        noteLabel: 'Qeyd', notePh: 'Görüləcək tədbir haqqında qısa qeyd', saveAction: 'Yadda saxla', ownerShort: 'Məsul', updatedAt: 'Yenilənib',
        actionSaved: 'Tədbir qeydi saxlanıldı.', actionFailed: 'Tədbir qeydi saxlanılmadı: qrup K həddindən aşağı düşüb və ya server cavab vermədi.',
        announceTitle: 'Komandaya elan', announceSub: 'Elan bütün işçilərin panelində canlı görünür. Fərdi işçiyə ünvanlanmır.',
        announcePh: 'məs. PR review üçün 24 saatlıq qayda təyin edirik', announceTo: 'Mövzu', announceAll: 'Ümumi (mövzusuz)',
        announceSend: 'Elanı göndər', announceSent: 'Elan komandaya göndərildi.', announceFail: 'Elan göndərilmədi.',
        announceHistory: 'Göndərilmiş elanlar', noAnnouncements: 'Hələ elan yoxdur.',
        wsAnnouncements: 'Komanda elanları', wsStatusTitle: 'Tıxanmalar üzrə tədbirlər', wsNoStatus: 'Hələ tədbir qeydi yoxdur.',
        newAnnouncementToast: 'Menecerdən yeni komanda elanı var.',
        signIn: 'Daxil ol', signInDev: 'İşçi (Developer)', signInDevSub: 'IDE siqnalı, xatırlatma və öz tarixçəm', signInMgr: 'Menecer', signInMgrSub: 'Komanda səviyyəsində tıxanmalar və elanlar',
        portalTitle: 'Panelə giriş', portalSub: 'Rolunuzu seçin. İşçi və menecer panelləri bir-birindən ayrıdır.', backToSite: 'Əsas səhifəyə qayıt', backToPortal: 'Rol seçiminə qayıt',
        skipToContent: 'Məzmuna keç', mainNav: 'Əsas naviqasiya', legalNav: 'Hüquqi səhifələr', ctaPortal: 'Panellərə giriş', ctaPolicy: 'Məxfilik Siyasəti',
        howTitle: 'Necə işləyir', how1T: '1. Hadisələr', how1P: 'IDE genişləndirməsi planlaşdırılır. Bu gün simulyator IDE və Pull Request metadatasını API-yə göndərir.',
        how2T: '2. Xatırlatma', how2P: 'Fasilədən sonra server son hadisədən Gemini ilə qısa xatırlatma yazdırır və cavabı həmin məlumata qarşı yoxlayır. Gemini yoxdursa hazır mətn göstərilir.',
        how3T: '3. Komanda görünüşü', how3P: 'Fasilə səbəbləri sayılır; 5-dən az cavabı olan qruplar gizli qalır. Menecer tədbir qeydi və komandaya elan yazır.',
        limitsTitle: 'Hazırkı məhdudiyyətlər', lim1: 'IDE hadisələri simulyatordan gəlir, IDE genişləndirməsi hələ daxil deyil.', lim2: 'İlk AI xatırlatması bir neçə saniyə çəkə bilər; eyni hadisə üçün təkrar sorğular yaddaşdan gəlir.',
        lim3: 'K-anonimlik panelin göstərdiyini məhdudlaşdırır, lakin tam anonimləşdirmə deyil.', lim4: 'Bu versiyada giriş və rol ayrılığı yalnız brauzerdə yoxlanılır.',
        lastUpdated: 'Son yenilənmə', cookieSettings: 'Yaddaş ayarları', clearPrefs: 'Saxlanmış seçimləri sil', prefsCleared: 'Saxlanmış seçimlər silindi.',
        tblName: 'Ad', tblType: 'Növ', tblPurpose: 'Məqsəd', tblDuration: 'Müddət', tblWhen: 'Nə vaxt yazılır',
        pageTitle_home: 'ContextPulse AI', pageTitle_portal: 'Panelə giriş · ContextPulse AI', 'pageTitle_login-dev': 'İşçi girişi · ContextPulse AI', 'pageTitle_login-mgr': 'Menecer girişi · ContextPulse AI',
        'pageTitle_dev-portal': 'İşçi paneli · ContextPulse AI', 'pageTitle_manager-portal': 'Menecer paneli · ContextPulse AI',
        pageTitle_privacy: 'Məxfilik Siyasəti · ContextPulse AI', pageTitle_terms: 'İstifadə Şərtləri · ContextPulse AI', pageTitle_cookies: 'Kuki Siyasəti · ContextPulse AI', pageTitle_404: 'Səhifə tapılmadı · ContextPulse AI',
        featSpyTitle: 'Yalnız metadata', featSpyText: 'API yalnız IDE və Pull Request metadatasını qəbul edir. Ekran qeydi, klaviatura məzmunu və ya mənbə kodu bildirən hadisələr və sxemdə olmayan sahələr serverdə rədd edilir.',
        featReTitle: 'Fasilədən sonra kontekst bərpası', featReText: 'AI son IDE və PR metadatasından qısa xatırlatma hazırlayır və cavabı giriş məlumatına qarşı yoxlayır. İlk sorğu bir neçə saniyə çəkə bilər; əlçatmaz olduqda hazır mətn göstərilir.',
        featKTitle: 'K-anonim qruplaşdırma (K=5)', featKText: 'Menecer paneli yalnız ən azı 5 cavabı olan qrupları göstərir. Bu, tam anonimləşdirmə deyil; məhdudiyyətlər Məxfilik Siyasətində izah olunur.'
    },
    en: {
        brandSub: 'Enterprise Context Platform', devPanel: 'Employee Panel', mgrPanel: 'Manager Panel', logout: 'Log out',
        live: 'Live', connecting: 'Connecting…', offlineDemo: 'Offline demo', loading: 'Loading...',
        homeBadge: 'Metadata only · K-anonymous grouping (K=5)',
        homeTitle: 'Context recovery after breaks, visible team blockers',
        homeSub: 'The platform accepts IDE and pull request metadata: developers get a short reminder when they return, and managers see blockers only at team level.',
        devCardTitle: 'Employee Panel (Dev View)', devCardText: 'Live IDE telemetry view, away history and personal context recovery tools.',
        goDev: 'Open Employee Panel', loginDev: 'Log in as Employee (Password)',
        mgrCardTitle: 'Manager Panel', mgrCardText: 'A live team-level view of blockers, action notes and announcements. Groups are shown according to the K=5 threshold.',
        goMgr: 'Open Manager Panel', loginMgr: 'Log in as Manager (Password)',
        loginTitleDev: 'Employee Panel Login', loginTitleMgr: 'Manager Panel Login', loginSub: 'Enter your company email and password',
        email: 'Company Email', password: 'Password', demoCreds: 'Demo Credentials:', cancel: 'Cancel', submit: 'Log In',
        loginErr: 'Wrong email or password!', loginOkDev: 'Signed in to the Employee Panel!',
        loginOkMgr: 'Securely signed in to the Manager Panel!', logoutToast: 'You have been signed out.', cookieSaved: 'Your cookie preferences were saved.',
        devTitle: 'Employee Panel (Developer View)', devSub: 'Live IDE metadata stream and personal re-engagement indicators',
        simBtn: 'Simulate Break / Away', liveTitle: 'Live IDE Signal (metadata only)',
        file: 'File', firstErr: 'First error', tests: 'Tests', pr: 'Pull Request', line: 'line', errorsWord: 'errors',
        passed: 'passed', failed: 'failed', unresolved: 'unresolved comments',
        privacyLine: 'event declaration: no screen capture · no keystroke content · no source code',
        historyTitle: 'Your Away and Break History', duration: 'Duration', min: 'min', simSuffix: '(simulation)',
        idleTitle: 'Break and Away Diagnostics', idleText: 'The system detected a break after your last activity. Choose the reason:',
        whereLeft: 'Where you left off', aiReading: 'AI is reading your latest context...', pickReason: 'Choose a reason:', selectPh: '-- Choose a reason --',
        close: 'Close', record: 'Save to History', recorded: 'Your reason was added to history and counted as part of a group total in the manager view.',
        serverFail: 'The server did not respond, your answer was not recorded.',
        badge_gemini: 'Gemini · verified against the facts', badge_no_key: 'template text (no API key)',
        badge_invalid: 'template text (AI answer failed verification)', badge_error: 'template text (AI unavailable)',
        badge_timeout: 'template text (AI responded too slowly)', badge_offline: 'offline demo · template text', badge_srvfail: 'template text (server did not respond)',
        mgrTitle: 'Manager Analytics Panel',
        mgrSub: (k) => `Team-level blockers under K-anonymity (K=${k}). No individual employee data appears in this panel.`,
        teamSize: 'Team size', last7: 'last 7 days', responses: 'Responses', anonAnswers: 'recorded responses',
        kLabel: 'K threshold', minGroup: 'minimum group size', hiddenGroups: 'Hidden groups',
        analyticsTitle: 'Team-level blockers (K threshold applied)',
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
        cookieTitle: 'About browser storage', cookieText: 'This site sets no HTTP cookies. Your language and theme choices are saved in your browser local storage only when you change them. There are no analytics or advertising tools.',
        accept: 'Got it', readMore: 'Read More',
        notFoundTitle: 'Page Not Found or Access Denied',
        notFoundText: 'The page does not exist or is not allowed for this role. The employee and manager panels are fully separated.',
        backHome: 'Back to Home', themeAria: 'Toggle theme', langAria: 'Language',
        status_none: 'No status', status_investigating: 'Investigating', status_planned: 'Action planned', status_resolved: 'Resolved',
        actionTitle: 'Action tracking', statusLabel: 'Status', ownerLabel: 'Owner team / person', ownerPh: 'e.g. DevOps team',
        noteLabel: 'Note', notePh: 'Short note about the planned action', saveAction: 'Save', ownerShort: 'Owner', updatedAt: 'Updated',
        actionSaved: 'Action note saved.', actionFailed: 'Action note was not saved: the group dropped below K or the server did not respond.',
        announceTitle: 'Team announcement', announceSub: 'The announcement appears live on every employee panel. It is not addressed to an individual.',
        announcePh: 'e.g. We are introducing a 24-hour PR review rule', announceTo: 'Topic', announceAll: 'General (no topic)',
        announceSend: 'Send announcement', announceSent: 'Announcement sent to the team.', announceFail: 'Announcement was not sent.',
        announceHistory: 'Sent announcements', noAnnouncements: 'No announcements yet.',
        wsAnnouncements: 'Team announcements', wsStatusTitle: 'Actions on team blockers', wsNoStatus: 'No action notes yet.',
        newAnnouncementToast: 'New team announcement from your manager.',
        signIn: 'Sign in', signInDev: 'Developer', signInDevSub: 'IDE signal, reminders and my history', signInMgr: 'Manager', signInMgrSub: 'Team-level blockers and announcements',
        portalTitle: 'Dashboard access', portalSub: 'Choose your role. The developer and manager panels are separate.', backToSite: 'Back to the main site', backToPortal: 'Back to role selection',
        skipToContent: 'Skip to content', mainNav: 'Main navigation', legalNav: 'Legal pages', ctaPortal: 'Access dashboards', ctaPolicy: 'Privacy Policy',
        howTitle: 'How it works', how1T: '1. Events', how1P: 'An IDE extension is planned. Today a simulator sends IDE and pull request metadata to the API.',
        how2T: '2. Reminder', how2P: 'After a break the server asks Gemini for a short reminder from the latest event and checks the answer against that data. Without Gemini, template text is shown.',
        how3T: '3. Team view', how3P: 'Break reasons are counted; groups with fewer than 5 responses stay hidden. Managers write action notes and team announcements.',
        limitsTitle: 'Current limitations', lim1: 'IDE events come from a simulator; no IDE extension is included yet.', lim2: 'The first AI reminder can take several seconds; repeated requests for the same event are served from memory.',
        lim3: 'K-anonymity limits what the panel shows but is not complete anonymisation.', lim4: 'In this version, sign-in and role separation are enforced in the browser only.',
        lastUpdated: 'Last updated', cookieSettings: 'Storage settings', clearPrefs: 'Delete saved preferences', prefsCleared: 'Saved preferences deleted.',
        tblName: 'Name', tblType: 'Type', tblPurpose: 'Purpose', tblDuration: 'Duration', tblWhen: 'When it is written',
        pageTitle_home: 'ContextPulse AI', pageTitle_portal: 'Dashboard access · ContextPulse AI', 'pageTitle_login-dev': 'Developer sign-in · ContextPulse AI', 'pageTitle_login-mgr': 'Manager sign-in · ContextPulse AI',
        'pageTitle_dev-portal': 'Developer panel · ContextPulse AI', 'pageTitle_manager-portal': 'Manager panel · ContextPulse AI',
        pageTitle_privacy: 'Privacy Policy · ContextPulse AI', pageTitle_terms: 'Terms and Conditions · ContextPulse AI', pageTitle_cookies: 'Cookie Policy · ContextPulse AI', pageTitle_404: 'Page not found · ContextPulse AI',
        featSpyTitle: 'Metadata only', featSpyText: 'The API accepts only IDE and pull request metadata. Events declaring screen capture, keystroke content or source code, and fields outside the schema, are rejected by the server.',
        featReTitle: 'Context recovery after a break', featReText: 'AI writes a short reminder from the latest IDE and PR metadata and checks the answer against that data. The first request can take several seconds; template text is shown when AI is unavailable.',
        featKTitle: 'K-anonymous grouping (K=5)', featKText: 'The manager panel shows only groups with at least 5 responses. This is not full anonymisation; limitations are explained in the Privacy Policy.'
    }
};
function translate(lang, key, ...args) {
    const v = (I18N[lang] && I18N[lang][key] !== undefined) ? I18N[lang][key] : I18N.az[key];
    return typeof v === 'function' ? v(...args) : v;
}
const LangCtx = React.createContext({ lang: 'az', t: (k) => k });
const useT = () => React.useContext(LangCtx);

const NavCtx = React.createContext(() => {});

// ============ MARŞRUTLAR (History API; hər yol serverdə index.html-ə düşür) ============
const ROUTE_PATHS = { home: '', portal: 'portal', 'login-dev': 'developer-login', 'login-mgr': 'manager-login', 'dev-portal': 'developer', 'manager-portal': 'manager', privacy: 'privacy-policy', terms: 'terms-and-conditions', cookies: 'cookie-policy' };
// Sayt kökü (alt yolda, məsələn GitLab Pages-də də işləsin deyə styles.css-in ünvanından götürülür)
const BASE = new URL(document.querySelector('link[href$="styles.css"]').href).pathname.replace(/styles\.css$/, '');
const pathFor = (route) => BASE + (ROUTE_PATHS[route] || '');
function routeFromPath() {
    const rel = location.pathname.startsWith(BASE) ? location.pathname.slice(BASE.length).replace(/\/+$/, '') : '';
    if (rel === '' || rel === 'index.html') return 'home';
    return Object.keys(ROUTE_PATHS).find((k) => ROUTE_PATHS[k] === rel) || '404';
}
const guardRoute = (r, role) => {
    if (r === 'dev-portal') return role === 'employee' ? r : role === null ? 'login-dev' : '404';
    if (r === 'manager-portal') return role === 'manager' ? r : role === null ? 'login-mgr' : '404';
    if ((r === 'login-dev' || r === 'login-mgr' || r === 'portal') && role) return role === 'manager' ? 'manager-portal' : 'dev-portal';
    return r;
};

// ============ HÜQUQİ SƏNƏDLƏR (kod və README əsasında; [[...]] = operator tərəfindən doldurulmalı yer tutucu) ============
const LEGAL_UPDATED = '2026-10-18';
const LEGAL = {
    en: {
        privacy: {
            title: 'Privacy Policy',
            intro: 'This policy describes how this ContextPulse AI deployment handles data, based on what the application code does. Items shown as [[placeholders]] must be completed by the operator before production use. This page is not legal advice and does not claim legal compliance.',
            sections: [
                { h: 'Operator and contact', p: ['Operator: [[LEGAL ENTITY NAME]]. Address: [[ADDRESS]]. Privacy contact: [[EMAIL]]. Data protection officer or representative, if required: [[DETAILS]].'] },
                { h: 'Data we process', ul: [
                    'IDE event metadata (POST /api/events): a pseudonymous developer reference, repository and branch name, source file path, edited function name, line range and added or removed line counts, language, error and warning counts with the first error code and line, test runner with pass and fail counts and a failing test name, pull request number, title, status and unresolved comment count, and timestamps.',
                    'Break responses: developer reference, the reason and category you choose, and the time.',
                    'Manager input: action status, an owner label (up to 40 characters), a note (up to 200) and team announcements (up to 280).',
                    'Server logs: request method, path, status code, duration and some counts. Notes and announcements are logged by length only. The application does not log IP addresses; your hosting provider may [[CONFIRM]].',
                    'Browser storage for language, theme and notice acknowledgement: see the Cookie Policy.'],
                  p: ['The API rejects events that declare screen capture, keystroke content or source code content, and rejects unknown fields. The server enforces this. This repository does not yet include an IDE extension; events currently come from a simulator, so what a future extension collects is not covered by this text.'] },
                { h: 'Purposes', ul: ['Show a developer a short reminder of the last work context after a break.', 'Show managers team-level blocker counts and let them record actions and announcements.', 'Operate, secure and debug the service.'] },
                { h: 'AI processing', p: ['If a Gemini API key is configured, the server sends the latest IDE event for the developer, without its privacy and source fields, to the Google Gemini API to write the reminder. This includes the developer reference, repository and branch, file path, function name, error code, test name and pull request title. The reply is checked against the input and replaced with template text if it does not match. Without a key, or if the call fails, template text is used and nothing is sent. Google handles this data under its own terms: [[CONFIRM plan and data-use settings]].'] },
                { h: 'Who can see what', ul: ['Managers see team-level groups only when at least 5 responses fall into a group (K = 5), plus the notes and announcements managers write.', 'Employees see their own latest IDE event, team announcements and the status of visible blockers.'],
                  p: ['K-anonymity here limits what the dashboard shows. It is not complete anonymisation: the database stores the developer reference next to each break response, so anyone with database or server access can link them, and changes in counts over time can reveal information.'] },
                { h: 'Security and current limitations', ul: ['The demo sign-in is checked in the browser only; no account data is stored on the server.', 'Role separation is currently enforced in the user interface. The API endpoints are not yet authenticated on the server, so this version should not be exposed publicly with real personal data.', 'Secrets such as the Gemini API key are read from server environment variables and are not sent to the browser.'] },
                { h: 'Storage and retention', p: ['Data is stored in an SQLite file on the server (default contextpulse.db; in the provided Docker image under /tmp, which is cleared when the container restarts). No automated retention or deletion schedule is implemented. A demo reset endpoint deletes events, responses, actions and announcements. Retention period: [[PERIOD]].'] },
                { h: 'Third parties and transfers', ul: ['Google (Gemini API), only if configured.', 'Your browser loads scripts from cdn.tailwindcss.com and unpkg.com; their operators receive your IP address and request metadata. Fonts are served from this site.', 'Hosting provider: [[NAME AND LOCATION]].'], p: ['International transfers depend on the hosting location and Google services: [[CONFIRM]].'] },
                { h: 'Your rights', p: ['Depending on the law that applies to you, you may have rights to access, correct, delete, restrict or object to processing of your data, to data portability, to withdraw consent, and to complain to a supervisory authority. There is no self-service export or deletion tool in this version. Send requests to [[EMAIL]]; process and response time: [[PROCESS]].'] },
                { h: 'Changes', p: ['Changes are published on this page with a new date.'] }
            ]
        },
        terms: {
            title: 'Terms and Conditions',
            intro: 'These terms apply to the use of this ContextPulse AI deployment. Items shown as [[placeholders]] must be completed by the operator. This page is not legal advice.',
            sections: [
                { h: 'The service', p: ['ContextPulse AI is pre-release software that shows a developer a short context reminder after a break and shows managers team-level blocker information. IDE events currently come from a simulator. Features may change or be removed.'] },
                { h: 'Eligibility and accounts', p: ['Use is intended for members of a team authorised by [[OPERATOR]]. You are responsible for keeping your sign-in details confidential and for activity under your account. [[ACCOUNT RULES]]'] },
                { h: 'Acceptable use', ul: ['Do not submit source code, secrets, credentials or personal data that the API does not need.', 'Do not try to identify individuals from team-level data or to circumvent the K threshold.', 'Do not use the service to monitor people unlawfully or without the notice that applies to them.', 'Do not disrupt, probe or overload the service, or access data you are not authorised to see.'] },
                { h: 'AI-generated output', p: ['Reminders may be incomplete or wrong, even though they are checked against the input data. Verify them against your code, tests and pull requests before acting on them.'] },
                { h: 'Availability and changes', p: ['The service is provided as available, with no guaranteed uptime. It may be changed, suspended or discontinued, and these terms may be updated by publishing a new date.'] },
                { h: 'Intellectual property', p: ['The software and brand belong to their respective owners: [[LICENSE AND OWNER]]. You keep your rights to content you submit and allow its processing as described in the Privacy Policy.'] },
                { h: 'Suspension and termination', p: ['Access may be suspended or ended for breach of these terms or to protect the service.'] },
                { h: 'Warranty and liability', p: ['To the extent allowed by applicable law, the service is provided without warranties and the operator is not liable for indirect or consequential loss. Nothing here limits liability that cannot be limited by law. [[CONFIRM WITH COUNSEL]]'] },
                { h: 'Governing law and contact', p: ['Governing law and venue: [[JURISDICTION]]. Contact: [[EMAIL]].'] }
            ]
        },
        cookies: {
            title: 'Cookie Policy',
            intro: 'This policy lists what this site stores in your browser. Items shown as [[placeholders]] must be confirmed by the operator. This page is not legal advice.',
            sections: [
                { h: 'What this site sets', p: ['This application sets no HTTP cookies: the server sends no Set-Cookie header (checked by an automated test). It stores a few preferences in your browser local storage, listed in the table below.'] },
                { h: 'When items are written', p: ['Items are written only when you act: the language and theme items when you change them, the notice item when you dismiss the notice. Nothing is written before that.'] },
                { h: 'Optional cookies and analytics', p: ['There are no analytics, advertising or tracking tools, so there are no optional categories to accept or reject. If such tools are added later, a consent choice (accept, reject, customise) will be required before they run.'] },
                { h: 'Third-party requests', p: ['The page loads scripts from cdn.tailwindcss.com and unpkg.com. We do not control whether those providers set cookies or other identifiers: [[CONFIRM]].'] },
                { h: 'Your choices', p: ['You can delete the items below with the button, or through your browser settings. Deleting them does not stop you from using the site; the notice may appear again.'] }
            ]
        }
    },
    az: {
        privacy: {
            title: 'Məxfilik Siyasəti',
            intro: 'Bu siyasət ContextPulse AI-ın bu quraşdırmasının məlumatla necə işlədiyini tətbiq kodunun real davranışına əsasən izah edir. [[Yer tutucu]] kimi göstərilən yerləri operator istehsalda istifadədən əvvəl doldurmalıdır. Bu səhifə hüquqi məsləhət deyil və hüquqi uyğunluq iddia etmir.',
            sections: [
                { h: 'Operator və əlaqə', p: ['Operator: [[HÜQUQİ ŞƏXSİN ADI]]. Ünvan: [[ÜNVAN]]. Məxfilik üzrə əlaqə: [[E-POÇT]]. Məlumatların mühafizəsi üzrə məsul şəxs və ya nümayəndə (tələb olunarsa): [[MƏLUMAT]].'] },
                { h: 'Hansı məlumatı emal edirik', ul: [
                    'IDE hadisə metadatası (POST /api/events): təxəllüslü developer istinadı, repozitoriya və branch adı, mənbə faylının yolu, dəyişdirilən funksiyanın adı, sətir aralığı və əlavə/silinən sətir sayı, dil, xəta və xəbərdarlıq sayı ilə ilk xəta kodu və sətri, test icraçısı, keçən/uğursuz test sayı və uğursuz testin adı, Pull Request nömrəsi, başlığı, statusu və həll olunmamış şərh sayı, vaxt möhürləri.',
                    'Fasilə cavabları: developer istinadı, seçdiyiniz səbəb və kateqoriya, vaxt.',
                    'Menecerin daxil etdikləri: tədbir statusu, məsul etiketi (40 simvola qədər), qeyd (200-ə qədər) və komanda elanları (280-ə qədər).',
                    'Server logları: sorğu metodu, yol, status kodu, müddət və bəzi say göstəriciləri. Qeyd və elanlar yalnız uzunluğu ilə yazılır. Tətbiq IP ünvanlarını yazmır; hosting təminatçısı yaza bilər: [[YOXLAYIN]].',
                    'Dil, tema və bildirişin qəbulu üçün brauzer yaddaşı: Kuki Siyasətinə baxın.'],
                  p: ['API ekran qeydi, klaviatura məzmunu və ya mənbə kodu bildirən hadisələri və sxemdə olmayan sahələri rədd edir. Bunu server təmin edir. Bu repozitoriyada hələ IDE genişləndirməsi yoxdur; hadisələr hazırda simulyatordan gəlir, ona görə gələcək genişləndirmənin topladığı məlumat bu mətnə daxil deyil.'] },
                { h: 'Məqsədlər', ul: ['Fasilədən sonra developerə son iş kontekstinin qısa xatırlatmasını göstərmək.', 'Menecerlərə komanda səviyyəsində tıxanma saylarını göstərmək, tədbir və elan yazmağa imkan vermək.', 'Xidməti işlətmək, qorumaq və xətaları aşkarlamaq.'] },
                { h: 'AI ilə emal', p: ['Gemini API açarı təyin olunubsa, server developerin son IDE hadisəsini (privacy və source sahələri çıxarılmaqla) xatırlatmanı yazdırmaq üçün Google Gemini API-yə göndərir. Buraya developer istinadı, repozitoriya və branch, fayl yolu, funksiya adı, xəta kodu, test adı və Pull Request başlığı daxildir. Cavab giriş məlumatına qarşı yoxlanılır və uyğun gəlmirsə hazır mətnlə əvəz olunur. Açar yoxdursa və ya çağırış uğursuz olarsa, hazır mətn istifadə olunur və heç nə göndərilmir. Google bu məlumatı öz şərtlərinə əsasən emal edir: [[PLAN VƏ MƏLUMAT İSTİFADƏSİ AYARLARINI YOXLAYIN]].'] },
                { h: 'Kim nəyi görür', ul: ['Menecerlər komanda səviyyəsində qrupları yalnız qrupda ən azı 5 cavab olduqda görür (K = 5), həmçinin menecerlərin yazdığı qeyd və elanları.', 'İşçilər öz son IDE hadisəsini, komanda elanlarını və görünən tıxanmaların statusunu görür.'],
                  p: ['Buradakı K-anonimlik panelin göstərdiyini məhdudlaşdırır. Bu, tam anonimləşdirmə deyil: verilənlər bazası hər fasilə cavabının yanında developer istinadını saxlayır, ona görə baza və ya serverə çıxışı olan şəxs onları əlaqələndirə bilər və saylarda zamanla dəyişmələr məlumat aça bilər.'] },
                { h: 'Təhlükəsizlik və hazırkı məhdudiyyətlər', ul: ['Demo giriş yalnız brauzerdə yoxlanılır; serverdə hesab məlumatı saxlanılmır.', 'Rol ayrılığı hazırda istifadəçi interfeysində təmin olunur. API endpoint-ləri serverdə hələ autentifikasiya olunmur, ona görə bu versiyanı real şəxsi məlumatla açıq şəkildə yerləşdirmək olmaz.', 'Gemini API açarı kimi sirlər server mühit dəyişənlərindən oxunur və brauzerə göndərilmir.'] },
                { h: 'Saxlama və müddət', p: ['Məlumat serverdəki SQLite faylında saxlanılır (standart contextpulse.db; verilmiş Docker image-də /tmp qovluğunda, konteyner yenidən başlayanda təmizlənir). Avtomatik saxlama müddəti və ya silmə cədvəli tətbiq olunmayıb. Demo sıfırlama endpoint-i hadisələri, cavabları, tədbirləri və elanları silir. Saxlama müddəti: [[MÜDDƏT]].'] },
                { h: 'Üçüncü tərəflər və ötürmələr', ul: ['Google (Gemini API), yalnız təyin olunubsa.', 'Brauzeriniz cdn.tailwindcss.com və unpkg.com saytlarından skript yükləyir; onların operatorları IP ünvanınızı və sorğu metadatasını alır. Şriftlər bu saytdan verilir.', 'Hosting təminatçısı: [[AD VƏ YER]].'], p: ['Beynəlxalq ötürmələr hosting yerindən və Google xidmətlərindən asılıdır: [[YOXLAYIN]].'] },
                { h: 'Hüquqlarınız', p: ['Sizə şamil olunan qanunvericiliyə görə məlumatınıza çıxış, düzəliş, silmə, emalın məhdudlaşdırılması və ya ona etiraz, məlumatın daşınması, razılığı geri götürmə və nəzarət orqanına şikayət hüquqlarınız ola bilər. Bu versiyada özünəxidmət ixrac və ya silmə aləti yoxdur. Sorğuları [[E-POÇT]] ünvanına göndərin; proses və cavab müddəti: [[PROSES]].'] },
                { h: 'Dəyişikliklər', p: ['Dəyişikliklər bu səhifədə yeni tarixlə dərc olunur.'] }
            ]
        },
        terms: {
            title: 'İstifadə Şərtləri',
            intro: 'Bu şərtlər ContextPulse AI-ın bu quraşdırmasından istifadəyə şamil olunur. [[Yer tutucu]] kimi göstərilən yerləri operator doldurmalıdır. Bu səhifə hüquqi məsləhət deyil.',
            sections: [
                { h: 'Xidmət', p: ['ContextPulse AI istehsaldan əvvəlki proqram təminatıdır: fasilədən sonra developerə qısa kontekst xatırlatması göstərir, menecerlərə isə komanda səviyyəsində tıxanma məlumatı verir. IDE hadisələri hazırda simulyatordan gəlir. Funksiyalar dəyişə və ya çıxarıla bilər.'] },
                { h: 'Uyğunluq və hesablar', p: ['İstifadə [[OPERATOR]] tərəfindən icazə verilmiş komanda üzvləri üçündür. Giriş məlumatlarınızın məxfiliyinə və hesabınız altındakı fəaliyyətə siz cavabdehsiniz. [[HESAB QAYDALARI]]'] },
                { h: 'Məqbul istifadə', ul: ['API-nin ehtiyac duymadığı mənbə kodunu, sirləri, giriş məlumatlarını və ya şəxsi məlumatı göndərməyin.', 'Komanda səviyyəsindəki məlumatdan fərdləri tanımağa və ya K həddini keçməyə cəhd etməyin.', 'Xidməti insanları qanunsuz və ya onlara şamil olunan xəbərdarlıq olmadan izləmək üçün istifadə etməyin.', 'Xidmətə mane olmayın, onu yoxlamayın və ya həddindən artıq yükləməyin; baxmağa icazəniz olmayan məlumata çıxış əldə etməyin.'] },
                { h: 'AI tərəfindən yaradılan nəticə', p: ['Giriş məlumatına qarşı yoxlanılsa da, xatırlatmalar natamam və ya yanlış ola bilər. Onlara əsasən hərəkət etməzdən əvvəl kodunuz, testləriniz və Pull Request-lərinizlə yoxlayın.'] },
                { h: 'Əlçatanlıq və dəyişikliklər', p: ['Xidmət mövcud olduğu kimi, zəmanətli iş vaxtı olmadan təqdim olunur. O dəyişdirilə, dayandırıla və ya bağlana bilər; bu şərtlər yeni tarixlə dərc olunaraq yenilənə bilər.'] },
                { h: 'Əqli mülkiyyət', p: ['Proqram və brend müvafiq sahiblərinə məxsusdur: [[LİSENZİYA VƏ SAHİB]]. Göndərdiyiniz məzmuna hüquqlarınız saxlanılır və onun Məxfilik Siyasətində izah olunan qaydada emalına icazə verirsiniz.'] },
                { h: 'Dayandırma və xitam', p: ['Giriş bu şərtlərin pozulmasına görə və ya xidməti qorumaq üçün dayandırıla və ya ləğv edilə bilər.'] },
                { h: 'Zəmanət və məsuliyyət', p: ['Tətbiq olunan qanunvericiliyin icazə verdiyi həddə xidmət zəmanətsiz təqdim olunur və operator dolayı və ya nəticə zərərlərinə görə məsuliyyət daşımır. Qanunla məhdudlaşdırıla bilməyən məsuliyyət burada məhdudlaşdırılmır. [[HÜQUQŞÜNASLA YOXLAYIN]]'] },
                { h: 'Tətbiq olunan hüquq və əlaqə', p: ['Tətbiq olunan hüquq və yurisdiksiya: [[YURİSDİKSİYA]]. Əlaqə: [[E-POÇT]].'] }
            ]
        },
        cookies: {
            title: 'Kuki Siyasəti',
            intro: 'Bu siyasət saytın brauzerinizdə nələri saxladığını göstərir. [[Yer tutucu]] kimi göstərilən yerləri operator təsdiqləməlidir. Bu səhifə hüquqi məsləhət deyil.',
            sections: [
                { h: 'Bu sayt nə qoyur', p: ['Bu tətbiq HTTP cookie qoymur: server Set-Cookie başlığı göndərmir (avtomatik testlə yoxlanılıb). Bir neçə seçimi brauzerin yerli yaddaşında saxlayır, aşağıdakı cədvəldə göstərilib.'] },
                { h: 'Elementlər nə vaxt yazılır', p: ['Elementlər yalnız siz hərəkət edəndə yazılır: dil və tema elementləri onları dəyişəndə, bildiriş elementi bildirişi bağlayanda. Bundan əvvəl heç nə yazılmır.'] },
                { h: 'İstəyə bağlı kukilər və analitika', p: ['Analitika, reklam və ya izləmə alətləri yoxdur, ona görə qəbul və ya rədd ediləcək istəyə bağlı kateqoriya yoxdur. Belə alətlər sonradan əlavə olunarsa, işə düşməzdən əvvəl razılıq seçimi (qəbul, rədd, fərdi seçim) tələb olunacaq.'] },
                { h: 'Üçüncü tərəf sorğuları', p: ['Səhifə cdn.tailwindcss.com və unpkg.com saytlarından skript yükləyir. Bu təminatçıların cookie və ya başqa identifikator qoyub-qoymadığını biz idarə etmirik: [[YOXLAYIN]].'] },
                { h: 'Seçimləriniz', p: ['Aşağıdakı elementləri düymə ilə və ya brauzer ayarlarından silə bilərsiniz. Silmək saytdan istifadəyə mane olmur; bildiriş yenidən görünə bilər.'] }
            ]
        }
    }
};
const STORAGE_ITEMS = [
    { name: 'cp_lang', type: { az: 'localStorage', en: 'localStorage' }, purpose: { az: 'Seçdiyiniz dil (az / en)', en: 'Your chosen language (az / en)' }, duration: { az: 'Siz silənə qədər', en: 'Until you delete it' }, when: { az: 'Dili dəyişəndə', en: 'When you change the language' } },
    { name: 'cp_theme', type: { az: 'localStorage', en: 'localStorage' }, purpose: { az: 'Seçdiyiniz tema (açıq / tünd)', en: 'Your chosen theme (light / dark)' }, duration: { az: 'Siz silənə qədər', en: 'Until you delete it' }, when: { az: 'Temanı dəyişəndə', en: 'When you change the theme' } },
    { name: 'cookieConsentGiven', type: { az: 'localStorage', en: 'localStorage' }, purpose: { az: 'Yaddaş bildirişinin bağlandığını xatırlayır', en: 'Remembers that the storage notice was dismissed' }, duration: { az: 'Siz silənə qədər', en: 'Until you delete it' }, when: { az: 'Bildirişi bağlayanda', en: 'When you dismiss the notice' } }
];

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
        shown.push({ category: cat, affected_count: n, share: Math.round(n / st.respondents * 100) / 100, avg_stall_minutes: m.avg, trend_7d: m.trend, suppressed: false, action: (st.actions && st.actions[cat]) || null });
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
    const [theme, setTheme] = useState(() => (document.documentElement.classList.contains('dark') ? 'dark' : 'light'));
    const [lang, setLang] = useState(getStoredLang);
    const [currentRoute, setCurrentRoute] = useState(() => routeFromPath());
    const [userRole, setUserRole] = useState(null); // null | 'employee' | 'manager'

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
    const [announcements, setAnnouncements] = useState([]);
    const teamRef = useRef(null);
    const langRef = useRef(lang);
    langRef.current = lang;
    const roleRef = useRef(null);
    roleRef.current = userRole;
    const offlineState = useRef({ counts: { PR_REVIEW_WAIT: 8, CI_FLAKY: 6, MEETING_LOAD: 5, UNCLEAR_REQUIREMENTS: 5, TOOLING: 2 }, respondents: 26, actions: {} });

    const t = (key, ...args) => translate(lang, key, ...args);
    const ctx = { lang, t };

    useEffect(() => { document.documentElement.classList.toggle('dark', theme === 'dark'); }, [theme]);
    // Dil seçimi yalnız istifadəçi dəyişəndə yaddaşa yazılır (changeLang); burada yalnız <html lang> yenilənir
    useEffect(() => { document.documentElement.lang = lang; }, [lang]);

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

    // Elanı siyahıya əlavə edir (eyni id təkrarlanmır); işçiyə bildiriş göstərir
    const addAnnouncement = (a, notify) => {
        setAnnouncements((cur) => (cur.some((x) => x.id === a.id) ? cur : [a].concat(cur).slice(0, 5)));
        if (notify && roleRef.current === 'employee') showToast(translate(langRef.current, 'newAnnouncementToast'));
    };

    useEffect(() => {
        let es = null;
        api('/api/bootstrap')
            .then((d) => { setIdeEvent(d.event); teamRef.current = d.team; setTeam(d.team); setAnnouncements(d.announcements || []); })
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
            es.addEventListener('announcement', (m) => addAnnouncement(JSON.parse(m.data), true));
            es.addEventListener('announcement_reset', () => setAnnouncements([]));
            es.addEventListener('event', (m) => {
                const e = JSON.parse(m.data);
                setIdeEvent((prev) => (!prev || e.developer_ref === prev.developer_ref) ? e : prev);
            });
        }
        return () => { if (es) es.close(); };
    }, []);

    // ---- Menecer əməliyyatları: tədbir qeydi və komandaya elan ----
    const saveAction = (category, data) => {
        if (offline) {
            offlineState.current.actions[category] = Object.assign({}, data, { updated_at: new Date().toISOString() });
            applyTeam(localTeam(offlineState.current));
            showToast(t('actionSaved'));
            return Promise.resolve(true);
        }
        return api('/api/team/blockers/' + category + '/action', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
            .then(() => { showToast(t('actionSaved')); return true; })
            .catch(() => { showToast(t('actionFailed')); return false; });
    };
    const sendAnnouncement = (data) => {
        if (offline) {
            addAnnouncement({ id: Date.now(), text: data.text, category: data.category || null, created_at: new Date().toISOString() }, false);
            showToast(t('announceSent'));
            return Promise.resolve(true);
        }
        return postJson('/api/team/messages', data)
            .then(() => { showToast(t('announceSent')); return true; })
            .catch(() => { showToast(t('announceFail')); return false; });
    };

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

    // ---- Marşrutlaşdırma (History API) və rol ayrılığı ----
    // Qeyd: rol yoxlaması bu versiyada yalnız interfeysdədir; server API-ləri hələ autentifikasiya olunmur.
    const ownRoute = userRole === 'manager' ? 'manager-portal' : userRole === 'employee' ? 'dev-portal' : 'home';
    const route = guardRoute(currentRoute, userRole);
    const goRoute = (r, hash) => {
        const url = pathFor(r) + (hash || '');
        if (location.pathname + location.hash !== url) history.pushState({}, '', url);
        setCurrentRoute(r);
        if (hash) setTimeout(() => { const el = document.getElementById(hash.slice(1)); if (el) el.scrollIntoView(); }, 60);
    };
    const navigateTo = goRoute;

    useEffect(() => {
        const onPop = () => setCurrentRoute(routeFromPath());
        window.addEventListener('popstate', onPop);
        return () => window.removeEventListener('popstate', onPop);
    }, []);
    useEffect(() => {
        if (route === '404') return;
        const want = pathFor(route);
        if (location.pathname !== want) history.replaceState({}, '', want + location.hash);
    }, [route]);
    useEffect(() => { document.title = t('pageTitle_' + route); }, [route, lang]);
    const navCount = useRef(0);
    useEffect(() => {
        navCount.current += 1;
        if (navCount.current > 1) { const m = document.getElementById('main'); if (m) m.focus({ preventScroll: true }); window.scrollTo(0, 0); }
        if (location.hash) setTimeout(() => { const el = document.getElementById(location.hash.slice(1)); if (el) el.scrollIntoView(); }, 60);
    }, [route]);
    useEffect(() => {
        const onCleared = () => { setCookieConsent(false); showToast(translate(langRef.current, 'prefsCleared')); };
        window.addEventListener('cp-prefs-cleared', onCleared);
        return () => window.removeEventListener('cp-prefs-cleared', onCleared);
    }, []);

    const loginRole = route === 'login-mgr' ? 'manager' : 'employee';
    const handleLoginSubmit = (e) => {
        e.preventDefault();
        const mail = sanitizeInput(emailInput).trim(), pass = sanitizeInput(passwordInput).trim();
        const okDev = loginRole === 'employee' && mail === 'dev@company.com' && pass === 'emp123';
        const okMgr = loginRole === 'manager' && mail === 'manager@company.com' && pass === 'admin123';
        if (okDev || okMgr) {
            setUserRole(okMgr ? 'manager' : 'employee');
            setLoginError(false); setEmailInput(''); setPasswordInput('');
            goRoute(okMgr ? 'manager-portal' : 'dev-portal');
            showToast(t(okMgr ? 'loginOkMgr' : 'loginOkDev'));
        } else { setLoginError(true); }
    };
    const handleLogout = () => { setUserRole(null); setIsIdleModalOpen(false); goRoute('home'); showToast(t('logoutToast')); };
    const acceptCookies = () => { try { localStorage.setItem('cookieConsentGiven', 'true'); } catch (e) { /* yoxdur */ } setCookieConsent(true); showToast(t('cookieSaved')); };
    // Seçimlər yalnız istifadəçi hərəkət edəndə brauzer yaddaşına yazılır
    const changeLang = (l) => { setLang(l); try { localStorage.setItem('cp_lang', l); } catch (e) { /* yoxdur */ } };
    const toggleTheme = () => { const nt = theme === 'dark' ? 'light' : 'dark'; setTheme(nt); try { localStorage.setItem('cp_theme', nt); } catch (e) { /* yoxdur */ } };

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

    const tabCls = (active) => 'px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors ' + (active ? 'bg-sky-600 text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800');

    return (
        <LangCtx.Provider value={ctx}><NavCtx.Provider value={navigateTo}>
        <div className="min-h-screen flex flex-col justify-between relative">
            {toastMsg && (
                <div className="fixed top-6 right-6 z-50 bg-slate-900 border border-sky-500/50 text-sky-300 px-5 py-3 rounded-2xl shadow-2xl flex items-center space-x-3 max-w-sm">
                    <span className="w-2.5 h-2.5 bg-sky-400 rounded-full animate-ping shrink-0"></span>
                    <span className="text-sm font-medium">{toastMsg}</span>
                </div>
            )}

            <a href="#main" className="skip-link" onClick={(e) => { e.preventDefault(); const m = document.getElementById('main'); if (m) m.focus(); }}>{t('skipToContent')}</a>
            <header className="border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90 backdrop-blur sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                    <Link route={ownRoute} className="flex items-center gap-3 rounded-xl">
                        <img src="favicon.svg" alt="" width="36" height="36" className="rounded-xl" />
                        <span className="leading-tight">
                            <span className="block text-lg font-bold tracking-tight text-slate-900 dark:text-white">ContextPulse AI</span>
                            <span className="hidden sm:block text-[10px] uppercase font-mono text-sky-700 dark:text-sky-400">{t('brandSub')}</span>
                        </span>
                    </Link>
                    <nav aria-label={t('mainNav')} className="flex flex-wrap items-center justify-end gap-2">
                        {userRole ? (
                            <>
                                <Link route={ownRoute} className={tabCls(route === ownRoute)}>{userRole === 'manager' ? t('mgrPanel') : t('devPanel')}</Link>
                                <button type="button" onClick={handleLogout} className="px-3.5 py-2 bg-rose-500/10 text-rose-700 dark:text-rose-400 hover:bg-rose-500/20 rounded-xl text-xs font-semibold transition-colors">{t('logout')}</button>
                            </>
                        ) : <SignInMenu />}
                        <LivePill live={live} offline={offline} />
                        <LangSwitch lang={lang} onChange={changeLang} />
                        <button type="button" onClick={toggleTheme} aria-label={t('themeAria')}
                            className="p-2.5 bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                            {theme === 'dark' ? <IconSun className="w-5 h-5 text-amber-400" /> : <IconMoon className="w-5 h-5 text-slate-700" />}
                        </button>
                    </nav>
                </div>
            </header>

            <main id="main" tabIndex={-1} className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 outline-none">
                {route === 'home' && <HomeView userRole={userRole} />}
                {route === 'portal' && <PortalPage />}
                {(route === 'login-dev' || route === 'login-mgr') && (
                    <LoginPage role={loginRole} email={emailInput} password={passwordInput} error={loginError}
                        onEmail={setEmailInput} onPassword={setPasswordInput} onSubmit={handleLoginSubmit} />
                )}
                {route === 'dev-portal' && <DevPortalView awayHistory={awayHistory} event={ideEvent} live={live} offline={offline} team={team} announcements={announcements} onTriggerIdle={openIdle} />}
                {route === 'manager-portal' && <ManagerPortalView team={team} bumps={bumps} live={live} offline={offline} announcements={announcements} onSaveAction={saveAction} onSend={sendAnnouncement} />}
                {route === 'privacy' && <LegalDocPage docKey="privacy" />}
                {route === 'terms' && <LegalDocPage docKey="terms" />}
                {route === 'cookies' && <LegalDocPage docKey="cookies" />}
                {route === '404' && <Custom404Page onGoHome={() => navigateTo(ownRoute)} />}
            </main>

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
                <div className="max-w-7xl mx-auto px-4 text-center sm:text-left sm:flex sm:items-center sm:justify-between text-xs text-slate-600 dark:text-slate-400">
                    <p>{t('footerCopy')}</p>
                    <nav aria-label={t('legalNav')} className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-4 sm:mt-0 font-medium">
                        <Link route="privacy" className="hover:text-sky-700 dark:hover:text-sky-400 hover:underline">{t('privacyLink')}</Link>
                        <Link route="terms" className="hover:text-sky-700 dark:hover:text-sky-400 hover:underline">{t('termsLink')}</Link>
                        <Link route="cookies" className="hover:text-sky-700 dark:hover:text-sky-400 hover:underline">{t('cookiesLink')}</Link>
                        <Link route="cookies" hash="#storage" className="hover:text-sky-700 dark:hover:text-sky-400 hover:underline">{t('cookieSettings')}</Link>
                    </nav>
                </div>
            </footer>

            {!cookieConsent && (
                <div role="region" aria-label={t('cookieTitle')} className="fixed bottom-4 left-4 right-4 md:left-8 md:right-auto md:max-w-md z-50 p-5 glass-panel rounded-2xl">
                    <h2 className="text-sm font-semibold text-slate-900 dark:text-white">{t('cookieTitle')}</h2>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">{t('cookieText')}</p>
                    <div className="flex items-center gap-3 mt-4">
                        <button type="button" onClick={acceptCookies} className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs rounded-xl">{t('accept')}</button>
                        <Link route="cookies" hash="#storage" className="px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:underline">{t('readMore')}</Link>
                    </div>
                </div>
            )}
        </div>
        </NavCtx.Provider></LangCtx.Provider>
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
                        <h2 className="text-base font-semibold">{it.title}</h2>
                    </div>
                    <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">{it.text}</p>
                </div>
            ))}
        </div>
    );
}

// ============ NAVİQASİYA KOMPONENTLƏRİ ============
function Link({ route, hash, className, children }) {
    const go = React.useContext(NavCtx);
    return (
        <a href={pathFor(route) + (hash || '')} className={className}
            onClick={(e) => { if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return; e.preventDefault(); go(route, hash); }}>
            {children}
        </a>
    );
}

// Kompakt "Daxil ol" menyusu: İşçi və Menecer üçün ayrı giriş səhifələrinə keçid
function SignInMenu() {
    const { t } = useT();
    const go = React.useContext(NavCtx);
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    useEffect(() => {
        if (!open) return undefined;
        const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
        document.addEventListener('mousedown', onDown);
        document.addEventListener('keydown', onKey);
        return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
    }, [open]);
    const item = (r, title, sub) => (
        <a role="menuitem" href={pathFor(r)} onClick={(e) => { e.preventDefault(); setOpen(false); go(r); }}
            className="block px-4 py-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
            <span className="block text-sm font-semibold text-slate-900 dark:text-white">{title}</span>
            <span className="block text-[11px] text-slate-600 dark:text-slate-400">{sub}</span>
        </a>
    );
    return (
        <div className="relative" ref={ref}>
            <button type="button" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(!open)}
                className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold transition-colors">
                {t('signIn')} <span aria-hidden="true">▾</span>
            </button>
            {open && (
                <div role="menu" className="absolute right-0 mt-2 w-64 p-1.5 glass-panel rounded-xl z-50">
                    {item('login-dev', t('signInDev'), t('signInDevSub'))}
                    {item('login-mgr', t('signInMgr'), t('signInMgrSub'))}
                </div>
            )}
        </div>
    );
}

// ============ ANA SƏHİFƏ ============
function HomeView({ userRole }) {
    const { t } = useT();
    const own = userRole === 'manager' ? 'manager-portal' : 'dev-portal';
    return (
        <div className="max-w-5xl mx-auto py-8 space-y-14">
            <section className="text-center space-y-5 max-w-3xl mx-auto">
                <span className="inline-block px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-700 dark:text-sky-300 text-xs font-mono">{t('homeBadge')}</span>
                <h1 className="text-3xl sm:text-5xl font-bold text-slate-900 dark:text-white leading-tight">{t('homeTitle')}</h1>
                <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 leading-relaxed">{t('homeSub')}</p>
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    <Link route={userRole ? own : 'portal'} className="px-5 py-3 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl text-sm transition-colors">
                        {userRole ? (userRole === 'manager' ? t('goMgr') : t('goDev')) : t('ctaPortal')}
                    </Link>
                    <Link route="privacy" className="px-5 py-3 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900 font-semibold rounded-xl text-sm transition-colors">{t('ctaPolicy')}</Link>
                </div>
            </section>
            <FeatureCards />
            <section aria-labelledby="how-h">
                <h2 id="how-h" className="text-xl font-semibold text-slate-900 dark:text-white">{t('howTitle')}</h2>
                <ol className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    {[['how1T', 'how1P'], ['how2T', 'how2P'], ['how3T', 'how3P']].map(([a, b]) => (
                        <li key={a} className="glass-panel rounded-2xl p-5">
                            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{t(a)}</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">{t(b)}</p>
                        </li>
                    ))}
                </ol>
            </section>
            <section aria-labelledby="lim-h" className="glass-panel rounded-2xl p-6">
                <h2 id="lim-h" className="text-xl font-semibold text-slate-900 dark:text-white">{t('limitsTitle')}</h2>
                <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-400 list-disc pl-5 leading-relaxed">
                    {['lim1', 'lim2', 'lim3', 'lim4'].map((k) => (<li key={k}>{t(k)}</li>))}
                </ul>
            </section>
        </div>
    );
}

// ============ /portal: rol seçimi ============
function PortalPage() {
    const { t } = useT();
    const card = (r, icon, title, text, cta) => (
        <Link route={r} className="glass-panel rounded-2xl p-6 flex flex-col gap-3 hover:border-sky-500/60 transition-colors">
            <span className="p-3 bg-sky-500/10 text-sky-700 dark:text-sky-400 rounded-xl w-fit">{icon}</span>
            <span className="text-lg font-semibold text-slate-900 dark:text-white">{title}</span>
            <span className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{text}</span>
            <span className="text-sm font-semibold text-sky-700 dark:text-sky-400 mt-1">{cta} →</span>
        </Link>
    );
    return (
        <div className="max-w-3xl mx-auto py-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">{t('portalTitle')}</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">{t('portalSub')}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                {card('login-dev', <IconTerminal className="w-6 h-6" />, t('devCardTitle'), t('devCardText'), t('signInDev'))}
                {card('login-mgr', <IconUsers className="w-6 h-6" />, t('mgrCardTitle'), t('mgrCardText'), t('signInMgr'))}
            </div>
            <p className="mt-6"><Link route="home" className="text-sm text-sky-700 dark:text-sky-400 hover:underline">← {t('backToSite')}</Link></p>
        </div>
    );
}

// ============ /developer-login və /manager-login ============
function LoginPage({ role, email, password, error, onEmail, onPassword, onSubmit }) {
    const { t } = useT();
    const mgr = role === 'manager';
    const field = 'w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-sky-500 font-mono';
    return (
        <div className="max-w-md mx-auto py-6">
            <Link route="portal" className="text-xs text-sky-700 dark:text-sky-400 hover:underline">← {t('backToPortal')}</Link>
            <div className="glass-panel rounded-2xl p-7 mt-4">
                <div className="flex items-center gap-3 mb-6">
                    <span className="p-3 bg-sky-500/10 text-sky-700 dark:text-sky-400 rounded-xl">{mgr ? <IconUsers className="w-6 h-6" /> : <IconTerminal className="w-6 h-6" />}</span>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white">{mgr ? t('loginTitleMgr') : t('loginTitleDev')}</h1>
                        <p className="text-xs text-slate-600 dark:text-slate-400">{t('loginSub')}</p>
                    </div>
                </div>
                <form onSubmit={onSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="login-email" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">{t('email')}</label>
                        <input id="login-email" type="email" autoComplete="username" required value={email} onChange={(e) => onEmail(e.target.value)}
                            placeholder={mgr ? 'manager@company.com' : 'dev@company.com'} className={field} />
                    </div>
                    <div>
                        <label htmlFor="login-password" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">{t('password')}</label>
                        <input id="login-password" type="password" autoComplete="current-password" required value={password} onChange={(e) => onPassword(e.target.value)} placeholder="••••••••" className={field} />
                    </div>
                    {error && <p role="alert" className="text-xs text-rose-700 dark:text-rose-400 font-medium">{t('loginErr')}</p>}
                    <div className="p-3 bg-sky-500/10 rounded-xl text-xs text-sky-900 dark:text-sky-200 space-y-1 font-mono">
                        <p className="font-bold">{t('demoCreds')}</p>
                        {mgr ? <p>Email: <b>manager@company.com</b> | {t('password')}: <b>admin123</b></p> : <p>Email: <b>dev@company.com</b> | {t('password')}: <b>emp123</b></p>}
                    </div>
                    <button type="submit" className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-sm font-semibold transition-colors">{t('submit')}</button>
                </form>
            </div>
        </div>
    );
}

// ============ İŞÇİ PANELİ ============
function DevPortalView({ awayHistory, event, live, offline, team, announcements, onTriggerIdle }) {
    const { t, lang } = useT();
    const loc = lang === 'az' ? 'az-AZ' : 'en-GB';
    const a = event && event.last_meaningful_action;
    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-panel p-6 rounded-3xl">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('devTitle')}</h1>
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

            <TeamNews team={team} announcements={announcements} />

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

// ============ MENECER PANELİ (K-anonim məlumat + tədbir izləmə + komandaya elan) ============
const ACTION_STATUSES = ['investigating', 'planned', 'resolved'];
const fmtTime = (iso, lang) => { try { return new Date(iso).toLocaleTimeString(lang === 'az' ? 'az-AZ' : 'en-GB', { hour: '2-digit', minute: '2-digit' }); } catch (e) { return ''; } };
const inputCls = 'w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-sky-500';

function StatusBadge({ status }) {
    const { t } = useT();
    const cls = {
        investigating: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
        planned: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
        resolved: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
    }[status] || 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400';
    return <span className={'px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold ' + cls}>{t('status_' + (status || 'none'))}</span>;
}

// Görünən (K həddini keçmiş) tıxanma kartı + menecerin tədbir qeydi
function BlockerCard({ b, max, bump, onSave }) {
    const { t, lang } = useT();
    const saved = b.action;
    const [status, setStatus] = useState(saved ? saved.status : 'investigating');
    const [owner, setOwner] = useState(saved ? saved.owner : '');
    const [note, setNote] = useState(saved ? saved.note : '');
    const [busy, setBusy] = useState(false);
    const save = () => { setBusy(true); onSave(b.category, { status, owner: owner.trim(), note: note.trim() }).then(() => setBusy(false)); };
    return (
        <div className="p-4 bg-slate-50 dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">{t('cat_' + b.category)}</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{t('sig_' + b.category)}</p>
                </div>
                <div className="text-right shrink-0">
                    <span className="px-3 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-mono rounded-full">
                        {b.affected_count} {t('employees')} · {Math.round(b.share * 100)}%
                    </span>
                    {bump ? <span className="ml-2 px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-mono animate-pulse">+{bump}</span> : null}
                    <p className="text-[10px] font-mono text-slate-400 mt-1">{t('avgStall')} {b.avg_stall_minutes} {t('min')} · {b.trend_7d}</p>
                </div>
            </div>
            <div className="h-2 mt-3 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                <div className="h-full bg-sky-500 transition-all duration-700" style={{ width: Math.round(b.affected_count / max * 100) + '%' }}></div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between gap-3">
                    <span className="text-[10px] uppercase font-mono text-slate-400">{t('actionTitle')}</span>
                    <StatusBadge status={saved ? saved.status : null} />
                </div>
                {saved && (saved.owner || saved.note) && (
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 break-words">
                        {saved.owner ? <b>{t('ownerShort')}: {saved.owner}. </b> : null}{saved.note}
                        <span className="text-slate-400 font-mono"> · {t('updatedAt')} {fmtTime(saved.updated_at, lang)}</span>
                    </p>
                )}
                <div className="flex flex-wrap gap-2" role="group" aria-label={t('statusLabel')}>
                    {ACTION_STATUSES.map((st) => (
                        <button key={st} type="button" onClick={() => setStatus(st)} aria-pressed={status === st}
                            className={'px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ' + (status === st ? 'bg-sky-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700')}>
                            {t('status_' + st)}
                        </button>
                    ))}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input value={owner} maxLength={40} onChange={(e) => setOwner(e.target.value)} placeholder={t('ownerPh')} aria-label={t('ownerLabel')} className={inputCls} />
                    <input value={note} maxLength={200} onChange={(e) => setNote(e.target.value)} placeholder={t('notePh')} aria-label={t('noteLabel')} className={inputCls + ' sm:col-span-2'} />
                </div>
                <div className="flex justify-end">
                    <button type="button" onClick={save} disabled={busy} className="px-4 py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold">{t('saveAction')}</button>
                </div>
            </div>
        </div>
    );
}

// Komandaya elan (yalnız menecer göndərir; bütün işçilərin panelində canlı görünür)
function AnnounceBox({ visible, announcements, onSend }) {
    const { t, lang } = useT();
    const [text, setText] = useState('');
    const [category, setCategory] = useState('');
    const [busy, setBusy] = useState(false);
    const send = () => {
        if (!text.trim()) return;
        setBusy(true);
        onSend({ text: text.trim(), category: category || null }).then((ok) => { setBusy(false); if (ok) setText(''); });
    };
    return (
        <div className="glass-panel p-6 rounded-3xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">{t('announceTitle')}</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-4">{t('announceSub')}</p>
            <textarea value={text} maxLength={280} rows={2} onChange={(e) => setText(e.target.value)} placeholder={t('announcePh')} aria-label={t('announceTitle')} className={inputCls} />
            <div className="flex flex-wrap items-center justify-between gap-3 mt-2">
                <label className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                    {t('announceTo')}:
                    <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls + ' w-auto'}>
                        <option value="">{t('announceAll')}</option>
                        {visible.map((b) => (<option key={b.category} value={b.category}>{t('cat_' + b.category)}</option>))}
                    </select>
                </label>
                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono text-slate-400">{text.length}/280</span>
                    <button type="button" onClick={send} disabled={busy || !text.trim()} className="px-4 py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold">{t('announceSend')}</button>
                </div>
            </div>
            <p className="text-[10px] uppercase font-mono text-slate-400 mt-5 mb-2">{t('announceHistory')}</p>
            {announcements.length === 0 ? <p className="text-xs text-slate-500 dark:text-slate-400">{t('noAnnouncements')}</p> : (
                <ul className="space-y-2">
                    {announcements.map((a) => (
                        <li key={a.id} className="text-xs text-slate-700 dark:text-slate-300 break-words">
                            <span className="font-mono text-slate-400">{fmtTime(a.created_at, lang)}</span>
                            {a.category ? <span className="ml-2 px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 text-[10px]">{t('cat_' + a.category)}</span> : null}
                            <span className="ml-2">{a.text}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

// İşçi panelində: menecerin elanları və tıxanmalar üzrə görülən tədbirlər (komanda səviyyəsində)
function TeamNews({ team, announcements }) {
    const { t, lang } = useT();
    const acted = team ? team.blockers.filter((b) => !b.suppressed && b.action) : [];
    return (
        <div className="glass-panel p-6 rounded-3xl space-y-5">
            <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-3">{t('wsAnnouncements')}</h3>
                {announcements.length === 0 ? <p className="text-xs text-slate-500 dark:text-slate-400">{t('noAnnouncements')}</p> : (
                    <ul className="space-y-2">
                        {announcements.map((a) => (
                            <li key={a.id} className="p-3 bg-slate-50 dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-800 text-sm text-slate-800 dark:text-slate-200 break-words">
                                <span className="font-mono text-[10px] text-slate-400">{fmtTime(a.created_at, lang)}</span>
                                {a.category ? <span className="ml-2 px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 text-[10px]">{t('cat_' + a.category)}</span> : null}
                                <p className="mt-1">{a.text}</p>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-3">{t('wsStatusTitle')}</h3>
                {acted.length === 0 ? <p className="text-xs text-slate-500 dark:text-slate-400">{t('wsNoStatus')}</p> : (
                    <ul className="space-y-2">
                        {acted.map((b) => (
                            <li key={b.category} className="p-3 bg-slate-50 dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3">
                                <div className="text-xs text-slate-700 dark:text-slate-300 break-words">
                                    <b>{t('cat_' + b.category)}</b>
                                    {b.action.owner ? <span className="text-slate-500 dark:text-slate-400"> · {t('ownerShort')}: {b.action.owner}</span> : null}
                                    {b.action.note ? <p className="mt-0.5">{b.action.note}</p> : null}
                                </div>
                                <StatusBadge status={b.action.status} />
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}

function ManagerPortalView({ team, bumps, live, offline, announcements, onSaveAction, onSend }) {
    const { t } = useT();
    const shown = team ? team.blockers.filter((b) => !b.suppressed) : [];
    const hidden = team ? team.blockers.filter((b) => b.suppressed) : [];
    const max = Math.max(1, ...shown.map((b) => b.affected_count));
    return (
        <div className="space-y-8">
            <div className="glass-panel p-6 rounded-3xl flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('mgrTitle')}</h1>
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
                            {shown.map((b) => (<BlockerCard key={b.category} b={b} max={max} bump={bumps[b.category]} onSave={onSaveAction} />))}
                            {hidden.map((b) => (
                                <div key={b.group} className="p-4 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 flex items-center space-x-3 text-slate-500 dark:text-slate-400">
                                    <IconLock className="w-4 h-4" /><span className="text-xs font-mono">{t('hiddenRow', team.k_threshold)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <AnnounceBox visible={shown} announcements={announcements} onSend={onSend} />
                </>
            )}
        </div>
    );
}

// ============ HÜQUQİ SƏHİFƏLƏR VƏ 404 ============
// ============ HÜQUQİ SƏHİFƏLƏR (/privacy-policy, /terms-and-conditions, /cookie-policy) ============
// [[...]] yer tutucuları və `kod` hissələri render olunur; mətn React tərəfindən escape edilir
function LegalText({ text }) {
    return (
        <>
            {String(text).split(/(\[\[.*?\]\]|`[^`]+`)/g).map((part, i) => {
                if (part.startsWith('[[')) return <span key={i} className="placeholder">{part.slice(2, -2)}</span>;
                if (part.startsWith('`')) return <code key={i}>{part.slice(1, -1)}</code>;
                return <React.Fragment key={i}>{part}</React.Fragment>;
            })}
        </>
    );
}
function StorageTable() {
    const { t, lang } = useT();
    const clear = () => {
        try { ['cp_lang', 'cp_theme', 'cookieConsentGiven'].forEach((k) => localStorage.removeItem(k)); } catch (e) { /* yoxdur */ }
        window.dispatchEvent(new Event('cp-prefs-cleared'));
    };
    return (
        <section id="storage" tabIndex={-1} className="outline-none">
            <h2>{t('cookieSettings')}</h2>
            <div className="overflow-x-auto">
                <table>
                    <thead><tr><th scope="col">{t('tblName')}</th><th scope="col">{t('tblType')}</th><th scope="col">{t('tblPurpose')}</th><th scope="col">{t('tblDuration')}</th><th scope="col">{t('tblWhen')}</th></tr></thead>
                    <tbody>
                        {STORAGE_ITEMS.map((r) => (
                            <tr key={r.name}><td><code>{r.name}</code></td><td>{r.type[lang]}</td><td>{r.purpose[lang]}</td><td>{r.duration[lang]}</td><td>{r.when[lang]}</td></tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <button type="button" onClick={clear} className="mt-4 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-sm font-semibold transition-colors">{t('clearPrefs')}</button>
        </section>
    );
}
function LegalDocPage({ docKey }) {
    const { t, lang } = useT();
    const doc = LEGAL[lang][docKey];
    const date = new Date(LEGAL_UPDATED + 'T00:00:00').toLocaleDateString(lang === 'az' ? 'az-AZ' : 'en-GB', { year: 'numeric', month: 'long', day: 'numeric' });
    const others = [['privacy', 'privacyLink'], ['terms', 'termsLink'], ['cookies', 'cookiesLink']].filter(([k]) => k !== docKey);
    return (
        <article className="max-w-3xl mx-auto">
            <nav aria-label="breadcrumb" className="mb-4"><Link route="home" className="text-sm text-sky-700 dark:text-sky-400 hover:underline">← {t('backToSite')}</Link></nav>
            <div className="legal glass-panel rounded-2xl p-6 sm:p-10">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{doc.title}</h1>
                <p className="mt-1 text-xs font-mono text-slate-600 dark:text-slate-400">{t('lastUpdated')}: <time dateTime={LEGAL_UPDATED}>{date}</time></p>
                <p className="mt-4"><LegalText text={doc.intro} /></p>
                {doc.sections.map((sec, i) => (
                    <section key={i}>
                        <h2>{sec.h}</h2>
                        {(sec.p || []).map((p, j) => <p key={j}><LegalText text={p} /></p>)}
                        {sec.ul && <ul>{sec.ul.map((li, j) => <li key={j}><LegalText text={li} /></li>)}</ul>}
                    </section>
                ))}
                {docKey === 'cookies' && <StorageTable />}
                <div className="mt-10 pt-5 border-t border-slate-200 dark:border-slate-800 flex flex-wrap gap-x-6 gap-y-2 text-sm">
                    <Link route="home" className="text-sky-700 dark:text-sky-400 hover:underline">← {t('backToSite')}</Link>
                    {others.map(([k, lbl]) => <Link key={k} route={k} className="text-sky-700 dark:text-sky-400 hover:underline">{t(lbl)}</Link>)}
                </div>
            </div>
        </article>
    );
}
function Custom404Page({ onGoHome }) {
    const { t } = useT();
    return (
        <div className="py-20 text-center space-y-6">
            <div className="inline-block p-6 bg-rose-500/10 text-rose-500 rounded-full font-mono text-4xl font-extrabold">404</div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{t('notFoundTitle')}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">{t('notFoundText')}</p>
            <button onClick={onGoHome} className="px-6 py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-2xl text-xs shadow-lg shadow-sky-600/20">{t('backHome')}</button>
        </div>
    );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);