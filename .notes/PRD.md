# Blossomer GTM API - Product Requirements Document

*Last updated: July 5, 2025*

## Product Overview

Blossomer GTM is a full-stack web application (frontend + backend + API) that automates go-to-market best practices for early-stage B2B SaaS founders. Originally built to support Blossomer agency workflows, it's designed to help founders systematically experiment their way to finding their ICP and messaging through AI-powered analysis and campaign generation.

### Purpose
1. **Support agency workflows**: Automate and systematize the GTM processes used with Blossomer clients
2. **Create a comprehensive tool**: Build a full-featured platform that embodies GTM best practices 
3. **Potential SaaS offering**: Test market interest for external productization

### Target Users
**Early-stage B2B SaaS founders** (pre-seed to Series A) who struggle with positioning, targeting, and messaging. They often have a working product but lack systematic GTM processes. They work with Blossomer because they need structured experimentation frameworks and AI-powered systems to discover their ideal customer profile and refine their messaging.

## User Interactions & Product Decisions

### **Landing Page Flow**

#### **What users see**
- Clean, focused interface with single website URL input
- Optional ICP context textarea that appears on focus
- "Start for free" button prominently displayed
- Value proposition explaining the AI analysis process

#### **What happens when they interact**
- **URL input**: Real-time validation, shows green checkmark for valid URLs
- **ICP context (optional)**: User can describe their target customer or ideal use case
- **"Start for free" click**: Immediately transitions to loading sequence

#### **Product rationale**
- **Minimal friction**: Single required input (URL) removes barriers to trying the tool
- **Progressive disclosure**: ICP field only appears when needed to avoid overwhelming new users
- **Immediate value**: No signup required for first experience demonstrates value before commitment

---

### **Analysis Loading Experience**

#### **What users see**
- Sequential loading messages showing analysis progress:
  1. "Analyzing your website..." (3-5 seconds)
  2. "Extracting product capabilities..." (3-5 seconds)  
  3. "Generating target profiles..." (5-8 seconds)
  4. "Finalizing recommendations..." (2-3 seconds)
- Loading skeleton cards showing the structure of upcoming results

#### **What happens during loading**
- Backend simultaneously calls `/company/generate`, `/customers/target_accounts`, `/customers/target_personas`
- Results are cached in localStorage as they arrive
- User is automatically redirected to dashboard when primary analysis completes

#### **Product rationale**
- **Transparency**: Users understand what's happening rather than staring at a spinner
- **Expectation setting**: Loading messages prepare users for the type of analysis they'll receive
- **Perceived performance**: Sequential messages make 20-30 seconds feel faster than a blank loading screen

---

### **Dashboard Navigation & Layout**

#### **What users see**
- Left sidebar with Company, Accounts, Personas, Campaigns sections
- Main content area showing analysis results in structured cards
- Header with user context (if logged in) or signup prompt
- Subtle navigation indicators showing current section

#### **What happens when they navigate**
- **Section switching**: Instant navigation using cached localStorage data
- **First-time section loads**: May show brief loading if data isn't cached yet
- **Persistent URLs**: Each section has its own route for sharing/bookmarking

#### **Product rationale**
- **Logical flow**: Company → Accounts → Personas → Campaigns follows natural GTM thinking process
- **No data loss**: localStorage ensures users can explore freely without losing progress
- **Shareability**: URL-based navigation allows users to share specific sections

---

### **Company Analysis Exploration**

#### **What users see**
- **Company Overview**: 2-3 sentence summary of what the company does
- **Capabilities**: List of technical capabilities and core features
- **Business Model**: Revenue model, pricing approach, target market insights
- **Testimonials**: Customer quotes extracted from the website
- **Competitive Alternatives**: Similar services with differentiation notes

#### **What happens when they interact**
- **Hover any section**: Edit controls (✏️ Edit, ✨ Refine) appear
- **Click edit**: Section becomes editable textarea with save/cancel options
- **Click refine**: Modal opens with AI chat interface (TODO: not yet connected)
- **Save changes**: Updates stored in localStorage (TODO: backend persistence for registered users)

#### **Product rationale**
- **Structured insights**: Breaking analysis into clear sections helps users digest information
- **Edit capability**: Users can correct or improve AI analysis based on their domain knowledge
- **Confidence building**: Showing extracted testimonials and specific capabilities builds trust in analysis quality

---

### **Target Accounts Deep Dive**

#### **What users see**
- **Account Profiles**: 3-5 distinct target account types (e.g., "Mid-Market SaaS Companies")
- **Firmographics**: Company size, industry, geography, business model criteria
- **Buying Signals**: Observable indicators that suggest good fit (e.g., "Recently raised Series A")
- **Qualification Criteria**: Specific questions or data points to evaluate prospects

#### **What happens when they interact**
- **Account card expansion**: Click to see detailed firmographics and signals
- **Edit account criteria**: Inline editing for refining target definitions
- **Add new account type**: Button to generate additional account profiles (TODO)
- **Export account list**: Download criteria for use in prospecting tools (TODO)

#### **Product rationale**
- **Actionable segmentation**: Multiple account types help users understand their full addressable market
- **Observable criteria**: Focus on signals that can be easily identified during prospecting
- **Practical application**: Designed to be directly usable in sales and marketing workflows

---

### **Persona Profile Analysis**

#### **What users see**
- **Primary Personas**: 2-4 key buyer personas per target account type
- **Role Details**: Job titles, seniority, department, typical responsibilities
- **Pain Points**: Specific challenges these personas face that the product addresses
- **Use Cases**: How they would actually use the product in their workflow
- **Buying Process**: Decision criteria, evaluation process, potential objections

#### **What happens when they interact**
- **Persona card selection**: Click to see full persona details and cross-account relationships
- **Pain point refinement**: Edit specific pain points based on customer discovery learnings
- **Use case expansion**: Add new use cases discovered through sales conversations
- **Persona comparison**: View multiple personas side-by-side (TODO)

#### **Product rationale**
- **Sales enablement focus**: Designed to directly improve sales conversations and positioning
- **Evidence-based**: All persona attributes linked back to website evidence or user input
- **Iterative refinement**: Built for ongoing improvement as users learn more about their customers

---

### **Campaign Development Interface**

#### **What users see** (UI implemented, backend TODO)
- **Campaign Type Selection**: Email sequences, positioning statements, value propositions
- **Template Library**: Pre-built campaign frameworks based on analysis
- **Content Editor**: Dual-mode editing (structured breakdown vs. full text)
- **Preview System**: Real-time preview of how campaigns will appear to recipients

#### **What happens when they interact** (planned)
- **Generate campaign**: AI creates email sequences based on personas and account data
- **Edit campaign content**: Inline editing with automatic personalization tokens
- **A/B variant creation**: Generate alternative versions for testing
- **Campaign export**: Download for use in email platforms or CRM systems

#### **Product rationale**
- **Bridge to execution**: Analysis is only valuable if it leads to actionable campaigns
- **Best practice automation**: Embeds proven email and messaging frameworks
- **Experimentation support**: A/B testing capabilities support systematic optimization

---

### **User Authentication Flow** (TODO)

#### **What users see** (planned)
- **Signup modal**: Email and name fields, clear privacy policy
- **API key display**: One-time display of generated API key with copy functionality
- **Login interface**: Simple API key entry with validation feedback
- **Account dashboard**: Usage statistics, saved analyses, account settings

#### **What happens when they interact** (planned)
- **Sign up**: Creates account, generates API key, explains usage limits
- **Login**: Validates API key, loads user context and saved data
- **Save analysis**: Option to persist current analysis to account
- **Manage keys**: Regenerate API keys, view usage statistics

#### **Product rationale**
- **Value before commitment**: Users experience full analysis before any registration
- **Developer-friendly**: API key approach familiar to technical founder audience
- **Data control**: Users can choose whether to persist analysis data or keep it local

---

### **Data Export & Sharing** (TODO)

#### **What users see** (planned)
- **Export options**: PDF reports, CSV data files, JSON for API integration
- **Share controls**: Generate read-only links for team collaboration
- **Integration hooks**: Connect to CRM, email tools, or custom applications
- **Template system**: Save custom analysis templates for repeated use

#### **What happens when they interact** (planned)
- **Export analysis**: Generates formatted documents suitable for team sharing
- **Create share link**: Generates time-limited URL for stakeholder review
- **Connect integrations**: OAuth flows for connecting external tools
- **Save as template**: Create reusable frameworks for similar companies

#### **Product rationale**
- **Workflow integration**: Analysis must integrate into existing founder workflows
- **Team collaboration**: Founders need to share insights with advisors and team members
- **Scalable process**: Templates enable systematic analysis across portfolio companies

---

## Key Product Decisions & Rationale

### **localStorage vs. Database Persistence**
**Decision**: Primary data storage in localStorage with optional account persistence
**Rationale**: Fastest path to value, better privacy, allows users to try without commitment

### **Dual API Structure (Demo + Production)**
**Decision**: Separate demo endpoints with IP rate limiting vs. API key endpoints
**Rationale**: Removes friction for trial while enabling developer/agency use cases

### **Analysis-First Approach**
**Decision**: Start with website analysis rather than user input forms
**Rationale**: Demonstrates AI capabilities immediately, reduces user effort, provides objective starting point

### **Structured Output with Edit Capability**
**Decision**: AI generates structured sections that users can edit rather than free-form output
**Rationale**: More actionable than paragraphs, allows users to apply domain knowledge, maintains consistency

### **Progressive Disclosure Interface**
**Decision**: Start simple (URL input) and reveal complexity gradually (ICP context, advanced features)
**Rationale**: Reduces cognitive load for new users while providing power features for advanced users

### **Multi-Modal Campaign Editor**
**Decision**: Support both structured editing (breakdown mode) and full-text editing
**Rationale**: Different users prefer different editing styles, structured mode ensures completeness, text mode allows creative flow

This PRD focuses on the actual user experience and product decisions rather than business metrics, providing clear guidance for implementation priorities and user interaction design.