import { useState } from "react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Clock, Search, Filter, Pencil, Trash } from "lucide-react"
import SummaryCard from "../cards/SummaryCard"
import type { GeneratedEmail, Campaign } from "../../types/api"
import { getEntityColorForParent } from "../../lib/entityColors"
import { getCampaignSubject, getCampaignBody, getCampaignTimestamp, getCampaignParents } from "../../lib/entityDisplayUtils"

interface EmailHistoryProps {
  emails: (Campaign & { isDraft?: boolean })[] | GeneratedEmail[]
  onSelectEmail: (email: Campaign | GeneratedEmail) => void
  onEditEmail: (email: Campaign | GeneratedEmail) => void
  onDeleteEmail: (email: Campaign | GeneratedEmail) => void
  extraItem?: React.ReactNode;
}

export function EmailHistory({ emails, onSelectEmail, onEditEmail, onDeleteEmail, extraItem }: EmailHistoryProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterBy, setFilterBy] = useState("all")

  const filteredEmails = emails.filter((email) => {
    const matchesSearch =
      getCampaignSubject(email).toLowerCase().includes(searchTerm.toLowerCase()) ||
      getCampaignBody(email).toLowerCase().includes(searchTerm.toLowerCase())

    if (filterBy === "all") return matchesSearch
    return matchesSearch
  })

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-visible p-1">
        {filteredEmails.map((email) => {
          const parents = getCampaignParents(email);
          const subject = getCampaignSubject(email);
          const body = getCampaignBody(email);
          
          return (
            <SummaryCard
              key={email.id}
              title={subject}
              description={body.substring(0, 120) + (body.length > 120 ? "..." : "")}
              parents={[...parents, ...(email.isDraft ? [{ name: "Draft", color: "bg-orange-100 text-orange-800", label: "Status" }] : [])]}
              onClick={() => onSelectEmail(email)}
              entityType="campaign"
            >
              {/* Edit button */}
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-blue-600"
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
                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-red-500"
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