ContextPulse AI
> \*\*NeuroBridge Hackathon\*\* · Komanda: \*\*Code of War\*\*
ContextPulse AI proqramçı fasilədən qayıdanda kontekst itkisini sıfıra endirən süni intellekt platformasıdır. Sistem yalnız IDE və Pull Request metadatası ilə işləyir: ekran çəkilmir, klaviatura izlənmir, kod məzmunu oxunmur.
Komanda
Üzv
Mikayıl Məvsumzadə
Elgün Hüseynli
Nuran Əliyev
Problem və həll
Proqramçı toplantıdan və ya qısa fasilədən sonra harada qaldığını xatırlamaq üçün dəqiqələr itirir. Komanda rəhbəri isə tıxanmaların (blocker) səbəbini görmür, çünki fərdi işçini izləmək etik və hüquqi problem yaradır.
ContextPulse AI iki problemi birlikdə həll edir:
İşçi üçün: fasilədən qayıdan kimi AI son işi qısa xatırlatma ilə bərpa edir: son dəyişdirilən funksiya, açıq xəta, uğursuz test və PR-dəki həll olunmamış şərhlər.
Menecer üçün: komanda səviyyəsində tıxanmalar K-anonimlik qaydası ilə göstərilir. Fərdi işçi məlumatı menecer panelində yoxdur.
Əsas xüsusiyyətlər
Zero Spyware. Ekran qeydi və keylogger yoxdur. Sistem yalnız metadata telemetriyası qəbul edir. API `privacy` sahələrindən biri `true` olarsa və ya sxemdə olmayan əlavə sahə (məsələn `source\_code`) gələrsə hadisəni `422` ilə rədd edir.
0 saniyəlik geri dönüş. İşçi boş vəziyyətdən qayıdanda AI konteksti dərhal bərpa edir. Xatırlatma Gemini ilə yazılır, cavab proqramla doğrulanır: uydurma fayl, funksiya, xəta kodu və ya PR nömrəsi varsa hazır mətnə (fallback) keçilir.
K-anonimlik. Menecer panelində qrup yalnız ən azı K = 5 cavab toplayanda görünür. Daha az olan qruplar "gizlədilib" kimi göstərilir.
İki dil. Sayt Azərbaycan və İngilis dillərini dəstəkləyir. AI xatırlatması da seçilmiş dildə gəlir.
Canlı yenilənmə. İşçi cavab verəndə menecer paneli Server-Sent Events (SSE) ilə eyni anda yenilənir.
Oflayn demo rejimi. Backend olmadan (məsələn GitLab Pages-də) sayt eyni məntiqi brauzerdə işlədir və "Oflayn demo" nişanı göstərir.
Texnologiyalar
Qat	Texnologiya
Backend	Python, FastAPI, Uvicorn, Pydantic
Verilənlər bazası	SQLite
AI	Google Gemini (`google-genai`)
Frontend	React 18 (CDN + Babel), Tailwind CSS (CDN), sadə HTML/CSS/JS, build addımı yoxdur
Canlı axın	Server-Sent Events
Test	pytest, httpx
Deploy	Docker, GitLab CI/CD, GitLab Pages
Layihə strukturu
```
NeuroBridge/
├── cp4/                      # Əsas layihə (FastAPI + frontend)
│   ├── app/
│   │   ├── main.py           # API marşrutları, SSE axını, statik fayllar
│   │   ├── core.py           # SQLite, seed data, K-anonim aqreqasiya
│   │   ├── ai\_engine.py      # Gemini prompt, cavabın doğrulanması, fallback
│   │   └── schemas.py        # Pydantic sxemləri (məxfilik yoxlaması daxil)
│   ├── static/               # index.html, app.js, styles.css
│   ├── tests/test\_core.py    # Avtomatik testlər
│   ├── simulator.py          # IDE simulyatoru
│   ├── Dockerfile
│   ├── .gitlab-ci.yml
│   └── requirements.txt
└── contextpulse\_ai/          # İlk prototip (Streamlit, mock data)
```
Mühit tələbləri
Python 3.12 və ya daha yeni (Docker və CI 3.12 istifadə edir)
pip və venv
İnternet bağlantısı (paketləri yükləmək və Gemini üçün)
İstəyə görə: Docker
İstəyə görə: Gemini API açarı. Açar olmadan da sistem işləyir, AI xatırlatması hazır mətnlə əvəz olunur.
Frontend üçün Node.js və ya build addımı lazım deyil. React, Tailwind və fontlar CDN-dən yüklənir, ona görə brauzer internetə qoşulu olmalıdır.
Quraşdırma və işə salma
Bütün komandalar `cp4/` qovluğundan icra olunur.
1. Asılılıqları yüklə
Windows (PowerShell):
```powershell
cd cp4
python -m venv .venv
.venv\\Scripts\\Activate.ps1
pip install -r requirements.txt
```
macOS / Linux:
```bash
cd cp4
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```
2. Mühit dəyişənlərini təyin et (istəyə görə)
`cp4/` qovluğunda `.env` faylı yarat:
```env
GEMINI\_API\_KEY=your\_api\_key\_here
GEMINI\_MODEL=gemini-3.5-flash
DB\_PATH=contextpulse.db
```
Dəyişən	Məcburidir?	Təsvir	Standart
`GEMINI\_API\_KEY`	Xeyr	Gemini açarı. Yoxdursa hazır mətn (fallback) istifadə olunur	yoxdur
`GEMINI\_MODEL`	Xeyr	İstifadə olunan Gemini modeli	`gemini-3.5-flash`
`DB\_PATH`	Xeyr	SQLite faylının yolu	`contextpulse.db`
`PORT`	Xeyr	Yalnız Docker-də: server portu	`8000`
> \*\*Diqqət:\*\* `.env` faylını heç vaxt Git-ə əlavə etməyin və başqaları ilə paylaşmayın. `.gitignore` onu artıq istisna edir. Açarı səhvən paylaşmısınızsa, Google AI Studio-da yenisini yaradın.
>
> Uvicorn `.env` faylını avtomatik oxumur. Dəyişənləri terminalda təyin edin (məsələn PowerShell: `$env:GEMINI\_API\_KEY="..."`, Linux/macOS: `export GEMINI\_API\_KEY=...`) və ya VS Code-dakı hazır `ContextPulse: API server` konfiqurasiyasından istifadə edin, o `.env`-i yükləyir.
3. Serveri başlat
```bash
uvicorn app.main:app --reload --port 8000
```
Sonra brauzerdə açın: http://localhost:8000
İlk başlanğıcda sistem verilənlər bazasını yaradır və demo məlumatlarını (seed) yükləyir. Terminalda AI mühərrikinin vəziyyəti yazılır: Gemini konfiqurasiya olunub, yoxsa hazır mətn istifadə olunacaq.
Demo giriş məlumatları
Rol	E-poçt	Parol
İşçi	`dev@company.com`	`emp123`
Menecer	`manager@company.com`	`admin123`
Bunlar yalnız demo üçündür. İşçi yalnız İşçi Panelinə, menecer yalnız Menecer Panelinə daxil ola bilər.
Demo ssenarisi
Brauzerdə `http://localhost:8000` açın və dili AZ / EN düyməsi ilə dəyişin.
Bir pəncərədə menecer, digərində işçi kimi daxil olun.
İşçi panelində Fasilə / Uzaqlaşmanı Simulyasiya Et düyməsini basın. AI son konteksti bərpa edən qısa xatırlatma göstərir.
Fasilə səbəbini seçib qeyd edin. Menecer panelində say canlı artır.
Bir kateqoriya K = 5 həddinə çatanda gizli qrup görünür və bildiriş çıxır.
IDE simulyatoru
Backend işləyərkən ikinci terminalda (eyni virtual mühitdə):
```bash
python simulator.py events --interval 5      # IDE hadisə axını, işçi paneli canlı yenilənir
python simulator.py answer MEETING\_LOAD      # menecer panelinə 1 anonim cavab
python simulator.py reset                    # demo məlumatını sıfırlayır
```
Başqa ünvan üçün `--url http://host:port` əlavə edin. Mümkün kateqoriyalar: `PR\_REVIEW\_WAIT`, `CI\_FLAKY`, `MEETING\_LOAD`, `UNCLEAR\_REQUIREMENTS`, `TOOLING`.
Testlər
```bash
python -m pytest -q
```
Testlər K-anonimlik məntiqini, məxfilik yoxlamasını (`422` cavabları), AI cavabının doğrulanmasını və iki dildə xatırlatmanı yoxlayır. Testlər yaddaşdakı verilənlər bazası ilə işləyir və `GEMINI\_API\_KEY` tələb etmir.
Docker ilə işə salma
```bash
cd cp4
docker build -t contextpulse-ai .
docker run -p 8000:8000 --env-file .env contextpulse-ai
```
`.env` faylı yoxdursa `--env-file .env` hissəsini silin, sistem hazır mətnlə işləyəcək. Konteyner `PORT` dəyişənini qəbul edir (standart `8000`), verilənlər bazası konteynerin `/tmp` qovluğundadır.
CI/CD (GitLab)
`.gitlab-ci.yml` üç mərhələdən ibarətdir:
test: `pip install -r requirements.txt` və `pytest`
build: Docker image yığılır və GitLab Container Registry-yə göndərilir (yalnız default branch)
pages: `static/` qovluğu GitLab Pages-ə çıxarılır. Backend olmadığı üçün bu versiya Oflayn demo rejimində işləyir.
API
Metod	Yol	Təsvir
GET	`/api/health`	Server vəziyyəti
GET	`/api/bootstrap`	İşçinin son hadisəsi və komanda məlumatı
POST	`/api/events`	IDE metadata hadisəsi qəbulu (`202`)
GET	`/api/snapshot/{developer\_ref}`	İşçinin son hadisəsi
POST	`/api/reminder`	AI xatırlatması (`lang`: `az` / `en`)
POST	`/api/survey`	Anonim fasilə səbəbi cavabı
GET	`/api/team/blockers`	K-anonim menecer məlumatı
POST	`/api/demo/reset`	Demo məlumatını sıfırla
GET	`/api/stream`	SSE canlı axını (`event` və `team` hadisələri)
Swagger sənədləşməsi: `http://localhost:8000/docs`
Məxfilik prinsipləri
Yalnız IDE və PR metadatası toplanır. Hadisədəki `privacy` sahələrinin hamısı `false` olmalıdır, əks halda sorğu rədd edilir.
Sxemdə olmayan sahələr (məsələn kod məzmunu) qəbul edilmir.
Menecer məlumatında fərdi identifikator və sərbəst mətn yoxdur.
K = 5-dən az cavabı olan qruplar gizlədilir və onların dəqiq sayı göstərilmir.
AI-ya yalnız doğrulanmış metadata JSON-u göndərilir. `privacy` və `source` sahələri prompta daxil edilmir.
İlk prototip (Streamlit)
`contextpulse\_ai/` qovluğu layihənin ilk Streamlit prototipidir və mock JSON məlumatlarından istifadə edir. Əsas versiya `cp4/`-dür. Prototip `app.py`-də mövcud olmayan `CPAI` paketini import etdiyi üçün olduğu kimi işə düşməyə bilər. İşlətmək istəsəniz, həmin sətri `from ai\_engine import generate\_reentry\_message` ilə əvəz edib `pip install -r requirements.txt` və `streamlit run app.py` icra edin.
Komanda
Code of War · NeuroBridge Hackathon
Mikayıl Məvsumzadə · Elgün Hüseynli · Nuran Əliyev
