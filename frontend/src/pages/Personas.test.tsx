import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { vi } from "vitest";
import Personas from "./Personas";
import { useCompanyOverview } from "../lib/useCompanyOverview";
import * as accountService from "../lib/accountService";
import { TargetPersonaResponse, TargetAccountResponse } from "../types/api";

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock useCompanyOverview hook
vi.mock("../lib/useCompanyOverview", () => ({
  useCompanyOverview: vi.fn(),
}));

// Mock accountService functions
vi.mock("../lib/accountService", () => ({
  getAllPersonas: vi.fn(),
  deletePersonaFromTargetAccount: vi.fn(),
  updatePersonaForTargetAccount: vi.fn(),
  addPersonaToTargetAccount: vi.fn(),
  generateTargetPersona: vi.fn(),
  getStoredTargetAccounts: vi.fn(),
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
  targetAccountRationale: [],
  firmographics: {},
  buying_signals: [],
  buying_signals_rationale: [],
  metadata: {},
};

const mockTargetPersona: TargetPersonaResponse & { id: string; createdAt: string } = {
  id: "persona-1",
  createdAt: new Date().toISOString(),
  targetPersonaName: "CEO",
  targetPersonaDescription: "Founders or CEOs of AI developer companies who are actively involved in strategic growth, operational scaling, and decision-making for outreach and partnership initiatives, seeking scalable solutions to accelerate market expansion.",
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

describe("Personas Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
    (useCompanyOverview as vi.Mock).mockReturnValue(mockCompanyOverview);
    (accountService.getAllPersonas as vi.Mock).mockReturnValue([]);
    (accountService.getStoredTargetAccounts as vi.Mock).mockReturnValue([mockTargetAccount]);
  });

  test("renders loading state initially", () => {
    (accountService.getAllPersonas as vi.Mock).mockReturnValueOnce([]); // Simulate no personas found initially
    render(<Personas />);
    expect(screen.getByRole("progressbar")).toBeInTheDocument(); // Loader2 renders a role of progressbar
  });

  test("renders company overview and add persona card", () => {
    render(<Personas />);
    expect(screen.getByText(/Test Company/i)).toBeInTheDocument();
    expect(screen.getByText(/This is a test company overview./i)).toBeInTheDocument();
    expect(screen.getByText(/Add New/i)).toBeInTheDocument();
    expect(screen.getByText(/Generate Your First Persona/i)).toBeInTheDocument();
  });

  test("renders existing target personas with data integrity", () => {
    (accountService.getAllPersonas as vi.Mock).mockReturnValue([
      { persona: mockTargetPersona, accountId: mockTargetAccount.id, accountName: mockTargetAccount.targetAccountName },
    ]);
    render(<Personas />);

    // Assert main persona name and description
    expect(screen.getByText(mockTargetPersona.targetPersonaName)).toBeInTheDocument();
    expect(screen.getByText(mockTargetPersona.targetPersonaDescription)).toBeInTheDocument();

    // Assert specific content from nested fields
    expect(screen.getByText(/Founder/i)).toBeInTheDocument(); // From demographics.job_titles
    expect(screen.getByText(/Scaling outbound outreach/i)).toBeInTheDocument(); // From use_cases.use_case
    expect(screen.getByText(/Funding Announcements/i)).toBeInTheDocument(); // From buying_signals.title

    // Smart Assertion: Verify number of rendered persona cards
    expect(screen.getAllByText(mockTargetPersona.targetPersonaName).length).toBe(1);
    expect(screen.getByText(/1 personas across all target accounts/i)).toBeInTheDocument();
  });

  test("opens add persona modal", async () => {
    render(<Personas />);
    fireEvent.click(screen.getByText(/Add Target Persona/i));
    expect(screen.getByText(/Generate Target Persona/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/e.g., Marketing Director, Sales Manager.../i)).toBeInTheDocument();
  });

  test("adds a new target persona", async () => {
    (accountService.generateTargetPersona as vi.Mock).mockResolvedValue(mockTargetPersona);
    (accountService.getAllPersonas as vi.Mock).mockReturnValueOnce([]).mockReturnValueOnce([
      { persona: mockTargetPersona, accountId: mockTargetAccount.id, accountName: mockTargetAccount.targetAccountName },
    ]);

    render(<Personas />);
    fireEvent.click(screen.getByText(/Add Target Persona/i));

    const nameInput = screen.getByLabelText(/Persona Name/i);
    const descriptionInput = screen.getByLabelText(/Persona Description/i);
    const accountSelect = screen.getByRole("combobox", { name: /Target Account/i });
    const generateButton = screen.getByRole("button", { name: /Generate/i });

    fireEvent.change(nameInput, { target: { value: "New Persona" } });
    fireEvent.change(descriptionInput, { target: { value: "A new persona description." } });
    fireEvent.mouseDown(accountSelect); // Open the select dropdown
    fireEvent.click(screen.getByText(/SaaS Startups/i)); // Select the mock account
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(accountService.generateTargetPersona).toHaveBeenCalledWith(
        mockCompanyOverview.companyUrl.trim(),
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

  test("edits an existing target persona", async () => {
    (accountService.getAllPersonas as vi.Mock).mockReturnValue([
      { persona: mockTargetPersona, accountId: mockTargetAccount.id, accountName: mockTargetAccount.targetAccountName },
    ]);
    render(<Personas />);

    await waitFor(() => {
      expect(screen.getByText(mockTargetPersona.targetPersonaName)).toBeInTheDocument();
    });

    const editButton = screen.getByRole("button", { name: /edit/i, hidden: true }); // Assuming the edit button is within the persona card
    fireEvent.click(editButton);

    expect(screen.getByText(/Edit Persona/i)).toBeInTheDocument();
    const nameInput = screen.getByLabelText(/Persona Name/i);
    const descriptionInput = screen.getByLabelText(/Description/i);
    const updateButton = screen.getByRole("button", { name: /Update/i });

    expect(nameInput).toHaveValue(mockTargetPersona.targetPersonaName);
    expect(descriptionInput).toHaveValue(mockTargetPersona.targetPersonaDescription);

    fireEvent.change(nameInput, { target: { value: "Updated Persona Name" } });
    fireEvent.change(descriptionInput, { target: { value: "Updated persona description." } });
    fireEvent.click(updateButton);

    await waitFor(() => {
      expect(accountService.updatePersonaForTargetAccount).toHaveBeenCalledWith(
        mockTargetAccount.id,
        expect.objectContaining({
          id: mockTargetPersona.id,
          targetPersonaName: "Updated Persona Name",
          targetPersonaDescription: "Updated persona description.",
        })
      );
    });
    expect(accountService.getAllPersonas).toHaveBeenCalledTimes(2); // Called on mount and after update
  });

  test("deletes a target persona", async () => {
    (accountService.getAllPersonas as vi.Mock).mockReturnValue([
      { persona: mockTargetPersona, accountId: mockTargetAccount.id, accountName: mockTargetAccount.targetAccountName },
    ]);
    render(<Personas />);

    await waitFor(() => {
      expect(screen.getByText(mockTargetPersona.targetPersonaName)).toBeInTheDocument();
    });

    const deleteButton = screen.getByRole("button", { name: /delete/i, hidden: true });
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(accountService.deletePersonaFromTargetAccount).toHaveBeenCalledWith(
        mockTargetAccount.id,
        mockTargetPersona.id
      );
    });
    expect(accountService.getAllPersonas).toHaveBeenCalledTimes(2); // Called on mount and after delete
    expect(screen.queryByText(mockTargetPersona.targetPersonaName)).not.toBeInTheDocument();
  });

  test("filters personas by search term", () => {
    const anotherPersona = {
      persona: {
        ...mockTargetPersona,
        id: "persona-2",
        targetPersonaName: "Marketing Manager",
        targetPersonaDescription: "Manages marketing campaigns.",
      },
      accountId: mockTargetAccount.id,
      accountName: mockTargetAccount.targetAccountName,
    };
    (accountService.getAllPersonas as vi.Mock).mockReturnValue([
      { persona: mockTargetPersona, accountId: mockTargetAccount.id, accountName: mockTargetAccount.targetAccountName },
      anotherPersona,
    ]);
    render(<Personas />);

    const searchInput = screen.getByPlaceholderText(/Search personas.../i);
    fireEvent.change(searchInput, { target: { value: "Marketing" } });

    expect(screen.queryByText(/CEO/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Marketing Manager/i)).toBeInTheDocument();
  });

  test("displays error message on persona generation failure", async () => {
    (accountService.generateTargetPersona as vi.Mock).mockRejectedValue(new Error("API Error"));

    render(<Personas />);
    fireEvent.click(screen.getByText(/Add Target Persona/i));

    const nameInput = screen.getByLabelText(/Persona Name/i);
    const descriptionInput = screen.getByLabelText(/Persona Description/i);
    const accountSelect = screen.getByRole("combobox", { name: /Target Account/i });
    const generateButton = screen.getByRole("button", { name: /Generate/i });

    fireEvent.change(nameInput, { target: { value: "Failing Persona" } });
    fireEvent.change(descriptionInput, { target: { value: "This will fail." } });
    fireEvent.mouseDown(accountSelect);
    fireEvent.click(screen.getByText(/SaaS Startups/i));
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(screen.getByText(/Failed to generate persona./i)).toBeInTheDocument();
    });
    expect(screen.queryByText(/Failing Persona/i)).not.toBeInTheDocument();
  });

  test("data persistence via localStorage", async () => {
    // Simulate initial load with no personas
    (accountService.getAllPersonas as vi.Mock).mockReturnValueOnce([]);
    render(<Personas />);

    // Simulate adding a persona
    (accountService.generateTargetPersona as vi.Mock).mockResolvedValue(mockTargetPersona);
    // Mock getAllPersonas to return the new persona after it's added
    (accountService.getAllPersonas as vi.Mock).mockReturnValueOnce([
      { persona: mockTargetPersona, accountId: mockTargetAccount.id, accountName: mockTargetAccount.targetAccountName },
    ]);

    fireEvent.click(screen.getByText(/Add Target Persona/i));
    const nameInput = screen.getByLabelText(/Persona Name/i);
    const descriptionInput = screen.getByLabelText(/Persona Description/i);
    const accountSelect = screen.getByRole("combobox", { name: /Target Account/i });
    const generateButton = screen.getByRole("button", { name: /Generate/i });

    fireEvent.change(nameInput, { target: { value: mockTargetPersona.targetPersonaName } });
    fireEvent.change(descriptionInput, { target: { value: mockTargetPersona.targetPersonaDescription } });
    fireEvent.mouseDown(accountSelect);
    fireEvent.click(screen.getByText(/SaaS Startups/i));
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(screen.getByText(mockTargetPersona.targetPersonaName)).toBeInTheDocument();
    });

    // Verify localStorage was called to set the item
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      "target_accounts",
      expect.stringContaining(JSON.stringify(mockTargetPersona.targetPersonaName))
    );

    // Simulate page reload by re-rendering the component
    localStorageMock.getItem.mockReturnValueOnce(JSON.stringify([
      { persona: mockTargetPersona, accountId: mockTargetAccount.id, accountName: mockTargetAccount.targetAccountName },
    ]));
    (accountService.getAllPersonas as vi.Mock).mockReturnValueOnce([
      { persona: mockTargetPersona, accountId: mockTargetAccount.id, accountName: mockTargetAccount.targetAccountName },
    ]);
    render(<Personas />);

    await waitFor(() => {
      expect(screen.getByText(mockTargetPersona.targetPersonaName)).toBeInTheDocument();
      expect(screen.getByText(mockTargetPersona.targetPersonaDescription)).toBeInTheDocument();
    });

    // Assert that the data loaded from localStorage is the same as the original mock data
    expect(localStorageMock.getItem).toHaveBeenCalledWith("target_accounts");
  });
});
