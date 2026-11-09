# ContextPulse AI

> ContextPulse AI proqramçı fasilədən qayıdanda kontekst itkisini azaldan və komanda rəhbərinə tıxanmaları işçini izləmədən göstərən platformadır. Sistem yalnız IDE və Pull Request metadatası ilə işləyir: ekran çəkilmir, klaviatura izlənmir, kod məzmunu oxunmur.

## Problem və həll

Proqramçı toplantıdan və ya qısa fasilədən sonra harada qaldığını xatırlamaq üçün vaxt itirir. Komanda rəhbəri isə tıxanmaların (blocker) səbəbini görmür, çünki fərdi işçini izləmək etik və hüquqi problem yaradır. ContextPulse AI iki problemi bir dövrədə həll edir:

1. **İşçi üçün:** fasilədən qayıdan kimi AI son işi qısa xatırlatma ilə bərpa edir: son dəyişdirilən funksiya, açıq xəta, uğursuz test, PR-dəki həll olunmamış şərhlər.
2. **Menecer üçün:** komanda səviyyəsində tıxanmalar K-anonimlik qaydası ilə göstərilir və menecer onlar üzərində tədbir qeydi aça, komandaya elan göndərə bilər.
3. **Dövrə qapanır:** işçi öz panelində menecerin elanlarını və tıxanmalar üzrə görülən tədbirləri canlı görür.

## Əsas xüsusiyyətlər

- **Yalnız metadata qəbulu.** API `privacy` sahələrindən biri `true` olarsa (ekran qeydi, klaviatura məzmunu, mənbə kodu) və ya sxemdə olmayan sahə (məsələn `source_code`) gələrsə hadisəni `422` ilə rədd edir. Bu yoxlama serverdədir; hələ IDE genişləndirməsi olmadığı üçün onun nə topladığını bu repo təsdiqləmir.
- **Saniyələr içində geri dönüş.** Xatırlatma Gemini ilə yazılır, cavab proqramla doğrulanır: uydurma fayl, funksiya, xəta kodu və ya PR nömrəsi varsa hazır mətnə (fallback) keçilir. İlk Gemini sorğusu bir neçə saniyə çəkə bilər, eyni hadisə üçün sonrakı sorğular yaddaşdan gəlir.
- **K-anonimlik.** Qrup yalnız ən azı K = 5 cavab toplayanda menecerə görünür. Daha az olanlar "gizlədilib" kimi göstərilir və dəqiq sayı açıqlanmır.
- **Tədbir izləmə (menecer).** Görünən hər tıxanma üçün status (Araşdırılır, Tədbir planlanıb, Həll olunub), məsul komanda və qısa qeyd. Gizli (K həddindən az) qrup üzərində tədbir açmaq serverdə rədd edilir (`409`).
- **Komandaya elan (menecer).** Elan bütün işçilərin panelində canlı görünür. Fərdi işçiyə ünvanlanmır, mövzu seçilərsə yalnız görünən qrupa bağlana bilər.
- **İki dil.** Azərbaycan və İngilis. AI xatırlatması da seçilmiş dildə gəlir.
- **Canlı yenilənmə.** Server-Sent Events (SSE) ilə işçi cavabı, tədbir qeydləri və elanlar açıq pəncərələrdə səhifə yenilənmədən görünür.
- **Oflayn demo rejimi.** Backend olmadan (məsələn GitLab Pages-də) sayt eyni məntiqi brauzerdə işlədir və "Oflayn demo" nişanı göstərir. Bu rejimdə AI əvəzinə hazır mətn istifadə olunur.

## Texnologiyalar

| Qat | Texnologiya |
|---|---|
| Backend | Python, FastAPI, Uvicorn, Pydantic |
| Verilənlər bazası | SQLite |
| AI | Google Gemini (`google-genai`), Anthropic Claude (`anthropic`) |
| Frontend | React 18 (CDN + Babel), Tailwind CSS (CDN), build addımı yoxdur; animasiyalı pulse vizuallaşdırması və yenilənmiş responsive interfeys |
| Canlı axın | Server-Sent Events |
| Test | pytest, httpx |
| Deploy | Docker, GitLab CI/CD, GitLab Pages |

## Layihə strukturu

```text
.
├── app/
│   ├── main.py            # API marşrutları, SSE axını, statik fayllar
│   ├── core.py            # SQLite, seed data, K-anonim aqreqasiya, tədbir və elan saxlanması
│   ├── ai_engine.py       # Gemini/Claude prompt, cavabın doğrulanması, fallback, gündəlik AI limiti
│   ├── demo.py            # İctimai demo rejimi: şablonlar, avtomatik sıfırlama intervalı
│   ├── ratelimit.py       # IP üzrə sorğu limiti, etibarlı proxy (X-Forwarded-For)
│   ├── security.py        # Təhlükəsizlik başlıqları (CSP və s.), /docs-un söndürülməsi
│   ├── config.py          # Mühit dəyişənlərini oxuma köməkçiləri
│   └── schemas.py         # Pydantic sxemləri (məxfilik yoxlaması daxil)
├── static/                # index.html, app.js, styles.css, favicon.*, fonts/ (lokal şriftlər)
├── tests/                 # pytest testləri (conftest.py testləri yaddaşdakı bazaya yönəldir)
├── contextpulse_ai/       # İlk prototip (Streamlit, mock data)
├── simulator.py           # IDE simulyatoru və demo köməkçisi
├── list_models.py         # Hesabdakı Gemini modellərini göstərir
├── Dockerfile
├── .gitlab-ci.yml
├── requirements.txt
└── .env.example
```

## Səhifələr və marşrutlar

Frontend tək səhifəli tətbiqdir (React, build addımı yoxdur). Hər yol serverdə `index.html` qaytarır və marşrutu `static/app.js` oxuyur. Naməlum yollar `404` verir.

| Yol | Səhifə |
|---|---|
| `/` | Ana səhifə (məhsul, necə işləyir, hazırkı məhdudiyyətlər) |
| `/portal` | Rol seçimi (Developer / Manager) |
| `/developer-login`, `/manager-login` | Rola görə ayrı giriş səhifələri |
| `/developer`, `/manager` | Paneller (giriş tələb edir, səhv rolda 404 səhifəsi göstərilir) |
| `/privacy-policy`, `/terms-and-conditions`, `/cookie-policy` | Hüquqi səhifələr (AZ / EN, son yenilənmə tarixi ilə) |

Giriş naviqasiyadakı "Daxil ol" menyusundan və ya `/portal` səhifəsindən açılır. Hüquqi səhifələrdəki `[[YER TUTUCULAR]]` operator tərəfindən doldurulmalıdır (şirkət adı, ünvan, əlaqə, saxlama müddəti, yurisdiksiya və s.). Bu mətnlər hüquqi məsləhət deyil.

**Brauzer yaddaşı:** tətbiq HTTP cookie qoymur (testlə yoxlanılır). Dil, tema və bildiriş seçimləri `localStorage`-də yalnız istifadəçi dəyişəndə yazılır (`cp_lang`, `cp_theme`, `cookieConsentGiven`). Analitika və ya izləmə aləti yoxdur. Şriftlər (Inter, JetBrains Mono, SIL OFL lisenziyası, `static/fonts/`) lokal verilir; Tailwind, React və Babel hələ CDN-dən (`cdn.tailwindcss.com`, `unpkg.com`) dəqiq versiya ilə yüklənir: Tailwind `3.4.17`, React və ReactDOM `18.3.1`, `@babel/standalone` `7.26.10`. Versiyanı dəyişəndə `static/index.html`-də yeni dəqiq versiya yazın (`@18` kimi aralıq yox). Favicon: `static/favicon.ico`, `favicon.svg`, `apple-touch-icon.png`.

## Quraşdırma və işə salma

Bütün əmrlər repo kökündən icra olunur. Python 3.12 və ya daha yeni tövsiyə olunur.

**Windows (PowerShell):**

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

**macOS / Linux:**

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### Mühit dəyişənləri (istəyə görə)

`.env.example` faylını `.env` adı ilə kopyalayıb doldurun. Server `.env` faylını repo kökündən özü oxuyur (terminalda əvvəlcədən təyin edilmiş dəyişənin üstündən yazmır).

IDE simulyatorunu işlətmək üçün `INGEST_KEY` lazımdır. Öz təsadüfi açarınızı yaradın və çıxan sətri `.env`-də `INGEST_KEY=` qarşısına yazın (açarı başqası ilə paylaşmayın):

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

| Dəyişən | Məcburi | Təsvir | Standart |
|---|---|---|---|
| `GEMINI_API_KEY` | Xeyr | Gemini açarı. Yoxdursa hazır mətn (fallback) istifadə olunur | yoxdur |
| `GEMINI_MODEL` | Xeyr | Gemini modeli. Vergüllə bir neçə ad yazmaq olar, biri uğursuz olarsa növbətisi sınanır | `gemini-3.5-flash,gemini-2.5-flash` |
| `ANTHROPIC_API_KEY` | Xeyr | Claude açarı. Gemini ilə yanaşı və ya onun yerinə istifadə oluna bilər | yoxdur |
| `CLAUDE_MODEL` | Xeyr | Claude modeli. Vergüllə bir neçə ad yazmaq olar, biri uğursuz olarsa növbətisi sınanır | `claude-opus-5-5,claude-sonnet-5-5,claude-haiku-5-5` |
| `AI_PROVIDERS` | Xeyr | Provayderlərin sınanma sırası. Yalnız açarı olanlar istifadə olunur; biri tam uğursuz olarsa növbətisinə keçilir | `gemini,claude` |
| `INGEST_KEY` | Bəli (IDE/simulyator üçün) | IDE genişləndirməsi və `simulator.py` bu açarla (`X-Ingest-Key` başlığı) hadisə və sorğu göndərir. Yoxdursa `/api/events` rədd edilir | yoxdur |
| `DEMO_EMPLOYEE_REF` | Xeyr | Demo işçi hesabının IDE hadisələrindəki `developer_ref`-i | `dev_a91f` |
| `DB_PATH` | Xeyr | SQLite faylının yolu | `contextpulse.db` |
| `SIMULATOR_URL` | Xeyr | `simulator.py`-ın qoşulduğu server ünvanı (`--url` verilməyəndə) | `localhost:8000`, sonra `8001` axtarılır |
| `PORT` | Xeyr | Yalnız Docker-də: server portu | `8000` |
| `DEMO_MODE` | Xeyr | `1`: ictimai demo rejimi. Elan, tədbir qeydi və məsul yalnız hazır şablonlardan seçilir, demo məlumatı avtomatik sıfırlanır | `0` |
| `DEMO_RESET_MINUTES` | Xeyr | Demo məlumatının avtomatik sıfırlanma intervalı (dəqiqə). Yalnız `DEMO_MODE=1` olanda; `0` söndürür | `30` |
| `RATE_LIMIT_ENABLED` | Xeyr | IP üzrə sorğu limiti. Limit keçiləndə `429` və `Retry-After` qaytarılır | `1` |
| `RATE_LIMIT_LOGIN` | Xeyr | `/api/auth/login` limiti, `sorğu/saniyə` formatında | `10/60` |
| `RATE_LIMIT_REMINDER` | Xeyr | `/api/reminder` limiti | `20/60` |
| `RATE_LIMIT_SURVEY` | Xeyr | `/api/survey` limiti | `20/60` |
| `RATE_LIMIT_MESSAGES` | Xeyr | `/api/team/messages` limiti | `10/60` |
| `RATE_LIMIT_ACTION` | Xeyr | `/api/team/blockers/*/action` limiti | `30/60` |
| `RATE_LIMIT_STREAM` | Xeyr | `/api/stream` (yeni SSE bağlantısı) limiti | `30/60` |
| `RATE_LIMIT_RESET` | Xeyr | `/api/demo/reset` limiti | `3/60` |
| `TRUSTED_PROXY` | Xeyr | `0`: `X-Forwarded-For` nəzərə alınmır. `1` (və ya `N`): server N etibarlı reverse proxy arxasındadır, müştəri IP-si başlığın sondan N-ci elementidir. Uvicorn birbaşa internetə açıqdırsa aktiv etməyin | `0` |
| `MAX_SSE_SUBSCRIBERS` | Xeyr | Eyni anda açıq SSE bağlantılarının ümumi sayı (aşılanda `503`) | `200` |
| `MAX_SSE_PER_IP` | Xeyr | Bir IP-dən eyni anda açıq SSE bağlantıları (aşılanda `429`; `RATE_LIMIT_ENABLED=0` olanda yoxlanmır) | `10` |
| `AI_DAILY_LIMIT` | Xeyr | Gündə (UTC) ən çox model çağırışı; ehtiyat modellərə keçid də sayılır. Bitəndə hazır mətn qaytarılır. `0`: AI heç çağırılmır | `300` |
| `AI_FAILURE_COOLDOWN_SEC` | Xeyr | Uğursuz (fallback) cavab bu müddət keşlənir, AI-ya dərhal təkrar sorğu getmir. `0` söndürür | `300` |
| `DISABLE_DOCS` | Xeyr | `1`: `/docs`, `/redoc` və `/openapi.json` bağlanır | `0` |
| `SECURITY_HEADERS` | Xeyr | CSP, `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy` başlıqları | `1` |
| `CSP_FRAME_ANCESTORS` | Xeyr | Saytı iframe-də göstərə bilən mənbələr (məs. `https://nexusweb.az`). Boşdursa `'none'` | yoxdur |
| `HSTS_MAX_AGE` | Xeyr | `Strict-Transport-Security` müddəti (saniyə). Yalnız HTTPS arxasında, məs. `31536000` | `0` |

> **Diqqət:** `.env` faylını heç vaxt Git-ə əlavə etməyin və paylaşmayın. `.gitignore` onu istisna edir. Açarı səhvən paylaşmısınızsa, Google AI Studio-da (Gemini) və ya Claude Console-da (Anthropic) yenisini yaradın. Mövcud model adlarını `python list_models.py` ilə yoxlaya bilərsiniz.

### Serveri başlat

```bash
python -m uvicorn app.main:app --port 8000 --no-access-log
```

Kod üzərində işləyərkən istəyə görə `--reload` əlavə edə bilərsiniz. `--no-access-log` standart HTTP access loglarını söndürür; tətbiqin `/api` və AI logları ayrıca qala bilər.

Brauzerdə `http://localhost:8000` açın. İlk başlanğıcda sistem verilənlər bazasını yaradır və demo məlumatlarını (seed) yükləyir. Terminalda hər API sorğusu və AI mühərrikinin vəziyyəti yazılır.

## Demo giriş məlumatları

| Rol | E-poçt | Parol |
|---|---|---|
| İşçi | `dev@company.com` | `emp123` |
| Menecer | `manager@company.com` | `admin123` |

Bunlar yalnız demo üçündür. Giriş serverdə yoxlanılır (`/api/auth/login`); hesabları `.env`-də `DEMO_EMPLOYEE_*` və `DEMO_MANAGER_*` ilə dəyişmək olar. Backend olmadan işləyən oflayn demoda (GitLab Pages) yoxlama brauzerdə aparılır.

## Demo ssenarisi

1. Brauzerdə `http://localhost:8000` açın. Dili AZ / EN düyməsi ilə dəyişə bilərsiniz.
2. Bir pəncərədə menecer, digərində işçi kimi daxil olun (rollar bir-birinin panelinə keçə bilmir).
3. İşçi panelində **Fasilə / Uzaqlaşmanı Simulyasiya Et** düyməsini basın. AI son konteksti bərpa edən qısa xatırlatma göstərir.
4. Fasilə səbəbini seçib qeyd edin. Menecer panelində say canlı artır.
5. Bir kateqoriya K = 5 həddinə çatanda gizli qrup görünür və bildiriş çıxır.
6. Menecer paneldə görünən tıxanmaya status və qeyd yazır, komandaya elan göndərir. İşçi panelində hər ikisi canlı görünür.

## IDE simulyatoru

Backend işləyərkən ikinci terminalda (eyni virtual mühitdə). Simulyator `INGEST_KEY`-i `.env`-dən oxuyur, ona görə əvvəlcə orada açar təyin edin:

```bash
python simulator.py events --interval 5      # IDE hadisə axını, işçi paneli canlı yenilənir
python simulator.py answer MEETING_LOAD      # menecer panelinə 1 anonim cavab
python simulator.py reset                    # demo məlumatını sıfırlayır (tədbir və elanlar da silinir)
python simulator.py warm                     # AZ və EN AI cavablarını əvvəlcədən hazırlayır
```

Simulyator serveri özü tapır: əvvəlcə `SIMULATOR_URL` (mühit və ya `.env`), yoxdursa `localhost:8000`, sonra `localhost:8001` yoxlanılır. Başqa ünvan üçün `--url http://host:port` əlavə edin. Server tapılmasa simulyator bunu yazıb dayanır. Mümkün kateqoriyalar: `PR_REVIEW_WAIT`, `CI_FLAKY`, `MEETING_LOAD`, `UNCLEAR_REQUIREMENTS`, `TOOLING`.

## Testlər

```bash
python -m pytest -q
```

Testlər K-anonimlik məntiqini, məxfilik yoxlamasını (`422` cavabları), AI cavabının doğrulanmasını, ehtiyat modelə keçidi, iki dildə xatırlatmanı, menecer tədbirləri və elanları yoxlayır. `tests/test_public_demo.py` ictimai demo qorumalarını yoxlayır: demo rejimində şablonlar, sorğu limiti və `X-Forwarded-For`, AI gündəlik limiti və uğursuzluq keşi, təhlükəsizlik başlıqları, `/docs`-un bağlanması, CDN versiyalarının dəqiqliyi. Mövcud testlər bir ünvandan çox giriş etdiyi üçün `tests/conftest.py` sorğu limitini standart olaraq söndürür, limit testləri onu ayrıca yandırır. Testlər yaddaşdakı verilənlər bazası ilə işləyir və `GEMINI_API_KEY` / `ANTHROPIC_API_KEY` tələb etmir.

## Docker ilə işə salma

```bash
docker build -t contextpulse-ai .
docker run -p 8000:8000 --env-file .env contextpulse-ai
```

`.env` faylı yoxdursa `--env-file .env` hissəsini silin, sistem hazır mətnlə işləyəcək. Konteyner `PORT` dəyişənini qəbul edir, verilənlər bazası konteynerin `/tmp` qovluğundadır (yenidən başlayanda sıfırlanır). Konteyner tək uvicorn worker ilə və HTTP access logu olmadan (IP ünvanları loga yazılmır) işləyir.

## CI/CD (GitLab)

`.gitlab-ci.yml` üç mərhələdən ibarətdir:

- **test:** `pip install -r requirements.txt` və `pytest`
- **build:** Docker image yığılır və GitLab Container Registry-yə göndərilir (yalnız default branch)
- **pages:** `static/` qovluğu GitLab Pages-ə çıxarılır. Backend olmadığı üçün bu versiya Oflayn demo rejimində işləyir.

## API

| Metod | Yol | Təsvir |
|---|---|---|
| GET | `/api/health` | Server vəziyyəti |
| GET | `/api/bootstrap` | Komanda məlumatı və son elanlar; işçi tokeni ilə həm də işçinin öz son hadisəsi |
| POST | `/api/events` | IDE metadata hadisəsi qəbulu (`202`; `X-Ingest-Key` tələb edir, əks halda `401`) |
| GET | `/api/snapshot/{developer_ref}` | İşçinin son hadisəsi (yalnız həmin işçinin tokeni və ya `X-Ingest-Key` ilə) |
| POST | `/api/reminder` | AI xatırlatması (`lang`: `az` / `en`; işçi tokeni ilə öz hadisəsi üçün, və ya `X-Ingest-Key`) |
| POST | `/api/auth/login` | Giriş (IP üzrə limitli, aşılanda `429`): `email`, `password`, `role` (`employee`/`manager`); səhv məlumat `401`, rol uyğunsuzluğu `403`; Bearer token qaytarır |
| GET | `/api/auth/session` | Token üzrə sessiya vəziyyəti (`authenticated`, `role`) |
| POST | `/api/auth/logout` | Sessiyanı bağlayır |
| POST | `/api/survey` | Anonim fasilə səbəbi cavabı (işçi tokeni və ya `X-Ingest-Key`; hər developerin yalnız son cavabı sayılır; menecer tokeni ilə `403`) |
| GET | `/api/team/blockers` | K-anonim menecer məlumatı (tədbir qeydləri daxil) |
| PUT | `/api/team/blockers/{category}/action` | Görünən tıxanma üzrə status, məsul və qeyd (menecer tokeni tələb edir: tokensiz `401`, işçi tokeni `403`; gizli qrup üçün `409`) |
| POST | `/api/team/messages` | Komandaya elan (`201`; menecer tokeni tələb edir) |
| GET | `/api/announcements` | Son elanlar |
| POST | `/api/demo/reset` | Demo məlumatını sıfırla (menecer tokeni və ya `X-Ingest-Key`) |
| GET | `/api/stream` | SSE canlı axını (`team`, `announcement`, `announcement_reset`; `?token=` işçi tokeni ilə həm də işçinin öz `event`-ləri) |

Swagger sənədləşməsi: `http://localhost:8000/docs` (`DISABLE_DOCS=1` olanda bağlıdır). `/api/auth/login`, `/api/reminder`, `/api/survey`, `/api/team/messages`, `/api/team/blockers/*/action`, `/api/demo/reset` və `/api/stream` IP üzrə limitlidir: limit keçiləndə `429` və `Retry-After` başlığı qaytarılır. `DEMO_MODE=1` olanda `/api/bootstrap` cavabında `demo` sahəsi (şablonlar və sıfırlama intervalı) var, şablondan kənar elan və ya qeyd `422` ilə rədd edilir.

## Məxfilik prinsipləri

- Yalnız IDE və PR metadatası toplanır. Hadisədəki `privacy` sahələrinin hamısı `false` olmalıdır, əks halda sorğu rədd edilir.
- Sxemdə olmayan sahələr (məsələn kod məzmunu) qəbul edilmir.
- Menecer məlumatında fərdi identifikator yoxdur. Menecerin yazdığı qeyd və elanlar komanda səviyyəsindədir və fərdi işçiyə bağlanmır.
- K = 5-dən az cavabı olan qruplar gizlədilir, dəqiq sayı göstərilmir və onlar üzərində tədbir və ya elan mövzusu açmaq olmur. Hər developerin yalnız bir (son) cavabı sayılır, təkrar cavabla həddi aşmaq olmur.
- AI-ya yalnız doğrulanmış metadata JSON-u göndərilir. `privacy` və `source` sahələri prompta daxil edilmir.

## Cari demo davranışı

- Menecer endpoint-ləri (`PUT .../action`, `POST /api/team/messages`) serverdə menecer tokeni tələb edir. Sessiyalar proses yaddaşındadır (server yenidən başlayanda silinir). IDE hadisələri yalnız `INGEST_KEY` ilə qəbul olunur. İşçi yalnız öz hadisəsini, xatırlatmasını və canlı axınını görür, sorğuda hər developerin bir cavabı sayılır. `/api/team/blockers` və `/api/announcements` komanda səviyyəsində olduğu üçün tokensiz oxunur.
- IDE hadisələri bu demo versiyada `simulator.py` vasitəsilə yaradılır; IDE genişləndirməsi bu paketin əhatəsinə daxil deyil.
- K-anonimlik zamana görə müşahidə hücumlarından tam qorumur.
- Demo parolları sadədir və `static/app.js`-də yalnız oflayn rejim üçün saxlanılır. Bu versiyanı real şəxsi məlumatla açıq yerləşdirməyin.
- SQLite demo üçündür. İstehsal üçün PostgreSQL və AI cavab keşinin bazada saxlanması planlaşdırılır.
- Sessiyalar, sorğu limiti sayğacları, AI gündəlik sayğacı, cavab keşi və SSE bağlantıları proses yaddaşındadır. Ona görə server **yalnız bir uvicorn worker** ilə işləməlidir; bir neçə worker və ya replika üçün bunlar ortaq yaddaşa (məs. Redis) köçürülməlidir.

## İctimai demo yerləşdirmə (public demo)

Hədəf: `https://contextpulse.nexusweb.az`. Ən risksiz ilk addım backend-siz **Oflayn demo**dur (`static/` qovluğunu istənilən statik hostinqə qoymaq kifayətdir: AI açarı, baza və sessiya yoxdur). Canlı backend ilə demo üçün aşağıdakı qorumalar əlavə olunub.

### Ziyarətçilərin bir-birindən təsirlənməsi: seçilmiş yanaşma

Bütün ziyarətçilər eyni demo işçi (`dev_a91f`), eyni demo menecer və eyni SQLite bazasını paylaşır. İki variant nəzərdən keçirildi:

| Variant | Üstünlük | Çatışmazlıq |
|---|---|---|
| Hər brauzerə ayrıca "sandbox" vəziyyəti | Ziyarətçilər bir-birini heç görmür | `core.py`-dəki hər funksiyaya, SSE axınına və sessiyalara sandbox identifikatoru əlavə etmək lazımdır; menecer və işçi pəncərələrini eyni sandboxa bağlamaq üçün brauzerdə identifikator (cookie və ya `localStorage`) saxlamaq lazımdır, bu isə "HTTP cookie yoxdur" siyasətini və testləri dəyişir; yaddaş ziyarətçi sayı ilə böyüyür |
| **`DEMO_MODE=1`: hazır şablonlar + avtomatik sıfırlama (seçildi)** | Az dəyişiklik; "bir pəncərədə menecer, digərində işçi, dəyişiklik canlı görünür" demosu olduğu kimi qalır; əsas sui-istifadə yolu bağlanır: heç kim başqalarının ekranına öz mətnini yaya bilmir | Eyni vaxtda daxil olan ziyarətçilər bir-birinin kliklərini (şablon elanlar, status dəyişikliyi) görür; sıfırlama kiminsə demosunun ortasına düşə bilər |

`DEMO_MODE=1` olanda:

- `POST /api/team/messages` yalnız şablon elanları qəbul edir, tədbir qeydinin `note` və `owner` sahələri yalnız şablonlardan (və ya boş) ola bilər; əks halda `422`. Şablonlar `app/demo.py`-dədir, AZ və EN variantı var, interfeys mətn sahəsi əvəzinə seçim siyahısı göstərir və saxlanmış şablonu oxuyanın dilində göstərir.
- Demo məlumatı hər `DEMO_RESET_MINUTES` dəqiqədən bir `core.reset_demo()` ilə başlanğıca qaytarılır və açıq pəncərələrə canlı göndərilir.
- `/api/events` əvvəlki kimi yalnız `INGEST_KEY` ilə işləyir; ictimai serverdə simulyatoru internetdən istifadə etməyin.

### Sorğu limiti və AI xərci

- IP üzrə sürüşən pəncərəli limit (`app/ratelimit.py`, əlavə asılılıq yoxdur, IP-lər yalnız yaddaşda və loga yazılmadan saxlanır). Server reverse proxy arxasındadırsa `TRUSTED_PROXY=1` qoyun, əks halda bütün ziyarətçilər proxy-nin IP-si ilə bir limitə düşər. Uvicorn birbaşa internetə açıqdırsa `TRUSTED_PROXY=0` saxlayın, çünki `X-Forwarded-For`-u müştəri özü yaza bilər.
- Uğurlu AI cavabı əvvəlki kimi daimi keşlənir; uğursuz cavab (fallback) `AI_FAILURE_COOLDOWN_SEC` müddətinə keşlənir. Eyni hadisə üçün eyni anda gələn sorğular AI-ya bir dəfə gedir.
- `AI_DAILY_LIMIT` bütün server üçün gündəlik model çağırışı limitidir; bitəndə hazır mətn ("günlük AI limiti doldu") göstərilir. Provayder tərəfində də (Google AI Studio, Claude Console) xərc limiti qoyun.
- API açarları yalnız serverin mühit dəyişənlərindədir; `static/` qovluğunda açar və ya açar adı yoxdur (testlə yoxlanılır), `.env` Docker image-ə kopyalanmır.

### HTTPS reverse proxy və tək worker

Uvicorn-u yalnız lokal ünvanda, **bir worker** ilə işə salın və HTTPS-i reverse proxy (nginx, Caddy və s.) üzərindən verin:

```bash
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --workers 1 --no-access-log
```

Nümunə nginx bloku (sertifikat, məs. Let's Encrypt, ayrıca qurulur):

```nginx
server {
    listen 443 ssl http2;
    server_name contextpulse.nexusweb.az;
    # ssl_certificate ...; ssl_certificate_key ...;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    location /api/stream {               # SSE: buferləmə və qısa timeout olmasın
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_buffering off;
        proxy_read_timeout 1h;
    }
}
```

Proxy qarşısında başqa proxy (məs. Cloudflare) varsa `TRUSTED_PROXY=2` qoyun. CORS lazım deyil: frontend və API eyni domendədir.

### CDN skriptləri və Tailwind

React, ReactDOM, Babel və Tailwind dəqiq versiyalarla bağlanıb (yuxarıda). Content-Security-Policy yalnız `cdn.tailwindcss.com` və `unpkg.com` skriptlərinə icazə verir, lakin brauzerdə Babel ilə JSX çevrildiyi və Tailwind Play CDN üslubları runtime-da yaratdığı üçün `'unsafe-inline'` və `'unsafe-eval'` hələ lazımdır. **Tailwind Play CDN (`cdn.tailwindcss.com`) istehsal üçün nəzərdə tutulmayıb.** Növbəti addım (follow-up):

1. Tailwind CLI ilə əvvəlcədən yığılmış CSS (`static/tailwind.css`) yaratmaq və CDN skriptini silmək.
2. `app.js`-i (JSX) əvvəlcədən JavaScript-ə çevirmək (esbuild və ya Babel CLI), React və ReactDOM-u lokal fayl kimi vermək.
3. Bundan sonra CSP-dən CDN ünvanlarını, `'unsafe-inline'` və `'unsafe-eval'`-ı çıxarmaq (və ya xarici skriptlərə SRI `integrity` hash-i əlavə etmək).

### Yerləşdirmə yoxlama siyahısı

- [ ] Əvvəlcə oflayn demo (`static/`) kifayətdirsə, backend-siz yerləşdirin.
- [ ] `DEMO_MODE=1`, `DEMO_RESET_MINUTES` (məs. `30`).
- [ ] `DISABLE_DOCS=1`.
- [ ] `RATE_LIMIT_ENABLED=1`; proxy arxasında `TRUSTED_PROXY=1` (və uvicorn yalnız `127.0.0.1`-də).
- [ ] `AI_DAILY_LIMIT` (məs. `200`) və `AI_FAILURE_COOLDOWN_SEC`; provayder hesabında da xərc limiti.
- [ ] API açarları yalnız serverin mühit dəyişənlərində və ya `.env`-də; `.env` Git-də və Docker image-də yoxdur.
- [ ] `INGEST_KEY` uzun təsadüfi dəyər və ya boş (ictimai serverdə simulyator lazım deyil).
- [ ] HTTPS reverse proxy; `HSTS_MAX_AGE=31536000` yalnız HTTPS işlədikdən sonra.
- [ ] `--workers 1` (sessiyalar və sayğaclar yaddaşdadır).
- [ ] Hüquqi səhifələrdəki `[[YER TUTUCULAR]]` doldurulub; real şəxsi məlumat daxil edilmir.
- [ ] Yerləşdirmədən sonra: `/docs` `404`, cavablarda `Content-Security-Policy` var, brauzer konsolunda CSP xətası yoxdur, `python -m pytest -q` yaşıldır.

## İlk prototip (Streamlit)

`contextpulse_ai/` qovluğu layihənin ilk Streamlit prototipidir və mock JSON məlumatlarından istifadə edir. Əsas versiya repo kökündəki `app/` və `static/` qovluqlarıdır. Prototip `app.py`-də mövcud olmayan `CPAI` paketini import etdiyi üçün olduğu kimi işə düşməyə bilər. İşlətmək istəsəniz, həmin sətri `from ai_engine import generate_reentry_message` ilə əvəz edib `pip install -r requirements.txt` və `streamlit run app.py` icra edin.
