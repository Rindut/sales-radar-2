from openai import AsyncOpenAI
from models.schemas import Company, Contact, LeadScore, OutreachDraft
from config import OPENAI_API_KEY, BAWANA_CONTEXT
from typing import Optional

_has_key = bool(OPENAI_API_KEY and OPENAI_API_KEY != "your_openai_api_key_here")
client = AsyncOpenAI(api_key=OPENAI_API_KEY) if _has_key else None

SENDER_PROFILE = {
    "name": "Anna Savira",
    "position": "Sales Executive",
    "company": "Bawana",
    "email": "anna.savira@bawana.com",
    "phone": "+62 812-9278-9875",
}

SIGNATURE = {
    "linkedin": "Anna Savira | Sales Executive, Bawana",
    "email": (
        "Salam hangat,\n"
        "Anna Savira\n"
        "Sales Executive, Bawana\n"
        f"anna.savira@bawana.com | +62 812-9278-9875"
    ),
    "whatsapp": "- Anna (Bawana)",
}

ENGLISH_SIGNATURE = {
    "linkedin": "Anna Savira | Sales Executive, Bawana",
    "email": (
        "Warm regards,\n"
        "Anna Savira\n"
        "Sales Executive, Bawana\n"
        f"anna.savira@bawana.com | +62 812-9278-9875"
    ),
    "whatsapp": "- Anna (Bawana)",
}


def _is_indonesia_lead(company: Company) -> bool:
    location = (company.location or "").lower()
    return not location or "indonesia" in location


def _mock_draft(company: Company, contact: Optional[Contact], channel: str) -> OutreachDraft:
    use_indonesian = _is_indonesia_lead(company)
    first_name = contact.name.split()[0] if contact and contact.name else ("Bapak/Ibu" if use_indonesian else "there")
    industry = company.industry or ("perusahaan Anda" if use_indonesian else "your industry")

    if not use_indonesian:
        templates = {
            "linkedin": (
                f"Hi {first_name}, I am Anna from Bawana, a B2B LXP platform helping companies "
                f"in {industry} improve employee learning engagement. Would it be okay if I shared "
                f"how we support similar teams?"
            ),
            "email": (
                f"Hi {first_name},\n\n"
                f"I am reaching out because {company.name} looks highly relevant to the learning "
                f"challenges Bawana helps enterprise teams solve.\n\n"
                f"Bawana is a B2B LXP platform that helps companies create more engaging learning "
                f"experiences, from structured courses and learning journeys to content production.\n\n"
                f"Would you be open to a 20-minute conversation this week?\n\n"
                f"{ENGLISH_SIGNATURE['email']}"
            ),
            "whatsapp": (
                f"Hi {first_name}, I am Anna from Bawana LXP. We help companies like {company.name} "
                f"improve employee training effectiveness. Could we connect briefly? {ENGLISH_SIGNATURE['whatsapp']}"
            ),
        }
        return OutreachDraft(
            company_id=company.id,
            channel=channel,
            subject=f"Learning platform support for {company.name}" if channel == "email" else None,
            message=templates.get(channel, templates["linkedin"]),
            tips=[
                "Personalize the message with a specific business or learning challenge before sending",
                "Send on Tuesday to Thursday mornings for a higher response rate",
            ],
        )

    templates = {
        "linkedin": (
            f"Halo {first_name}, saya Anna dari Bawana — platform LXP B2B yang membantu perusahaan "
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
            f"{SIGNATURE['email']}"
        ),
        "whatsapp": (
            f"Halo {first_name}, saya Anna dari Bawana LXP. "
            f"Kami bantu perusahaan seperti {company.name} tingkatkan efektivitas training karyawan. "
            f"Boleh terhubung sebentar? {SIGNATURE['whatsapp']}"
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

    use_indonesian = _is_indonesia_lead(company)
    contact_info = ""
    if contact:
        contact_info = f"Contact target:\n- Nama: {contact.name or 'tidak diketahui'}\n- Role: {contact.role or 'tidak diketahui'}\n"

    reasoning_text = "\n".join([f"- {r}" for r in score.reasoning])

    if use_indonesian:
        channel_instruction = {
            "linkedin": "Tulis LinkedIn message yang singkat, personal, tidak terkesan spam. Maksimal 300 karakter. Jangan pitch langsung. Gunakan nama depan 'Anna' sebagai pengirim.",
            "email": "Tulis email profesional dengan subject line menarik. Maksimal 150 kata. Struktur: hook -> konteks -> value proposition -> CTA. Pisahkan setiap paragraf dengan satu baris kosong. Akhiri dengan signature lengkap.",
            "whatsapp": "Tulis pesan WhatsApp singkat dan conversational. Maksimal 200 karakter. Perkenalkan diri sebagai Anna dari Bawana.",
        }.get(channel, "Tulis pesan singkat dan personal.")
        signature_instruction = {
            "linkedin": f"Signature: {SIGNATURE['linkedin']}",
            "email": f"Gunakan signature ini persis:\n{SIGNATURE['email']}",
            "whatsapp": f"Akhiri dengan: {SIGNATURE['whatsapp']}",
        }.get(channel, "")
        language_instruction = "Bahasa Indonesia yang natural dan profesional"
    else:
        channel_instruction = {
            "linkedin": "Write a short, personal LinkedIn message that does not feel spammy. Maximum 300 characters. Do not hard-pitch. Use 'Anna' as the sender name.",
            "email": "Write a professional email with a compelling subject line. Maximum 150 words. Structure: hook -> context -> value proposition -> CTA. Separate every paragraph with one blank line. End with the full signature.",
            "whatsapp": "Write a short conversational WhatsApp message. Maximum 200 characters. Introduce yourself as Anna from Bawana.",
        }.get(channel, "Write a short and personal message.")
        signature_instruction = {
            "linkedin": f"Signature: {ENGLISH_SIGNATURE['linkedin']}",
            "email": f"Use this exact signature:\n{ENGLISH_SIGNATURE['email']}",
            "whatsapp": f"End with: {ENGLISH_SIGNATURE['whatsapp']}",
        }.get(channel, "")
        language_instruction = "Natural, professional English. Do not write in Indonesian."

    lead_context_label = "Indonesia-based" if use_indonesian else "international"

    prompt = f"""Kamu adalah sales assistant dari Bawana, sebuah LXP B2B di Indonesia.
Lead ini adalah lead {lead_context_label}. Jika lokasi company bukan Indonesia, semua draft outreach, subject, tips, dan CTA harus ditulis dalam bahasa Inggris.

{BAWANA_CONTEXT}

Pengirim pesan ini adalah:
- Nama: {SENDER_PROFILE['name']}
- Posisi: {SENDER_PROFILE['position']}
- Email: {SENDER_PROFILE['email']}
- No HP: {SENDER_PROFILE['phone']}

Company yang di-approach:
- Nama: {company.name}
- Industri: {company.industry or 'tidak diketahui'}
- Ukuran: {company.employee_count or 'tidak diketahui'} karyawan
- Lokasi: {company.location or 'tidak diketahui'}
- Deskripsi: {company.description or 'tidak tersedia'}
{contact_info}

Alasan company ini dipilih:
{reasoning_text}

Instruksi channel: {channel_instruction}

{signature_instruction}

Tulis pesan yang:
1. Personal dan tidak generik
2. Relevan dengan industri dan konteks perusahaan
3. Tidak langsung jualan — buka percakapan dulu
4. {language_instruction}
5. Sebutkan nama contact jika tersedia

Format response:
{"SUBJECT: [subject line]" if channel == "email" else ""}
MESSAGE:
[isi pesan]

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
    message_lines = []
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
        elif section == "message":
            message_lines.append(line.rstrip())
        elif section == "tips" and s.startswith("-"):
            tips.append(s.lstrip("- ").strip())

    message = "\n".join(message_lines).strip()

    return OutreachDraft(
        company_id=company_id,
        channel=channel,
        subject=subject,
        message=message,
        tips=tips,
    )
