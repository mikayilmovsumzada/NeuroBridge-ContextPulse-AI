# ContextPulse AI

> ContextPulse AI proqramçı fasilədən qayıdanda kontekst itkisini azaldan və komanda rəhbərinə tıxanmaları işçini izləmədən göstərən platformadır. Sistem yalnız IDE və Pull Request metadatası ilə işləyir: ekran çəkilmir, klaviatura izlənmir, kod məzmunu oxunmur.

ContextPulse AI [NexusWeb](https://github.com/mikayilmovsumzada/NexusWeb-) ekosisteminin ilk məhsuludur və hazırda **hazırlanma mərhələsindədir**.

**Komanda:** Nuran Əliyev (ideyanın müəllifi), Elgün Hüseynli, Mikayıl Mövsümzadə.

## Problem və həll

Proqramçı toplantıdan və ya qısa fasilədən sonra harada qaldığını xatırlamaq üçün vaxt itirir. Komanda rəhbəri isə tıxanmaların (blocker) səbəbini görmür, çünki fərdi işçini izləmək etik və hüquqi problem yaradır. ContextPulse AI iki problemi bir dövrədə həll edir:

1. **İşçi üçün:** fasilədən qayıdan kimi AI son işi qısa xatırlatma ilə bərpa edir: son dəyişdirilən funksiya, açıq xəta, uğursuz test, PR-dəki həll olunmamış şərhlər.
2. **Menecer üçün:** komanda səviyyəsində tıxanmalar K-anonimlik qaydası ilə göstərilir və menecer onlar üzərində tədbir qeydi aça, komandaya elan göndərə bilər.
3. **Dövrə qapanır:** işçi öz panelində menecerin elanlarını və tıxanmalar üzrə görülən tədbirləri canlı görür.

## Əsas xüsusiyyətlər

- **Yalnız metadata.** Ekran qeydi, klaviatura məzmunu və ya mənbə kodu olan hadisələr serverdə rədd edilir.
- **Saniyələr içində geri dönüş.** Xatırlatmanı Gemini və ya Claude yazır. Cavab avtomatik yoxlanılır: içində olmayan fayl, funksiya, xəta kodu və ya PR nömrəsi varsa, hazır mətn göstərilir.
- **K-anonimlik.** Qrup yalnız ən azı K = 5 cavab toplayanda menecerə görünür. Daha az olanlar "gizlədilib" kimi göstərilir və dəqiq sayı açıqlanmır.
- **Tədbir izləmə (menecer).** Görünən hər tıxanma üçün status (Araşdırılır, Tədbir planlanıb, Həll olunub), məsul komanda və qısa qeyd.
- **Komandaya elan (menecer).** Elan bütün işçilərin panelində canlı görünür və heç vaxt fərdi işçiyə ünvanlanmır.
- **İki dil.** Azərbaycan və ingilis dili. AI xatırlatması da seçilmiş dildə gəlir.
- **Canlı yenilənmə.** Cavablar, tədbir qeydləri və elanlar açıq pəncərələrdə səhifəni yeniləmədən görünür.
- **Oflayn demo.** Server olmadan da brauzerdə sınamaq üçün demo rejimi var. Bu rejimdə AI əvəzinə hazır mətnlər istifadə olunur.

## Məxfilik prinsipləri

- Yalnız IDE və PR metadatası toplanır. Kod məzmunu heç vaxt qəbul edilmir.
- Menecer heç bir fərdi işçinin məlumatını görmür. Bütün göstəricilər komanda səviyyəsindədir.
- K = 5-dən az cavabı olan qruplar gizlədilir və onlar üzərində tədbir və ya elan açmaq olmur. Hər işçinin yalnız bir (son) cavabı sayılır.
- AI-ya yalnız yoxlanılmış metadata göndərilir.
- Tətbiq kuki qoymur, analitika və izləmə aləti istifadə etmir.

## Texnologiyalar

| Qat | Texnologiya |
|---|---|
| Backend | Python, FastAPI, Uvicorn, Pydantic |
| Verilənlər bazası | SQLite |
| AI | Google Gemini, Anthropic Claude |
| Frontend | React 18, Tailwind CSS |
| Canlı axın | Server-Sent Events |

## Sınamaq

Python 3.12 və ya daha yeni versiya tövsiyə olunur.

**Windows (PowerShell):**

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m uvicorn app.main:app --port 8000
```

**macOS / Linux:**

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python -m uvicorn app.main:app --port 8000
```

Sonra brauzerdə `http://localhost:8000` ünvanını açın. AI açarı olmadan da işləyir, onda hazır mətnlər göstərilir. AI-ı aktivləşdirmək üçün `.env.example` faylını `.env` adı ilə kopyalayın və Gemini və ya Claude açarınızı yazın. Bütün ayarlar həmin faylda izah olunub.

Docker ilə:

```bash
docker build -t contextpulse-ai .
docker run -p 8000:8000 contextpulse-ai
```

### Demo hesablar

| Rol | E-poçt | Parol |
|---|---|---|
| İşçi | `dev@company.com` | `emp123` |
| Menecer | `manager@company.com` | `admin123` |

### Demo ssenarisi

1. Dili AZ / EN düyməsi ilə seçin.
2. Bir pəncərədə menecer, digərində işçi kimi daxil olun.
3. İşçi panelində **Fasilə / Uzaqlaşmanı Simulyasiya Et** düyməsini basın. AI son işinizi xatırladan qısa mesaj göstərir.
4. Fasilə səbəbini seçib qeyd edin. Menecer panelində say canlı artır.
5. Bir kateqoriya 5 cavaba çatanda menecer onu görür və bildiriş alır.
6. Menecer tıxanmaya status və qeyd yazır, komandaya elan göndərir. İşçi hər ikisini öz panelində canlı görür.

### IDE simulyatoru

IDE genişləndirməsi hələ hazırlanır. Onu əvəz etmək üçün `simulator.py` IDE hadisələrini yaradır. `.env`-də `INGEST_KEY` təyin edin, server işləyərkən ikinci terminalda simulyatoru işə salın:

```bash
python simulator.py events --interval 5      # IDE hadisə axını
python simulator.py answer MEETING_LOAD      # menecer panelinə 1 anonim cavab
python simulator.py reset                    # demo məlumatını sıfırlayır
```

## API

| Metod | Yol | Təsvir |
|---|---|---|
| GET | `/api/health` | Server vəziyyəti |
| POST | `/api/events` | IDE metadata hadisəsi (`X-Ingest-Key` tələb edir) |
| POST | `/api/reminder` | AI xatırlatması (`az` / `en`) |
| POST | `/api/auth/login` | Giriş (işçi və ya menecer) |
| POST | `/api/survey` | Anonim fasilə səbəbi |
| GET | `/api/team/blockers` | K-anonim komanda tıxanmaları |
| PUT | `/api/team/blockers/{category}/action` | Tıxanma üzrə tədbir (menecer) |
| POST | `/api/team/messages` | Komandaya elan (menecer) |
| GET | `/api/announcements` | Son elanlar |
| GET | `/api/stream` | Canlı axın (SSE) |

## Hazırkı məhdudiyyətlər

- IDE genişləndirməsi hələ yoxdur. Hadisələr simulyator vasitəsilə yaradılır.
- Bu versiya demo üçündür. Real şəxsi məlumatla istifadə etməyin.
- K-anonimlik zamanla aparılan müşahidələrə qarşı tam qoruma vermir.

## Lisenziya

© 2026 Mikayıl Mövsümzadə. Mənbə kodu [GNU Affero General Public License v3.0](LICENSE) (AGPL-3.0) lisenziyası ilə paylanır. Kodu dəyişib şəbəkə üzərindən xidmət kimi təqdim etsəniz, dəyişdirilmiş mənbə kodunu da həmin şərtlərlə istifadəçilərə açmalısınız. Lisenziya ContextPulse AI və NexusWeb adlarından istifadə hüququ vermir.

## Əlaqə

Sual və təkliflər üçün: [movsumzademikayil@gmail.com](mailto:movsumzademikayil@gmail.com) və ya bu repoda [issue](https://github.com/mikayilmovsumzada/ContextPulse-AI/issues) açın.
