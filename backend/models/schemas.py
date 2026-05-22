from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


# ── Enums ─────────────────────────────────────────────────────────────────────

class Role(str, Enum):
    user = "user"
    host = "host"

class JobType(str, Enum):
    full_time  = "full-time"
    part_time  = "part-time"
    contract   = "contract"
    internship = "internship"
    remote     = "remote"

class ExperienceLevel(str, Enum):
    entry  = "entry"
    mid    = "mid"
    senior = "senior"
    lead   = "lead"


# ── Auth ──────────────────────────────────────────────────────────────────────

class SignUpRequest(BaseModel):
    name:     str       = Field(..., min_length=2, max_length=80)
    email:    EmailStr
    password: str       = Field(..., min_length=6)
    role:     Role      = Role.user

class LoginRequest(BaseModel):
    email:    EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type:   str = "bearer"
    role:         str
    name:         str
    user_id:      str


# ── Job ───────────────────────────────────────────────────────────────────────

class SalaryRange(BaseModel):
    min:      Optional[int] = None
    max:      Optional[int] = None
    currency: str           = "INR"

class JobCreate(BaseModel):
    title:            str            = Field(..., min_length=3, max_length=120)
    description:      str            = Field(..., min_length=20)
    company:          str            = Field(..., min_length=2)
    location:         str            = Field(..., min_length=2)
    job_type:         JobType        = JobType.full_time
    experience_level: ExperienceLevel = ExperienceLevel.mid
    category:         str            = "General"
    skills:           List[str]      = []
    salary:           Optional[SalaryRange] = None
    is_active:        bool           = True

class JobUpdate(BaseModel):
    title:            Optional[str]            = None
    description:      Optional[str]            = None
    company:          Optional[str]            = None
    location:         Optional[str]            = None
    job_type:         Optional[JobType]        = None
    experience_level: Optional[ExperienceLevel] = None
    category:         Optional[str]            = None
    skills:           Optional[List[str]]      = None
    salary:           Optional[SalaryRange]    = None
    is_active:        Optional[bool]           = None

class JobOut(BaseModel):
    id:               str
    title:            str
    description:      str
    company:          str
    location:         str
    job_type:         str
    experience_level: str
    category:         str
    skills:           List[str]
    salary:           Optional[SalaryRange]
    is_active:        bool
    host_id:          str
    posted_at:        datetime
    updated_at:       Optional[datetime] = None


# ── Applications ──────────────────────────────────────────────────────────────

class ApplicationCreate(BaseModel):
    full_name:   str       = Field(..., min_length=2, max_length=100)
    email:       EmailStr
    phone:       str       = Field(..., min_length=7, max_length=20)
    cover_letter: Optional[str] = Field(None, max_length=2000)
    resume_link: Optional[str]  = Field(None, max_length=500)
    years_of_experience: Optional[int] = Field(None, ge=0, le=60)

class ApplicationStatus(str, Enum):
    pending     = "pending"
    reviewed    = "reviewed"
    shortlisted = "shortlisted"
    rejected    = "rejected"


# ── Search ────────────────────────────────────────────────────────────────────

class JobSearchParams(BaseModel):
    q:                Optional[str]            = None   # free-text
    location:         Optional[str]            = None
    job_type:         Optional[JobType]        = None
    experience_level: Optional[ExperienceLevel] = None
    category:         Optional[str]            = None
    salary_min:       Optional[int]            = None
    salary_max:       Optional[int]            = None
    page:             int                      = Field(1, ge=1)
    page_size:        int                      = Field(10, ge=1, le=50)
