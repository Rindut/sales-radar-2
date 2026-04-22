from openai import AsyncOpenAI
from models.schemas import Company, Contact, LeadScore, OutreachDraft
from config import OPENAI_API_KEY, BAWANA_CONTEXT
from typing import Optional

_has_key = bool(OPENAI_API_KEY and OPENAI_API_KEY != "your_openai_api_key_here")
client = AsyncOpenAI(api_key=OPENAI_API_KEY) if _has_key else None


def _mock_draft(company: Company, contact: Optional[Contact], channel: str) -> OutreachDraft:
    first_name = contact.name.split()[0] if contact and contact.name else "Bapak/Ibu"
    industry = company.industry or "perusahaan Anda"

    templates = {
        "linkedin": (
            f"Halo {first_name}, saya dari Bawana — platform LXP B2B yang membantu perusahaan "
            f"di industri {industry} meningkatkan efektivitas dan engagement learning karyawan. "
            f"Boleh saya share bagaimana kami membantu perusahaan serupa?"
        ),
        "email": (
            f"Halo {first_name},\n\n"
            f"Saya menghubungi Anda karena {company.name} memiliki profil yang sangat relevan "
            f"dengan solusi yang kami kembangkan di Bawana.\n\n"
            f"Bawana adalah platform LXP B2B yang membantu perusahaan enterprise di Indonesia "
            f"merancang pengalaman belajar yang lebih engaging — dari structured courses, "
            f"learning journey, hingga content production dalam Bahasa Indonesia.\n\n"
            f"Apakah ada waktu 20 menit minggu ini untuk saya ceritakan lebih lanjut?\n\n"
            f"Salam,\nTim Sales Bawana"
        ),
        "whatsapp": (
            f"Halo {first_name}, saya dari Bawana LXP. "
            f"Kami bantu perusahaan seperti {company.name} tingkatkan efektivitas training karyawan. "
            f"Boleh terhubung sebentar?"
        ),
    }

    return OutreachDraft(
        company_id=company.id,
        channel=channel,
        subject=f"Solusi Learning Platform untuk {company.name}" if channel == "email" else None,
        message=templates.get(channel, templates["linkedin"]),
        tips=[
            "Personalisasi dengan menyebut tantangan spesifik industri mereka sebelum kirim",
            "Kirim di Selasa-Kamis pagi (08.00-10.00) untuk response rate lebih tinggi",
        ],
    )


async def generate_outreach_draft(
    company: Company,
    score: LeadScore,
    contact: Optional[Contact],
    channel: str = "linkedin",
) -> OutreachDraft:
    if not client:
        return _mock_draft(company, contact, channel)

    contact_info = ""
    if contact:
        contact_info = f"Contact target:\n- Nama: {contact.name or 'tidak diketahui'}\n- Role: {contact.role or 'tidak diketahui'}\n"

    reasoning_text = "\n".join([f"- {r}" for r in score.reasoning])

    channel_instruction = {
        "linkedin": "Tulis LinkedIn message yang singkat, personal, tidak terkesan spam. Maksimal 300 karakter. Jangan pitch langsung.",
        "email": "Tulis email profesional dengan subject line menarik. Maksimal 150 kata. Struktur: hook -> konteks -> value proposition -> CTA.",
        "whatsapp": "Tulis pesan WhatsApp singkat dan conversational. Maksimal 200 karakter.",
    }.get(channel, "Tulis pesan singkat dan personal.")

    prompt = f"""Kamu adalah sales assistant dari Bawana, sebuah LXP B2B di Indonesia.

{BAWANA_CONTEXT}

Company: {company.name}
Industri: {company.industry or 'tidak diketahui'}
Ukuran: {company.employee_count or 'tidak diketahui'} karyawan
Lokasi: {company.location or 'tidak diketahui'}
Deskripsi: {company.description or 'tidak tersedia'}
{contact_info}

Alasan dipilih:
{reasoning_text}

Instruksi: {channel_instruction}

Tulis pesan yang personal, relevan, tidak langsung jualan, Bahasa Indonesia natural.
{"Tambahkan subject line." if channel == "email" else ""}

Format:
{"SUBJECT: [subject]" if channel == "email" else ""}
MESSAGE:
[pesan]

TIPS:
- [tip 1]
- [tip 2]"""

    response = await client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.7,
        max_tokens=600,
    )

    raw = response.choices[0].message.content or ""
    return _parse_response(raw, company.id, channel)


def _parse_response(raw: str, company_id: str, channel: str) -> OutreachDraft:
    subject = None
    message = ""
    tips = []
    section = None

    for line in raw.strip().split("\n"):
        s = line.strip()
        if s.startswith("SUBJECT:"):
            subject = s.replace("SUBJECT:", "").strip()
        elif s.startswith("MESSAGE:"):
            section = "message"
        elif s.startswith("TIPS:"):
            section = "tips"
        elif section == "message" and s:
            message += s + "\n"
        elif section == "tips" and s.startswith("-"):
            tips.append(s.lstrip("- ").strip())

    return OutreachDraft(
        company_id=company_id,
        channel=channel,
        subject=subject,
        message=message.strip(),
        tips=tips,
    )
