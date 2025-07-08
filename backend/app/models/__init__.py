from sqlalchemy import Column, String, Boolean, DateTime, Integer, ForeignKey, Text, Enum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
import enum

Base = declarative_base()

# Enums for better type safety
class PriorityLevel(enum.Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"

class BuyingSignalType(enum.Enum):
    TECHNOLOGY = "technology"
    BEHAVIORAL = "behavioral"
    INTENT = "intent"
    CONTEXTUAL = "contextual"

class SeniorityLevel(enum.Enum):
    JUNIOR = "junior"
    MID = "mid"
    SENIOR = "senior"
    DIRECTOR = "director"
    VP = "vp"
    C_LEVEL = "c_level"

class CampaignType(enum.Enum):
    EMAIL = "email"
    LINKEDIN = "linkedin"
    COLD_CALL = "cold_call"
    AD = "ad"

class CampaignStatus(enum.Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"


class User(Base):
    """
    User model for authentication and API key management.

    This model connects to Neon Auth users for authentication
    while managing API keys for programmatic access.

    Attributes:
        id: UUID primary key
        neon_auth_user_id: Reference to Neon Auth user (from neon_auth.users_sync)
        email: Unique email address (synced from Neon Auth)
        name: Optional user name (synced from Neon Auth)
        created_at: Account creation timestamp
        last_login: Last login timestamp
        rate_limit_exempt: If True, user is exempt from rate limits
        role: User role (user, admin, etc.)
        api_keys: Relationship to APIKey
    """

    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    neon_auth_user_id = Column(
        String(255), unique=True, nullable=True
    )  # Neon Auth user ID
    email = Column(String(255), unique=True, nullable=False)
    name = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime)
    rate_limit_exempt = Column(Boolean, default=False, nullable=False)
    role = Column(String(20), default="user", nullable=False)

    api_keys = relationship(
        "APIKey", back_populates="user", cascade="all, delete-orphan"
    )


class APIKey(Base):
    """
    APIKey model for storing hashed API keys and metadata.

    Attributes:
        id: UUID primary key
        user_id: Foreign key to User
        key_hash: SHA-256 hash of the API key
        key_prefix: Display prefix for the key
        name: User-provided name for the key
        tier: Access tier (free, paid, enterprise)
        is_active: Whether the key is active
        last_used: Last usage timestamp
        created_at: Creation timestamp
        user: Relationship to User
        usage_records: Relationship to APIUsage
    """

    __tablename__ = "api_keys"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    key_hash = Column(String(64), nullable=False, unique=True)
    key_prefix = Column(String(32), nullable=False)
    name = Column(String(100))
    tier = Column(String(20), default="free")
    is_active = Column(Boolean, default=True)
    last_used = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="api_keys")
    usage_records = relationship("APIUsage", back_populates="api_key")


class APIUsage(Base):
    """
    APIUsage model for tracking API key usage, rate limiting, and analytics.

    Attributes:
        id: UUID primary key
        api_key_id: Foreign key to APIKey
        endpoint: Endpoint accessed
        success: Whether the request succeeded
        response_time_ms: Response time in milliseconds
        error_code: Error code if any
        created_at: Timestamp of usage
        api_key: Relationship to APIKey
    """

    __tablename__ = "api_usage"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    api_key_id = Column(UUID(as_uuid=True), ForeignKey("api_keys.id"), nullable=False)
    endpoint = Column(String(100), nullable=False)
    success = Column(Boolean, nullable=False)
    response_time_ms = Column(Integer)
    error_code = Column(String(50))
    created_at = Column(DateTime, default=datetime.utcnow)

    api_key = relationship("APIKey", back_populates="usage_records")


class Company(Base):
    """
    Company model for storing analyzed company data.
    
    Represents a company that has been analyzed through the platform,
    containing all the business intelligence gathered from website analysis.
    """
    
    __tablename__ = "companies"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Core company information
    name = Column(String(255), nullable=False)
    url = Column(String(500), nullable=False)
    description = Column(Text)
    
    # Business profile
    category = Column(String(255))
    business_model = Column(String(500))
    existing_customers = Column(Text)
    
    # Positioning insights
    key_market_belief = Column(Text)
    unique_approach = Column(Text)
    language_used = Column(Text)
    
    # Process analysis
    process_impact = Column(Text)
    problems_addressed = Column(Text)
    how_they_do_it_today = Column(Text)
    
    # ICP insights
    target_account_hypothesis = Column(Text)
    target_persona_hypothesis = Column(Text)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User")
    capabilities = relationship("CompanyCapability", back_populates="company", cascade="all, delete-orphan")
    objections = relationship("CompanyObjection", back_populates="company", cascade="all, delete-orphan")
    target_accounts = relationship("TargetAccount", back_populates="company", cascade="all, delete-orphan")


class CompanyCapability(Base):
    """
    Normalized table for company capabilities (many-to-one with Company).
    """
    
    __tablename__ = "company_capabilities"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False)
    capability = Column(String(500), nullable=False)
    
    # Relationships
    company = relationship("Company", back_populates="capabilities")


class CompanyObjection(Base):
    """
    Normalized table for company objections (many-to-one with Company).
    """
    
    __tablename__ = "company_objections"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False)
    objection = Column(String(500), nullable=False)
    
    # Relationships
    company = relationship("Company", back_populates="objections")


class TargetAccount(Base):
    """
    Target Account model representing ideal customer profiles.
    
    Contains firmographic data and buying signals for target accounts
    identified through analysis.
    """
    
    __tablename__ = "target_accounts"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False)
    
    # Core account information
    name = Column(String(255), nullable=False)
    description = Column(Text)
    
    # Firmographics
    industry = Column(String(255))
    employees = Column(String(100))  # e.g., "50-200", "500+"
    department_size = Column(String(100))
    revenue = Column(String(100))  # e.g., "$1M-$10M"
    geography = Column(String(255))
    business_model = Column(String(255))
    funding_stage = Column(String(100))
    company_type = Column(String(100))
    
    # Analysis metadata
    overall_confidence = Column(String(50))
    data_quality = Column(String(50))
    inference_level = Column(String(50))
    primary_context_source = Column(String(255))
    context_sufficiency = Column(String(50))
    processing_notes = Column(Text)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    company = relationship("Company", back_populates="target_accounts")
    rationale_items = relationship("AccountRationale", back_populates="target_account", cascade="all, delete-orphan")
    keywords = relationship("AccountKeyword", back_populates="target_account", cascade="all, delete-orphan")
    buying_signals = relationship("AccountBuyingSignal", back_populates="target_account", cascade="all, delete-orphan")
    buying_signal_rationale = relationship("AccountBuyingSignalRationale", back_populates="target_account", cascade="all, delete-orphan")
    recommended_improvements = relationship("AccountImprovementRecommendation", back_populates="target_account", cascade="all, delete-orphan")
    sources_used = relationship("AccountSourceUsed", back_populates="target_account", cascade="all, delete-orphan")
    target_personas = relationship("TargetPersona", back_populates="target_account", cascade="all, delete-orphan")


class AccountRationale(Base):
    """Normalized table for target account rationale items."""
    
    __tablename__ = "account_rationale"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    target_account_id = Column(UUID(as_uuid=True), ForeignKey("target_accounts.id"), nullable=False)
    rationale = Column(Text, nullable=False)
    
    target_account = relationship("TargetAccount", back_populates="rationale_items")


class AccountKeyword(Base):
    """Normalized table for account keywords."""
    
    __tablename__ = "account_keywords"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    target_account_id = Column(UUID(as_uuid=True), ForeignKey("target_accounts.id"), nullable=False)
    keyword = Column(String(255), nullable=False)
    
    target_account = relationship("TargetAccount", back_populates="keywords")


class AccountBuyingSignal(Base):
    """Normalized table for account buying signals."""
    
    __tablename__ = "account_buying_signals"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    target_account_id = Column(UUID(as_uuid=True), ForeignKey("target_accounts.id"), nullable=False)
    
    title = Column(String(255), nullable=False)
    description = Column(Text)
    signal_type = Column(Enum(BuyingSignalType))
    priority = Column(Enum(PriorityLevel))
    detection_method = Column(String(255))
    
    target_account = relationship("TargetAccount", back_populates="buying_signals")


class AccountBuyingSignalRationale(Base):
    """Normalized table for buying signal rationale."""
    
    __tablename__ = "account_buying_signal_rationale"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    target_account_id = Column(UUID(as_uuid=True), ForeignKey("target_accounts.id"), nullable=False)
    rationale = Column(Text, nullable=False)
    
    target_account = relationship("TargetAccount", back_populates="buying_signal_rationale")


class AccountImprovementRecommendation(Base):
    """Normalized table for recommended improvements."""
    
    __tablename__ = "account_improvement_recommendations"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    target_account_id = Column(UUID(as_uuid=True), ForeignKey("target_accounts.id"), nullable=False)
    recommendation = Column(Text, nullable=False)
    
    target_account = relationship("TargetAccount", back_populates="recommended_improvements")


class AccountSourceUsed(Base):
    """Normalized table for sources used in analysis."""
    
    __tablename__ = "account_sources_used"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    target_account_id = Column(UUID(as_uuid=True), ForeignKey("target_accounts.id"), nullable=False)
    source = Column(String(500), nullable=False)
    
    target_account = relationship("TargetAccount", back_populates="sources_used")


class TargetPersona(Base):
    """
    Target Persona model representing buyer personas within target accounts.
    
    Contains demographic data, use cases, and buying behavior for specific
    personas identified through analysis.
    """
    
    __tablename__ = "target_personas"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    target_account_id = Column(UUID(as_uuid=True), ForeignKey("target_accounts.id"), nullable=False)
    
    # Core persona information
    name = Column(String(255), nullable=False)
    description = Column(Text)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    target_account = relationship("TargetAccount", back_populates="target_personas")
    rationale_items = relationship("PersonaRationale", back_populates="target_persona", cascade="all, delete-orphan")
    job_titles = relationship("PersonaJobTitle", back_populates="target_persona", cascade="all, delete-orphan")
    departments = relationship("PersonaDepartment", back_populates="target_persona", cascade="all, delete-orphan")
    seniority_levels = relationship("PersonaSeniorityLevel", back_populates="target_persona", cascade="all, delete-orphan")
    buying_roles = relationship("PersonaBuyingRole", back_populates="target_persona", cascade="all, delete-orphan")
    job_keywords = relationship("PersonaJobKeyword", back_populates="target_persona", cascade="all, delete-orphan")
    use_cases = relationship("PersonaUseCase", back_populates="target_persona", cascade="all, delete-orphan")
    buying_signals = relationship("PersonaBuyingSignal", back_populates="target_persona", cascade="all, delete-orphan")
    buying_signal_rationale = relationship("PersonaBuyingSignalRationale", back_populates="target_persona", cascade="all, delete-orphan")
    objections = relationship("PersonaObjection", back_populates="target_persona", cascade="all, delete-orphan")
    goals = relationship("PersonaGoal", back_populates="target_persona", cascade="all, delete-orphan")
    purchase_journey_steps = relationship("PersonaPurchaseJourneyStep", back_populates="target_persona", cascade="all, delete-orphan")
    campaigns = relationship("Campaign", back_populates="target_persona")


class PersonaRationale(Base):
    """Normalized table for persona rationale items."""
    
    __tablename__ = "persona_rationale"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    target_persona_id = Column(UUID(as_uuid=True), ForeignKey("target_personas.id"), nullable=False)
    rationale = Column(Text, nullable=False)
    
    target_persona = relationship("TargetPersona", back_populates="rationale_items")


class PersonaJobTitle(Base):
    """Normalized table for persona job titles."""
    
    __tablename__ = "persona_job_titles"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    target_persona_id = Column(UUID(as_uuid=True), ForeignKey("target_personas.id"), nullable=False)
    job_title = Column(String(255), nullable=False)
    
    target_persona = relationship("TargetPersona", back_populates="job_titles")


class PersonaDepartment(Base):
    """Normalized table for persona departments."""
    
    __tablename__ = "persona_departments"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    target_persona_id = Column(UUID(as_uuid=True), ForeignKey("target_personas.id"), nullable=False)
    department = Column(String(255), nullable=False)
    
    target_persona = relationship("TargetPersona", back_populates="departments")


class PersonaSeniorityLevel(Base):
    """Normalized table for persona seniority levels."""
    
    __tablename__ = "persona_seniority_levels"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    target_persona_id = Column(UUID(as_uuid=True), ForeignKey("target_personas.id"), nullable=False)
    seniority = Column(Enum(SeniorityLevel), nullable=False)
    
    target_persona = relationship("TargetPersona", back_populates="seniority_levels")


class PersonaBuyingRole(Base):
    """Normalized table for persona buying roles."""
    
    __tablename__ = "persona_buying_roles"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    target_persona_id = Column(UUID(as_uuid=True), ForeignKey("target_personas.id"), nullable=False)
    buying_role = Column(String(255), nullable=False)
    
    target_persona = relationship("TargetPersona", back_populates="buying_roles")


class PersonaJobKeyword(Base):
    """Normalized table for persona job description keywords."""
    
    __tablename__ = "persona_job_keywords"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    target_persona_id = Column(UUID(as_uuid=True), ForeignKey("target_personas.id"), nullable=False)
    keyword = Column(String(255), nullable=False)
    
    target_persona = relationship("TargetPersona", back_populates="job_keywords")


class PersonaUseCase(Base):
    """Normalized table for persona use cases."""
    
    __tablename__ = "persona_use_cases"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    target_persona_id = Column(UUID(as_uuid=True), ForeignKey("target_personas.id"), nullable=False)
    
    use_case = Column(Text, nullable=False)
    pain_points = Column(Text)
    capability = Column(Text)
    desired_outcome = Column(Text)
    
    target_persona = relationship("TargetPersona", back_populates="use_cases")


class PersonaBuyingSignal(Base):
    """Normalized table for persona buying signals."""
    
    __tablename__ = "persona_buying_signals"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    target_persona_id = Column(UUID(as_uuid=True), ForeignKey("target_personas.id"), nullable=False)
    
    title = Column(String(255), nullable=False)
    description = Column(Text)
    signal_type = Column(Enum(BuyingSignalType))
    priority = Column(Enum(PriorityLevel))
    detection_method = Column(String(255))
    
    target_persona = relationship("TargetPersona", back_populates="buying_signals")


class PersonaBuyingSignalRationale(Base):
    """Normalized table for persona buying signal rationale."""
    
    __tablename__ = "persona_buying_signal_rationale"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    target_persona_id = Column(UUID(as_uuid=True), ForeignKey("target_personas.id"), nullable=False)
    rationale = Column(Text, nullable=False)
    
    target_persona = relationship("TargetPersona", back_populates="buying_signal_rationale")


class PersonaObjection(Base):
    """Normalized table for persona objections."""
    
    __tablename__ = "persona_objections"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    target_persona_id = Column(UUID(as_uuid=True), ForeignKey("target_personas.id"), nullable=False)
    objection = Column(Text, nullable=False)
    
    target_persona = relationship("TargetPersona", back_populates="objections")


class PersonaGoal(Base):
    """Normalized table for persona goals."""
    
    __tablename__ = "persona_goals"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    target_persona_id = Column(UUID(as_uuid=True), ForeignKey("target_personas.id"), nullable=False)
    goal = Column(Text, nullable=False)
    
    target_persona = relationship("TargetPersona", back_populates="goals")


class PersonaPurchaseJourneyStep(Base):
    """Normalized table for persona purchase journey steps."""
    
    __tablename__ = "persona_purchase_journey_steps"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    target_persona_id = Column(UUID(as_uuid=True), ForeignKey("target_personas.id"), nullable=False)
    step_order = Column(Integer, nullable=False)
    step = Column(Text, nullable=False)
    
    target_persona = relationship("TargetPersona", back_populates="purchase_journey_steps")
