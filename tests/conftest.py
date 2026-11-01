import os

# Hər test modulundan ƏVVƏL: testlər yaddaşdakı bazadan istifadə etsin (real contextpulse.db-yə toxunmasın)
# və .env-dən açar götürüb real Gemini-yə sorğu göndərməsin.
os.environ["DB_PATH"] = ":memory:"
os.environ["GEMINI_API_KEY"] = ""
# Testlər .env-dəki hesablardan asılı olmasın: demo hesabları sabitləyirik.
os.environ["DEMO_EMPLOYEE_EMAIL"] = "dev@company.com"
os.environ["DEMO_EMPLOYEE_PASSWORD"] = "emp123"
os.environ["DEMO_MANAGER_EMAIL"] = "manager@company.com"
os.environ["DEMO_MANAGER_PASSWORD"] = "admin123"
