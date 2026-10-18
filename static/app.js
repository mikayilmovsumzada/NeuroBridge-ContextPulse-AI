const { useState, useEffect, useRef } = React;

// ============ XSS təmizləyici ============
function sanitizeInput(str) {
    if (typeof str !== 'string') return '';
    return str.replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}

// ============ DİL (AZ / EN) — README və faktiki koda tam uyğunlaşdırılıb ============
const I18N = {
    az: {
        brandSub: 'Privacy-First Context & Blocker Platform',
        navHome: 'Məhsul',
        navArchitecture: 'Arxitektura',
        navPrivacy: 'Məxfilik',
        navPortal: 'Giriş Portalı',
        devPanel: 'İşçi Paneli',
        mgrPanel: 'Menecer Paneli',
        logout: 'Çıxış',
        live: 'Canlı SSE',
        connecting: 'Qoşulur…',
        offlineDemo: 'Oflayn demo',
        loading: 'Yüklənir...',

        // Hero & Public Landing Page (Grounded in README.md)
        homeBadge: 'Yalnız IDE və PR Metadatası • K-Anonimlik (K = 5)',
        homeTitle: 'Fasilədən Sonra Kontekst İtkisini Azaldan və Tıxanmaları İzləmədən Göstərən Platforma',
        homeSub: 'ContextPulse AI proqramçı fasilədən qayıdanda son işi qısa xatırlatma ilə bərpa edir və komanda rəhbərinə tıxanmaları fərdi işçini izləmədən, K-anonimlik (K = 5) qaydası ilə təqdim edir. Ekran çəkilmir, klaviatura izlənmir, kod məzmunu oxunmur.',
        heroCtaPrimary: 'Arxitektura və Axını İzlə',
        heroCtaPortal: ' İdarəetmə Portalına Keçid',
        heroMeta1Label: 'Məxfilik Yoxlaması',
        heroMeta1Val: 'Pydantic Strict (422 Rədd)',
        heroMeta2Label: 'Anonimlik Həddi',
        heroMeta2Val: 'K = 5 Minimum Qrup',
        heroMeta3Label: 'AI Doğrulama',
        heroMeta3Val: 'Fakt Yoxlaması + Fallback',
        heroMeta4Label: 'Canlı Yenilənmə',
        heroMeta4Val: 'Server-Sent Events (SSE)',

        // 3 Core Features (Corrected from README)
        featSectionTag: 'ƏSAS XÜSUSİYYƏTLƏR VƏ MEXANİZMLƏR',
        featSectionTitle: 'Məxfiliklə Mühəndislik Görünürlüyünü Birləşdirən İkiqat Dövrə',
        featSectionSub: 'Sistem yalnız doğrulanmış IDE və Pull Request metadatası üzərində işləyir — fərdi nəzarət olmadan həm proqramçını, həm də komanda rəhbərini dəstəkləyir.',

        featSpyTitle: 'Yalnız Metadata Telemetriyası (Casus Proqram Yoxdur)',
        featSpyBadge: 'HTTP 422 Sxem Mühafizəsi',
        featSpyText: 'Ekran qeydi (screen_capture) və klaviatura izləmə (keystroke_content) yoxdur. API-də privacy sahələrindən hər hansı biri true olarsa və ya sxemdə nəzərdə tutulmayan sahə (məsələn source_code) göndərilərsə, sorğu dərhal HTTP 422 ilə rədd edilir.',

        featReTitle: 'Saniyələr İçində Kontekst Bərpası',
        featReBadge: 'Gemini + Deterministik Doğrulama',
        featReText: 'Fasilədən qayıdanda xatırlatma Google Gemini ilə hazırlanır və proqramla giriş JSON-una qarşı doğrulanır: uydurma fayl, funksiya, xəta kodu və ya PR nömrəsi aşkarlanarsa avtomatik hazır mətnə (fallback) keçilir. İlk Gemini sorğusu bir neçə saniyə çəkə bilər, eyni hadisə üçün sonrakı sorğular yaddaşdan (keşdən) gəlir.',

        featKTitle: 'K-Anonimlik (K = 5) Qrup Aqreqasiyası',
        featKBadge: 'K = 5 Hədd Qorunması',
        featKText: 'Menecer panelində fərdi identifikator yoxdur. Tıxanma kateqoriyası yalnız ən azı K = 5 cavab topladıqda görünür. Daha az cavabı olan qruplar "gizlədilib" (n < K) kimi göstərilir, dəqiq sayı açıqlanmır və onlar üzərində tədbir açmaq serverdə 409 ilə rədd edilir.',

        // Closed-loop architecture section
        loopTag: 'QAPALI DÖVRƏ AXINI',
        loopTitle: 'Üç Addımda Komanda Koordinasiyası',
        loopStep1Title: '1. İşçi üçün Kontekst Bərpası',
        loopStep1Text: 'Fasilədən qayıdan kimi AI son dəyişdirilən funksiyanı, açıq xətanı (məs. TS2345), uğursuz testi və PR-dəki həll olunmamış şərhləri qısa xatırlatma ilə göstərir.',
        loopStep2Title: '2. Menecer üçün K-Anonim Analitika',
        loopStep2Text: 'İşçinin seçdiyi fasilə səbəbi anonim olaraq qruplaşdırılır. K = 5 həddini keçən tıxanmalar üzrə menecer status (Araşdırılır, Tədbir planlanıb, Həll olunub), məsul komanda və qeyd təyin edir.',
        loopStep3Title: '3. Dövrə Qapanır (Canlı SSE)',
        loopStep3Text: 'Menecerin tıxanmalar üzrə tədbir qeydləri və komanda elanları Server-Sent Events (SSE) vasitəsilə bütün işçilərin panelində səhifə yenilənmədən canlı görünür.',

        // Schema & Limitations transparency section
        schemaTag: 'TEXNİKİ ŞƏFFAFLIQ VƏ MƏHDUDİYYƏTLƏR',
        schemaTitle: 'Doğrulanmış Hadisə Sxemi və Məlum Məhdudiyyətlər',
        schemaSub: 'README sənədləşməsinə uyğun olaraq sistemin qəbul etdiyi metadata strukturu və cari memarlıq məhdudiyyətləri açıq şəkildə təqdim edilir.',
        schemaBoxTitle: 'Qəbul Edilən IDE Hadisə Sxemi (contextpulse.ide_event.v1)',
        limitsBoxTitle: 'Məlum Məhdudiyyətlər və Yol Xəritəsi',
        limit1: 'IDE hadisələri hazırda simulyatordan (simulator.py) və ya API-dən gəlir; birbaşa VS Code extension və GitHub PR inteqrasiyası növbəti mərhələdədir.',
        limit2: 'K-anonimlik (K = 5) kiçik qrupları gizlədir, lakin zamana görə ardıcıl müşahidə hücumlarından tam qorumur.',
        limit3: 'SQLite verilənlər bazası və yaddaşdaxili (in-memory) sessiya/keş saxlama demo üçündür; istehsal mühiti üçün PostgreSQL planlaşdırılır.',
        limit4: 'Oflayn demo rejimində (məs. GitLab Pages) backend olmadıqda eyni K-anonimlik və hazır mətn (fallback) məntiqi brauzerdə işlədilir.',

        // Portal & Login Views
        portalBadge: 'ROL ƏSASLI GİRİŞ PORTALI',
        portalTitle: 'ContextPulse AI İdarəetmə Portalı',
        portalSub: 'İşçi və menecer panelləri məxfilik və səlahiyyət prinsiplərinə uyğun olaraq tam ayrılmışdır. Davam etmək üçün rolunuzu seçin.',
        devCardTitle: 'İşçi Paneli (Developer View)',
        devCardText: 'Canlı IDE metadata axını, AI ilə kontekst bərpası, fasilə səbəbinin anonim qeydi, komanda elanları və tıxanma tədbirləri.',
        goDev: 'İşçi Panelinə Keçid',
        loginDev: 'İşçi Kimi Daxil Ol',
        mgrCardTitle: 'Menecer Paneli (K-Anonim Analitika)',
        mgrCardText: 'K = 5 həddi ilə qorunan komanda səviyyəli tıxanma analitikası, tədbir izləmə (status/məsul/qeyd) və komandaya canlı elan göndərilməsi.',
        goMgr: 'Menecer Panelinə Keçid',
        loginMgr: 'Menecer Kimi Daxil Ol',
        loginTitleDev: 'İşçi Panelinə Giriş',
        loginTitleMgr: 'Menecer Panelinə Giriş',
        loginSub: 'Rolunuza uyğun şirkət e-poçtu və parolunuzu daxil edin',
        email: 'Şirkət E-poçtu',
        password: 'Parol',
        demoCreds: 'Demo Giriş Məlumatları (README):',
        fillDemoBtn: 'Demo məlumatlarını doldur',
        cancel: 'Geri Qayıt',
        submit: 'Daxil Ol',
        loginErr: 'Səhv e-poçt, parol və ya rol uyğunsuzluğu!',
        loginOkDev: 'İşçi Panelinə uğurla daxil oldunuz!',
        loginOkMgr: 'Menecer Panelinə təhlükəsiz giriş edildi!',
        logoutToast: 'Sistemdən çıxış edildi.',
        switchRoleHint: 'Başqa rol ilə daxil olmaq üçün əvvəlcə cari sessiyadan çıxış edin.',

        // Developer Dashboard
        devTitle: 'İşçi Paneli (Developer Workspace)',
        devSub: 'Canlı IDE və PR metadata siqnalı, AI kontekst bərpası və komanda yenilikləri',
        simBtn: 'Fasilə / Uzaqlaşmanı Simulyasiya Et',
        liveTitle: 'Canlı IDE və PR Siqnalı (yalnız doğrulanmış metadata)',
        workspaceLabel: ' Workspace / Repo',
        sessionLabel: 'Sessiya Vəziyyəti',
        idleSecLabel: 'Son fəaliyyətdən keçən vaxt',
        file: 'Son Dəyişdirilən Fayl',
        firstErr: 'Diaqnostika (İlk Xəta)',
        tests: 'Test Vəziyyəti',
        pr: 'Pull Request Statusu',
        line: 'sətir',
        linesRange: 'sətir aralığı',
        errorsWord: 'xəta',
        warningsWord: 'xəbərdarlıq',
        passed: 'uğurlu',
        failed: 'uğursuz',
        unresolved: 'həll olunmamış şərh',
        privacyLine: 'screen_capture: false · keystroke_content: false · source_code_content: false',
        historyTitle: 'Uzaqda Olma və Fasilə Tarixçəniz',
        historySub: 'Seçdiyiniz fasilə səbəbləri fərdi identifikator olmadan menecer aqreqasiyasına göndərilir',
        duration: 'Müddət',
        min: 'dəq',
        simSuffix: '(Simulyasiya)',
        idleTitle: 'Fasilədən Qayıdış və Kontekst Bərpası',
        idleText: 'Sistem son aktivlikdən sonra fasilə qeydə aldı. AI son kontekstinizi bərpa etdi — fasilə səbəbini seçərək komanda analitikasına anonim töhfə verin:',
        whereLeft: 'Harada qalmışdın (AI Kontekst Xülasəsi)',
        aiReading: 'AI son IDE və PR metadatanızı oxuyur...',
        pickReason: 'Fasilə Səbəbini Seçin (K-Anonim sorğu):',
        selectPh: '-- Səbəb seçin --',
        close: 'Bağla',
        record: 'Tarixçəyə Qeyd Et',
        recorded: 'Səbəbiniz tarixçəyə əlavə edildi və menecer panelinə anonim göndərildi.',
        serverFail: 'Server cavab vermədi, cavab qeyd olunmadı.',
        badge_gemini: 'Gemini · faktlara qarşı doğrulanıb',
        badge_no_key: 'hazır mətn (API açarı yoxdur)',
        badge_invalid: 'hazır mətn (AI cavabı doğrulamadan keçmədi)',
        badge_error: 'hazır mətn (AI əlçatmaz)',
        badge_timeout: 'hazır mətn (AI gec cavab verdi)',
        badge_offline: 'oflayn demo · hazır mətn',
        badge_srvfail: 'hazır mətn (server cavab vermədi)',

        // Manager Dashboard
        mgrTitle: 'Menecer Analitika Paneli',
        mgrSub: (k) => `K-Anonimlik (K=${k}) çərçivəsində komanda səviyyəsində tıxanmalar. Fərdi işçi identifikatoru bu paneldə yoxdur.`,
        orgUnitLabel: 'Təşkilati vahid',
        teamSize: 'Komanda ölçüsü',
        last7: 'son 7 gün',
        responses: 'Cavablar',
        anonAnswers: 'anonim cavablar',
        kLabel: 'K həddi',
        minGroup: 'minimum qrup ölçüsü',
        hiddenGroups: 'Gizlədilən qruplar',
        analyticsTitle: 'K-Anonimləşdirilmiş Tıxanma (Blocker) Analitikası',
        filterAll: 'Hamısı',
        filterVisible: 'Görünən (n ≥ K)',
        filterActed: 'Tədbir görülənlər',
        filterHidden: 'Gizlədilən (n < K)',
        insufficient: 'Cavabların ümumi sayı K həddindən azdır, məxfilik üçün heç bir qrup göstərilmir.',
        employees: 'cavab',
        avgStall: 'orta dayanma',
        hiddenRow: (k) => `Gizlədilib: qrup ölçüsü K=${k} həddindən azdır (dəqiq say açıqlanmır, tədbir açmaq qadağandır)`,
        kReached: (k, l) => `K=${k} həddinə çatdı, qrup göründü: ${l}`,
        cat_PR_REVIEW_WAIT: 'PR review gözləməsi',
        sig_PR_REVIEW_WAIT: 'Median PR gözləməsi 26,4 saat',
        cat_CI_FLAKY: 'Qeyri-sabit CI testləri',
        sig_CI_FLAKY: '7 flaky test, 3 pipeline təkrar işə düşüb',
        cat_MEETING_LOAD: 'Görüşlər arası parçalanma',
        sig_MEETING_LOAD: 'Gündə orta 3,1 görüş',
        cat_UNCLEAR_REQUIREMENTS: 'Aydın olmayan tələb',
        sig_UNCLEAR_REQUIREMENTS: '2 task açıq sualla bağlanıb',
        cat_TOOLING: 'Mühit / alət problemləri',
        sig_TOOLING: 'Lokal mühit qurulumu və asılılıq xətaları',
        reason_pr: 'PR review gözləməsi',
        reason_ci: 'Qeyri-sabit CI / test problemi',
        reason_meet: 'Görüşlər arası parçalanma',
        reason_req: 'Aydın olmayan tələb',
        reason_tool: 'Mühit / alət problemi',
        reason_break: 'Şəxsi fasilə (çay / istirahət)',

        // Action tracking & Announcements
        status_none: 'Status yoxdur',
        status_investigating: 'Araşdırılır',
        status_planned: 'Tədbir planlanıb',
        status_resolved: 'Həll olunub',
        actionTitle: 'Tədbir izləmə',
        statusLabel: 'Status',
        ownerLabel: 'Məsul komanda / şəxs',
        ownerPh: 'məs. DevOps komandası',
        noteLabel: 'Qeyd',
        notePh: 'Görüləcək tədbir haqqında qısa qeyd',
        saveAction: 'Yadda saxla',
        ownerShort: 'Məsul',
        updatedAt: 'Yenilənib',
        actionSaved: 'Tədbir qeydi saxlanıldı.',
        actionFailed: 'Tədbir qeydi saxlanılmadı: qrup K həddindən aşağı düşüb və ya server cavab vermədi.',
        announceTitle: 'Komandaya elan',
        announceSub: 'Elan bütün işçilərin panelində canlı görünür. Fərdi işçiyə ünvanlanmır; mövzu yalnız görünən (n ≥ K) qrupa bağlana bilər.',
        announcePh: 'məs. PR review üçün 24 saatlıq qayda təyin edirik',
        announceTo: 'Mövzu',
        announceAll: 'Ümumi (mövzusuz)',
        announceSend: 'Elanı göndər',
        announceSent: 'Elan komandaya göndərildi.',
        announceFail: 'Elan göndərilmədi.',
        announceHistory: 'Göndərilmiş elanlar',
        noAnnouncements: 'Hələ elan yoxdur.',
        wsAnnouncements: 'Komanda elanları',
        wsStatusTitle: 'Tıxanmalar üzrə tədbirlər',
        wsNoStatus: 'Hələ tədbir qeydi yoxdur.',
        newAnnouncementToast: 'Menecerdən yeni komanda elanı var.',
        demoResetBtn: 'Demo Məlumatını Sıfırla',
        demoResetConfirmTitle: 'Demo Məlumatını Sıfırlamaq İstəyirsiniz?',
        demoResetConfirmText: 'Bu əməliyyat bütün əlavə edilmiş sorğu cavablarını, tədbir qeydlərini və komanda elanlarını silərək ilkin seed vəziyyətinə qaytaracaq.',
        demoResetConfirmYes: 'Bəli, Sıfırla',
        demoResetDone: 'Demo məlumatları ilkin vəziyyətə sıfırlandı.',

        // Footer & Cookie Consent
        footerCopy: '© 2026 ContextPulse AI (NeuroBridge Hackathon · Code of War). Bütün hüquqlar qorunur.',
        privacyLink: 'Məxfilik Siyasəti',
        termsLink: 'İstifadə Şərtləri',
        cookiesLink: 'Kuki Siyasəti',
        cookieSettingsBtn: 'Kuki Seçimləri',
        cookieTitle: 'Kuki və Lokal Yaddaş Seçimləri',
        cookieText: 'ContextPulse AI üçüncü tərəf reklam və ya izləmə kukilərindən istifadə etmir. Sessiya təhlükəsizliyi üçün zəruri HttpOnly kuki və dil/tema seçimləriniz üçün brauzer yaddaşı (localStorage) tətbiq olunur.',
        acceptAll: 'Hamısını Qəbul Et',
        rejectNonEssential: 'Yalnız Zəruri',
        customizeCookies: 'Fərdiləşdir',
        savePreferences: 'Seçimləri Yadda Saxla',
        cookieEssentialTitle: 'Zəruri Texniki Saxlama (Həmişə Aktiv)',
        cookieEssentialDesc: 'Autentifikasiya sessiyası (cp_session HttpOnly cookie) və kuki razılıq vəziyyətinin saxlanması üçün tələb olunur.',
        cookieFuncTitle: 'Funksional UI Seçimləri (İstəyə bağlı)',
        cookieFuncDesc: 'Dil (AZ/EN) və görünüş rejimi (tünd/açıq tema) seçimlərinizin növbəti ziyarətlərdə xatırlanmasını təmin edir.',
        cookieAnalyticsTitle: 'Analitika və İzləmə Kukiləri (İstifadə Olunmur)',
        cookieAnalyticsDesc: 'Sistemdə heç bir üçüncü tərəf analitika və ya reklam izləyicisi quraşdırılmayıb.',
        cookieSaved: 'Kuki və məxfilik seçimləriniz yadda saxlanıldı.',
        readMore: 'Kuki Siyasəti',

        // 404 / Access Denied
        notFoundTitle: 'Giriş Məhdudlaşdırılıb və ya Səhifə Tapılmadı',
        notFoundText: 'Müraciət etdiyiniz ünvan mövcud deyil və ya cari rolunuz üçün icazə verilmir. İşçi və menecer panelləri bir-birindən tam ayrılıb.',
        backHome: 'Ana Səhifəyə Qayıt',
        goPortalBtn: 'Giriş Portalına Keç',
        themeAria: 'Temanı dəyiş',
        langAria: 'Dil seçimi'
    },
    en: {
        brandSub: 'Privacy-First Context & Blocker Platform',
        navHome: 'Product',
        navArchitecture: 'Architecture',
        navPrivacy: 'Privacy',
        navPortal: 'Sign-In Portal',
        devPanel: 'Employee Panel',
        mgrPanel: 'Manager Panel',
        logout: 'Log out',
        live: 'Live SSE',
        connecting: 'Connecting…',
        offlineDemo: 'Offline demo',
        loading: 'Loading...',

        // Hero & Public Landing Page (Grounded in README.md)
        homeBadge: 'IDE & PR Metadata Only • K-Anonymity (K = 5)',
        homeTitle: 'Reduce Post-Break Context Loss & Surface Team Blockers Without Surveillance',
        homeSub: 'ContextPulse AI restores developer context upon returning from a break and surfaces team-level bottlenecks to engineering managers under K-anonymity (K = 5) — using only IDE and Pull Request metadata. No screen capture, no keylogging, and no source code reading.',
        heroCtaPrimary: 'Explore Architecture & Flow',
        heroCtaPortal: 'Open Access Portal',
        heroMeta1Label: 'Privacy Validation',
        heroMeta1Val: 'Pydantic Strict (422 Reject)',
        heroMeta2Label: 'Anonymity Threshold',
        heroMeta2Val: 'K = 5 Minimum Group',
        heroMeta3Label: 'AI Verification',
        heroMeta3Val: 'Fact-Checked + Fallback',
        heroMeta4Label: 'Live Updates',
        heroMeta4Val: 'Server-Sent Events (SSE)',

        // 3 Core Features (Corrected from README)
        featSectionTag: 'CORE CAPABILITIES & VERIFIED MECHANISMS',
        featSectionTitle: 'A Closed-Loop Architecture Balancing Privacy and Engineering Visibility',
        featSectionSub: 'Built strictly on verified IDE and Pull Request metadata—supporting both individual developers and engineering managers without invasive monitoring.',

        featSpyTitle: 'Metadata-Only Telemetry (Zero Spyware Architecture)',
        featSpyBadge: 'HTTP 422 Schema Enforcement',
        featSpyText: 'No screen recording (screen_capture) and no keystroke logging (keystroke_content). The API enforces strict Pydantic validation: if any privacy flag is true or an unexpected field (such as source_code) is submitted, the event is rejected with HTTP 422.',

        featReTitle: 'Context Recovery in Seconds',
        featReBadge: 'Gemini + Deterministic Validation',
        featReText: 'When returning from a break, reminders are generated with Google Gemini and programmatically validated against the input JSON: if any hallucinated file, symbol, error code, or PR number is detected, the system automatically falls back to a deterministic template. The initial Gemini request may take a few seconds; subsequent requests for the same event are served from memory.',

        featKTitle: 'K-Anonymity (K = 5) Blocker Aggregation',
        featKBadge: 'K = 5 Threshold Enforcement',
        featKText: 'No individual identifiers appear in the manager view. A blocker category is revealed only when it collects at least K = 5 responses. Smaller groups are shown as "hidden" (n < K) without disclosing exact counts, and server-side guards reject actions on hidden groups with HTTP 409.',

        // Closed-loop architecture section
        loopTag: 'CLOSED-LOOP WORKFLOW',
        loopTitle: 'Three-Stage Team Coordination',
        loopStep1Title: '1. Context Recovery for Developers',
        loopStep1Text: 'Upon returning from a break, AI summarizes the last edited function, open diagnostic error (e.g., TS2345), failing test, and unresolved PR comments.',
        loopStep2Title: '2. K-Anonymous Analytics for Managers',
        loopStep2Text: 'Break reasons selected by developers are aggregated anonymously. For visible categories (n ≥ 5), managers assign status (Investigating, Action planned, Resolved), owner team, and action notes.',
        loopStep3Title: '3. Closing the Loop (Live SSE)',
        loopStep3Text: 'Manager action notes and team-wide announcements stream live via Server-Sent Events (SSE) to all developer dashboards without page reloads.',

        // Schema & Limitations transparency section
        schemaTag: 'TECHNICAL TRANSPARENCY & LIMITATIONS',
        schemaTitle: 'Verified Event Schema & Known Limitations',
        schemaSub: 'In accordance with the repository README, here is the exact metadata schema accepted by the API alongside current prototype boundaries.',
        schemaBoxTitle: 'Accepted IDE Event Schema (contextpulse.ide_event.v1)',
        limitsBoxTitle: 'Known Limitations & Roadmap',
        limit1: 'IDE events are currently emitted via simulator.py or direct API calls; native VS Code extension and GitHub PR webhooks are on the roadmap.',
        limit2: 'K-anonymity (K = 5) hides small groups below the threshold, though it does not fully protect against temporal observation attacks over sequential updates.',
        limit3: 'SQLite storage and in-memory session/reminder caches are designed for demonstration; PostgreSQL and persistent caching are planned for production.',
        limit4: 'In Offline Demo mode (e.g., static GitLab Pages deployment without a backend), the same K-anonymity and template fallback logic runs locally in the browser.',

        // Portal & Login Views
        portalBadge: 'ROLE-BASED ACCESS PORTAL',
        portalTitle: 'ContextPulse AI Access Portal',
        portalSub: 'Employee and Manager workspaces are strictly separated by role and data boundaries. Select your role to sign in.',
        devCardTitle: 'Employee Panel (Developer View)',
        devCardText: 'Live IDE metadata signal, fact-checked AI context recovery, anonymous break reason logging, team announcements, and blocker action updates.',
        goDev: 'Open Employee Panel',
        loginDev: 'Sign in as Employee',
        mgrCardTitle: 'Manager Panel (K-Anonymous Analytics)',
        mgrCardText: 'Team-level blocker analytics protected by K = 5 threshold, action tracking (status/owner/note), and live team-wide announcements.',
        goMgr: 'Open Manager Panel',
        loginMgr: 'Sign in as Manager',
        loginTitleDev: 'Employee Panel Sign In',
        loginTitleMgr: 'Manager Panel Sign In',
        loginSub: 'Enter your role-specific company email and password',
        email: 'Company Email',
        password: 'Password',
        demoCreds: 'Demo Credentials (from README):',
        fillDemoBtn: 'Autofill demo credentials',
        cancel: 'Back',
        submit: 'Sign In',
        loginErr: 'Invalid email, password, or role mismatch!',
        loginOkDev: 'Signed in to the Employee Panel!',
        loginOkMgr: 'Securely signed in to the Manager Panel!',
        logoutToast: 'You have been signed out.',
        switchRoleHint: 'To sign in with a different role, please log out of your current session first.',

        // Developer Dashboard
        devTitle: 'Employee Panel (Developer Workspace)',
        devSub: 'Live IDE & PR metadata stream, AI context recovery, and team updates',
        simBtn: 'Simulate Break / Away',
        liveTitle: 'Live IDE & PR Signal (verified metadata only)',
        workspaceLabel: 'Workspace / Repo',
        sessionLabel: 'Session State',
        idleSecLabel: 'Idle duration',
        file: 'Last Edited File',
        firstErr: 'Diagnostics (First Error)',
        tests: 'Test Runner State',
        pr: 'Pull Request Status',
        line: 'line',
        linesRange: 'lines',
        errorsWord: 'errors',
        warningsWord: 'warnings',
        passed: 'passed',
        failed: 'failed',
        unresolved: 'unresolved comments',
        privacyLine: 'screen_capture: false · keystroke_content: false · source_code_content: false',
        historyTitle: 'Your Away and Break History',
        historySub: 'Submitted break reasons contribute anonymously to team-level manager analytics without individual identifiers',
        duration: 'Duration',
        min: 'min',
        simSuffix: '(simulation)',
        idleTitle: 'Break Return & Context Recovery',
        idleText: 'The system detected a break after your last activity. AI has summarized where you left off — select a break reason to contribute anonymously to team blocker analytics:',
        whereLeft: 'Where you left off (AI Context Summary)',
        aiReading: 'AI is reading your latest IDE & PR metadata...',
        pickReason: 'Choose a break reason (K-Anonymous survey):',
        selectPh: '-- Choose a reason --',
        close: 'Close',
        record: 'Save to History',
        recorded: 'Your reason was added to history and sent anonymously to the manager view.',
        serverFail: 'The server did not respond, your answer was not recorded.',
        badge_gemini: 'Gemini · verified against the facts',
        badge_no_key: 'template text (no API key)',
        badge_invalid: 'template text (AI answer failed verification)',
        badge_error: 'template text (AI unavailable)',
        badge_timeout: 'template text (AI responded too slowly)',
        badge_offline: 'offline demo · template text',
        badge_srvfail: 'template text (server did not respond)',

        // Manager Dashboard
        mgrTitle: 'Manager Analytics Panel',
        mgrSub: (k) => `Team-level blockers under K-anonymity (K=${k}). No individual employee data appears in this panel.`,
        orgUnitLabel: 'Organization unit',
        teamSize: 'Team size',
        last7: 'last 7 days',
        responses: 'Responses',
        anonAnswers: 'anonymous answers',
        kLabel: 'K threshold',
        minGroup: 'minimum group size',
        hiddenGroups: 'Hidden groups',
        analyticsTitle: 'Anonymized Blocker Analytics',
        filterAll: 'All groups',
        filterVisible: 'Visible (n ≥ K)',
        filterActed: 'With action notes',
        filterHidden: 'Hidden (n < K)',
        insufficient: 'The total number of responses is below K, so no group is shown to preserve anonymity.',
        employees: 'responses',
        avgStall: 'avg stall',
        hiddenRow: (k) => `Hidden: group size is below the K=${k} threshold (exact count suppressed, actions disabled)`,
        kReached: (k, l) => `K=${k} reached, group now visible: ${l}`,
        cat_PR_REVIEW_WAIT: 'Waiting for PR review',
        sig_PR_REVIEW_WAIT: 'Median PR wait 26.4 hours',
        cat_CI_FLAKY: 'Flaky CI tests',
        sig_CI_FLAKY: '7 flaky tests, 3 pipelines re-run',
        cat_MEETING_LOAD: 'Fragmentation between meetings',
        sig_MEETING_LOAD: '3.1 meetings per day on average',
        cat_UNCLEAR_REQUIREMENTS: 'Unclear requirements',
        sig_UNCLEAR_REQUIREMENTS: '2 tasks closed with open questions',
        cat_TOOLING: 'Environment / tooling problems',
        sig_TOOLING: 'Local setup and dependency errors',
        reason_pr: 'Waiting for PR review',
        reason_ci: 'Flaky CI / test problem',
        reason_meet: 'Fragmentation between meetings',
        reason_req: 'Unclear requirements',
        reason_tool: 'Environment / tooling problem',
        reason_break: 'Personal break (tea / rest)',

        // Action tracking & Announcements
        status_none: 'No status',
        status_investigating: 'Investigating',
        status_planned: 'Action planned',
        status_resolved: 'Resolved',
        actionTitle: 'Action tracking',
        statusLabel: 'Status',
        ownerLabel: 'Owner team / person',
        ownerPh: 'e.g. DevOps team',
        noteLabel: 'Note',
        notePh: 'Short note about the planned action',
        saveAction: 'Save',
        ownerShort: 'Owner',
        updatedAt: 'Updated',
        actionSaved: 'Action note saved.',
        actionFailed: 'Action note was not saved: the group dropped below K or the server did not respond.',
        announceTitle: 'Team announcement',
        announceSub: 'The announcement appears live on every employee panel. It is not addressed to an individual and can only link to visible (n ≥ K) categories.',
        announcePh: 'e.g. We are introducing a 24-hour PR review rule',
        announceTo: 'Topic',
        announceAll: 'General (no topic)',
        announceSend: 'Send announcement',
        announceSent: 'Announcement sent to the team.',
        announceFail: 'Announcement was not sent.',
        announceHistory: 'Sent announcements',
        noAnnouncements: 'No announcements yet.',
        wsAnnouncements: 'Team announcements',
        wsStatusTitle: 'Actions on team blockers',
        wsNoStatus: 'No action notes yet.',
        newAnnouncementToast: 'New team announcement from your manager.',
        demoResetBtn: 'Reset Demo Data',
        demoResetConfirmTitle: 'Reset Demo Data to Initial Seed State?',
        demoResetConfirmText: 'This will clear all added survey responses, blocker action notes, and team announcements, restoring the default seed dataset.',
        demoResetConfirmYes: 'Yes, Reset Demo',
        demoResetDone: 'Demo dataset has been reset to initial seed values.',

        // Footer & Cookie Consent
        footerCopy: '© 2026 ContextPulse AI (NeuroBridge Hackathon · Code of War). All rights reserved.',
        privacyLink: 'Privacy Policy',
        termsLink: 'Terms & Conditions',
        cookiesLink: 'Cookie Policy',
        cookieSettingsBtn: 'Cookie Preferences',
        cookieTitle: 'Cookie & Local Storage Preferences',
        cookieText: 'ContextPulse AI does not use third-party advertising or tracking cookies. We use an essential HttpOnly session cookie for authentication and optional browser localStorage for language and theme preferences.',
        acceptAll: 'Accept All',
        rejectNonEssential: 'Essential Only',
        customizeCookies: 'Customize',
        savePreferences: 'Save Preferences',
        cookieEssentialTitle: 'Strictly Necessary Storage (Always Active)',
        cookieEssentialDesc: 'Required for authentication session integrity (cp_session HttpOnly cookie) and storing your consent choice.',
        cookieFuncTitle: 'Functional UI Preferences (Optional)',
        cookieFuncDesc: 'Remembers your selected interface language (AZ/EN) and color theme (dark/light) across visits in localStorage.',
        cookieAnalyticsTitle: 'Analytics & Tracking Cookies (Not Used)',
        cookieAnalyticsDesc: 'No third-party analytics, telemetry trackers, or advertising pixels are installed on this platform.',
        cookieSaved: 'Your cookie and privacy preferences were saved.',
        readMore: 'Cookie Policy',

        // 404 / Access Denied
        notFoundTitle: 'Access Restricted or Page Not Found',
        notFoundText: 'The requested route does not exist or is restricted for your current role. Employee and Manager panels are strictly separated.',
        backHome: 'Back to Home',
        goPortalBtn: 'Go to Access Portal',
        themeAria: 'Toggle color theme',
        langAria: 'Select language'
    }
};

function translate(lang, key, ...args) {
    const v = (I18N[lang] && I18N[lang][key] !== undefined) ? I18N[lang][key] : I18N.az[key];
    return typeof v === 'function' ? v(...args) : v;
}
const LangCtx = React.createContext({ lang: 'az', t: (k) => k });
const useT = () => React.useContext(LangCtx);

// ============ URL ROUTING MAP ============
const PATH_TO_ROUTE = {
    '/': 'home',
    '/portal': 'portal',
    '/login': 'portal',
    '/login/developer': 'login-developer',
    '/login/manager': 'login-manager',
    '/developer': 'dev-portal',
    '/dev-portal': 'dev-portal',
    '/manager': 'manager-portal',
    '/manager-portal': 'manager-portal',
    '/privacy-policy': 'privacy-policy',
    '/privacy': 'privacy-policy',
    '/terms-and-conditions': 'terms-and-conditions',
    '/terms': 'terms-and-conditions',
    '/cookie-policy': 'cookie-policy',
    '/cookies': 'cookie-policy'
};

const ROUTE_TO_PATH = {
    'home': '/',
    'portal': '/portal',
    'login-developer': '/login/developer',
    'login-manager': '/login/manager',
    'dev-portal': '/developer',
    'manager-portal': '/manager',
    'privacy-policy': '/privacy-policy',
    'terms-and-conditions': '/terms-and-conditions',
    'cookie-policy': '/cookie-policy'
};

function resolveInitialRoute() {
    const p = window.location.pathname.replace(/\/+$/, '') || '/';
    return PATH_TO_ROUTE[p] || '404';
}

// ============ BACKEND (FastAPI) KÖMƏKÇİLƏRİ ============
const REASONS = [
    { id: 'pr', cat: 'PR_REVIEW_WAIT' },
    { id: 'ci', cat: 'CI_FLAKY' },
    { id: 'meet', cat: 'MEETING_LOAD' },
    { id: 'req', cat: 'UNCLEAR_REQUIREMENTS' },
    { id: 'tool', cat: 'TOOLING' },
    { id: 'break', cat: null }
];

async function api(path, opts = {}) {
    const headers = Object.assign({}, opts.headers || {});
    const r = await fetch(path, Object.assign({}, opts, { headers, credentials: 'same-origin' }));
    if (!r.ok) throw new Error(path + ' ' + r.status);
    return r.json();
}
const postJson = (path, body) => api(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

// Oflayn demo (backend yoxdursa, məsələn GitLab Pages): eyni məntiq brauzerdə
const K_ANON = 5, TEAM_SIZE = 40;
const BLOCKER_META = {
    PR_REVIEW_WAIT: { avg: 74, trend: '+18%' },
    CI_FLAKY: { avg: 52, trend: '+6%' },
    MEETING_LOAD: { avg: 38, trend: '-4%' },
    UNCLEAR_REQUIREMENTS: { avg: 61, trend: '+2%' },
    TOOLING: { avg: 45, trend: '+3%' }
};
const SEED_EVENT = {
    schema: 'contextpulse.ide_event.v1',
    event_id: 'evt_8f31c2a7',
    source: { client: 'vscode-extension', version: '0.4.2' },
    developer_ref: 'dev_a91f',
    emitted_at: '2026-10-09T11:42:42+04:00',
    session: { state: 'idle', last_activity_at: '2026-10-09T11:19:42+04:00', idle_duration_sec: 1380 },
    workspace: { repo: 'payments-service', branch: 'feature/refund-idempotency' },
    last_meaningful_action: { type: 'EDIT_FUNCTION', file: 'src/refunds/processRefund.ts', symbol: 'processRefund', line_range: [48, 71], lines_added: 14, lines_removed: 3, language: 'typescript' },
    diagnostics: { errors: 2, warnings: 1, first_error: { code: 'TS2345', line: 63 } },
    test_state: { runner: 'jest', passed: 18, failed: 1, failing_test: 'rejects duplicate idempotency key' },
    pull_request: { id: 412, title: 'Refund idempotency keys', status: 'changes_requested', unresolved_comments: 3 },
    privacy: { screen_capture: false, keystroke_content: false, source_code_content: false }
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
    const blockers = shown.concat(Array.from({ length: hidden }, (_, i) => ({ group: 'suppressed_' + (i + 1), suppressed: true, reason: 'n<k' })));
    return { org_unit: 'Platform Engineering', period: 'last_7_days', k_threshold: K_ANON, population: { team_size: TEAM_SIZE, respondents: st.respondents }, blockers, suppressed_groups: hidden, insufficient_data: insufficient };
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

function getStoredConsent() {
    try {
        const raw = localStorage.getItem('cp_cookie_consent');
        if (raw) return JSON.parse(raw);
        if (localStorage.getItem('cookieConsentGiven') === 'true') {
            return { decided: true, essential: true, functional: true, updatedAt: new Date().toISOString() };
        }
    } catch (e) { /* ignore */ }
    return { decided: false, essential: true, functional: false, updatedAt: null };
}

function getStoredLang() {
    try {
        const consent = getStoredConsent();
        if (consent.functional) {
            const v = localStorage.getItem('cp_lang');
            if (v === 'az' || v === 'en') return v;
        }
    } catch (e) { /* ignore */ }
    return 'az';
}

function getStoredTheme() {
    try {
        const consent = getStoredConsent();
        if (consent.functional) {
            const v = localStorage.getItem('cp_theme');
            if (v === 'dark' || v === 'light') return v;
        }
    } catch (e) { /* ignore */ }
    return 'dark';
}

// ============ İKONLAR ============
const Ico = ({ d, className = 'w-5 h-5' }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={d} />
    </svg>
);
const IconPulse = ({ className = 'w-5 h-5' }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M3 12h4l3-7 4 14 3-7h4" />
    </svg>
);
const IconTerminal = (p) => <Ico {...p} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />;
const IconUsers = (p) => <Ico {...p} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />;
const IconSun = (p) => <Ico {...p} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />;
const IconMoon = (p) => <Ico {...p} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />;
const IconLock = (p) => <Ico {...p} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />;
const IconShield = (p) => <Ico {...p} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />;
const IconClock = (p) => <Ico {...p} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />;
const IconCheck = (p) => <Ico {...p} d="M5 13l4 4L19 7" />;
const IconAlert = (p) => <Ico {...p} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />;
const IconArrowRight = (p) => <Ico {...p} d="M14 5l7 7m0 0l-7 7m7-7H3" />;
const IconRefresh = (p) => <Ico {...p} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />;

// ============ ORTAQ KOMPONENTLƏR ============
function LivePill({ live, offline }) {
    const { t } = useT();
    const ok = live && !offline;
    return (
        <span className={'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-medium border ' + (ok ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-700 dark:text-emerald-400' : 'bg-amber-500/10 border-amber-500/25 text-amber-700 dark:text-amber-400')}>
            <span className={'w-1.5 h-1.5 rounded-full ' + (ok ? 'bg-emerald-500' : 'bg-amber-500')}></span>
            {offline ? t('offlineDemo') : live ? t('live') : t('connecting')}
        </span>
    );
}

function Stat({ label, value, sub, bump, accent }) {
    return (
        <div className="p-4 bg-slate-50/90 dark:bg-slate-900/70 rounded-2xl border border-slate-200/90 dark:border-slate-800/90 flex flex-col justify-between">
            <span className="text-[11px] uppercase tracking-wider font-mono text-slate-500 dark:text-slate-400">{label}</span>
            <p className={'text-base sm:text-lg font-bold mt-1.5 break-words font-display ' + (accent || 'text-slate-900 dark:text-white')}>
                {value}
                {bump ? <span className="ml-2 px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[11px] font-mono">+{bump}</span> : null}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 break-words font-mono">{sub}</p>
        </div>
    );
}

function RichText({ text }) {
    return (
        <span>
            {String(text).split('`').map((p, i) => i % 2
                ? <code key={i} className="px-1.5 py-0.5 rounded-md bg-sky-500/15 text-sky-700 dark:text-sky-300 font-mono text-[12px] border border-sky-500/20">{p}</code>
                : <span key={i}>{p}</span>)}
        </span>
    );
}

function LangSwitch({ lang, onChange }) {
    const { t } = useT();
    return (
        <div role="group" aria-label={t('langAria')} className="inline-flex items-center bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-0.5">
            {['az', 'en'].map((l) => (
                <button key={l} type="button" onClick={() => onChange(l)} aria-pressed={lang === l}
                    className={'px-2.5 py-1 rounded-lg text-[11px] font-bold font-mono transition-colors ' + (lang === l ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white')}>
                    {l.toUpperCase()}
                </button>
            ))}
        </div>
    );
}

// ============ ƏSAS TƏTBİQ ============
function App() {
    const [consent, setConsent] = useState(getStoredConsent);
    const [showCookieModal, setShowCookieModal] = useState(false);

    const [theme, setTheme] = useState(getStoredTheme);
    const [lang, setLang] = useState(getStoredLang);
    const [currentRoute, setCurrentRoute] = useState(resolveInitialRoute);
    const [userRole, setUserRole] = useState(null); // null | 'employee' | 'manager'
    const [authChecked, setAuthChecked] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const [emailInput, setEmailInput] = useState('');
    const [passwordInput, setPasswordInput] = useState('');
    const [loginError, setLoginError] = useState(false);
    const [loginBusy, setLoginBusy] = useState(false);

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

    // Theme & Language persistence (respecting functional cookie consent)
    useEffect(() => {
        document.documentElement.classList.toggle('dark', theme === 'dark');
        try {
            if (consent.functional) {
                localStorage.setItem('cp_theme', theme);
            } else {
                localStorage.removeItem('cp_theme');
            }
        } catch (e) { /* ignore */ }
    }, [theme, consent.functional]);

    useEffect(() => {
        document.documentElement.lang = lang;
        try {
            if (consent.functional) {
                localStorage.setItem('cp_lang', lang);
            } else {
                localStorage.removeItem('cp_lang');
            }
        } catch (e) { /* ignore */ }
    }, [lang, consent.functional]);

    // Update document title dynamically per route
    useEffect(() => {
        const titles = {
            'home': 'ContextPulse AI — Privacy-First Context Recovery & K-Anonymous Analytics',
            'portal': t('portalTitle') + ' | ContextPulse AI',
            'login-developer': t('loginTitleDev') + ' | ContextPulse AI',
            'login-manager': t('loginTitleMgr') + ' | ContextPulse AI',
            'dev-portal': t('devTitle') + ' | ContextPulse AI',
            'manager-portal': t('mgrTitle') + ' | ContextPulse AI',
            'privacy-policy': t('privacyLink') + ' | ContextPulse AI',
            'terms-and-conditions': t('termsLink') + ' | ContextPulse AI',
            'cookie-policy': t('cookiesLink') + ' | ContextPulse AI',
            '404': t('notFoundTitle') + ' | ContextPulse AI'
        };
        document.title = titles[currentRoute] || titles.home;
    }, [currentRoute, lang]);

    // Browser history popstate listener
    useEffect(() => {
        const onPopState = () => {
            setCurrentRoute(resolveInitialRoute());
            window.scrollTo({ top: 0, behavior: 'smooth' });
        };
        window.addEventListener('popstate', onPopState);
        return () => window.removeEventListener('popstate', onPopState);
    }, []);

    const showToast = (msg) => {
        setToastMsg(msg);
        setTimeout(() => setToastMsg(null), 4200);
    };

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

    const addAnnouncement = (a, notify) => {
        setAnnouncements((cur) => (cur.some((x) => x.id === a.id) ? cur : [a].concat(cur).slice(0, 5)));
        if (notify && roleRef.current === 'employee') showToast(translate(langRef.current, 'newAnnouncementToast'));
    };

    // Initial bootstrap + session check + SSE stream
    useEffect(() => {
        let es = null;
        api('/api/auth/session')
            .then((s) => {
                if (s && s.authenticated && s.role) {
                    setUserRole(s.role);
                }
                setAuthChecked(true);
            })
            .catch(() => {
                setAuthChecked(true);
            });

        api('/api/bootstrap')
            .then((d) => {
                setIdeEvent(d.event);
                teamRef.current = d.team;
                setTeam(d.team);
                setAnnouncements(d.announcements || []);
            })
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

    // Navigation helper with URL pushState and role guard
    const navigateTo = (route) => {
        setMobileMenuOpen(false);
        setLoginError(false);
        let target = route;
        if (route === 'privacy') target = 'privacy-policy';
        if (route === 'terms') target = 'terms-and-conditions';
        if (route === 'cookies') target = 'cookie-policy';

        if (target === 'manager-portal' && userRole !== 'manager') {
            const path = ROUTE_TO_PATH['manager-portal'];
            if (window.location.pathname !== path) window.history.pushState({}, '', path);
            setCurrentRoute('404');
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }
        if (target === 'dev-portal' && userRole !== 'employee') {
            const path = ROUTE_TO_PATH['dev-portal'];
            if (window.location.pathname !== path) window.history.pushState({}, '', path);
            setCurrentRoute('404');
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        const path = ROUTE_TO_PATH[target] || '/';
        if (window.location.pathname !== path) {
            window.history.pushState({}, '', path);
        }
        setCurrentRoute(target);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Enforce route protection when directly visiting /developer or /manager while logged out or wrong role
    const effectiveRoute = (() => {
        if (currentRoute === 'manager-portal' && userRole !== 'manager') return authChecked ? '404' : 'home';
        if (currentRoute === 'dev-portal' && userRole !== 'employee') return authChecked ? '404' : 'home';
        return currentRoute;
    })();

    // Manager operations
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

    const handleResetDemo = () => {
        if (offline) {
            offlineState.current = { counts: { PR_REVIEW_WAIT: 8, CI_FLAKY: 6, MEETING_LOAD: 5, UNCLEAR_REQUIREMENTS: 5, TOOLING: 2 }, respondents: 26, actions: {} };
            applyTeam(localTeam(offlineState.current));
            setAnnouncements([]);
            showToast(t('demoResetDone'));
            return Promise.resolve(true);
        }
        return postJson('/api/demo/reset', {})
            .then(() => { showToast(t('demoResetDone')); return true; })
            .catch(() => { showToast(t('serverFail')); return false; });
    };

    // AI reminder
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

    // Login & Logout with server session + offline fallback
    const handleLoginSubmit = async (e, targetRole) => {
        e.preventDefault();
        const mail = sanitizeInput(emailInput).trim().toLowerCase();
        const pass = sanitizeInput(passwordInput).trim();
        setLoginBusy(true);
        setLoginError(false);

        if (!offline) {
            try {
                const res = await postJson('/api/auth/login', { email: mail, password: pass, role: targetRole });
                if (res && res.authenticated) {
                    setUserRole(res.role);
                    setEmailInput('');
                    setPasswordInput('');
                    setLoginBusy(false);
                    const dest = res.role === 'manager' ? 'manager-portal' : 'dev-portal';
                    const path = ROUTE_TO_PATH[dest];
                    window.history.pushState({}, '', path);
                    setCurrentRoute(dest);
                    showToast(t(res.role === 'manager' ? 'loginOkMgr' : 'loginOkDev'));
                    return;
                }
            } catch (err) {
                setLoginBusy(false);
                setLoginError(true);
                return;
            }
        }

        // Offline fallback validation
        const okDev = targetRole === 'employee' && mail === 'dev@company.com' && pass === 'emp123';
        const okMgr = targetRole === 'manager' && mail === 'manager@company.com' && pass === 'admin123';
        setLoginBusy(false);
        if (okDev || okMgr) {
            const r = okMgr ? 'manager' : 'employee';
            setUserRole(r);
            setEmailInput('');
            setPasswordInput('');
            const dest = okMgr ? 'manager-portal' : 'dev-portal';
            const path = ROUTE_TO_PATH[dest];
            window.history.pushState({}, '', path);
            setCurrentRoute(dest);
            showToast(t(okMgr ? 'loginOkMgr' : 'loginOkDev'));
        } else {
            setLoginError(true);
        }
    };

    const handleLogout = () => {
        if (!offline) {
            postJson('/api/auth/logout', {}).catch(() => {});
        }
        setUserRole(null);
        setIsIdleModalOpen(false);
        window.history.pushState({}, '', '/');
        setCurrentRoute('home');
        showToast(t('logoutToast'));
    };

    // Cookie consent handlers
    const saveConsentChoice = (functionalAllowed) => {
        const next = {
            decided: true,
            essential: true,
            functional: Boolean(functionalAllowed),
            updatedAt: new Date().toISOString()
        };
        try {
            localStorage.setItem('cp_cookie_consent', JSON.stringify(next));
            localStorage.setItem('cookieConsentGiven', 'true');
            if (!functionalAllowed) {
                localStorage.removeItem('cp_lang');
                localStorage.removeItem('cp_theme');
            } else {
                localStorage.setItem('cp_lang', lang);
                localStorage.setItem('cp_theme', theme);
            }
        } catch (e) { /* ignore */ }
        setConsent(next);
        setShowCookieModal(false);
        showToast(t('cookieSaved'));
    };

    // Record away reason
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
        setIsIdleModalOpen(false);
        setSelectedReason('');
        showToast(t('recorded'));
    };

    const ownPanelRoute = userRole === 'manager' ? 'manager-portal' : userRole === 'employee' ? 'dev-portal' : null;

    return (
        <LangCtx.Provider value={ctx}>
        <div className="min-h-screen flex flex-col justify-between relative bg-grid-pattern">
            {/* Toast Notification */}
            {toastMsg && (
                <div role="status" aria-live="polite" className="fixed top-5 right-5 z-50 bg-slate-900 dark:bg-slate-900 border border-sky-500/40 text-sky-200 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 max-w-sm">
                    <span className="w-2 h-2 bg-sky-400 rounded-full shrink-0"></span>
                    <span className="text-xs sm:text-sm font-medium leading-snug">{toastMsg}</span>
                </div>
            )}

            {/* Top Navigation Header */}
            <header className="border-b border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-[#090d16]/90 backdrop-blur-md sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-3">
                    {/* Brand Logo */}
                    <div className="flex items-center gap-3">
                        <button type="button" onClick={() => navigateTo('home')} className="flex items-center gap-3 text-left group cursor-pointer">
                            <div className="bg-gradient-to-br from-sky-500 to-sky-700 p-2.5 rounded-xl text-white shadow-md shadow-sky-600/20 group-hover:from-sky-400 group-hover:to-sky-600 transition-all">
                                <IconPulse className="w-5 h-5" />
                            </div>
                            <div>
                                <span className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 dark:text-white font-display block leading-none">ContextPulse AI</span>
                                <span className="text-[10px] uppercase font-mono text-sky-600 dark:text-sky-400 tracking-wider block mt-1">{t('brandSub')}</span>
                            </div>
                        </button>
                    </div>

                    {/* Desktop Navigation Links */}
                    <nav aria-label="Main Navigation" className="hidden md:flex items-center gap-1">
                        <button type="button" onClick={() => navigateTo('home')}
                            className={'px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors ' + (effectiveRoute === 'home' ? 'bg-slate-100 dark:bg-slate-800/90 text-sky-600 dark:text-sky-400' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900')}>
                            {t('navHome')}
                        </button>
                        <button type="button" onClick={() => navigateTo('privacy-policy')}
                            className={'px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors ' + (effectiveRoute === 'privacy-policy' ? 'bg-slate-100 dark:bg-slate-800/90 text-sky-600 dark:text-sky-400' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900')}>
                            {t('navPrivacy')}
                        </button>
                        {!userRole ? (
                            <button type="button" onClick={() => navigateTo('portal')}
                                className={'ml-1 px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ' + (['portal', 'login-developer', 'login-manager'].includes(effectiveRoute) ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20' : 'bg-slate-900 dark:bg-sky-500/15 text-white dark:text-sky-300 border border-transparent dark:border-sky-500/30 hover:bg-slate-800 dark:hover:bg-sky-500/25')}>
                                <IconLock className="w-3.5 h-3.5" />
                                <span>{t('navPortal')}</span>
                            </button>
                        ) : (
                            <div className="flex items-center gap-2 ml-1">
                                <button type="button" onClick={() => navigateTo(ownPanelRoute)}
                                    className={'px-4 py-2 rounded-xl text-xs font-bold transition-all ' + (effectiveRoute === ownPanelRoute ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20' : 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/25 hover:bg-sky-500/20')}>
                                    {userRole === 'manager' ? t('mgrPanel') : t('devPanel')}
                                </button>
                                <button type="button" onClick={handleLogout}
                                    className="px-3.5 py-2 bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 rounded-xl text-xs font-semibold transition-colors">
                                    {t('logout')}
                                </button>
                            </div>
                        )}
                    </nav>

                    {/* Right Utility Controls */}
                    <div className="flex items-center gap-2">
                        <div className="hidden sm:block">
                            <LivePill live={live} offline={offline} />
                        </div>
                        <LangSwitch lang={lang} onChange={setLang} />
                        <button type="button" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label={t('themeAria')}
                            className="p-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                            {theme === 'dark' ? <IconSun className="w-4 h-4 text-amber-400" /> : <IconMoon className="w-4 h-4 text-slate-700" />}
                        </button>
                        {/* Mobile Menu Toggle */}
                        <button type="button" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Menu" aria-expanded={mobileMenuOpen}
                            className="md:hidden p-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 rounded-xl">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {mobileMenuOpen
                                    ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />}
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation Drawer */}
                {mobileMenuOpen && (
                    <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f1623] px-4 py-4 space-y-2">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                            <LivePill live={live} offline={offline} />
                        </div>
                        <button type="button" onClick={() => navigateTo('home')} className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 block">
                            {t('navHome')}
                        </button>
                        <button type="button" onClick={() => navigateTo('privacy-policy')} className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 block">
                            {t('navPrivacy')}
                        </button>
                        {!userRole ? (
                            <button type="button" onClick={() => navigateTo('portal')} className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold bg-sky-600 text-white block">
                                {t('navPortal')}
                            </button>
                        ) : (
                            <>
                                <button type="button" onClick={() => navigateTo(ownPanelRoute)} className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold bg-sky-600 text-white block">
                                    {userRole === 'manager' ? t('mgrPanel') : t('devPanel')}
                                </button>
                                <button type="button" onClick={handleLogout} className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-500/10 block">
                                    {t('logout')}
                                </button>
                            </>
                        )}
                    </div>
                )}
            </header>

            {/* Main Content Router */}
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
                {effectiveRoute === 'home' && (
                    <HomeView userRole={userRole} onNavigate={navigateTo} />
                )}
                {effectiveRoute === 'portal' && (
                    <PortalEntryView userRole={userRole} onNavigate={navigateTo} onLogout={handleLogout} />
                )}
                {effectiveRoute === 'login-developer' && (
                    <DedicatedLoginPage
                        roleType="employee"
                        userRole={userRole}
                        emailInput={emailInput}
                        setEmailInput={setEmailInput}
                        passwordInput={passwordInput}
                        setPasswordInput={setPasswordInput}
                        loginError={loginError}
                        loginBusy={loginBusy}
                        onSubmit={(e) => handleLoginSubmit(e, 'employee')}
                        onNavigate={navigateTo}
                    />
                )}
                {effectiveRoute === 'login-manager' && (
                    <DedicatedLoginPage
                        roleType="manager"
                        userRole={userRole}
                        emailInput={emailInput}
                        setEmailInput={setEmailInput}
                        passwordInput={passwordInput}
                        setPasswordInput={setPasswordInput}
                        loginError={loginError}
                        loginBusy={loginBusy}
                        onSubmit={(e) => handleLoginSubmit(e, 'manager')}
                        onNavigate={navigateTo}
                    />
                )}
                {effectiveRoute === 'dev-portal' && (
                    <DevPortalView
                        awayHistory={awayHistory}
                        event={ideEvent}
                        live={live}
                        offline={offline}
                        team={team}
                        announcements={announcements}
                        onTriggerIdle={openIdle}
                    />
                )}
                {effectiveRoute === 'manager-portal' && (
                    <ManagerPortalView
                        team={team}
                        bumps={bumps}
                        live={live}
                        offline={offline}
                        announcements={announcements}
                        onSaveAction={saveAction}
                        onSend={sendAnnouncement}
                        onResetDemo={handleResetDemo}
                    />
                )}
                {effectiveRoute === 'privacy-policy' && (
                    <PrivacyPolicyPage onNavigate={navigateTo} />
                )}
                {effectiveRoute === 'terms-and-conditions' && (
                    <TermsAndConditionsPage onNavigate={navigateTo} />
                )}
                {effectiveRoute === 'cookie-policy' && (
                    <CookiePolicyPage consent={consent} onOpenCookieModal={() => setShowCookieModal(true)} onNavigate={navigateTo} />
                )}
                {effectiveRoute === '404' && (
                    <Custom404Page userRole={userRole} onNavigate={navigateTo} />
                )}
            </main>

            {/* Break / Idle Simulation Modal */}
            {isIdleModalOpen && (
                <div role="dialog" aria-modal="true" aria-labelledby="idle-modal-title" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm">
                    <div className="surface-card rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative border border-slate-200 dark:border-slate-800">
                        <div className="flex items-start justify-between gap-3 mb-2">
                            <h3 id="idle-modal-title" className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white font-display">{t('idleTitle')}</h3>
                            <button type="button" onClick={() => setIsIdleModalOpen(false)} aria-label={t('close')} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1">✕</button>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-5 leading-relaxed">{t('idleText')}</p>
                        {reminder && (
                            <div className="mb-6 p-4 rounded-2xl bg-sky-500/10 border border-sky-500/25">
                                <div className="flex items-center justify-between gap-2 mb-2">
                                    <p className="text-[11px] uppercase font-mono font-semibold text-sky-700 dark:text-sky-400">{t('whereLeft')}</p>
                                    {!reminder.loading && (
                                        <span className="px-2 py-0.5 rounded-md bg-sky-500/15 text-sky-700 dark:text-sky-300 text-[10px] font-mono">
                                            {t('badge_' + reminder.code)}
                                        </span>
                                    )}
                                </div>
                                {reminder.loading ? (
                                    <p className="text-xs text-slate-600 dark:text-slate-300 animate-pulse font-mono py-2">{t('aiReading')}</p>
                                ) : (
                                    <p className="text-sm leading-relaxed text-slate-800 dark:text-slate-100"><RichText text={reminder.text} /></p>
                                )}
                            </div>
                        )}
                        <div className="space-y-2 mb-6">
                            <label htmlFor="break-reason-select" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">{t('pickReason')}</label>
                            <select id="break-reason-select" value={selectedReason} onChange={(e) => setSelectedReason(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-sky-500">
                                <option value="">{t('selectPh')}</option>
                                {REASONS.map((r) => (<option key={r.id} value={r.id}>{t('reason_' + r.id)}</option>))}
                            </select>
                        </div>
                        <div className="flex items-center justify-end gap-3">
                            <button type="button" onClick={() => setIsIdleModalOpen(false)} className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-xs font-semibold transition-colors">{t('close')}</button>
                            <button type="button" onClick={handleRecordAway} disabled={!selectedReason} className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-600/20 transition-all">{t('record')}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Shared Footer with Legal Links & Persistent Cookie Settings */}
            <footer className="border-t border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-[#090d16]/90 py-8 mt-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-2.5">
                        <div className="w-2 h-2 rounded-full bg-sky-500"></div>
                        <p>{t('footerCopy')}</p>
                    </div>
                    <nav aria-label="Legal and Privacy Navigation" className="flex flex-wrap justify-center items-center gap-x-6 gap-y-2 font-medium">
                        <a href="/privacy-policy" onClick={(e) => { e.preventDefault(); navigateTo('privacy-policy'); }} className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors">{t('privacyLink')}</a>
                        <a href="/terms-and-conditions" onClick={(e) => { e.preventDefault(); navigateTo('terms-and-conditions'); }} className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors">{t('termsLink')}</a>
                        <a href="/cookie-policy" onClick={(e) => { e.preventDefault(); navigateTo('cookie-policy'); }} className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors">{t('cookiesLink')}</a>
                        <button type="button" onClick={() => setShowCookieModal(true)} className="text-sky-600 dark:text-sky-400 hover:underline font-mono text-[11px]">
                            ⚙ {t('cookieSettingsBtn')}
                        </button>
                    </nav>
                </div>
            </footer>

            {/* Non-blocking Cookie Consent Banner or Modal */}
            {(!consent.decided || showCookieModal) && (
                <CookieConsentManager
                    consent={consent}
                    isModal={showCookieModal}
                    onAcceptAll={() => saveConsentChoice(true)}
                    onRejectOptional={() => saveConsentChoice(false)}
                    onSaveCustom={(funcAllowed) => saveConsentChoice(funcAllowed)}
                    onOpenCustomize={() => setShowCookieModal(true)}
                    onCloseModal={() => setShowCookieModal(false)}
                    onReadPolicy={() => { setShowCookieModal(false); navigateTo('cookie-policy'); }}
                />
            )}
        </div>
        </LangCtx.Provider>
    );
}

// ============ COOKIE CONSENT MANAGER (PHASE 9) ============
function CookieConsentManager({ consent, isModal, onAcceptAll, onRejectOptional, onSaveCustom, onOpenCustomize, onCloseModal, onReadPolicy }) {
    const { t } = useT();
    const [funcEnabled, setFuncEnabled] = useState(consent.decided ? consent.functional : true);

    if (isModal) {
        return (
            <div role="dialog" aria-modal="true" aria-labelledby="cookie-modal-title" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm">
                <div className="surface-card rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <h3 id="cookie-modal-title" className="text-lg font-bold text-slate-900 dark:text-white font-display">{t('cookieTitle')}</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{t('cookieText')}</p>
                        </div>
                        {consent.decided && (
                            <button type="button" onClick={onCloseModal} aria-label={t('close')} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1">✕</button>
                        )}
                    </div>

                    <div className="space-y-3">
                        {/* Essential */}
                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3">
                            <div>
                                <p className="text-xs font-bold text-slate-900 dark:text-white">{t('cookieEssentialTitle')}</p>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{t('cookieEssentialDesc')}</p>
                            </div>
                            <input type="checkbox" checked disabled aria-label={t('cookieEssentialTitle')} className="mt-1 h-4 w-4 accent-sky-600 rounded" />
                        </div>

                        {/* Functional */}
                        <label className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3 cursor-pointer">
                            <div>
                                <p className="text-xs font-bold text-slate-900 dark:text-white">{t('cookieFuncTitle')}</p>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{t('cookieFuncDesc')}</p>
                            </div>
                            <input type="checkbox" checked={funcEnabled} onChange={(e) => setFuncEnabled(e.target.checked)} className="mt-1 h-4 w-4 accent-sky-600 rounded" />
                        </label>

                        {/* Analytics (None used) */}
                        <div className="p-4 rounded-2xl bg-slate-50/60 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3 opacity-75">
                            <div>
                                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{t('cookieAnalyticsTitle')}</p>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{t('cookieAnalyticsDesc')}</p>
                            </div>
                            <input type="checkbox" checked={false} disabled aria-label={t('cookieAnalyticsTitle')} className="mt-1 h-4 w-4 rounded" />
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                        <button type="button" onClick={onReadPolicy} className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline">
                            {t('readMore')}
                        </button>
                        <div className="flex flex-wrap items-center gap-2">
                            <button type="button" onClick={onRejectOptional} className="px-3.5 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs rounded-xl transition-colors">
                                {t('rejectNonEssential')}
                            </button>
                            <button type="button" onClick={() => onSaveCustom(funcEnabled)} className="px-3.5 py-2 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl transition-colors">
                                {t('savePreferences')}
                            </button>
                            <button type="button" onClick={onAcceptAll} className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow-md transition-colors">
                                {t('acceptAll')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <aside aria-label={t('cookieTitle')} className="fixed bottom-4 left-4 right-4 md:left-6 md:right-6 lg:left-auto lg:right-8 lg:max-w-xl z-40 p-5 surface-card rounded-2xl shadow-2xl border border-sky-500/30">
            <div className="flex flex-col gap-3">
                <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white font-display">{t('cookieTitle')}</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">{t('cookieText')}</p>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <button type="button" onClick={onReadPolicy} className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline">
                        {t('readMore')}
                    </button>
                    <div className="flex flex-wrap items-center gap-2">
                        <button type="button" onClick={onRejectOptional} className="px-3.5 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs rounded-xl transition-colors">
                            {t('rejectNonEssential')}
                        </button>
                        <button type="button" onClick={onOpenCustomize} className="px-3.5 py-2 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl transition-colors">
                            {t('customizeCookies')}
                        </button>
                        <button type="button" onClick={onAcceptAll} className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow-sm transition-colors">
                            {t('acceptAll')}
                        </button>
                    </div>
                </div>
            </div>
        </aside>
    );
}

// ============ ANA SƏHİFƏ (PUBLIC LANDING PAGE — PHASE 2, 3, 5) ============
function HomeView({ userRole, onNavigate }) {
    const { t } = useT();
    const ownPanelRoute = userRole === 'manager' ? 'manager-portal' : userRole === 'employee' ? 'dev-portal' : 'portal';

    const features = [
        {
            kind: 'spy',
            badge: t('featSpyBadge'),
            title: t('featSpyTitle'),
            text: t('featSpyText'),
            icon: <IconShield className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />,
            accent: 'border-cyan-500/20 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300'
        },
        {
            kind: 're',
            badge: t('featReBadge'),
            title: t('featReTitle'),
            text: t('featReText'),
            icon: <IconClock className="w-5 h-5 text-sky-600 dark:text-sky-400" />,
            accent: 'border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300'
        },
        {
            kind: 'k',
            badge: t('featKBadge'),
            title: t('featKTitle'),
            text: t('featKText'),
            icon: <IconUsers className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
            accent: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
        }
    ];

    const sampleSchema = `{
  "schema": "contextpulse.ide_event.v1",
  "developer_ref": "dev_a91f",
  "workspace": { "repo": "payments-service", "branch": "feature/refund-idempotency" },
  "last_meaningful_action": {
    "type": "EDIT_FUNCTION",
    "file": "src/refunds/processRefund.ts",
    "symbol": "processRefund",
    "line_range": [48, 71]
  },
  "diagnostics": { "errors": 2, "first_error": { "code": "TS2345", "line": 63 } },
  "test_state": { "runner": "jest", "passed": 18, "failed": 1 },
  "pull_request": { "id": 412, "status": "changes_requested", "unresolved_comments": 3 },
  "privacy": {
    "screen_capture": false,
    "keystroke_content": false,
    "source_code_content": false
  }
}`;

    return (
        <div className="space-y-16 sm:space-y-24 py-4 sm:py-8">
            {/* Hero Section */}
            <section className="text-center max-w-4xl mx-auto space-y-6">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/25 text-sky-700 dark:text-sky-300 text-xs font-mono font-medium">
                    <IconShield className="w-3.5 h-3.5" />
                    <span>{t('homeBadge')}</span>
                </div>
                <h1 className="text-3xl sm:text-5xl lg:text-[52px] font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15] font-display">
                    {t('homeTitle')}
                </h1>
                <p className="text-sm sm:text-base lg:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl mx-auto">
                    {t('homeSub')}
                </p>

                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    <button type="button" onClick={() => navigateTo(ownPanelRoute)}
                        className="px-6 py-3.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs sm:text-sm shadow-lg shadow-sky-600/20 transition-all inline-flex items-center gap-2 cursor-pointer">
                        <span>{userRole ? (userRole === 'manager' ? t('goMgr') : t('goDev')) : t('heroCtaPortal')}</span>
                        <IconArrowRight className="w-4 h-4" />
                    </button>
                    <a href="#architecture-section"
                        className="px-6 py-3.5 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 font-semibold rounded-xl text-xs sm:text-sm transition-colors">
                        {t('heroCtaPrimary')}
                    </a>
                </div>

                {/* Verified Architecture Strip */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-6 text-left">
                    <div className="surface-card p-4 rounded-2xl">
                        <span className="text-[10px] uppercase font-mono text-slate-500 dark:text-slate-400 block">{t('heroMeta1Label')}</span>
                        <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white font-mono mt-1 block">{t('heroMeta1Val')}</span>
                    </div>
                    <div className="surface-card p-4 rounded-2xl">
                        <span className="text-[10px] uppercase font-mono text-slate-500 dark:text-slate-400 block">{t('heroMeta2Label')}</span>
                        <span className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-1 block">{t('heroMeta2Val')}</span>
                    </div>
                    <div className="surface-card p-4 rounded-2xl">
                        <span className="text-[10px] uppercase font-mono text-slate-500 dark:text-slate-400 block">{t('heroMeta3Label')}</span>
                        <span className="text-xs sm:text-sm font-bold text-sky-600 dark:text-sky-400 font-mono mt-1 block">{t('heroMeta3Val')}</span>
                    </div>
                    <div className="surface-card p-4 rounded-2xl">
                        <span className="text-[10px] uppercase font-mono text-slate-500 dark:text-slate-400 block">{t('heroMeta4Label')}</span>
                        <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white font-mono mt-1 block">{t('heroMeta4Val')}</span>
                    </div>
                </div>
            </section>

            {/* Core Verified Capabilities (Phase 5 accurate claims) */}
            <section className="space-y-8">
                <div className="text-center max-w-2xl mx-auto space-y-2">
                    <span className="text-[11px] font-mono uppercase tracking-widest text-sky-600 dark:text-sky-400 font-semibold">{t('featSectionTag')}</span>
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white font-display">{t('featSectionTitle')}</h2>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{t('featSectionSub')}</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {features.map((it) => (
                        <div key={it.kind} className="feature-card rounded-2xl p-6 flex flex-col justify-between space-y-4">
                            <div className="space-y-3">
                                <div className="flex items-center justify-between gap-2">
                                    <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/90">{it.icon}</div>
                                    <span className={'px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold border ' + it.accent}>{it.badge}</span>
                                </div>
                                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-display">{it.title}</h3>
                                <p className="text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-300">{it.text}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Closed-Loop Architecture Workflow */}
            <section id="architecture-section" className="surface-card rounded-3xl p-6 sm:p-10 space-y-8">
                <div className="max-w-2xl space-y-2">
                    <span className="text-[11px] font-mono uppercase tracking-widest text-sky-600 dark:text-sky-400 font-semibold">{t('loopTag')}</span>
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white font-display">{t('loopTitle')}</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 space-y-2">
                        <span className="inline-block px-2.5 py-1 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 font-mono text-xs font-bold">01 · IDE & PR</span>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">{t('loopStep1Title')}</h3>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{t('loopStep1Text')}</p>
                    </div>
                    <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 space-y-2">
                        <span className="inline-block px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-xs font-bold">02 · K = 5</span>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">{t('loopStep2Title')}</h3>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{t('loopStep2Text')}</p>
                    </div>
                    <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 space-y-2">
                        <span className="inline-block px-2.5 py-1 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-mono text-xs font-bold">03 · LIVE SSE</span>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">{t('loopStep3Title')}</h3>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{t('loopStep3Text')}</p>
                    </div>
                </div>
            </section>

            {/* Technical Schema & Known Limitations (README Transparency) */}
            <section className="space-y-8">
                <div className="max-w-2xl space-y-2">
                    <span className="text-[11px] font-mono uppercase tracking-widest text-sky-600 dark:text-sky-400 font-semibold">{t('schemaTag')}</span>
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white font-display">{t('schemaTitle')}</h2>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{t('schemaSub')}</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="surface-card rounded-2xl p-6 space-y-3 overflow-hidden">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white font-mono">{t('schemaBoxTitle')}</h3>
                            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-mono">extra=&quot;forbid&quot;</span>
                        </div>
                        <pre className="p-4 rounded-xl bg-slate-900 text-slate-100 text-[11px] font-mono overflow-x-auto leading-relaxed border border-slate-800">
                            {sampleSchema}
                        </pre>
                    </div>

                    <div className="surface-card rounded-2xl p-6 flex flex-col justify-between space-y-4">
                        <div className="space-y-4">
                            <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">{t('limitsBoxTitle')}</h3>
                            <ul className="space-y-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                                {[t('limit1'), t('limit2'), t('limit3'), t('limit4')].map((lim, idx) => (
                                    <li key={idx} className="flex items-start gap-2.5">
                                        <span className="mt-1 w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0"></span>
                                        <span className="leading-relaxed">{lim}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                            <span className="text-xs text-slate-500 dark:text-slate-400">{t('portalSub')}</span>
                            <button type="button" onClick={() => navigateTo(ownPanelRoute)}
                                className="shrink-0 px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs transition-colors">
                                {t('navPortal')}
                            </button>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

// ============ PORTAL ENTRY & DEDICATED LOGIN VIEWS (PHASE 3) ============
function PortalEntryView({ userRole, onNavigate, onLogout }) {
    const { t } = useT();
    return (
        <div className="py-8 max-w-4xl mx-auto space-y-8">
            <div className="text-center space-y-3">
                <span className="px-3.5 py-1 rounded-full bg-sky-500/10 border border-sky-500/25 text-sky-600 dark:text-sky-400 text-xs font-mono font-semibold">
                    {t('portalBadge')}
                </span>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white font-display">{t('portalTitle')}</h1>
                <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">{t('portalSub')}</p>
            </div>

            {userRole && (
                <div className="p-4 rounded-2xl bg-sky-500/10 border border-sky-500/25 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-sky-800 dark:text-sky-200">
                    <span>{t('switchRoleHint')}</span>
                    <button type="button" onClick={onLogout} className="px-3.5 py-1.5 bg-rose-500/15 text-rose-600 dark:text-rose-300 rounded-lg font-bold shrink-0">
                        {t('logout')}
                    </button>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Employee Role Entry Card */}
                <div className={'surface-card p-6 sm:p-8 rounded-3xl flex flex-col justify-between space-y-6 ' + (userRole === 'manager' ? 'opacity-60' : '')}>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="p-3 bg-sky-500/10 text-sky-600 dark:text-sky-400 rounded-2xl"><IconTerminal className="w-6 h-6" /></div>
                            <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-mono">/login/developer</span>
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white font-display">{t('devCardTitle')}</h2>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{t('devCardText')}</p>
                    </div>
                    {userRole === 'employee' ? (
                        <button type="button" onClick={() => onNavigate('dev-portal')} className="w-full py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md shadow-sky-600/20 transition-all">
                            {t('goDev')}
                        </button>
                    ) : (
                        <button type="button" disabled={userRole === 'manager'} onClick={() => onNavigate('login-developer')}
                            className="w-full py-3 bg-slate-900 dark:bg-sky-600 hover:bg-slate-800 dark:hover:bg-sky-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs sm:text-sm transition-all">
                            {t('loginDev')}
                        </button>
                    )}
                </div>

                {/* Manager Role Entry Card */}
                <div className={'surface-card p-6 sm:p-8 rounded-3xl flex flex-col justify-between space-y-6 ' + (userRole === 'employee' ? 'opacity-60' : '')}>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl"><IconUsers className="w-6 h-6" /></div>
                            <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-mono">/login/manager</span>
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white font-display">{t('mgrCardTitle')}</h2>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{t('mgrCardText')}</p>
                    </div>
                    {userRole === 'manager' ? (
                        <button type="button" onClick={() => onNavigate('manager-portal')} className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md shadow-emerald-600/20 transition-all">
                            {t('goMgr')}
                        </button>
                    ) : (
                        <button type="button" disabled={userRole === 'employee'} onClick={() => onNavigate('login-manager')}
                            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs sm:text-sm transition-all">
                            {t('loginMgr')}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

function DedicatedLoginPage({ roleType, userRole, emailInput, setEmailInput, passwordInput, setPasswordInput, loginError, loginBusy, onSubmit, onNavigate }) {
    const { t } = useT();
    const isMgr = roleType === 'manager';
    const demoMail = isMgr ? 'manager@company.com' : 'dev@company.com';
    const demoPass = isMgr ? 'admin123' : 'emp123';

    const autofillDemo = () => {
        setEmailInput(demoMail);
        setPasswordInput(demoPass);
    };

    return (
        <div className="py-8 max-w-md mx-auto">
            <div className="surface-card rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
                <div className="flex items-center justify-between">
                    <div className={'p-3 rounded-2xl ' + (isMgr ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-sky-500/10 text-sky-600 dark:text-sky-400')}>
                        {isMgr ? <IconUsers className="w-6 h-6" /> : <IconTerminal className="w-6 h-6" />}
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-mono text-slate-500">
                        {isMgr ? 'Role: Manager' : 'Role: Employee'}
                    </span>
                </div>

                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white font-display">
                        {isMgr ? t('loginTitleMgr') : t('loginTitleDev')}
                    </h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t('loginSub')}</p>
                </div>

                <form onSubmit={onSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="login-email" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">{t('email')}</label>
                        <input id="login-email" type="email" required autoComplete="username" value={emailInput} onChange={(e) => setEmailInput(e.target.value)}
                            placeholder={demoMail}
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-sky-500 font-mono" />
                    </div>
                    <div>
                        <label htmlFor="login-password" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">{t('password')}</label>
                        <input id="login-password" type="password" required autoComplete="current-password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)}
                            placeholder="••••••••"
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-sky-500 font-mono" />
                    </div>

                    {loginError && (
                        <div role="alert" className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-xs text-rose-600 dark:text-rose-400 font-medium">
                            {t('loginErr')}
                        </div>
                    )}

                    <div className="p-3.5 bg-sky-500/10 border border-sky-500/20 rounded-xl text-xs text-sky-800 dark:text-sky-300 space-y-2 font-mono">
                        <div className="flex items-center justify-between">
                            <span className="font-bold">{t('demoCreds')}</span>
                            <button type="button" onClick={autofillDemo} className="underline text-[11px] font-sans font-semibold hover:text-sky-500">
                                {t('fillDemoBtn')}
                            </button>
                        </div>
                        <p>Email: <b>{demoMail}</b> | {t('password')}: <b>{demoPass}</b></p>
                    </div>

                    <div className="flex items-center justify-between gap-3 pt-2">
                        <button type="button" onClick={() => onNavigate('portal')} className="px-4 py-2.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-colors">
                            {t('cancel')}
                        </button>
                        <button type="submit" disabled={loginBusy} className="px-6 py-2.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-600/20 transition-all">
                            {t('submit')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ============ İŞÇİ PANELİ (DEVELOPER PANEL — PHASE 4) ============
function DevPortalView({ awayHistory, event, live, offline, team, announcements, onTriggerIdle }) {
    const { t, lang } = useT();
    const loc = lang === 'az' ? 'az-AZ' : 'en-GB';
    const a = event && event.last_meaningful_action;
    const ws = event && event.workspace;
    const sess = event && event.session;

    return (
        <div className="space-y-8">
            {/* Top Header Bar */}
            <div className="surface-card p-6 sm:p-8 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                        <span className="px-2.5 py-0.5 rounded-md bg-sky-500/10 text-sky-600 dark:text-sky-400 font-mono text-[11px] font-semibold">
                            {event ? event.developer_ref : 'dev_a91f'}
                        </span>
                        {ws && (
                            <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                                {ws.repo} · <code className="text-sky-600 dark:text-sky-400">{ws.branch}</code>
                            </span>
                        )}
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white font-display">{t('devTitle')}</h1>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">{t('devSub')}</p>
                </div>
                <button type="button" onClick={onTriggerIdle}
                    className="px-5 py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-2xl text-xs sm:text-sm shadow-lg shadow-sky-600/20 transition-all cursor-pointer flex items-center gap-2 shrink-0">
                    <IconClock className="w-4 h-4" />
                    <span>{t('simBtn')}</span>
                </button>
            </div>

            {/* Live IDE Telemetry Cards */}
            <div className="surface-card p-6 sm:p-8 rounded-3xl space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-display">{t('liveTitle')}</h2>
                        {sess && (
                            <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                                {t('sessionLabel')}: <span className="text-amber-600 dark:text-amber-400 font-semibold">{sess.state}</span> · {t('idleSecLabel')}: {Math.round((sess.idle_duration_sec || 0) / 60)} {t('min')}
                            </p>
                        )}
                    </div>
                    <LivePill live={live} offline={offline} />
                </div>

                {!event ? (
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono py-4">{t('loading')}</p>
                ) : (
                    <div key={event.event_id} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Stat
                            label={t('file')}
                            value={a.file.split('/').pop()}
                            sub={`${a.symbol}() · ${t('linesRange')} ${a.line_range[0]}–${a.line_range[1]} (+${a.lines_added} / -${a.lines_removed})`}
                        />
                        <Stat
                            label={t('firstErr')}
                            value={event.diagnostics.first_error.code}
                            sub={`${t('line')} ${event.diagnostics.first_error.line} · ${event.diagnostics.errors} ${t('errorsWord')}`}
                            accent="text-rose-600 dark:text-rose-400"
                        />
                        <Stat
                            label={t('tests')}
                            value={`${event.test_state.passed} ${t('passed')} / ${event.test_state.failed} ${t('failed')}`}
                            sub={`${event.test_state.runner}: ${event.test_state.failing_test}`}
                            accent={event.test_state.failed > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}
                        />
                        <Stat
                            label={t('pr')}
                            value={`PR #${event.pull_request.id}`}
                            sub={`${event.pull_request.unresolved_comments} ${t('unresolved')} · ${event.pull_request.status}`}
                        />
                    </div>
                )}

                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    <span>event_id: {event ? event.event_id : '-'} · developer_ref: {event ? event.developer_ref : '-'}</span>
                    <span className="text-emerald-600 dark:text-emerald-400">✓ {t('privacyLine')}</span>
                </div>
            </div>

            {/* Two-Column Lower Section: Team Announcements/Actions & Personal Break History */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <TeamNews team={team} announcements={announcements} />

                <div className="surface-card p-6 sm:p-8 rounded-3xl space-y-4">
                    <div>
                        <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-display flex items-center gap-2">
                            <IconClock className="w-5 h-5 text-sky-500" />
                            <span>{t('historyTitle')}</span>
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t('historySub')}</p>
                    </div>
                    <div className="space-y-3">
                        {awayHistory.map((item) => (
                            <div key={item.id} className="p-4 bg-slate-50 dark:bg-slate-900/70 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div>
                                    <span className="text-[11px] font-mono text-sky-600 dark:text-sky-400 font-semibold block">
                                        {new Date(item.iso).toLocaleString(loc, { hour12: false })}
                                    </span>
                                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{t('reason_' + item.reasonId)}</p>
                                </div>
                                <span className="px-3 py-1 bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-mono rounded-full w-fit shrink-0">
                                    {t('duration')}: {item.minutes} {t('min')}{item.sim ? ' ' + t('simSuffix') : ''}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ============ MENECER PANELİ (MANAGER PANEL — PHASE 4) ============
const ACTION_STATUSES = ['investigating', 'planned', 'resolved'];
const fmtTime = (iso, lang) => { try { return new Date(iso).toLocaleTimeString(lang === 'az' ? 'az-AZ' : 'en-GB', { hour: '2-digit', minute: '2-digit' }); } catch (e) { return ''; } };
const inputCls = 'w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-sky-500';

function StatusBadge({ status }) {
    const { t } = useT();
    const cls = {
        investigating: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
        planned: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30',
        resolved: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
    }[status] || 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-transparent';
    return <span className={'px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold border ' + cls}>{t('status_' + (status || 'none'))}</span>;
}

function BlockerCard({ b, max, bump, onSave }) {
    const { t, lang } = useT();
    const saved = b.action;
    const [status, setStatus] = useState(saved ? saved.status : 'investigating');
    const [owner, setOwner] = useState(saved ? saved.owner : '');
    const [note, setNote] = useState(saved ? saved.note : '');
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        if (b.action) {
            setStatus(b.action.status);
            setOwner(b.action.owner || '');
            setNote(b.action.note || '');
        }
    }, [b.action]);

    const save = () => {
        setBusy(true);
        onSave(b.category, { status, owner: owner.trim(), note: note.trim() }).then(() => setBusy(false));
    };

    return (
        <div className="p-5 bg-slate-50/90 dark:bg-slate-900/70 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <div className="flex items-center gap-2">
                        <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white font-display">{t('cat_' + b.category)}</h4>
                        <span className="text-[10px] font-mono text-slate-400">{b.category}</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t('sig_' + b.category)}</p>
                </div>
                <div className=" sm:text-right shrink-0">
                    <span className="inline-block px-3 py-1 bg-sky-500/10 border border-sky-500/20 text-sky-700 dark:text-sky-300 text-xs font-mono font-semibold rounded-full">
                        {b.affected_count} {t('employees')} · {Math.round(b.share * 100)}%
                    </span>
                    {bump ? <span className="ml-2 px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-mono">+{bump}</span> : null}
                    <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-1">{t('avgStall')}: {b.avg_stall_minutes} {t('min')} · 7d: {b.trend_7d}</p>
                </div>
            </div>

            <div className="h-2 mt-3 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-sky-500 to-cyan-400 transition-all duration-500" style={{ width: Math.round(b.affected_count / max * 100) + '%' }}></div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between gap-3">
                    <span className="text-[10px] uppercase font-mono text-slate-500 dark:text-slate-400 font-semibold">{t('actionTitle')}</span>
                    <StatusBadge status={saved ? saved.status : null} />
                </div>
                {saved && (saved.owner || saved.note) && (
                    <p className="text-xs text-slate-700 dark:text-slate-300 break-words bg-white dark:bg-slate-950/60 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800">
                        {saved.owner ? <b>{t('ownerShort')}: {saved.owner}. </b> : null}{saved.note}
                        <span className="text-slate-400 font-mono text-[11px]"> · {t('updatedAt')} {fmtTime(saved.updated_at, lang)}</span>
                    </p>
                )}
                <div className="flex flex-wrap gap-2" role="group" aria-label={t('statusLabel')}>
                    {ACTION_STATUSES.map((st) => (
                        <button key={st} type="button" onClick={() => setStatus(st)} aria-pressed={status === st}
                            className={'px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ' + (status === st ? 'bg-sky-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700')}>
                            {t('status_' + st)}
                        </button>
                    ))}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <input value={owner} maxLength={40} onChange={(e) => setOwner(e.target.value)} placeholder={t('ownerPh')} aria-label={t('ownerLabel')} className={inputCls} />
                    <input value={note} maxLength={200} onChange={(e) => setNote(e.target.value)} placeholder={t('notePh')} aria-label={t('noteLabel')} className={inputCls + ' sm:col-span-2'} />
                </div>
                <div className="flex justify-end">
                    <button type="button" onClick={save} disabled={busy} className="px-4 py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors">{t('saveAction')}</button>
                </div>
            </div>
        </div>
    );
}

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
        <div className="surface-card p-6 sm:p-8 rounded-3xl space-y-4">
            <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-display">{t('announceTitle')}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t('announceSub')}</p>
            </div>
            <textarea value={text} maxLength={280} rows={2} onChange={(e) => setText(e.target.value)} placeholder={t('announcePh')} aria-label={t('announceTitle')} className={inputCls} />
            <div className="flex flex-wrap items-center justify-between gap-3">
                <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 font-medium">
                    <span>{t('announceTo')}:</span>
                    <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls + ' w-auto'}>
                        <option value="">{t('announceAll')}</option>
                        {visible.map((b) => (<option key={b.category} value={b.category}>{t('cat_' + b.category)}</option>))}
                    </select>
                </label>
                <div className="flex items-center gap-3">
                    <span className="text-[11px] font-mono text-slate-400">{text.length}/280</span>
                    <button type="button" onClick={send} disabled={busy || !text.trim()} className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-sm transition-colors">{t('announceSend')}</button>
                </div>
            </div>
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                <p className="text-[10px] uppercase font-mono text-slate-500 dark:text-slate-400 mb-2.5">{t('announceHistory')}</p>
                {announcements.length === 0 ? <p className="text-xs text-slate-500 dark:text-slate-400">{t('noAnnouncements')}</p> : (
                    <ul className="space-y-2">
                        {announcements.map((a) => (
                            <li key={a.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 break-words">
                                <span className="font-mono text-slate-400">{fmtTime(a.created_at, lang)}</span>
                                {a.category ? <span className="ml-2 px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 text-[10px] font-mono">{t('cat_' + a.category)}</span> : null}
                                <span className="ml-2">{a.text}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}

function TeamNews({ team, announcements }) {
    const { t, lang } = useT();
    const acted = team ? team.blockers.filter((b) => !b.suppressed && b.action) : [];
    return (
        <div className="surface-card p-6 sm:p-8 rounded-3xl space-y-6">
            <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-display mb-3">{t('wsAnnouncements')}</h2>
                {announcements.length === 0 ? <p className="text-xs text-slate-500 dark:text-slate-400">{t('noAnnouncements')}</p> : (
                    <ul className="space-y-2.5">
                        {announcements.map((a) => (
                            <li key={a.id} className="p-3.5 bg-slate-50 dark:bg-slate-900/70 rounded-2xl border border-slate-200 dark:border-slate-800 text-sm text-slate-800 dark:text-slate-200 break-words">
                                <span className="font-mono text-[10px] text-slate-400">{fmtTime(a.created_at, lang)}</span>
                                {a.category ? <span className="ml-2 px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 text-[10px] font-mono">{t('cat_' + a.category)}</span> : null}
                                <p className="mt-1 text-xs sm:text-sm">{a.text}</p>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                <h3 className="text-base font-bold text-slate-900 dark:text-white font-display mb-3">{t('wsStatusTitle')}</h3>
                {acted.length === 0 ? <p className="text-xs text-slate-500 dark:text-slate-400">{t('wsNoStatus')}</p> : (
                    <ul className="space-y-2.5">
                        {acted.map((b) => (
                            <li key={b.category} className="p-3.5 bg-slate-50 dark:bg-slate-900/70 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3">
                                <div className="text-xs text-slate-700 dark:text-slate-300 break-words">
                                    <b>{t('cat_' + b.category)}</b>
                                    {b.action.owner ? <span className="text-slate-500 dark:text-slate-400"> · {t('ownerShort')}: {b.action.owner}</span> : null}
                                    {b.action.note ? <p className="mt-1">{b.action.note}</p> : null}
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

function ManagerPortalView({ team, bumps, live, offline, announcements, onSaveAction, onSend, onResetDemo }) {
    const { t } = useT();
    const [filterMode, setFilterMode] = useState('all'); // 'all' | 'visible' | 'acted' | 'hidden'
    const [confirmResetOpen, setConfirmResetOpen] = useState(false);

    const shown = team ? team.blockers.filter((b) => !b.suppressed) : [];
    const hidden = team ? team.blockers.filter((b) => b.suppressed) : [];
    const max = Math.max(1, ...shown.map((b) => b.affected_count));

    const filteredShown = shown.filter((b) => {
        if (filterMode === 'hidden') return false;
        if (filterMode === 'acted') return Boolean(b.action);
        return true;
    });
    const showHiddenRows = filterMode === 'all' || filterMode === 'hidden';

    return (
        <div className="space-y-8">
            <div className="surface-card p-6 sm:p-8 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-[11px] font-semibold">
                            {team && team.org_unit ? team.org_unit : 'Platform Engineering'}
                        </span>
                        <span className="text-xs font-mono text-slate-400">K = {team ? team.k_threshold : K_ANON}</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white font-display">{t('mgrTitle')}</h1>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">{t('mgrSub', team ? team.k_threshold : K_ANON)}</p>
                </div>
                <div className="flex items-center gap-2.5">
                    <LivePill live={live} offline={offline} />
                    <button type="button" onClick={() => setConfirmResetOpen(true)}
                        className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 inline-flex items-center gap-1.5 transition-colors">
                        <IconRefresh className="w-3.5 h-3.5" />
                        <span>{t('demoResetBtn')}</span>
                    </button>
                </div>
            </div>

            {!team ? (
                <div className="surface-card p-6 rounded-3xl text-xs text-slate-500 dark:text-slate-400 font-mono">{t('loading')}</div>
            ) : (
                <>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <Stat label={t('teamSize')} value={team.population.team_size} sub={t('last7')} />
                        <Stat label={t('responses')} value={team.population.respondents} sub={t('anonAnswers')} bump={bumps.respondents} accent="text-sky-600 dark:text-sky-400" />
                        <Stat label={t('kLabel')} value={`K = ${team.k_threshold}`} sub={t('minGroup')} accent="text-emerald-600 dark:text-emerald-400" />
                        <Stat label={t('hiddenGroups')} value={team.suppressed_groups} sub="n < K (suppressed)" />
                    </div>

                    <div className="surface-card p-6 sm:p-8 rounded-3xl space-y-5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-display">{t('analyticsTitle')}</h2>
                            {/* Filter Tabs */}
                            <div className="flex flex-wrap gap-1.5 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl w-fit">
                                {[
                                    { id: 'all', label: t('filterAll') },
                                    { id: 'visible', label: t('filterVisible') },
                                    { id: 'acted', label: t('filterActed') },
                                    { id: 'hidden', label: t('filterHidden') }
                                ].map((f) => (
                                    <button key={f.id} type="button" onClick={() => setFilterMode(f.id)}
                                        className={'px-3 py-1 rounded-lg text-[11px] font-semibold transition-colors ' + (filterMode === f.id ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white')}>
                                        {f.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {team.insufficient_data && (
                            <p className="text-xs text-amber-600 dark:text-amber-400 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">{t('insufficient')}</p>
                        )}

                        <div className="space-y-4">
                            {filteredShown.map((b) => (
                                <BlockerCard key={b.category} b={b} max={max} bump={bumps[b.category]} onSave={onSaveAction} />
                            ))}
                            {showHiddenRows && hidden.map((b) => (
                                <div key={b.group} className="p-4 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/40 dark:bg-slate-900/30 flex items-center gap-3 text-slate-500 dark:text-slate-400">
                                    <IconLock className="w-4 h-4 shrink-0 text-amber-500" />
                                    <span className="text-xs font-mono">{t('hiddenRow', team.k_threshold)}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <AnnounceBox visible={shown} announcements={announcements} onSend={onSend} />
                </>
            )}

            {/* Confirmation Modal for Demo Reset */}
            {confirmResetOpen && (
                <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm">
                    <div className="surface-card rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                        <div className="flex items-center gap-3 text-amber-500">
                            <IconAlert className="w-6 h-6 shrink-0" />
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display">{t('demoResetConfirmTitle')}</h3>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{t('demoResetConfirmText')}</p>
                        <div className="flex justify-end gap-3 pt-2">
                            <button type="button" onClick={() => setConfirmResetOpen(false)} className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold">
                                {t('cancel')}
                            </button>
                            <button type="button" onClick={() => { setConfirmResetOpen(false); onResetDemo(); }} className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold">
                                {t('demoResetConfirmYes')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ============ DEDICATED LEGAL PAGES (PHASE 8) ============
function LegalLayout({ title, subtitle, updatedDate, onNavigate, children }) {
    const { t } = useT();
    return (
        <article className="max-w-4xl mx-auto py-4 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <button type="button" onClick={() => onNavigate('home')}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors">
                    ← {t('backHome')}
                </button>
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                    Son yenilənmə / Last updated: {updatedDate}
                </span>
            </div>
            <div className="surface-card p-6 sm:p-10 rounded-3xl legal-prose text-sm text-slate-700 dark:text-slate-300 space-y-4">
                <header className="border-b border-slate-200 dark:border-slate-800 pb-5 mb-6">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-display">{title}</h1>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2">{subtitle}</p>
                </header>
                {children}
            </div>
        </article>
    );
}

function PrivacyPolicyPage({ onNavigate }) {
    const { lang } = useT();
    if (lang === 'en') {
        return (
            <LegalLayout
                title="Privacy Policy"
                subtitle="How ContextPulse AI collects, validates, aggregates, and protects IDE and Pull Request metadata."
                updatedDate="October 18, 2026"
                onNavigate={onNavigate}
            >
                <h2>1. Overview & Privacy-First Design</h2>
                <p>
                    ContextPulse AI (&quot;Platform&quot;), developed by Team <b>Code of War</b> for the NeuroBridge Hackathon (Operator: <code>[COMPANY / LEGAL ENTITY NAME PLACEHOLDER]</code>), is designed around strict metadata minimization and K-anonymity. The Platform never records screens, never logs keystrokes, and never reads or stores source code content.
                </p>

                <h2>2. Categories of Data Actually Collected</h2>
                <ul>
                    <li><b>IDE &amp; Pull Request Metadata (<code>events</code> table):</b> Pseudonymous developer reference (e.g., <code>developer_ref: &quot;dev_a91f&quot;</code>), timestamp (<code>emitted_at</code>), session state and idle duration in seconds, workspace repository and branch name, last edited file path, function symbol name, edited line numbers, diagnostic error codes and line numbers (e.g., <code>TS2345</code>), test runner counts and failing test title, and Pull Request ID, title, status, and unresolved comment count.</li>
                    <li><b>Strict Schema Enforcement:</b> Every incoming event must include <code>privacy: &#123;&quot;screen_capture&quot;: false, &quot;keystroke_content&quot;: false, &quot;source_code_content&quot;: false&#125;</code>. If any flag is <code>true</code> or any undeclared field (such as <code>source_code</code>) is present, Pydantic <code>extra=&quot;forbid&quot;</code> validation immediately rejects the request with HTTP <code>422 Unprocessable Entity</code> prior to database storage.</li>
                    <li><b>Break Survey Responses (<code>survey_responses</code> table):</b> Pseudonymous <code>developer_ref</code>, selected break <code>reason_id</code>, standardized blocker <code>category</code> (<code>PR_REVIEW_WAIT</code>, <code>CI_FLAKY</code>, <code>MEETING_LOAD</code>, <code>UNCLEAR_REQUIREMENTS</code>, <code>TOOLING</code>, or <code>null</code> for personal break), and creation timestamp.</li>
                    <li><b>Team-Level Actions &amp; Announcements (<code>blocker_actions</code> &amp; <code>team_messages</code> tables):</b> Team-wide status, responsible team/owner label, action note, and broadcast announcements created by managers. These records never contain individual employee identifiers.</li>
                </ul>

                <h2>3. How Data Is Used &amp; K-Anonymity Aggregation</h2>
                <ul>
                    <li><b>Developer Context Recovery:</b> The latest IDE metadata event for a developer is used to generate a short reminder upon returning from a break.</li>
                    <li><b>K-Anonymity (K = 5) Manager Analytics:</b> Survey responses are aggregated by blocker category. A category is displayed to managers only if total respondents are at least K = 5 and the specific category has at least K = 5 responses. Groups below K = 5 are suppressed (<code>suppressed: true, reason: &quot;n&lt;k&quot;</code>) without revealing exact counts, and server endpoints reject manager actions or announcements targeting suppressed categories with HTTP <code>409 Conflict</code>.</li>
                </ul>

                <h2>4. AI Processing &amp; Third-Party Interactions (Google Gemini API)</h2>
                <p>
                    When <code>GEMINI_API_KEY</code> is configured on the server, the backend transmits a sanitized JSON payload of the developer&apos;s latest IDE metadata event (excluding <code>privacy</code> and <code>source</code> fields) to Google&apos;s Gemini API (<code>google-genai</code> SDK) to generate a 1-paragraph context summary. The AI output is programmatically verified against the input JSON before display; if verification fails or no API key is configured, a local deterministic template is used. When Google Gemini is enabled, metadata is processed by Google servers, which may involve international data transfers subject to Google API Terms.
                </p>

                <h2>5. Storage Location, Retention &amp; Security Practices</h2>
                <p>
                    Data is stored in a local SQLite database (<code>contextpulse.db</code>, or <code>/tmp/contextpulse.db</code> in Docker containers). Successful AI reminders are cached in server memory per <code>(event_id, lang)</code>, and authenticated sessions are held in server memory with a 24-hour expiration. Demo environments can be wiped at any time via <code>POST /api/demo/reset</code>.
                </p>

                <h2>6. Your Rights &amp; Contact Information</h2>
                <p>
                    Subject to applicable data protection laws, you may request access to, correction of, or deletion of your pseudonymous metadata records. For privacy inquiries or requests, contact: <code>[PRIVACY CONTACT EMAIL PLACEHOLDER, e.g., privacy@example.com]</code> at <code>[REGISTERED ADDRESS PLACEHOLDER]</code>.
                </p>
            </LegalLayout>
        );
    }

    return (
        <LegalLayout
            title="Məxfilik Siyasəti (Privacy Policy)"
            subtitle="ContextPulse AI tərəfindən IDE və Pull Request metadatasının toplanması, doğrulanması, K-anonim aqreqasiyası və qorunması qaydaları."
            updatedDate="18 Oktyabr 2026"
            onNavigate={onNavigate}
        >
            <h2>1. Ümumi Baxış və Məxfilik Prinsipləri</h2>
            <p>
                ContextPulse AI (&quot;Platforma&quot;) NeuroBridge Hackathon çərçivəsində <b>Code of War</b> komandası tərəfindən hazırlanmışdır (Operator: <code>[ŞİRKƏT / HÜQUQİ ŞƏXS ADI YERİ]</code>). Sistem yalnız minimal IDE və Pull Request metadatası ilə işləyir: ekran görüntüsü çəkilmir, klaviatura izlənmir və mənbə kodu oxunmur.
            </p>

            <h2>2. Faktiki Toplanan Məlumat Kateqoriyaları</h2>
            <ul>
                <li><b>IDE və Pull Request Metadatası (<code>events</code> cədvəli):</b> Psevdonim işçi identifikatoru (məs. <code>developer_ref: &quot;dev_a91f&quot;</code>), vaxt möhürü (<code>emitted_at</code>), sessiya vəziyyəti və fasilə müddəti (saniyə), repozitoriya və budaq (branch) adı, son dəyişdirilən faylın yolu və funksiya adı (symbol), sətir aralığı, diaqnostika xəta kodu və sətri (məs. <code>TS2345</code>), test nəticələri və uğursuz testin adı, PR nömrəsi, başlığı, statusu və həll olunmamış şərhlərin sayı.</li>
                <li><b>Sərt Sxem Doğrulaması:</b> Hər bir hadisədə <code>privacy: &#123;&quot;screen_capture&quot;: false, &quot;keystroke_content&quot;: false, &quot;source_code_content&quot;: false&#125;</code> sahələri mütləq <code>false</code> olmalıdır. Hər hansı sahə <code>true</code> olarsa və ya sxemdə olmayan əlavə sahə (məs. <code>source_code</code>) göndərilərsə, Pydantic <code>extra=&quot;forbid&quot;</code> yoxlaması sorğunu bazaya yazmadan HTTP <code>422</code> ilə rədd edir.</li>
                <li><b>Fasilə Səbəbi Sorğusu (<code>survey_responses</code> cədvəli):</b> <code>developer_ref</code>, seçilmiş <code>reason_id</code>, tıxanma kateqoriyası (<code>PR_REVIEW_WAIT</code>, <code>CI_FLAKY</code>, <code>MEETING_LOAD</code>, <code>UNCLEAR_REQUIREMENTS</code>, <code>TOOLING</code> və ya şəxsi fasilə üçün <code>null</code>) və tarix.</li>
                <li><b>Komanda Tədbirləri və Elanlar (<code>blocker_actions</code> və <code>team_messages</code>):</b> Menecer tərəfindən görünən tıxanmalar üzrə yazılan status, məsul komanda, qeyd və ümumi komanda elanları. Bu qeydlərdə fərdi işçi adı və ya identifikatoru saxlanmır.</li>
            </ul>

            <h2>3. Emal Məqsədləri və K-Anonimlik (K = 5) Mexanizmi</h2>
            <ul>
                <li><b>İşçi Kontekst Bərpası:</b> İşçi fasilədən qayıdanda son IDE hadisəsi əsasında qısa xatırlatma yaradılır.</li>
                <li><b>Menecer Analitikası (K = 5):</b> Tıxanma qrupları yalnız ümumi cavab sayı və müvafiq kateqoriya üzrə cavab sayı ən azı <code>K = 5</code> olduqda menecerə göstərilir. <code>n &lt; 5</code> olan qruplar gizlədilir, dəqiq say açıqlanmır və gizli qrup üzərində tədbir və ya elan açmaq cəhdi server tərəfindən HTTP <code>409</code> ilə rədd edilir.</li>
            </ul>

            <h2>4. Süni İntellekt (Google Gemini API) və Üçüncü Tərəf Ötürmələri</h2>
            <p>
                Serverdə <code>GEMINI_API_KEY</code> təyin edildikdə, son hadisənin təmizlənmiş JSON metadatası (<code>privacy</code> və <code>source</code> sahələri çıxarılmaqla) qısa xatırlatma mətni yaratmaq üçün Google Gemini API-ya (<code>google-genai</code>) göndərilir. AI cavabı proqramla giriş faktlarına qarşı yoxlanır; uydurma məlumat aşkarlanarsa və ya açar yoxdursa, lokal hazır mətn (fallback) istifadə edilir. Gemini API istifadəsi zamanı metadata Google serverlərinə ötürülə bilər.
            </p>

            <h2>5. Saxlama Yeri, Müddəti və Təhlükəsizlik</h2>
            <p>
                Məlumatlar lokal SQLite verilənlər bazasında (<code>contextpulse.db</code> və ya Docker konteynerində <code>/tmp/contextpulse.db</code>) saxlanılır. Demo məlumatları istənilən vaxt <code>POST /api/demo/reset</code> vasitəsilə sıfırlana bilər.
            </p>

            <h2>6. İstifadəçi Hüquqları və Əlaqə</h2>
            <p>
                Məlumatlarınızla bağlı sorğu, düzəliş və ya silinmə tələbləri üçün əlaqə: <code>[MƏXFİLİK ƏLAQƏ E-POÇTU YERİ, məs. privacy@example.com]</code> · Ünvan: <code>[HÜQUQİ ÜNVAN YERİ]</code>.
            </p>
        </LegalLayout>
    );
}

function TermsAndConditionsPage({ onNavigate }) {
    const { lang } = useT();
    if (lang === 'en') {
        return (
            <LegalLayout
                title="Terms & Conditions"
                subtitle="Terms governing the use of the ContextPulse AI platform, role-based dashboards, and AI-assisted context reminders."
                updatedDate="October 18, 2026"
                onNavigate={onNavigate}
            >
                <h2>1. Scope of Service</h2>
                <p>
                    ContextPulse AI provides metadata-driven developer context recovery and K-anonymous team blocker analytics. These Terms govern access to and use of the Platform operated by <code>[COMPANY / LEGAL ENTITY NAME PLACEHOLDER]</code>.
                </p>

                <h2>2. Role Separation &amp; Account Responsibilities</h2>
                <p>
                    The Platform enforces strict separation between the <b>Employee (Developer)</b> role and the <b>Manager</b> role. Users must access only the portal authorized for their role and must not attempt to bypass role checks, probe suppressed groups (<code>n &lt; K</code>), or submit unauthorized payloads.
                </p>

                <h2>3. Acceptable Use &amp; Prohibited Activities</h2>
                <ul>
                    <li>You may not submit source code content, keystroke logs, screen captures, or personal sensitive data to <code>POST /api/events</code>.</li>
                    <li>You may not attempt to de-anonymize K-anonymous blocker categories through automated sequential polling or timing attacks.</li>
                    <li>Managers must use blocker analytics solely for resolving team-wide engineering bottlenecks and never for individual employee surveillance or disciplinary evaluation.</li>
                </ul>

                <h2>4. AI-Generated Output Disclaimer</h2>
                <p>
                    Context recovery reminders may be generated using Google Gemini AI and validated against event metadata, or produced via deterministic fallback templates. AI outputs are provided as informational aids only. Developers remain responsible for independently verifying code lines, compiler diagnostics, test results, and Pull Request comments before merging or deploying software.
                </p>

                <h2>5. Intellectual Property</h2>
                <p>
                    The ContextPulse AI software, interface design, validation logic, and documentation are the intellectual property of the project authors (Team Code of War / <code>[RIGHTSHOLDER PLACEHOLDER]</code>).
                </p>

                <h2>6. Service Availability, Limitation of Liability &amp; Governing Law</h2>
                <p>
                    The Platform is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis without warranties of uninterrupted availability. To the maximum extent permitted by applicable law in <code>[JURISDICTION PLACEHOLDER]</code>, the operator shall not be liable for indirect or consequential damages arising from reliance on AI reminders or demo analytics. Contact: <code>[LEGAL CONTACT EMAIL PLACEHOLDER]</code>.
                </p>
            </LegalLayout>
        );
    }

    return (
        <LegalLayout
            title="İstifadə Şərtləri (Terms & Conditions)"
            subtitle="ContextPulse AI platformasından, rol əsaslı panellərdən və AI kontekst xatırlatmalarından istifadə qaydaları."
            updatedDate="18 Oktyabr 2026"
            onNavigate={onNavigate}
        >
            <h2>1. Xidmətin Əhatə Dairəsi</h2>
            <p>
                ContextPulse AI proqramçılar üçün fasilədən sonra kontekst bərpası və komanda rəhbərləri üçün K-anonim (K = 5) tıxanma analitikası təqdim edir. Bu şərtlər <code>[ŞİRKƏT / HÜQUQİ ŞƏXS ADI YERİ]</code> tərəfindən idarə olunan platformadan istifadəni tənzimləyir.
            </p>

            <h2>2. Rolların Ayrılması və Hesab Məsuliyyəti</h2>
            <p>
                Sistemdə <b>İşçi (Developer)</b> və <b>Menecer</b> rolları bir-birindən tam ayrılmışdır. İstifadəçilər yalnız öz rollarına uyğun panelə daxil olmalı, digər rolun marşrutlarına və ya API-lərinə icazəsiz müraciət etməməlidirlər.
            </p>

            <h2>3. Məqbul İstifadə və Qadağan Olunan Hərəkətlər</h2>
            <ul>
                <li><code>POST /api/events</code> ünvanına mənbə kodu, klaviatura qeydləri, ekran görüntüsü və ya fərdi həssas məlumatların göndərilməsi qadağandır.</li>
                <li>K-anonimlik həddindən (<code>K = 5</code>) aşağı olan gizli qrupların fərdi cavablarını ardıcıl sorğularla aşkarlamağa çalışmaq qadağandır.</li>
                <li>Menecer panelindəki analitika yalnız komanda səviyyəli texniki maneələri aradan qaldırmaq üçündür və fərdi işçinin qiymətləndirilməsi üçün istifadə edilə bilməz.</li>
            </ul>

            <h2>4. Süni İntellekt Çıxışları üzrə Məsuliyyətin Məhdudlaşdırılması</h2>
            <p>
                Kontekst xatırlatmaları Google Gemini AI (fakt yoxlaması ilə) və ya deterministik şablon vasitəsilə yaradılır. Bu mətnlər yalnız köməkçi xarakter daşıyır; proqramçı kod dəyişikliklərini, xəta sətirlərini və test nəticələrini müstəqil şəkildə yoxlamağa məsuldur.
            </p>

            <h2>5. Əqli Mülkiyyət və Qanunvericilik</h2>
            <p>
                ContextPulse AI proqram təminatı, dizayn sistemi və alqoritmləri müəllif komandaya (Code of War / <code>[HÜQUQ SAHİBİ YERİ]</code>) məxsusdur. Mübahisələr <code>[YURİSDİKSİYA YERİ]</code> qanunvericiliyinə uyğun həll edilir. Əlaqə: <code>[HÜQUQİ ƏLAQƏ E-POÇTU YERİ]</code>.
            </p>
        </LegalLayout>
    );
}

function CookiePolicyPage({ consent, onOpenCookieModal, onNavigate }) {
    const { lang, t } = useT();
    return (
        <LegalLayout
            title={lang === 'en' ? 'Cookie & Local Storage Policy' : 'Kuki və Lokal Yaddaş Siyasəti (Cookie Policy)'}
            subtitle={lang === 'en'
                ? 'Transparent inventory of browser cookies and localStorage keys used by ContextPulse AI.'
                : 'ContextPulse AI tərəfindən istifadə edilən kuki və brauzer yaddaşı (localStorage) elementlərinin tam siyahısı.'}
            updatedDate={lang === 'en' ? 'October 18, 2026' : '18 Oktyabr 2026'}
            onNavigate={onNavigate}
        >
            <h2>{lang === 'en' ? '1. No Third-Party Tracking or Advertising Cookies' : '1. Üçüncü Tərəf İzləmə və ya Reklam Kukiləri Yoxdur'}</h2>
            <p>
                {lang === 'en'
                    ? 'ContextPulse AI does not load any third-party analytics scripts, advertising pixels, or cross-site tracking cookies.'
                    : 'ContextPulse AI heç bir üçüncü tərəf analitika skripti, reklam pikseli və ya saytlararası izləmə kukisi istifadə etmir.'}
            </p>

            <h2>{lang === 'en' ? '2. Storage Inventory (Cookies & localStorage)' : '2. İstifadə Olunan Kuki və Lokal Yaddaş Cədvəli'}</h2>
            <div className="overflow-x-auto my-4">
                <table className="w-full text-left border-collapse text-xs font-mono">
                    <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                            <th className="py-2 pr-4">Ad / Key</th>
                            <th className="py-2 pr-4">Növ / Type</th>
                            <th className="py-2 pr-4">Kateqoriya</th>
                            <th className="py-2 pr-4">Müddət</th>
                            <th className="py-2">Məqsəd / Purpose</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        <tr>
                            <td className="py-2.5 pr-4 font-bold text-sky-600 dark:text-sky-400">cp_session</td>
                            <td className="py-2.5 pr-4">HttpOnly Cookie</td>
                            <td className="py-2.5 pr-4">Strictly Necessary</td>
                            <td className="py-2.5 pr-4">24h / Logout</td>
                            <td className="py-2.5 font-sans">{lang === 'en' ? 'Maintains authenticated Employee or Manager session on the backend.' : 'İşçi və ya Menecer giriş sessiyasını server tərəfdə qoruyur.'}</td>
                        </tr>
                        <tr>
                            <td className="py-2.5 pr-4 font-bold text-sky-600 dark:text-sky-400">cp_cookie_consent</td>
                            <td className="py-2.5 pr-4">localStorage</td>
                            <td className="py-2.5 pr-4">Strictly Necessary</td>
                            <td className="py-2.5 pr-4">Persistent</td>
                            <td className="py-2.5 font-sans">{lang === 'en' ? 'Stores your granular cookie consent decision.' : 'Kuki razılıq seçimlərinizi yadda saxlayır.'}</td>
                        </tr>
                        <tr>
                            <td className="py-2.5 pr-4 font-bold text-emerald-600 dark:text-emerald-400">cp_lang</td>
                            <td className="py-2.5 pr-4">localStorage</td>
                            <td className="py-2.5 pr-4">Functional (Optional)</td>
                            <td className="py-2.5 pr-4">Persistent</td>
                            <td className="py-2.5 font-sans">{lang === 'en' ? 'Remembers selected language (AZ / EN) if functional storage is enabled.' : 'Funksional icazə verildikdə seçilmiş dili (AZ / EN) xatırlayır.'}</td>
                        </tr>
                        <tr>
                            <td className="py-2.5 pr-4 font-bold text-emerald-600 dark:text-emerald-400">cp_theme</td>
                            <td className="py-2.5 pr-4">localStorage</td>
                            <td className="py-2.5 pr-4">Functional (Optional)</td>
                            <td className="py-2.5 pr-4">Persistent</td>
                            <td className="py-2.5 font-sans">{lang === 'en' ? 'Remembers dark/light theme preference if functional storage is enabled.' : 'Funksional icazə verildikdə tünd/açıq tema seçimini xatırlayır.'}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <h2>{lang === 'en' ? '3. Managing or Withdrawing Your Consent' : '3. Razılığın İdarə Edilməsi və Geri Çağırılması'}</h2>
            <p>
                {lang === 'en'
                    ? 'If you reject optional functional storage, cp_lang and cp_theme are immediately removed from localStorage and only kept in memory for your current tab. You can review or modify your choice at any time below:'
                    : 'Funksional yaddaşdan imtina etdikdə cp_lang və cp_theme dərhal localStorage-dən silinir. Seçiminizi istənilən vaxt aşağıdakı düymə ilə dəyişə bilərsiniz:'}
            </p>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 not-prose">
                <span className="text-xs font-mono text-slate-600 dark:text-slate-300">
                    Status: {consent.decided ? (consent.functional ? 'Essential + Functional Enabled' : 'Essential Only (Functional Disabled)') : 'Pending Choice'}
                </span>
                <button type="button" onClick={onOpenCookieModal} className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs transition-colors">
                    {t('cookieSettingsBtn')}
                </button>
            </div>
        </LegalLayout>
    );
}

// ============ 404 / ACCESS DENIED VIEW ============
function Custom404Page({ userRole, onNavigate }) {
    const { t } = useT();
    const ownRoute = userRole === 'manager' ? 'manager-portal' : userRole === 'employee' ? 'dev-portal' : 'home';
    return (
        <div className="py-16 text-center max-w-lg mx-auto space-y-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-rose-500/10 border border-rose-500/25 text-rose-500 rounded-2xl font-mono text-2xl font-extrabold">
                403/404
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-display">{t('notFoundTitle')}</h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{t('notFoundText')}</p>
            <div className="flex flex-wrap items-center justify-center gap-3">
                <button type="button" onClick={() => onNavigate(ownRoute)} className="px-5 py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs shadow-md shadow-sky-600/20">
                    {t('backHome')}
                </button>
                {!userRole && (
                    <button type="button" onClick={() => onNavigate('portal')} className="px-5 py-3 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold rounded-xl text-xs">
                        {t('goPortalBtn')}
                    </button>
                )}
            </div>
        </div>
    );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);