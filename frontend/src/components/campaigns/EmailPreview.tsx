import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { Copy, RefreshCw, Save, Eye, EyeOff } from "lucide-react"
import { Label } from "../ui/label"

interface EmailSegment {
  text: string
  type: string
  color: string
}

interface EmailBreakdown {
  [key: string]: {
    label: string
    description: string
    color: string
  }
}

interface GeneratedEmail {
  id: string
  timestamp: string
  subject: string
  body: string
  segments: EmailSegment[]
  breakdown: EmailBreakdown
  config?: any
}

interface EmailPreviewProps {
  email: GeneratedEmail
  onCreateVariant: (email: GeneratedEmail) => void
  onCopy: (email: GeneratedEmail) => void
  onSend: (email: GeneratedEmail) => void
  onEditComponent?: (componentType: string, email: GeneratedEmail) => void
}

export function EmailPreview({ email, onCreateVariant, onCopy, onSend, onEditComponent }: EmailPreviewProps) {
  const [showBreakdown, setShowBreakdown] = useState(true)
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null)

  const renderColorCodedBody = () => {
    return (
      <div className="space-y-2">
        {email.segments.map((segment, index) => (
          <div
            key={index}
            className={`p-2 rounded border transition-all duration-200 cursor-pointer ${segment.color} ${
              hoveredSegment === segment.type ? "ring-2 ring-blue-400" : ""
            }`}
            onMouseEnter={() => setHoveredSegment(segment.type)}
            onMouseLeave={() => setHoveredSegment(null)}
          >
            <div className="flex items-start justify-between">
              <pre className="text-sm whitespace-pre-wrap font-sans flex-1">{segment.text}</pre>
              <Badge variant="secondary" className="ml-2 text-xs">
                {email.breakdown[segment.type]?.label}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Email Preview */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Generated Email</CardTitle>
            <p className="text-sm text-gray-500 mt-1">Generated on {email.timestamp}</p>
          </div>
          <div className="flex space-x-2">
            <Button size="sm" variant="outline" onClick={() => setShowBreakdown(!showBreakdown)}>
              {showBreakdown ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
              {showBreakdown ? "Hide" : "Show"} Breakdown
            </Button>
            <Button size="sm" variant="outline" onClick={() => onCopy(email)}>
              <Copy className="w-4 h-4 mr-2" />
              Copy
            </Button>
            <Button size="sm" variant="outline" onClick={() => onCreateVariant(email)}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Create Variant
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-gray-700">Subject Line</Label>
            <div className="mt-1 p-3 bg-gray-50 rounded-lg border">
              <p className="text-sm">{email.subject}</p>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-700">Email Body</Label>
            <div className="mt-1 p-4 bg-gray-50 rounded-lg border">
              {showBreakdown ? (
                renderColorCodedBody()
              ) : (
                <pre className="text-sm whitespace-pre-wrap font-sans">{email.body}</pre>
              )}
            </div>
          </div>

          <Button onClick={() => onSend(email)} className="w-full bg-green-600 hover:bg-green-700">
            <Save className="w-4 h-4 mr-2" />
            Save Email
          </Button>
        </CardContent>
      </Card>

      {/* Breakdown */}
      {showBreakdown && (
        <Card>
          <CardHeader>
            <CardTitle>Email Breakdown</CardTitle>
            <p className="text-sm text-gray-500">Click on any component to edit it</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(email.breakdown).map(([key, value]) => (
              <div
                key={key}
                className={`p-3 rounded border transition-all duration-200 cursor-pointer hover:ring-2 hover:ring-blue-400 ${value.color} ${
                  hoveredSegment === key ? "ring-2 ring-blue-400" : ""
                }`}
                onMouseEnter={() => setHoveredSegment(key)}
                onMouseLeave={() => setHoveredSegment(null)}
                onClick={() => onEditComponent?.(key, email)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-sm font-medium text-gray-900">{value.label}</span>
                    <p className="text-xs text-gray-600 mt-1">{value.description}</p>
                    <p className="text-xs text-blue-600 mt-1 font-medium">Click to edit</p>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {key}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
} 