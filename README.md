# ContextPulse AI

> **NeuroBridge Hackathon** · Komanda: **Code of War**
>
> ContextPulse AI proqramçı fasilədən qayıdanda kontekst itkisini azaldan və komanda rəhbərinə tıxanmaları işçini izləmədən göstərən platformadır. Sistem yalnız IDE və Pull Request metadatası ilə işləyir: ekran çəkilmir, klaviatura izlənmir, kod məzmunu oxunmur.

**Komanda:** Mikayıl Mövsümzadə · Elgün Hüseynli · Nuran Əliyev

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
| AI | Google Gemini (`google-genai`) |
| Frontend | React 18 (CDN + Babel), Tailwind CSS (CDN), build addımı yoxdur |
| Canlı axın | Server-Sent Events |
| Test | pytest, httpx |
| Deploy | Docker, GitLab CI/CD, GitLab Pages |

## Layihə strukturu

```text
.
├── app/
│   ├── main.py            # API marşrutları, SSE axını, statik fayllar
│   ├── core.py            # SQLite, seed data, K-anonim aqreqasiya, tədbir və elan saxlanması
│   ├── ai_engine.py       # Gemini prompt, cavabın doğrulanması, fallback
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

**Brauzer yaddaşı:** tətbiq HTTP cookie qoymur (testlə yoxlanılır). Dil, tema və bildiriş seçimləri `localStorage`-də yalnız istifadəçi dəyişəndə yazılır (`cp_lang`, `cp_theme`, `cookieConsentGiven`). Analitika və ya izləmə aləti yoxdur. Şriftlər (Inter, JetBrains Mono, SIL OFL lisenziyası, `static/fonts/`) lokal verilir; Tailwind, React və Babel hələ CDN-dən (`cdn.tailwindcss.com`, `unpkg.com`) yüklənir. Favicon: `static/favicon.ico`, `favicon.svg`, `apple-touch-icon.png`.

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

| Dəyişən | Məcburi | Təsvir | Standart |
|---|---|---|---|
| `GEMINI_API_KEY` | Xeyr | Gemini açarı. Yoxdursa hazır mətn (fallback) istifadə olunur | yoxdur |
| `GEMINI_MODEL` | Xeyr | Gemini modeli. Vergüllə bir neçə ad yazmaq olar, biri uğursuz olarsa növbətisi sınanır | `gemini-3.5-flash,gemini-2.5-flash` |
| `DB_PATH` | Xeyr | SQLite faylının yolu | `contextpulse.db` |
| `PORT` | Xeyr | Yalnız Docker-də: server portu | `8000` |

> **Diqqət:** `.env` faylını heç vaxt Git-ə əlavə etməyin və paylaşmayın. `.gitignore` onu istisna edir. Açarı səhvən paylaşmısınızsa, Google AI Studio-da yenisini yaradın. Mövcud model adlarını `python list_models.py` ilə yoxlaya bilərsiniz.

### Serveri başlat

```bash
python -m uvicorn app.main:app --port 8000
```

Brauzerdə `http://localhost:8000` açın. İlk başlanğıcda sistem verilənlər bazasını yaradır və demo məlumatlarını (seed) yükləyir. Terminalda hər API sorğusu və AI mühərrikinin vəziyyəti yazılır.

## Demo giriş məlumatları

| Rol | E-poçt | Parol |
|---|---|---|
| İşçi | `dev@company.com` | `emp123` |
| Menecer | `manager@company.com` | `admin123` |

Bunlar yalnız demo üçündür və giriş brauzer tərəflidir. Real autentifikasiya yol xəritəsindədir (aşağıya baxın).

## Demo ssenarisi

1. Brauzerdə `http://localhost:8000` açın. Dili AZ / EN düyməsi ilə dəyişə bilərsiniz.
2. Bir pəncərədə menecer, digərində işçi kimi daxil olun (rollar bir-birinin panelinə keçə bilmir).
3. İşçi panelində **Fasilə / Uzaqlaşmanı Simulyasiya Et** düyməsini basın. AI son konteksti bərpa edən qısa xatırlatma göstərir.
4. Fasilə səbəbini seçib qeyd edin. Menecer panelində say canlı artır.
5. Bir kateqoriya K = 5 həddinə çatanda gizli qrup görünür və bildiriş çıxır.
6. Menecer paneldə görünən tıxanmaya status və qeyd yazır, komandaya elan göndərir. İşçi panelində hər ikisi canlı görünür.

## IDE simulyatoru

Backend işləyərkən ikinci terminalda (eyni virtual mühitdə):

```bash
python simulator.py events --interval 5      # IDE hadisə axını, işçi paneli canlı yenilənir
python simulator.py answer MEETING_LOAD      # menecer panelinə 1 anonim cavab
python simulator.py reset                    # demo məlumatını sıfırlayır (tədbir və elanlar da silinir)
python simulator.py warm                     # AZ və EN Gemini cavablarını əvvəlcədən hazırlayır
```

Başqa ünvan üçün `--url http://host:port` əlavə edin. Mümkün kateqoriyalar: `PR_REVIEW_WAIT`, `CI_FLAKY`, `MEETING_LOAD`, `UNCLEAR_REQUIREMENTS`, `TOOLING`.

## Testlər

```bash
python -m pytest -q
```

Testlər K-anonimlik məntiqini, məxfilik yoxlamasını (`422` cavabları), AI cavabının doğrulanmasını, ehtiyat modelə keçidi, iki dildə xatırlatmanı, menecer tədbirləri və elanları yoxlayır. Testlər yaddaşdakı verilənlər bazası ilə işləyir və `GEMINI_API_KEY` tələb etmir.

## Docker ilə işə salma

```bash
docker build -t contextpulse-ai .
docker run -p 8000:8000 --env-file .env contextpulse-ai
```

`.env` faylı yoxdursa `--env-file .env` hissəsini silin, sistem hazır mətnlə işləyəcək. Konteyner `PORT` dəyişənini qəbul edir, verilənlər bazası konteynerin `/tmp` qovluğundadır (yenidən başlayanda sıfırlanır).

## CI/CD (GitLab)

`.gitlab-ci.yml` üç mərhələdən ibarətdir:

- **test:** `pip install -r requirements.txt` və `pytest`
- **build:** Docker image yığılır və GitLab Container Registry-yə göndərilir (yalnız default branch)
- **pages:** `static/` qovluğu GitLab Pages-ə çıxarılır. Backend olmadığı üçün bu versiya Oflayn demo rejimində işləyir.

## API

| Metod | Yol | Təsvir |
|---|---|---|
| GET | `/api/health` | Server vəziyyəti |
| GET | `/api/bootstrap` | İşçinin son hadisəsi, komanda məlumatı və son elanlar |
| POST | `/api/events` | IDE metadata hadisəsi qəbulu (`202`) |
| GET | `/api/snapshot/{developer_ref}` | İşçinin son hadisəsi |
| POST | `/api/reminder` | AI xatırlatması (`lang`: `az` / `en`) |
| POST | `/api/survey` | Anonim fasilə səbəbi cavabı |
| GET | `/api/team/blockers` | K-anonim menecer məlumatı (tədbir qeydləri daxil) |
| PUT | `/api/team/blockers/{category}/action` | Görünən tıxanma üzrə status, məsul və qeyd (gizli qrup üçün `409`) |
| POST | `/api/team/messages` | Komandaya elan (`201`) |
| GET | `/api/announcements` | Son elanlar |
| POST | `/api/demo/reset` | Demo məlumatını sıfırla |
| GET | `/api/stream` | SSE canlı axını (`event`, `team`, `announcement`, `announcement_reset`) |

Swagger sənədləşməsi: `http://localhost:8000/docs`

## Məxfilik prinsipləri

- Yalnız IDE və PR metadatası toplanır. Hadisədəki `privacy` sahələrinin hamısı `false` olmalıdır, əks halda sorğu rədd edilir.
- Sxemdə olmayan sahələr (məsələn kod məzmunu) qəbul edilmir.
- Menecer məlumatında fərdi identifikator yoxdur. Menecerin yazdığı qeyd və elanlar komanda səviyyəsindədir və fərdi işçiyə bağlanmır.
- K = 5-dən az cavabı olan qruplar gizlədilir, dəqiq sayı göstərilmir və onlar üzərində tədbir və ya elan mövzusu açmaq olmur.
- AI-ya yalnız doğrulanmış metadata JSON-u göndərilir. `privacy` və `source` sahələri prompta daxil edilmir.

## Məlum məhdudiyyətlər və yol xəritəsi

- Giriş brauzer tərəflidir və API-lərin özü (menecer endpoint-ləri daxil) hələ qorunmur. Server tərəfdə autentifikasiya və rol yoxlaması növbəti addımdır.
- IDE hadisələri hələlik simulyatordan gəlir. Növbəti addımlar: VS Code extension və GitHub PR inteqrasiyası.
- K-anonimlik zamana görə müşahidə hücumlarından tam qorumur.
- Panellərə girişin yoxlanması brauzerdədir və paroller `static/app.js`-dədir; `PUT /api/team/...`, `POST /api/team/messages` kimi menecer endpoint-ləri serverdə hələ autentifikasiya olunmur. Bu versiyanı real şəxsi məlumatla açıq yerləşdirməyin.
- SQLite demo üçündür. İstehsal üçün PostgreSQL və AI cavab keşinin bazada saxlanması planlaşdırılır.

## İlk prototip (Streamlit)

`contextpulse_ai/` qovluğu layihənin ilk Streamlit prototipidir və mock JSON məlumatlarından istifadə edir. Əsas versiya repo kökündəki `app/` və `static/` qovluqlarıdır. Prototip `app.py`-də mövcud olmayan `CPAI` paketini import etdiyi üçün olduğu kimi işə düşməyə bilər. İşlətmək istəsəniz, həmin sətri `from ai_engine import generate_reentry_message` ilə əvəz edib `pip install -r requirements.txt` və `streamlit run app.py` icra edin.
