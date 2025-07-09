"""
Database service layer for CRUD operations with Row-Level Security.

This module provides a centralized service layer for database operations
with proper user scoping and security controls.
"""

from typing import List, Optional, Dict, Any
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status
from contextlib import contextmanager

from backend.app.models import User, Company, Account, Persona, Campaign
from backend.app.schemas import (
    CompanyCreate, CompanyUpdate, CompanyResponse,
    AccountCreate, AccountUpdate, AccountResponse,
    PersonaCreate, PersonaUpdate, PersonaResponse,
    CampaignCreate, CampaignUpdate, CampaignResponse,
    CompanyWithRelations, AccountWithRelations, PersonaWithRelations
)


class DatabaseService:
    """Centralized database service with Row-Level Security."""
    
    def __init__(self, db: Session):
        self.db = db
    
    @contextmanager
    def _set_user_context(self, user_id: str):
        """Set the current user context for RLS policies."""
        try:
            # Set the user context for this session
            self.db.execute(f"SET LOCAL app.current_user_id = '{user_id}'")
            yield
        finally:
            # Reset the user context (although it's automatically reset at transaction end)
            self.db.execute("SET LOCAL app.current_user_id = ''")
    
    def _get_user_or_404(self, user_id: str) -> User:
        """Get user by ID or raise 404."""
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        return user
    
    # Company CRUD Operations
    # ======================
    
    def create_company(self, company_data: CompanyCreate, user_id: str) -> CompanyResponse:
        """Create a new company for the authenticated user."""
        # Verify user exists
        user = self._get_user_or_404(user_id)
        
        with self._set_user_context(user_id):
            try:
                db_company = Company(
                    user_id=user.id,
                    name=company_data.name,
                    url=company_data.url,
                    analysis_data=company_data.analysis_data
                )
                self.db.add(db_company)
                self.db.commit()
                self.db.refresh(db_company)
                
                return CompanyResponse.model_validate(db_company)
                
            except IntegrityError:
                self.db.rollback()
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Company with this name already exists"
                )
    
    def get_company(self, company_id: UUID, user_id: str) -> CompanyResponse:
        """Get a company by ID (user-scoped)."""
        with self._set_user_context(user_id):
            company = self.db.query(Company).filter(
                Company.id == company_id,
                Company.user_id == user_id
            ).first()
            
            if not company:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Company not found"
                )
            
            return CompanyResponse.model_validate(company)
    
    def get_companies(self, user_id: str, skip: int = 0, limit: int = 100) -> List[CompanyResponse]:
        """Get all companies for the authenticated user."""
        with self._set_user_context(user_id):
            companies = self.db.query(Company).filter(
                Company.user_id == user_id
            ).offset(skip).limit(limit).all()
            
            return [CompanyResponse.model_validate(company) for company in companies]
    
    def update_company(self, company_id: UUID, company_data: CompanyUpdate, user_id: str) -> CompanyResponse:
        """Update a company (user-scoped)."""
        with self._set_user_context(user_id):
            company = self.db.query(Company).filter(
                Company.id == company_id,
                Company.user_id == user_id
            ).first()
            
            if not company:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Company not found"
                )
            
            # Update only provided fields
            update_data = company_data.model_dump(exclude_unset=True)
            for field, value in update_data.items():
                setattr(company, field, value)
            
            try:
                self.db.commit()
                self.db.refresh(company)
                return CompanyResponse.model_validate(company)
                
            except IntegrityError:
                self.db.rollback()
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Company with this name already exists"
                )
    
    def delete_company(self, company_id: UUID, user_id: str) -> bool:
        """Delete a company and all related data (user-scoped)."""
        with self._set_user_context(user_id):
            company = self.db.query(Company).filter(
                Company.id == company_id,
                Company.user_id == user_id
            ).first()
            
            if not company:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Company not found"
                )
            
            # Delete company (cascades to accounts, personas, campaigns)
            self.db.delete(company)
            self.db.commit()
            return True
    
    def get_company_with_relations(self, company_id: UUID, user_id: str) -> CompanyWithRelations:
        """Get company with all related accounts."""
        with self._set_user_context(user_id):
            company = self.db.query(Company).filter(
                Company.id == company_id,
                Company.user_id == user_id
            ).first()
            
            if not company:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Company not found"
                )
            
            # Get related accounts
            accounts = self.db.query(Account).filter(
                Account.company_id == company_id
            ).all()
            
            return CompanyWithRelations(
                **company.__dict__,
                accounts=[AccountResponse.model_validate(account) for account in accounts]
            )
    
    # Account CRUD Operations
    # ======================
    
    def create_account(self, account_data: AccountCreate, company_id: UUID, user_id: str) -> AccountResponse:
        """Create a new account for a company (user-scoped)."""
        with self._set_user_context(user_id):
            # Verify company exists and user owns it
            company = self.db.query(Company).filter(
                Company.id == company_id,
                Company.user_id == user_id
            ).first()
            
            if not company:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Company not found"
                )
            
            try:
                db_account = Account(
                    company_id=company_id,
                    name=account_data.name,
                    account_data=account_data.account_data
                )
                self.db.add(db_account)
                self.db.commit()
                self.db.refresh(db_account)
                
                return AccountResponse.model_validate(db_account)
                
            except IntegrityError:
                self.db.rollback()
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Account with this name already exists for this company"
                )
    
    def get_account(self, account_id: UUID, user_id: str) -> AccountResponse:
        """Get an account by ID (user-scoped via company)."""
        with self._set_user_context(user_id):
            account = self.db.query(Account).join(Company).filter(
                Account.id == account_id,
                Company.user_id == user_id
            ).first()
            
            if not account:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Account not found"
                )
            
            return AccountResponse.model_validate(account)
    
    def get_accounts(self, company_id: UUID, user_id: str, skip: int = 0, limit: int = 100) -> List[AccountResponse]:
        """Get all accounts for a company (user-scoped)."""
        with self._set_user_context(user_id):
            # Verify company exists and user owns it
            company = self.db.query(Company).filter(
                Company.id == company_id,
                Company.user_id == user_id
            ).first()
            
            if not company:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Company not found"
                )
            
            accounts = self.db.query(Account).filter(
                Account.company_id == company_id
            ).offset(skip).limit(limit).all()
            
            return [AccountResponse.model_validate(account) for account in accounts]
    
    def update_account(self, account_id: UUID, account_data: AccountUpdate, user_id: str) -> AccountResponse:
        """Update an account (user-scoped via company)."""
        with self._set_user_context(user_id):
            account = self.db.query(Account).join(Company).filter(
                Account.id == account_id,
                Company.user_id == user_id
            ).first()
            
            if not account:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Account not found"
                )
            
            # Update only provided fields
            update_data = account_data.model_dump(exclude_unset=True)
            for field, value in update_data.items():
                setattr(account, field, value)
            
            try:
                self.db.commit()
                self.db.refresh(account)
                return AccountResponse.model_validate(account)
                
            except IntegrityError:
                self.db.rollback()
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Account with this name already exists for this company"
                )
    
    def delete_account(self, account_id: UUID, user_id: str) -> bool:
        """Delete an account and all related data (user-scoped)."""
        with self._set_user_context(user_id):
            account = self.db.query(Account).join(Company).filter(
                Account.id == account_id,
                Company.user_id == user_id
            ).first()
            
            if not account:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Account not found"
                )
            
            # Delete account (cascades to personas, campaigns)
            self.db.delete(account)
            self.db.commit()
            return True
    
    def get_account_with_relations(self, account_id: UUID, user_id: str) -> AccountWithRelations:
        """Get account with all related personas and campaigns."""
        with self._set_user_context(user_id):
            account = self.db.query(Account).join(Company).filter(
                Account.id == account_id,
                Company.user_id == user_id
            ).first()
            
            if not account:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Account not found"
                )
            
            # Get related personas and campaigns
            personas = self.db.query(Persona).filter(
                Persona.account_id == account_id
            ).all()
            
            campaigns = self.db.query(Campaign).filter(
                Campaign.account_id == account_id
            ).all()
            
            return AccountWithRelations(
                **account.__dict__,
                personas=[PersonaResponse.model_validate(persona) for persona in personas],
                campaigns=[CampaignResponse.model_validate(campaign) for campaign in campaigns]
            )
    
    # Persona CRUD Operations
    # ======================
    
    def create_persona(self, persona_data: PersonaCreate, account_id: UUID, user_id: str) -> PersonaResponse:
        """Create a new persona for an account (user-scoped)."""
        with self._set_user_context(user_id):
            # Verify account exists and user owns it via company
            account = self.db.query(Account).join(Company).filter(
                Account.id == account_id,
                Company.user_id == user_id
            ).first()
            
            if not account:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Account not found"
                )
            
            try:
                db_persona = Persona(
                    account_id=account_id,
                    name=persona_data.name,
                    persona_data=persona_data.persona_data
                )
                self.db.add(db_persona)
                self.db.commit()
                self.db.refresh(db_persona)
                
                return PersonaResponse.model_validate(db_persona)
                
            except IntegrityError:
                self.db.rollback()
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Persona with this name already exists for this account"
                )
    
    def get_persona(self, persona_id: UUID, user_id: str) -> PersonaResponse:
        """Get a persona by ID (user-scoped via account->company)."""
        with self._set_user_context(user_id):
            persona = self.db.query(Persona).join(Account).join(Company).filter(
                Persona.id == persona_id,
                Company.user_id == user_id
            ).first()
            
            if not persona:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Persona not found"
                )
            
            return PersonaResponse.model_validate(persona)
    
    def get_personas(self, account_id: UUID, user_id: str, skip: int = 0, limit: int = 100) -> List[PersonaResponse]:
        """Get all personas for an account (user-scoped)."""
        with self._set_user_context(user_id):
            # Verify account exists and user owns it via company
            account = self.db.query(Account).join(Company).filter(
                Account.id == account_id,
                Company.user_id == user_id
            ).first()
            
            if not account:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Account not found"
                )
            
            personas = self.db.query(Persona).filter(
                Persona.account_id == account_id
            ).offset(skip).limit(limit).all()
            
            return [PersonaResponse.model_validate(persona) for persona in personas]
    
    def update_persona(self, persona_id: UUID, persona_data: PersonaUpdate, user_id: str) -> PersonaResponse:
        """Update a persona (user-scoped via account->company)."""
        with self._set_user_context(user_id):
            persona = self.db.query(Persona).join(Account).join(Company).filter(
                Persona.id == persona_id,
                Company.user_id == user_id
            ).first()
            
            if not persona:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Persona not found"
                )
            
            # Update only provided fields
            update_data = persona_data.model_dump(exclude_unset=True)
            for field, value in update_data.items():
                setattr(persona, field, value)
            
            try:
                self.db.commit()
                self.db.refresh(persona)
                return PersonaResponse.model_validate(persona)
                
            except IntegrityError:
                self.db.rollback()
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Persona with this name already exists for this account"
                )
    
    def delete_persona(self, persona_id: UUID, user_id: str) -> bool:
        """Delete a persona and all related campaigns (user-scoped)."""
        with self._set_user_context(user_id):
            persona = self.db.query(Persona).join(Account).join(Company).filter(
                Persona.id == persona_id,
                Company.user_id == user_id
            ).first()
            
            if not persona:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Persona not found"
                )
            
            # Delete persona (cascades to campaigns)
            self.db.delete(persona)
            self.db.commit()
            return True
    
    def get_persona_with_relations(self, persona_id: UUID, user_id: str) -> PersonaWithRelations:
        """Get persona with all related campaigns."""
        with self._set_user_context(user_id):
            persona = self.db.query(Persona).join(Account).join(Company).filter(
                Persona.id == persona_id,
                Company.user_id == user_id
            ).first()
            
            if not persona:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Persona not found"
                )
            
            # Get related campaigns
            campaigns = self.db.query(Campaign).filter(
                Campaign.persona_id == persona_id
            ).all()
            
            return PersonaWithRelations(
                **persona.__dict__,
                campaigns=[CampaignResponse.model_validate(campaign) for campaign in campaigns]
            )
    
    # Campaign CRUD Operations
    # =======================
    
    def create_campaign(self, campaign_data: CampaignCreate, account_id: UUID, persona_id: UUID, user_id: str) -> CampaignResponse:
        """Create a new campaign for an account and persona (user-scoped)."""
        with self._set_user_context(user_id):
            # Verify account exists and user owns it via company
            account = self.db.query(Account).join(Company).filter(
                Account.id == account_id,
                Company.user_id == user_id
            ).first()
            
            if not account:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Account not found"
                )
            
            # Verify persona exists and belongs to the account
            persona = self.db.query(Persona).filter(
                Persona.id == persona_id,
                Persona.account_id == account_id
            ).first()
            
            if not persona:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Persona not found or does not belong to this account"
                )
            
            try:
                db_campaign = Campaign(
                    account_id=account_id,
                    persona_id=persona_id,
                    name=campaign_data.name,
                    campaign_type=campaign_data.campaign_type,
                    campaign_data=campaign_data.campaign_data
                )
                self.db.add(db_campaign)
                self.db.commit()
                self.db.refresh(db_campaign)
                
                return CampaignResponse.model_validate(db_campaign)
                
            except IntegrityError:
                self.db.rollback()
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Campaign with this name already exists for this account"
                )
    
    def get_campaign(self, campaign_id: UUID, user_id: str) -> CampaignResponse:
        """Get a campaign by ID (user-scoped via account->company)."""
        with self._set_user_context(user_id):
            campaign = self.db.query(Campaign).join(Account).join(Company).filter(
                Campaign.id == campaign_id,
                Company.user_id == user_id
            ).first()
            
            if not campaign:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Campaign not found"
                )
            
            return CampaignResponse.model_validate(campaign)
    
    def get_campaigns(self, account_id: UUID, user_id: str, persona_id: Optional[UUID] = None, skip: int = 0, limit: int = 100) -> List[CampaignResponse]:
        """Get all campaigns for an account (optionally filtered by persona)."""
        with self._set_user_context(user_id):
            # Verify account exists and user owns it via company
            account = self.db.query(Account).join(Company).filter(
                Account.id == account_id,
                Company.user_id == user_id
            ).first()
            
            if not account:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Account not found"
                )
            
            query = self.db.query(Campaign).filter(Campaign.account_id == account_id)
            
            if persona_id:
                query = query.filter(Campaign.persona_id == persona_id)
            
            campaigns = query.offset(skip).limit(limit).all()
            
            return [CampaignResponse.model_validate(campaign) for campaign in campaigns]
    
    def update_campaign(self, campaign_id: UUID, campaign_data: CampaignUpdate, user_id: str) -> CampaignResponse:
        """Update a campaign (user-scoped via account->company)."""
        with self._set_user_context(user_id):
            campaign = self.db.query(Campaign).join(Account).join(Company).filter(
                Campaign.id == campaign_id,
                Company.user_id == user_id
            ).first()
            
            if not campaign:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Campaign not found"
                )
            
            # Update only provided fields
            update_data = campaign_data.model_dump(exclude_unset=True)
            for field, value in update_data.items():
                setattr(campaign, field, value)
            
            try:
                self.db.commit()
                self.db.refresh(campaign)
                return CampaignResponse.model_validate(campaign)
                
            except IntegrityError:
                self.db.rollback()
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Campaign with this name already exists for this account"
                )
    
    def delete_campaign(self, campaign_id: UUID, user_id: str) -> bool:
        """Delete a campaign (user-scoped)."""
        with self._set_user_context(user_id):
            campaign = self.db.query(Campaign).join(Account).join(Company).filter(
                Campaign.id == campaign_id,
                Company.user_id == user_id
            ).first()
            
            if not campaign:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Campaign not found"
                )
            
            self.db.delete(campaign)
            self.db.commit()
            return True