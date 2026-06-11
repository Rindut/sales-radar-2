# Sherlock Social Enrichment — Implementation Plan

**Status:** Draft for review
**Owner:** Product (Rina) + Backend
**Date:** 2026-06-11
**Decision context:** Sherlock dipakai sebagai **enrichment layer**, bukan discovery source. Discovery tetap Apollo. Tujuannya: lengkapin profil kontak yang sudah ada dengan jejak sosial publik, opt-in per lead.

---

## 1. Ringkasan keputusan

| Aspek | Keputusan | Alasan |
|---|---|---|
| Peran Sherlock | Enrichment, bukan discovery | Apollo sudah handle company + contact. Sherlock butuh username, bukan nama. |
| Site scope | ~12 situs (profesional + sosial) | Balance antara sinyal dan runtime. Full 400+ ditolak: lambat, false positive tinggi, surface compliance gede. |
| Trigger | Manual button di lead detail | Kontrol penuh atas resource. Sejalan dengan prinsip "outreach is manual" di CLAUDE.md. |
| Integrasi | On-demand per lead, async, cached | Sherlock 10-60s/username, tidak boleh masuk pipeline bulk refresh. |
| Ekspektasi | Modul opsional, hit rate diukur | Untuk ICP bank, hit rate kemungkinan rendah. Ada kill criteria di Section 10. |

---

## 2. Masalah inti yang harus diselesaikan dulu

Sherlock menerima **username string**, bukan nama orang. Apollo (`Contact` model) memberi `name`, `linkedin_url`, `email`, `phone`. Tidak ada username.

Artinya ada satu komponen baru yang harus dibangun di tengah: **username derivation**. Ini bagian engineering yang paling nyata, bukan integrasi Sherlock-nya sendiri.

Kualitas derivation menentukan confidence hasil:

| Sumber username | Contoh | Confidence |
|---|---|---|
| Email local-part (exact) | `budi.santoso@bca.co.id` → `budi.santoso` | **high** |
| Email local-part (normalized) | → `budisantoso`, `bsantoso` | medium |
| LinkedIn slug | `/in/budi-santoso-92` → `budi-santoso` | medium |
| Permutasi nama | `budi.santoso`, `b.santoso`, `santoso.budi` | **low** |

**Aturan main:** hasil Sherlock dari username low-confidence di-treat sebagai *unverified signal*, bukan fakta. Ini penting buat outreach quality dan buat compliance story (Section 9).

---

## 3. Arsitektur: di mana nyangkutnya

Kode sudah punya pola enrichment on-demand per-lead. Sherlock masuk di situ, **bukan** di `_fetch_fresh_leads`.

```
DISCOVERY (Apollo, bulk)           ENRICHMENT (on-demand, per lead)
─────────────────────────         ──────────────────────────────────
discover_companies()               GET  /leads/{id}            ← Apollo contact resolve (existing)
  → icp_filter                     POST /leads/{id}/refresh-contacts  (existing)
  → scoring                        POST /leads/{id}/enrich-socials     ← NEW (Sherlock)
  → resolve_contact (Apollo)
  → store LeadRecord
```

Alasan kenapa wajib on-demand dan terpisah: Sherlock = ~400 (atau ~12 dengan whitelist) HTTP request per username. Kalau ditaruh di bulk refresh 10 lead, dashboard mati. Endpoint terpisah + manual trigger = resource terkontrol.

---

## 4. Site whitelist (12 situs)

Curated untuk sinyal profesional/B2B dulu, baru sosial. **Nama sudah divalidasi persis terhadap katalog Sherlock 0.16.0 (QA-2 selesai).**

**Profesional / kreator (sinyal kuat, dibiaskan ke orang L&D + content):** Twitter, Medium, About.me, Behance, SlideShare, WordPress, GitHub, DEV Community
**Sosial (sinyal lemah, konteks tambahan):** Instagram, YouTube, Reddit, tumblr

> **Hasil validasi katalog:** `Facebook`, `TikTok`, `Pinterest`, dan `Wellfound/AngelList` **tidak ada** di katalog Sherlock, jadi di-drop. `AboutMe` ternyata bernama `About.me`. Whitelist final 12 situs di atas semuanya terkonfirmasi ada. SlideShare ditambah karena paling relevan buat konteks L&D. Login-wall sites (Twitter, Instagram) tetap paling rentan false negative/positive, kandidat utama buat di-drop setelah ukur hit rate. NSFW tetap off (default Sherlock).
>
> **Catatan eksekusi:** console script `sherlock` belum tentu ada di PATH (kasus di env test, ke-install di `~/.local/bin`). Service otomatis fallback ke `python -m sherlock_project`. Output CSV punya kolom `username,name,url_main,url_user,exists,http_status,response_time_s` (terverifikasi), parser ambil baris `exists == "Claimed"`.

---

## 5. Perubahan data model

Additive. **Tidak perlu migrasi DB** karena `contacts` disimpan sebagai kolom JSON di `LeadRecord`.

`backend/models/schemas.py`:

```python
class SocialProfile(BaseModel):
    site: str                      # "GitHub", "Medium", ...
    url: str
    source: str                    # "email_localpart" | "linkedin_slug" | "name_permutation"
    username: str                  # handle yang dipakai
    confidence: str                # "high" | "low"

class Contact(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    linkedin_url: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    enrichment_warning: Optional[str] = None
    social_profiles: List[SocialProfile] = Field(default_factory=list)   # NEW
    socials_enriched_at: Optional[datetime] = None                       # NEW
```

Karena `_record_to_lead` dan `_upsert_lead` sudah serialize `contacts` via `.dict()` / `Contact(**c)`, field baru ikut otomatis. Yang perlu dicek: record lama tanpa field ini harus default ke list kosong (Pydantic handle via default_factory).

---

## 6. Service baru: `services/sherlock_enrich.py`

Tanggung jawab: derive username → jalankan Sherlock (subprocess, whitelist, timeout) → parse hasil → cache.

```python
# Kontrak fungsi utama
async def enrich_contact_socials(contact: Contact) -> List[SocialProfile]:
    """
    1. Derive candidate usernames (Section 2) dengan confidence masing-masing.
    2. Untuk tiap username: cek cache. Kalau miss, jalankan Sherlock.
    3. Gabung hasil, dedup by (site, url), set confidence dari sumber username.
    """

def derive_usernames(contact: Contact) -> List[tuple[str, str, str]]:
    """Return list of (username, source, confidence). High-confidence dulu."""

async def _run_sherlock(username: str, sites: list[str], timeout: int = 10) -> list[dict]:
    """Subprocess call. Parse CSV output. Return rows yang 'Claimed'."""
```

**Eksekusi Sherlock (rekomendasi: subprocess, bukan import).**
Subprocess mengisolasi dependency dan update site-data Sherlock dari kode utama.

```
sherlock <username> \
  --site Twitter --site GitHub ... \
  --timeout 10 \
  --csv \
  --folderoutput <tmp_dir> \
  --print-found --no-color
```

Lalu parse CSV di `<tmp_dir>/<username>.csv`, ambil baris dengan kolom `exists == "Claimed"`. Field yang dipakai: `name` (situs), `url_user`.

> **Verifikasi saat implementasi:** format output CSV v0.16.0 harus dicek langsung (kolom: `username, name, url_main, url_user, exists, http_status, response_time_s`). Jangan asumsikan; jalankan sekali manual dulu.

**Guardrails:**
- Hard timeout total per contact (mis. 25s) lewat `asyncio.wait_for`, supaya satu username lambat nggak nge-hang request.
- Batasi jumlah candidate username per contact (mis. maks 4: 1 high + 3 low).
- Subprocess dijalankan via `asyncio.create_subprocess_exec`, bukan blocking.

**Caching (wajib):**
- Cache key = `username`. Value = list hasil + timestamp.
- TTL ~30 hari. Username yang sama nggak pernah di-run dua kali dalam window itu.
- Implementasi awal: tabel `sherlock_cache` di SQLite (`username TEXT PK, results_json, fetched_at`). Reuse pola `db.py` yang ada.

---

## 7. Endpoint baru

`backend/routers/leads.py`:

```python
@router.post("/{company_id}/enrich-socials", response_model=Lead)
async def enrich_lead_socials(company_id: str, session: AsyncSession = Depends(get_session)):
    """
    Untuk tiap contact di lead, jalankan Sherlock enrichment.
    Update contact.social_profiles + socials_enriched_at. Persist ke DB.
    Idempotent: kalau socials_enriched_at masih fresh (< TTL), skip & return cache.
    """
```

Pola sama persis dengan `refresh_lead_contacts` yang sudah ada: load record → proses → `_upsert_lead` → commit → return `Lead`. Jangan reset `is_saved`/`is_rejected` (konsisten dengan komentar di `_upsert_lead`).

---

## 8. Frontend: button di lead detail

`frontend/pages/leads/[id].tsx`:
- Tombol **"Enrich socials"** per contact card (atau per-lead untuk semua contact sekaligus).
- State: idle → loading (spinner, bisa 10-25s) → done. Kasih ekspektasi waktu ke user ("Checking public profiles...").
- Render `social_profiles` sebagai chip/link. Tampilkan badge confidence: high = solid, low = outline + tooltip "unverified, derived from name".
- Tombol disabled kalau `socials_enriched_at` masih fresh; kasih opsi "re-run".

`frontend/lib/api.ts`: tambah `enrichSocials(companyId)`.

---

## 9. Compliance & PDP (kritikal — lo yang handle security questionnaire bank)

Ini yang bakal ditanya auditor IT bank. Harus defensible sebelum fitur jalan.

- **Sumber tercatat.** Tiap `SocialProfile` simpan `source` + `username`. Jawaban audit: "derived from public business email handle, verified public profile existence, no content scraping."
- **Public existence only.** Sherlock hanya cek apakah profil publik *ada*. Tidak menyimpan isi/konten. Dokumentasikan ini.
- **NSFW off.** Pertahankan default.
- **Right to erasure (UU PDP).** Sediakan cara hapus `social_profiles` per contact. Karena tersimpan di JSON, cukup endpoint clear + clear cache by username.
- **Internal use only.** Data tidak dikirim keluar, tidak masuk outreach otomatis. Outreach tetap manual.
- **Disclaimer di UI** untuk low-confidence: "unverified, may not be this person."

---

## 10. Rollout & kill criteria

Jangan over-invest di source yang ICP-nya tipis. Ukur dulu.

1. **Phase 1 (build + internal test):** implement, jalankan di 50 lead pertama.
2. **Metrik yang diukur:**
   - Hit rate: % contact yang dapat minimal 1 high-confidence profile.
   - Usefulness rate: % hasil yang beneran kepake AM buat outreach (survei cepat ke tim sales).
   - Avg runtime per contact.
3. **Kill criteria:** kalau high-confidence hit rate < ~10% atau usefulness rate rendah setelah 50 lead, matiin fitur. Jangan dipaksain.
4. **Keep criteria:** kalau ada segmen yang hit-nya bagus (mis. prospek di perusahaan tech/startup vs bank), batasi fitur ke segmen itu.

---

## 11. Ticket breakdown

### Backend

| # | Ticket | Detail | Est |
|---|---|---|---|
| BE-1 | Tambah `SocialProfile` + extend `Contact` | `schemas.py`. Pastikan record lama default ke list kosong. | S |
| BE-2 | `derive_usernames()` | Email local-part (exact + normalized), LinkedIn slug, permutasi nama. Return (username, source, confidence). Unit test. | M |
| BE-3 | `_run_sherlock()` subprocess wrapper | `asyncio.create_subprocess_exec`, `--site` whitelist, `--csv`, timeout, parse CSV `Claimed` rows. | M |
| BE-4 | Cache layer | Tabel `sherlock_cache` di `db.py`, get/set by username, TTL 30 hari. | S |
| BE-5 | `enrich_contact_socials()` orchestrator | Gabung derive + cache + run, dedup, set confidence, total timeout guard. | M |
| BE-6 | Endpoint `POST /leads/{id}/enrich-socials` | Pola `refresh-contacts`. Idempotent via `socials_enriched_at`. | S |
| BE-7 | Endpoint clear socials (PDP) | Hapus `social_profiles` + cache by username. | S |
| BE-8 | Pin `sherlock-project==0.16.0` di requirements + verifikasi install di env | Cek warning distro package; pakai pip/pipx. | S |

### Frontend

| # | Ticket | Detail | Est |
|---|---|---|---|
| FE-1 | `enrichSocials()` di `api.ts` | Call endpoint baru. | S |
| FE-2 | Button + loading state di `[id].tsx` | Ekspektasi waktu 10-25s. Disable kalau fresh. | S |
| FE-3 | Render `social_profiles` | Chip/link + badge confidence + tooltip disclaimer. | S |
| FE-4 | UI clear socials (PDP) | Tombol hapus per contact. | S |

### QA / Ops

| # | Ticket | Detail |
|---|---|---|
| QA-1 | Verifikasi output CSV Sherlock v0.16.0 manual | Sebelum BE-3 final. |
| QA-2 | Validasi nama 12 situs vs katalog Sherlock | Tandai yang reliable. |
| QA-3 | Test timeout & subprocess kill | Pastikan nggak ada zombie process / hang. |
| OPS-1 | Dashboard metrik hit rate (Section 10) | Buat keputusan keep/kill. |

---

## 12. Risiko

| Risiko | Mitigasi |
|---|---|
| Hit rate rendah untuk ICP bank | Kill criteria Section 10. Modul opsional sejak awal. |
| False positive (username generik tabrakan) | Confidence model. Low-confidence ditandai unverified. |
| Compliance pushback dari klien bank | Section 9. Public-existence-only, source log, PDP erasure. |
| Runtime nge-hang request | Hard timeout total + subprocess kill + cache. |
| Maintenance churn (situs Sherlock sering breaking) | Whitelist kecil = surface kecil. Pin versi. |
| Login-wall sites (X/IG/FB) tidak reliable | Tandai saat QA-2. Boleh drop kalau noise. |

---

## 13. Yang sengaja TIDAK dilakukan

- Tidak dipakai sebagai discovery source.
- Tidak masuk bulk `_fetch_fresh_leads`.
- Tidak auto-run tanpa trigger user.
- Tidak scraping konten profil, hanya cek keberadaan.
- Tidak cek 400+ situs.
- Tidak feed hasil ke outreach otomatis.
