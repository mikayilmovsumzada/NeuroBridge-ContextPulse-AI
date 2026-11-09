import os

# Hər test modulundan ƏVVƏL: testlər yaddaşdakı bazadan istifadə etsin (real contextpulse.db-yə toxunmasın)
# və .env-dən açar götürüb real Gemini/Claude-a sorğu göndərməsin.
os.environ["DB_PATH"] = ":memory:"
os.environ["GEMINI_API_KEY"] = ""
os.environ["ANTHROPIC_API_KEY"] = ""
# IDE/simulyator açarı: testlər .env-dəkindən asılı olmasın
os.environ["INGEST_KEY"] = "test-ingest-key"
# Testlər .env-dəki hesablardan asılı olmasın: demo hesabları sabitləyirik.
os.environ["DEMO_EMPLOYEE_EMAIL"] = "dev@company.com"
os.environ["DEMO_EMPLOYEE_PASSWORD"] = "emp123"
os.environ["DEMO_MANAGER_EMAIL"] = "manager@company.com"
os.environ["DEMO_MANAGER_PASSWORD"] = "admin123"
# Mövcud testlər eyni "testclient" ünvanından çox sayda giriş edir: limit standart olaraq söndürülür,
# limit testləri (test_public_demo.py) onu monkeypatch ilə yandırır. İctimai demo rejimi də standart olaraq sönülüdür.
os.environ["RATE_LIMIT_ENABLED"] = "0"
os.environ["DEMO_MODE"] = "0"
os.environ["DISABLE_DOCS"] = "0"
os.environ.pop("TRUSTED_PROXY", None)
os.environ.pop("AI_DAILY_LIMIT", None)
