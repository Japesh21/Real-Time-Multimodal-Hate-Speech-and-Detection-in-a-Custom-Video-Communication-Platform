from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.moderation_api import router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
    "https://meeting-lemon.vercel.app",
    "http://localhost:5173"
],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

@app.get("/")
def root():
    return { "status": "AI Moderation Service Running ✅" }

@app.get("/health")
def health():
    return {"status": "ok"}