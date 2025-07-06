import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import Accounts from "./Accounts";
import { useCompanyOverview } from "../lib/useCompanyOverview";
import * as accountService from "../lib/accountService";
import { TargetAccountResponse } from "../types/api";

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
vi.mock("../lib/accountService", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    generateTargetCompany: vi.fn(),
    getStoredTargetAccounts: vi.fn(),
    generateTargetAccountId: vi.fn(() => "mock-id-" + Math.random().toString(36).substring(7)),
  };
});

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

const mockTargetAccounts: (TargetAccountResponse & { id: string; createdAt: string })[] = [
  {
    id: "account-1",
    createdAt: new Date().toISOString(),
    targetAccountName: "SaaS Startups",
    targetAccountDescription: "Early-stage SaaS companies.",
    targetAccountRationale: ["Rationale 1"],
    firmographics: {
      industry: ["Software"],
      employees: "1-50",
      revenue: "< $1M",
      geography: ["Global"],
      business_model: ["Subscription"],
      funding_stage: ["Seed"],
      keywords: ["startup", "SaaS"],
    },
    buying_signals: [
      {
        title: "Recent Funding",
        description: "Recently closed a seed round.",
        type: "Company Data",
        priority: "High",
        detection_method: "Crunchbase",
      },
    ],
    buying_signals_rationale: ["Signal Rationale 1"],
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
  },
  {
    id: "account-2",
    createdAt: new Date().toISOString(),
    targetAccountName: "Enterprise Clients",
    targetAccountDescription: "Large corporations.",
    targetAccountRationale: ["Rationale 2"],
    firmographics: {
      industry: ["Finance"],
      employees: "1000+",
      revenue: "$1B+",
      geography: ["North America"],
      business_model: ["Enterprise"],
      funding_stage: ["Public"],
      keywords: ["finance", "enterprise"],
    },
    buying_signals: [
      {
        title: "Digital Transformation",
        description: "Initiating large-scale digital projects.",
        type: "News",
        priority: "High",
        detection_method: "Press Release",
      },
    ],
    buying_signals_rationale: ["Signal Rationale 2"],
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
  },
];

describe("Accounts Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
    (useCompanyOverview as vi.Mock).mockReturnValue(mockCompanyOverview);
    (accountService.getStoredTargetAccounts as vi.Mock).mockReturnValue([]);
  });

  test("renders loading state when overview is not available", () => {
    (useCompanyOverview as vi.Mock).mockReturnValue(null);
    render(<Accounts />);
    expect(screen.getByText(/Loading.../i)).toBeInTheDocument();
  });

  test("renders company overview and add account card", () => {
    render(<Accounts />);
    expect(screen.getByText(/Test Company/i)).toBeInTheDocument();
    expect(screen.getByText(/This is a test company overview./i)).toBeInTheDocument();
    expect(screen.getByText(/Add New/i)).toBeInTheDocument();
    expect(screen.getByText(/Generate Your First Target Account/i)).toBeInTheDocument();
  });

  test("renders existing target accounts", () => {
    (accountService.getStoredTargetAccounts as vi.Mock).mockReturnValue(mockTargetAccounts);
    render(<Accounts />);
    expect(screen.getByText(/SaaS Startups/i)).toBeInTheDocument();
    expect(screen.getByText(/Early-stage SaaS companies./i)).toBeInTheDocument();
    expect(screen.getByText(/Enterprise Clients/i)).toBeInTheDocument();
    expect(screen.getByText(/Large corporations./i)).toBeInTheDocument();
    expect(screen.getByText(/2 accounts created/i)).toBeInTheDocument();
  });

  test("opens add account modal", async () => {
    render(<Accounts />);
    fireEvent.click(screen.getByText(/Add Target Account/i));
    expect(screen.getByText(/Describe Your Ideal Target Account \(ICP\)/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/e.g. SaaS Startups, B2B Fintech Companies, etc./i)).toBeInTheDocument();
  });

  test("adds a new target account", async () => {
    (accountService.generateTargetCompany as vi.Mock).mockResolvedValue({
      targetAccountName: "New Account",
      targetAccountDescription: "A newly generated account.",
      targetAccountRationale: [],
      firmographics: {},
      buying_signals: [],
      buying_signals_rationale: [],
      metadata: {},
    });
    localStorageMock.setItem.mockClear(); // Clear mock calls before this test

    render(<Accounts />);
    fireEvent.click(screen.getByText(/Add Target Account/i));

    const nameInput = screen.getByLabelText(/Target Account Name/i);
    const descriptionInput = screen.getByLabelText(/Description/i);
    const generateButton = screen.getByRole("button", { name: /Generate/i });

    fireEvent.change(nameInput, { target: { value: "New Account" } });
    fireEvent.change(descriptionInput, { target: { value: "A newly generated account." } });
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(accountService.generateTargetCompany).toHaveBeenCalledWith(
        mockCompanyOverview.companyUrl.trim(),
        "New Account",
        "A newly generated account.",
        undefined,
        expect.any(Object) // companyContext
      );
    });

    await waitFor(() => {
      expect(screen.getByText(/New Account/i)).toBeInTheDocument();
    });
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      "target_accounts",
      expect.stringContaining("New Account")
    );
  });

  test("edits an existing target account", async () => {
    (accountService.getStoredTargetAccounts as vi.Mock).mockReturnValue(mockTargetAccounts);
    render(<Accounts />);

    const editButton = screen.getAllByRole("button", { name: /edit/i })[0];
    fireEvent.click(editButton);

    expect(screen.getByText(/Edit Target Account/i)).toBeInTheDocument();
    const nameInput = screen.getByLabelText(/Target Account Name/i);
    const descriptionInput = screen.getByLabelText(/Description/i);
    const updateButton = screen.getByRole("button", { name: /Update/i });

    expect(nameInput).toHaveValue("SaaS Startups");
    expect(descriptionInput).toHaveValue("Early-stage SaaS companies.");

    fireEvent.change(nameInput, { target: { value: "Updated SaaS Startups" } });
    fireEvent.change(descriptionInput, { target: { value: "Updated description." } });
    fireEvent.click(updateButton);

    await waitFor(() => {
      expect(screen.getByText(/Updated SaaS Startups/i)).toBeInTheDocument();
    });
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      "target_accounts",
      expect.stringContaining("Updated SaaS Startups")
    );
  });

  test("deletes a target account", async () => {
    (accountService.getStoredTargetAccounts as vi.Mock).mockReturnValue(mockTargetAccounts);
    render(<Accounts />);

    expect(screen.getByText(/SaaS Startups/i)).toBeInTheDocument();
    const deleteButton = screen.getAllByRole("button", { name: /delete/i })[0];
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(screen.queryByText(/SaaS Startups/i)).not.toBeInTheDocument();
    });
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      "target_accounts",
      JSON.stringify([mockTargetAccounts[1]])
    );
  });

  test("filters accounts by search term", () => {
    (accountService.getStoredTargetAccounts as vi.Mock).mockReturnValue(mockTargetAccounts);
    render(<Accounts />);

    const searchInput = screen.getByPlaceholderText(/Search accounts.../i);
    fireEvent.change(searchInput, { target: { value: "Enterprise" } });

    expect(screen.queryByText(/SaaS Startups/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Enterprise Clients/i)).toBeInTheDocument();
  });

  test("displays error message on account generation failure", async () => {
    (accountService.generateTargetCompany as vi.Mock).mockRejectedValue(new Error("API Error"));

    render(<Accounts />);
    fireEvent.click(screen.getByText(/Add Target Account/i));

    const nameInput = screen.getByLabelText(/Target Account Name/i);
    const descriptionInput = screen.getByLabelText(/Description/i);
    const generateButton = screen.getByRole("button", { name: /Generate/i });

    fireEvent.change(nameInput, { target: { value: "Failing Account" } });
    fireEvent.change(descriptionInput, { target: { value: "This will fail." } });
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(screen.getByText(/Failed to generate target account./i)).toBeInTheDocument();
    });
    expect(screen.queryByText(/Failing Account/i)).not.toBeInTheDocument();
  });

  test("navigates to account detail page on card click", () => {
    (accountService.getStoredTargetAccounts as vi.Mock).mockReturnValue(mockTargetAccounts);
    render(<Accounts />);

    const saasCard = screen.getByText(/SaaS Startups/i).closest(".group"); // Assuming SummaryCard has a group class
    if (saasCard) {
      fireEvent.click(saasCard);
    }

    expect(mockNavigate).toHaveBeenCalledWith("/target-accounts/account-1");
  });
});
