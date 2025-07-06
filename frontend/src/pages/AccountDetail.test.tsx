import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { vi } from "vitest";
import AccountDetail from "./AccountDetail";
import { useCompanyOverview } from "../lib/useCompanyOverview";
import * as accountService from "../lib/accountService";
import { TargetAccountResponse, TargetPersonaResponse } from "../types/api";

// Mock react-router-dom
const mockUseParams = vi.fn();
const mockUseNavigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useParams: () => mockUseParams(),
    useNavigate: () => mockUseNavigate,
  };
});

// Mock useCompanyOverview hook
vi.mock("../lib/useCompanyOverview", () => ({
  useCompanyOverview: vi.fn(),
}));

// Mock accountService functions
vi.mock("../lib/accountService", () => ({
  getStoredTargetAccounts: vi.fn(),
  addPersonaToTargetAccount: vi.fn(),
  getPersonasForTargetAccount: vi.fn(),
  generateTargetPersona: vi.fn(),
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

const mockCompanyOverview = {
  companyName: "Test Company",
  companyUrl: "https://test.com",
  companyOverview: "This is a test company overview.",
  productDescription: "A test product.",
  capabilities: ["Test Cap 1", "Test Cap 2"],
  businessModel: ["SaaS"],
  differentiatedValue: ["Unique Value"],
  customerBenefits: ["Benefit 1"],
};

const mockTargetAccount: TargetAccountResponse & { id: string; createdAt: string } = {
  id: "account-1",
  createdAt: new Date().toISOString(),
  targetAccountName: "SaaS Startups",
  targetAccountDescription: "Early-stage SaaS companies.",
  targetAccountRationale: [
    "Rationale 1: SaaS startups have high growth potential.",
    "Rationale 2: They are early adopters of new technologies.",
  ],
  firmographics: {
    industry: ["Software", "Cloud Computing"],
    employees: "1-50",
    revenue: "< $1M",
    geography: ["Global"],
    business_model: ["Subscription", "Freemium"],
    funding_stage: ["Seed", "Series A"],
    keywords: ["startup", "SaaS", "innovation"],
  },
  buying_signals: [
    {
      title: "Recent Funding",
      description: "Recently closed a seed round, indicating budget for new tools.",
      type: "Company Data",
      priority: "High",
      detection_method: "Crunchbase, PitchBook",
    },
    {
      title: "Hiring Key Roles",
      description: "Actively hiring for engineering or product leadership.",
      type: "Website",
      priority: "Medium",
      detection_method: "LinkedIn, Company Careers Page",
    },
  ],
  buying_signals_rationale: [
    "Signal Rationale 1: Funding directly enables new software purchases.",
    "Signal Rationale 2: Hiring indicates growth and new initiatives.",
  ],
  metadata: {
    primary_context_source: "user",
    sources_used: ["user input"],
    confidence_assessment: {
      overall_confidence: "high",
      data_quality: "high",
      inference_level: "minimal",
      recommended_improvements: [],
    },
    processing_notes: "",
  },
};

const mockTargetPersona: TargetPersonaResponse & { id: string; createdAt: string } = {
  id: "persona-1",
  createdAt: new Date().toISOString(),
  targetPersonaName: "CEO",
  targetPersonaDescription: "Founders or CEOs of AI developer companies.",
  targetPersonaRationale: [
    "CEOs hold ultimate decision-making authority.",
    "Their companies are in growth phases.",
  ],
  demographics: {
    job_titles: ["Founder", "CEO"],
    departments: ["Executive Leadership"],
    seniority: ["C-Suite"],
    buying_roles: ["Decision Maker"],
    job_description_keywords: ["company strategy", "growth initiatives"],
  },
  use_cases: [
    {
      use_case: "Scaling outbound outreach",
      pain_points: "Manual, inefficient outreach processes.",
      capability: "AI-powered automation",
      desired_outcome: "Increase in qualified leads.",
    },
  ],
  buying_signals: [
    {
      title: "Funding Announcements",
      description: "Recent funding rounds suggest willingness to invest.",
      type: "Company Data",
      priority: "Low",
      detection_method: "Crunchbase API",
    },
  ],
  buying_signals_rationale: [
    "Funding announcements reflect capacity and intent to scale.",
  ],
  objections: [
    "High implementation costs."
  ],
  goals: [
    "Accelerate customer acquisition."
  ],
  purchase_journey: [
    "Consuming industry news."
  ],
  metadata: {
    primary_context_source: "user_input|company_context",
    sources_used: ["company_context"],
    confidence_assessment: {
      overall_confidence: "high",
      data_quality: "high",
      inference_level: "moderate",
      recommended_improvements: [
        "Additional recent funding data"
      ],
    },
    processing_notes: "Analysis focused on AI development companies.",
  },
};

describe("AccountDetail Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
    mockUseParams.mockReturnValue({ id: mockTargetAccount.id });
    (useCompanyOverview as vi.Mock).mockReturnValue(mockCompanyOverview);
    (accountService.getStoredTargetAccounts as vi.Mock).mockReturnValue([mockTargetAccount]);
    (accountService.getPersonasForTargetAccount as vi.Mock).mockReturnValue([]);
  });

  test("renders loading state initially", () => {
    (accountService.getStoredTargetAccounts as vi.Mock).mockReturnValueOnce([]); // Simulate no account found initially
    render(<AccountDetail />);
    expect(screen.getByRole("progressbar")).toBeInTheDocument(); // Loader2 renders a role of progressbar
  });

  test("renders error state if account not found", async () => {
    mockUseParams.mockReturnValue({ id: "non-existent-id" });
    (accountService.getStoredTargetAccounts as vi.Mock).mockReturnValue([]);
    render(<AccountDetail />);
    await waitFor(() => {
      expect(screen.getByText(/Account not found/i)).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: /Back to Target Accounts/i })).toBeInTheDocument();
  });

  test("renders all fields for a full target account", async () => {
    render(<AccountDetail />);

    await waitFor(() => {
      expect(screen.getByText(mockTargetAccount.targetAccountName)).toBeInTheDocument();
      expect(screen.getByText(mockTargetAccount.targetAccountDescription)).toBeInTheDocument();
    });

    // Firmographics
    expect(screen.getByText(/Firmographics/i)).toBeInTheDocument();
    expect(screen.getByText(/Software, Cloud Computing/i)).toBeInTheDocument();
    expect(screen.getByText(/1-50/i)).toBeInTheDocument();
    expect(screen.getByText(/< \$1M/i)).toBeInTheDocument();
    expect(screen.getByText(/Global/i)).toBeInTheDocument();
    expect(screen.getByText(/Subscription, Freemium/i)).toBeInTheDocument();
    expect(screen.getByText(/Seed, Series A/i)).toBeInTheDocument();
    expect(screen.getByText(/startup, SaaS, innovation/i)).toBeInTheDocument();

    // Why they're a good fit rationale
    expect(screen.getByText(/Why they're a good fit/i)).toBeInTheDocument();
    expect(screen.getByText(/Rationale 1: SaaS startups have high growth potential./i)).toBeInTheDocument();
    expect(screen.getByText(/Rationale 2: They are early adopters of new technologies./i)).toBeInTheDocument();

    // Buying Signals
    expect(screen.getByText(/Buying Signals/i)).toBeInTheDocument();
    expect(screen.getByText(/Recent Funding/i)).toBeInTheDocument();
    expect(screen.getByText(/Recently closed a seed round, indicating budget for new tools./i)).toBeInTheDocument();
    expect(screen.getByText(/Hiring Key Roles/i)).toBeInTheDocument();
    expect(screen.getByText(/Actively hiring for engineering or product leadership./i)).toBeInTheDocument();

    // Buying Signals Rationale
    expect(screen.getByText(/Buying Signals Rationale/i)).toBeInTheDocument();
    expect(screen.getByText(/Signal Rationale 1: Funding directly enables new software purchases./i)).toBeInTheDocument();
    expect(screen.getByText(/Signal Rationale 2: Hiring indicates growth and new initiatives./i)).toBeInTheDocument();
  });

  test("handles empty firmographics and buying signals gracefully", async () => {
    const emptyAccount = {
      ...mockTargetAccount,
      firmographics: {},
      buying_signals: [],
      targetAccountRationale: [],
      buyingSignalsRationale: [],
    };
    (accountService.getStoredTargetAccounts as vi.Mock).mockReturnValue([emptyAccount]);
    render(<AccountDetail />);

    await waitFor(() => {
      expect(screen.getByText(emptyAccount.targetAccountName)).toBeInTheDocument();
    });

    // Firmographics should show empty state or no data
    expect(screen.queryByText(/Software, Cloud Computing/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/1-50/i)).not.toBeInTheDocument();

    // Buying Signals should show empty state
    expect(screen.getByText(/No buying signals identified/i)).toBeInTheDocument();

    // Rationale sections should not render list items
    expect(screen.queryByText(/Rationale 1:/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Signal Rationale 1:/i)).not.toBeInTheDocument();
  });

  test("allows editing target account description", async () => {
    render(<AccountDetail />);

    await waitFor(() => {
      expect(screen.getByText(mockTargetAccount.targetAccountDescription)).toBeInTheDocument();
    });

    const editButton = screen.getByRole("button", { name: /Edit/i });
    fireEvent.click(editButton);

    const nameInput = screen.getByLabelText(/Name/i);
    const descriptionInput = screen.getByLabelText(/Description/i);
    const saveButton = screen.getByRole("button", { name: /Save/i });

    fireEvent.change(nameInput, { target: { value: "Updated Account Name" } });
    fireEvent.change(descriptionInput, { target: { value: "Updated account description." } });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/Updated account description./i)).toBeInTheDocument();
    });

    // Verify localStorage was updated
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      "target_accounts",
      expect.stringContaining("Updated account description.")
    );
  });

  test("adds a new persona to the account", async () => {
    (accountService.generateTargetPersona as vi.Mock).mockResolvedValue(mockTargetPersona);
    (accountService.getPersonasForTargetAccount as vi.Mock).mockReturnValueOnce([]).mockReturnValueOnce([mockTargetPersona]);

    render(<AccountDetail />);

    await waitFor(() => {
      expect(screen.getByText(/Personas for this Account/i)).toBeInTheDocument();
    });

    const addPersonaButton = screen.getByRole("button", { name: /Add New/i });
    fireEvent.click(addPersonaButton);

    expect(screen.getByText(/Describe a Persona/i)).toBeInTheDocument();

    const nameInput = screen.getByLabelText(/Persona Name/i);
    const descriptionInput = screen.getByLabelText(/Persona Description/i);
    const generateButton = screen.getByRole("button", { name: /Generate Persona/i });

    fireEvent.change(nameInput, { target: { value: "New Persona" } });
    fireEvent.change(descriptionInput, { target: { value: "A new persona description." } });
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(accountService.generateTargetPersona).toHaveBeenCalledWith(
        mockCompanyOverview.companyUrl,
        "New Persona",
        "A new persona description.",
        undefined,
        expect.any(Object), // companyContext
        expect.objectContaining({ id: mockTargetAccount.id }) // targetAccountContext
      );
    });

    await waitFor(() => {
      expect(screen.getByText(/New Persona/i)).toBeInTheDocument();
    });
    expect(accountService.addPersonaToTargetAccount).toHaveBeenCalledWith(
      mockTargetAccount.id,
      expect.objectContaining({ targetPersonaName: "New Persona" })
    );
  });

  test("navigates to persona detail page on persona card click", async () => {
    (accountService.getPersonasForTargetAccount as vi.Mock).mockReturnValue([mockTargetPersona]);
    render(<AccountDetail />);

    await waitFor(() => {
      expect(screen.getByText(mockTargetPersona.targetPersonaName)).toBeInTheDocument();
    });

    const personaCard = screen.getByText(mockTargetPersona.targetPersonaName).closest(".group");
    if (personaCard) {
      fireEvent.click(personaCard);
    }

    expect(mockUseNavigate).toHaveBeenCalledWith(
      `/target-accounts/${mockTargetAccount.id}/personas/${mockTargetPersona.id}`
    );
  });

  test("allows editing an existing persona", async () => {
    (accountService.getPersonasForTargetAccount as vi.Mock).mockReturnValue([mockTargetPersona]);
    render(<AccountDetail />);

    await waitFor(() => {
      expect(screen.getByText(mockTargetPersona.targetPersonaName)).toBeInTheDocument();
    });

    const editPersonaButton = screen.getByRole("button", { name: /edit/i, hidden: true }); // Assuming the edit button is within the persona card
    fireEvent.click(editPersonaButton);

    expect(screen.getByText(/Describe a Persona/i)).toBeInTheDocument(); // InputModal title
    const nameInput = screen.getByLabelText(/Persona Name/i);
    const descriptionInput = screen.getByLabelText(/Persona Description/i);
    const generateButton = screen.getByRole("button", { name: /Generate Persona/i });

    expect(nameInput).toHaveValue(mockTargetPersona.targetPersonaName);
    expect(descriptionInput).toHaveValue(mockTargetPersona.targetPersonaDescription);

    fireEvent.change(nameInput, { target: { value: "Updated Persona Name" } });
    fireEvent.change(descriptionInput, { target: { value: "Updated persona description." } });
    fireEvent.click(generateButton);

    // In a real scenario, this would trigger an update to localStorage via addPersonaToTargetAccount
    // For this test, we just check if the service function was called with updated data
    expect(accountService.addPersonaToTargetAccount).toHaveBeenCalledWith(
      mockTargetAccount.id,
      expect.objectContaining({
        id: mockTargetPersona.id,
        targetPersonaName: "Updated Persona Name",
        targetPersonaDescription: "Updated persona description.",
      })
    );
  });

  test("deletes a persona from the account", async () => {
    (accountService.getPersonasForTargetAccount as vi.Mock).mockReturnValue([mockTargetPersona]);
    render(<AccountDetail />);

    await waitFor(() => {
      expect(screen.getByText(mockTargetPersona.targetPersonaName)).toBeInTheDocument();
    });

    const deletePersonaButton = screen.getByRole("button", { name: /delete/i, hidden: true });
    fireEvent.click(deletePersonaButton);

    await waitFor(() => {
      expect(screen.queryByText(mockTargetPersona.targetPersonaName)).not.toBeInTheDocument();
    });
    // Verify that getPersonasForTargetAccount is called again to reflect the deletion
    expect(accountService.getPersonasForTargetAccount).toHaveBeenCalledWith(mockTargetAccount.id);
  });
});
