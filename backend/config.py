from dotenv import load_dotenv
import os

load_dotenv()

APOLLO_API_KEY = os.getenv("APOLLO_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
DATABASE_URL = os.getenv("DATABASE_URL", "./sales_radar.db")

# Set DUMMY_MODE=true in .env to skip Apollo and use local dummy data
DUMMY_MODE = os.getenv("DUMMY_MODE", "false").lower() == "true"

# Default ICP — overridable via /settings
DEFAULT_ICP = {
    "industries": [
        "financial services",
        "banking",
        "insurance",
        "retail",
        "hospitality",
        "telecommunications",
    ],
    "employee_ranges": ["201,500", "501,1000", "1001,5000", "5001,10000"],
    "keywords": ["training", "learning", "HR", "talent", "employee development"],
    "locations": ["Indonesia"],
    "target_roles": [
        "Chief HR Officer",
        "Head of Learning",
        "Head of Training",
        "Learning & Development Manager",
        "HR Director",
        "Talent Development",
        "Chief People Officer",
    ],
}

BAWANA_CONTEXT = """
Bawana adalah platform LXP (Learning Experience Platform) B2B yang beroperasi di Indonesia, 
dibangun oleh Netpolitan. Bawana melayani enterprise clients, khususnya perbankan dan korporasi besar,
dengan dua core offering:
1. SaaS-based LXP Platform — untuk structured learning: courses, assignments, journeys, events
2. Content Production Services — konten e-learning reusable dan custom

Differentiator utama Bawana:
- Pengalaman belajar yang engaging seperti Netflix, bukan LMS yang kaku
- Lokal Indonesia, memahami compliance dan regulasi perbankan (OJK)
- Dukungan konten dalam Bahasa Indonesia
- ROI yang terukur: meningkatkan engagement, performance, dan business metrics
"""
