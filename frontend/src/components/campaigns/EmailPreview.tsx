import { useState, useRef, useEffect } from "react"
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
  const [editingSubject, setEditingSubject] = useState(false)
  const [subjectValue, setSubjectValue] = useState(email.subject)
  const [editingSegment, setEditingSegment] = useState<number | null>(null)
  const [segmentValues, setSegmentValues] = useState(email.segments.map(s => s.text))
  const [editingBody, setEditingBody] = useState(false)
  const [bodyValue, setBodyValue] = useState(email.segments.map(s => s.text).join('\n\n'))
  const subjectInputRef = useRef<HTMLInputElement>(null)
  const segmentInputRefs = useRef<(HTMLTextAreaElement | null)[]>([])
  const [editingBodyActive, setEditingBodyActive] = useState(false)
  const bodyPreRef = useRef<HTMLPreElement>(null)
  const [bodyTextareaHeight, setBodyTextareaHeight] = useState<string | undefined>(undefined)
  const lastPreHeight = useRef<number>(0)

  // Save subject on blur or Enter
  const handleSubjectSave = () => {
    setEditingSubject(false)
    // Optionally: propagate change to parent or API here
  }
  const handleSubjectKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleSubjectSave()
    }
  }

  // When a segment is edited, update the body
  const handleSegmentSave = (idx: number) => {
    setEditingSegment(null)
    const newBody = segmentValues.join('\n\n')
    setBodyValue(newBody)
    // Optionally: propagate change to parent or API here
  }

  // Save segment on blur or Enter
  const handleSegmentKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>, idx: number) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSegmentSave(idx)
    }
  }

  // When the body is edited, update the segments
  const handleBodySave = () => {
    setEditingBody(false)
    // Split by double newlines, but keep the number of segments the same as before
    const split = bodyValue.split(/\n\n+/)
    setSegmentValues(vals => vals.map((v, i) => split[i] !== undefined ? split[i] : v))
    // Optionally: propagate change to parent or API here
  }
  const handleBodyKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && e.metaKey) {
      e.preventDefault()
      handleBodySave()
    }
  }

  // When showBreakdown changes, reset editingBodyActive
  useEffect(() => {
    setEditingBody(!showBreakdown)
    setEditingBodyActive(false)
  }, [showBreakdown])

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
              {editingSegment === index ? (
                <textarea
                  ref={el => { segmentInputRefs.current[index] = el; }}
                  className="text-sm whitespace-pre-wrap font-sans flex-1 bg-white border rounded p-1"
                  value={segmentValues[index]}
                  onChange={e => setSegmentValues(vals => vals.map((v, i) => i === index ? e.target.value : v))}
                  onBlur={() => handleSegmentSave(index)}
                  onKeyDown={e => handleSegmentKeyDown(e, index)}
                  rows={2}
                  autoFocus
                />
              ) : (
                <pre
                  className="text-sm whitespace-pre-wrap font-sans flex-1"
                  onClick={() => setEditingSegment(index)}
                  tabIndex={0}
                  style={{ cursor: "text" }}
                >{segmentValues[index]}</pre>
              )}
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
    <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Email Preview */}
      <div className="w-full min-w-[500px] bg-white rounded-lg shadow border p-6">
        <div className="flex flex-row items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Generated Email</h3>
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
        </div>
        
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-gray-700">Subject Line</Label>
            {editingSubject ? (
              <input
                ref={subjectInputRef}
                className="mt-1 p-3 rounded-lg border w-full text-sm bg-white"
                value={subjectValue}
                onChange={e => setSubjectValue(e.target.value)}
                onBlur={handleSubjectSave}
                onKeyDown={handleSubjectKeyDown}
                autoFocus
              />
            ) : (
              <div
                className={`mt-1 p-3 rounded-lg border transition-all duration-200 cursor-pointer ${email.breakdown.subject.color} ${hoveredSegment === "subject" ? "ring-2 ring-blue-400" : ""}`}
                onMouseEnter={() => setHoveredSegment("subject")}
                onMouseLeave={() => setHoveredSegment(null)}
                onClick={() => setEditingSubject(true)}
                tabIndex={0}
                style={{ cursor: "text" }}
              >
                <div className="flex items-start justify-between">
                  <p className="text-sm">{subjectValue}</p>
                  <Badge variant="secondary" className="ml-2 text-xs">{email.breakdown.subject.label}</Badge>
                </div>
              </div>
            )}
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-700">Email Body</Label>
            <div className="mt-1 p-4 bg-gray-50 rounded-lg border">
              {editingBody ? (
                editingBodyActive ? (
                  <textarea
                    className="email-body-textarea w-full text-sm font-sans bg-white border rounded p-2"
                    style={bodyTextareaHeight ? { height: bodyTextareaHeight, resize: 'vertical' } : { minHeight: '120px', resize: 'vertical' }}
                    value={bodyValue}
                    onChange={e => setBodyValue(e.target.value)}
                    onBlur={() => setEditingBodyActive(false)}
                    onKeyDown={handleBodyKeyDown}
                    autoFocus
                  />
                ) : (
                  <pre
                    ref={bodyPreRef}
                    className="text-sm whitespace-pre-wrap font-sans w-full min-h-[120px] cursor-text"
                    onClick={() => {
                      if (bodyPreRef.current) {
                        const h = Math.max(bodyPreRef.current.offsetHeight, 120)
                        setBodyTextareaHeight(`${h}px`)
                      }
                      setEditingBodyActive(true)
                    }}
                    tabIndex={0}
                    style={{ minHeight: '120px' }}
                  >{bodyValue}</pre>
                )
              ) : showBreakdown ? (
                renderColorCodedBody()
              ) : (
                <pre className="text-sm whitespace-pre-wrap font-sans">{bodyValue}</pre>
              )}
            </div>
          </div>

          <Button onClick={() => onSend(email)} className="w-full bg-green-600 hover:bg-green-700">
            <Save className="w-4 h-4 mr-2" />
            Save Email
          </Button>
        </div>
      </div>

      {/* Breakdown */}
      {showBreakdown && (
        <div className="w-full min-w-[500px] bg-white rounded-lg shadow border p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Email Breakdown</h3>
            <p className="text-sm text-gray-500">Click on any component to edit it</p>
          </div>
          
          <div className="space-y-3">
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
          </div>
        </div>
      )}
    </div>
  )
} 