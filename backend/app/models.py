import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


# ── Input models ─────────────────────────────────────────────────────────────

class RequirementInput(BaseModel):
    text: str = Field(..., min_length=2, max_length=200)
    weight: int = Field(default=3, ge=1, le=5)


class ShortlistCreate(BaseModel):
    need: str = Field(..., min_length=10, max_length=500)
    requirements: List[RequirementInput] = Field(..., min_length=1, max_length=8)
    excluded_vendors: List[str] = Field(default_factory=list)


class ExcludeVendorRequest(BaseModel):
    vendor_name: str


# ── Output models ─────────────────────────────────────────────────────────────

class EvidenceLink(BaseModel):
    url: str
    snippet: str


class MatchedFeature(BaseModel):
    requirement: str
    satisfied: bool
    notes: str
    weight: int = 3


class VendorResult(BaseModel):
    name: str
    website: str
    priceRange: str
    matchedFeatures: List[MatchedFeature]
    risks: List[str]
    evidenceLinks: List[EvidenceLink]
    overallScore: int
    matchScore: int
    tags: List[str] = Field(default_factory=list)
    excluded: bool = False


class ShortlistResult(BaseModel):
    vendors: List[VendorResult]
    summary: str
    recommendation: str
    markdownReport: Optional[str] = None


class ShortlistResponse(BaseModel):
    id: str
    need: str
    requirements: List[RequirementInput]
    excluded_vendors: List[str]
    result: Optional[ShortlistResult] = None
    status: str
    progress: Optional[str] = None
    error_message: Optional[str] = None
    created_at: datetime.datetime

    class Config:
        from_attributes = True
