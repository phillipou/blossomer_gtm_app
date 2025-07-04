import { useState } from "react"
import { Card, CardContent, CardHeader } from "../ui/card"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Clock, Search, Copy, Send, Eye, Filter, Pencil, Trash } from "lucide-react"
import SummaryCard from "../cards/SummaryCard"

interface GeneratedEmail {
  id: string
  timestamp: string
  subject: string
  body: string
  segments: any[]
  breakdown: any
  config?: any
}

interface EmailHistoryProps {
  emails: GeneratedEmail[]
  onSelectEmail: (email: GeneratedEmail) => void
  onCopyEmail: (email: GeneratedEmail) => void
  onSendEmail: (email: GeneratedEmail) => void
  onEditEmail: (email: GeneratedEmail) => void
  onDeleteEmail: (email: GeneratedEmail) => void
  extraItem?: React.ReactNode;
}

export function EmailHistory({ emails, onSelectEmail, onCopyEmail, onSendEmail, onEditEmail, onDeleteEmail, extraItem }: EmailHistoryProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterBy, setFilterBy] = useState("all")
  // const [viewMode, setViewMode] = useState("grid") // "grid" or "list"

  const filteredEmails = emails.filter((email) => {
    const matchesSearch =
      email.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.body.toLowerCase().includes(searchTerm.toLowerCase())

    if (filterBy === "all") return matchesSearch
    return matchesSearch
  })

  const getConfigSummary = (config: any) => {
    if (!config) return "Unknown configuration"

    const parts = []
    if (config.selectedUseCase === "1") parts.push("Scaling Sales")
    if (config.selectedUseCase === "2") parts.push("Time Optimization")
    if (config.emphasis === "pain-point") parts.push("Pain Point")
    if (config.emphasis === "capabilities") parts.push("Capabilities")
    if (config.emphasis === "desired-outcome") parts.push("Desired Outcome")

    return parts.join(" • ") || "Custom configuration"
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 1) return "Just now"
    if (diffInHours < 24) return `${Math.floor(diffInHours)}h ago`
    return date.toLocaleDateString()
  }

  if (emails.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500">
        <Clock className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No emails generated yet</h3>
        <p className="text-gray-600">Generate your first email to see it here</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Search and Filters */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Generated Emails</h2>
          <p className="text-sm text-gray-500">{emails.length} emails generated</p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search emails..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>

          <Select value={filterBy} onValueChange={setFilterBy}>
            <SelectTrigger className="w-40">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Emails</SelectItem>
              <SelectItem value="scaling">Scaling Sales</SelectItem>
              <SelectItem value="optimization">Time Optimization</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Email Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEmails.map((email) => {
          // Extract parent info from email.config if available, else use placeholders
          let parents = [];
          if (email.config?.companyName) parents.push({ name: email.config.companyName, color: "bg-green-400", label: "Company" });
          if (email.config?.accountName) parents.push({ name: email.config.accountName, color: "bg-red-400", label: "Account" });
          if (email.config?.personaName) parents.push({ name: email.config.personaName, color: "bg-blue-400", label: "Persona" });
          if (parents.length === 0) {
            parents = [
              { name: "Demo Company", color: "bg-green-400", label: "Company" },
              { name: "Demo Account", color: "bg-red-400", label: "Account" },
              { name: "Demo Persona", color: "bg-blue-400", label: "Persona" },
            ];
          }
          return (
            <SummaryCard
              key={email.id}
              title={email.subject}
              description={email.body.substring(0, 120) + (email.body.length > 120 ? "..." : "")}
              parents={parents}
              onClick={() => onSelectEmail(email)}
            >
              {/* Edit button */}
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={e => {
                  e.stopPropagation()
                  onEditEmail(email)
                }}
                aria-label="Edit Email"
              >
                <Pencil className="w-4 h-4" />
              </Button>
              {/* Delete button */}
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={e => {
                  e.stopPropagation()
                  onDeleteEmail(email)
                }}
                aria-label="Delete Email"
              >
                <Trash className="w-4 h-4" />
              </Button>
            </SummaryCard>
          );
        })}
        {extraItem}
      </div>

      {filteredEmails.length === 0 && searchTerm && (
        <div className="text-center py-12 text-gray-500">
          <Search className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No emails found matching "{searchTerm}"</p>
        </div>
      )}
    </div>
  )
} 