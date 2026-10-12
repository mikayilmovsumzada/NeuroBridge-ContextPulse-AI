import os

# Hər test modulundan ƏVVƏL: testlər yaddaşdakı bazadan istifadə etsin (real contextpulse.db-yə toxunmasın)
# və .env-dən açar götürüb real Gemini-yə sorğu göndərməsin.
os.environ["DB_PATH"] = ":memory:"
os.environ["GEMINI_API_KEY"] = ""
