from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
import enum

Base = declarative_base()


# Enums for stable business concepts only (used in application logic)
class PriorityLevel(enum.Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"


class SeniorityLevel(enum.Enum):
    JUNIOR = "junior"
    MID = "mid"
    SENIOR = "senior"
    DIRECTOR = "director"
    VP = "vp"
    C_LEVEL = "c_level"


class User(Base):
    """
    User model using Stack Auth user ID as primary key.

    Attributes:
        id: Stack Auth user ID as primary key
        email: User email (optional, can be synced from Stack Auth)
        name: User name (optional, can be synced from Stack Auth)
        created_at: Account creation timestamp
        last_login: Last login timestamp
        companies: One-to-many relationship with Company
    """

    __tablename__ = "users"

    id = Column(String, primary_key=True)  # Stack Auth user ID
    email = Column(String(255), unique=True, nullable=True)
    name = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime)

    # One user can have multiple companies (future-proofing)
    companies = relationship(
        "Company", back_populates="user", cascade="all, delete-orphan"
    )


class Company(Base):
    """
    Company model for storing analyzed company data.

    Stores all website analysis data in a single JSONB column for flexibility.
    Mirrors the TargetCompanyResponse structure from localStorage.
    """

    __tablename__ = "companies"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)

    # Basic company information
    name = Column(String(255), nullable=False)
    url = Column(String(500), nullable=False)

    # All analysis data stored as JSONB for flexibility
    analysis_data = Column(JSONB, nullable=True)

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="companies")
    target_accounts = relationship(
        "TargetAccount", back_populates="company", cascade="all, delete-orphan"
    )


class TargetAccount(Base):
    """
    Target account model for storing ideal customer profiles.

    Stores all account data in a single JSONB column for flexibility.
    Mirrors the TargetAccountResponse structure from localStorage.
    """

    __tablename__ = "target_accounts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False)

    # Basic account information
    name = Column(String(255), nullable=False)

    # All account data stored as JSONB for flexibility
    # Includes: firmographics, buyingSignals, rationale, metadata, etc.
    account_data = Column(JSONB, nullable=False)

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    company = relationship("Company", back_populates="target_accounts")
    target_personas = relationship(
        "TargetPersona", back_populates="target_account", cascade="all, delete-orphan"
    )
    campaigns = relationship(
        "Campaign", back_populates="target_account", cascade="all, delete-orphan"
    )


class TargetPersona(Base):
    """
    Target persona model for storing buyer personas.

    Stores all persona data in a single JSONB column for flexibility.
    Mirrors the TargetPersonaResponse structure from localStorage.
    """

    __tablename__ = "target_personas"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    target_account_id = Column(
        UUID(as_uuid=True), ForeignKey("target_accounts.id"), nullable=False
    )

    # Basic persona information
    name = Column(String(255), nullable=False)

    # All persona data stored as JSONB for flexibility
    # Includes: demographics, useCases, buyingSignals, objections, goals, etc.
    persona_data = Column(JSONB, nullable=False)

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    target_account = relationship("TargetAccount", back_populates="target_personas")
    campaigns = relationship(
        "Campaign", back_populates="target_persona", cascade="all, delete-orphan"
    )


class Campaign(Base):
    """
    Campaign model for storing generated marketing campaigns.

    Stores all campaign data in a single JSONB column for flexibility.
    Supports emails, LinkedIn, cold calls, ads, etc.
    """

    __tablename__ = "campaigns"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    target_account_id = Column(
        UUID(as_uuid=True), ForeignKey("target_accounts.id"), nullable=False
    )
    target_persona_id = Column(
        UUID(as_uuid=True), ForeignKey("target_personas.id"), nullable=False
    )

    # Basic campaign information
    name = Column(String(255), nullable=False)
    campaign_type = Column(
        String(50), nullable=False
    )  # flexible: email, linkedin, cold_call, ad

    # All campaign data stored as JSONB for flexibility
    # Includes: subject_line, content, segments, alternatives, configuration, etc.
    campaign_data = Column(JSONB, nullable=False)

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    target_account = relationship("TargetAccount", back_populates="campaigns")
    target_persona = relationship("TargetPersona", back_populates="campaigns")
