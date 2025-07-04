import { useState, useRef, useEffect, useLayoutEffect } from "react"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { Copy, RefreshCw, Save, Eye, EyeOff, Pencil } from "lucide-react"
import { Label } from "../ui/label"
import InputModal from "../modals/InputModal"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import {CSS} from '@dnd-kit/utilities';
import { restrictToVerticalAxis, restrictToParentElement } from '@dnd-kit/modifiers';

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

interface Segment {
  text: string;
  type: string;
  color: string;
}

interface BreakdownEntry {
  label: string;
  description: string;
  color: string;
}

interface Breakdown {
  [key: string]: BreakdownEntry;
}

// Replace enums with const objects for EditingMode and WizardMode
const EditingMode = {
  Breakdown: 'breakdown',
  Body: 'body',
} as const;
type EditingMode = (typeof EditingMode)[keyof typeof EditingMode];

const WizardMode = {
  Create: 'create',
  Edit: 'edit',
} as const;
type WizardMode = (typeof WizardMode)[keyof typeof WizardMode];

// NOTE: If you see module not found errors for @dnd-kit/*, run:
// npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities

interface SortableSegmentProps {
  segment: Segment;
  index: number;
  breakdown: Breakdown;
  hoveredSegment: string | null;
  setHoveredSegment: (type: string | null) => void;
  handleEditLabel: (index: number) => void;
}

// SortableSegment component for drag-and-drop
function SortableSegment({ segment, index, breakdown, hoveredSegment, setHoveredSegment, handleEditLabel }: SortableSegmentProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({id: segment.type});

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-3 rounded border transition-all duration-200 hover:ring-2 hover:ring-blue-400 ${breakdown[segment.type]?.color || "bg-blue-50 border-blue-200"} ${
        hoveredSegment === segment.type ? "ring-2 ring-blue-400" : ""
      }`}
      onMouseEnter={() => setHoveredSegment(segment.type)}
      onMouseLeave={() => setHoveredSegment(null)}
    >
      <div className="flex flex-row items-center justify-between min-h-[56px]">
        {/* Main content area - clickable for editing */}
        <div 
          className="flex-1 cursor-pointer pr-4"
          onClick={() => handleEditLabel(index)}
        >
          <span className="text-sm font-medium text-gray-900">
            {breakdown[segment.type]?.label || "Custom"}
          </span>
          <p className="text-xs text-gray-600 mt-1">
            {breakdown[segment.type]?.description || "Custom component"}
          </p>
          <p className="text-xs text-blue-600 mt-1 font-medium">
            Click to edit
          </p>
        </div>
        {/* Drag handle fills vertical space, icon centered */}
        <div
          {...attributes}
          {...listeners}
          className="ml-2 w-10 border-l border-gray-300 cursor-grab active:cursor-grabbing hover:bg-gray-100 transition-colors group flex items-center justify-center self-stretch"
          title="Drag to reorder"
        >
          <div className="flex flex-col items-center justify-center h-full">
            <div className="w-4 h-0.5 bg-gray-400 group-hover:bg-gray-600 rounded mb-0.5"></div>
            <div className="w-4 h-0.5 bg-gray-400 group-hover:bg-gray-600 rounded mb-0.5"></div>
            <div className="w-4 h-0.5 bg-gray-400 group-hover:bg-gray-600 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function EmailPreview({ email, onCreateVariant, onCopy, onSend, onEditComponent }: EmailPreviewProps) {
  const [showBreakdown, setShowBreakdown] = useState(true)
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null)
  const [editingSubject, setEditingSubject] = useState(false)
  const [subjectValue, setSubjectValue] = useState(email.subject)
  const [editingSegment, setEditingSegment] = useState<number | null>(null)
  const [segments, setSegments] = useState(email.segments)
  const [breakdown, setBreakdown] = useState(email.breakdown)
  const [segmentValues, setSegmentValues] = useState(email.segments.map(s => s.text))
  const [editingBody, setEditingBody] = useState(false)
  const [editingBodyActive, setEditingBodyActive] = useState(false)
  const [bodyValue, setBodyValue] = useState(email.segments.map(s => s.text).join('\n\n'))
  const subjectInputRef = useRef<HTMLInputElement>(null)
  const segmentInputRefs = useRef<(HTMLTextAreaElement | null)[]>([])
  const bodyPreRef = useRef<HTMLPreElement>(null)
  const [bodyTextareaHeight, setBodyTextareaHeight] = useState<string | undefined>(undefined)
  const lastPreHeight = useRef<number>(0)
  const [pendingBodyChanges, setPendingBodyChanges] = useState(false)
  const [currentEditingSection, setCurrentEditingSection] = useState<number | null>(null)
  const prevBodyValue = useRef(bodyValue);
  const [editingMode, setEditingMode] = useState<EditingMode>(EditingMode.Breakdown);
  const renderedBodyRef = useRef<HTMLDivElement>(null)
  const [editingLabelIndex, setEditingLabelIndex] = useState<number | null>(null);
  const [inputModalOpen, setInputModalOpen] = useState(false);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Drag end handler
  const handleDragEnd = (event: import('@dnd-kit/core').DragEndEvent) => {
    const {active, over} = event;
    if (!over || active.id === over.id) return;
    const oldIndex = segments.findIndex(s => s.type === active.id);
    const newIndex = segments.findIndex(s => s.type === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const newSegments = arrayMove(segments, oldIndex, newIndex);
    const newSegmentValues = arrayMove(segmentValues, oldIndex, newIndex);
    setSegments(newSegments);
    setSegmentValues(newSegmentValues);
    setBodyValue(newSegmentValues.join('\n\n'));
  };

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

  // When a segment is edited, update the body and segments
  const handleSegmentSave = (idx: number) => {
    setEditingSegment(null)
    const newSegments = segments.map((s, i) => i === idx ? { ...s, text: segmentValues[i] } : s)
    setSegments(newSegments)
    setBodyValue(newSegments.map(s => s.text).join('\n\n'))
  }

  // Save segment on blur or Enter
  const handleSegmentKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>, idx: number) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSegmentSave(idx)
    }
  }

  // Replace parseBodyIntoSegmentsNearest with a simpler chunk-to-section mapping
  function parseBodyIntoSegmentsSimple(
    newBody: string,
    currentSegments: Segment[],
    currentBreakdown: Breakdown
  ): { newSegments: Segment[]; newBreakdown: Breakdown } {
    const chunks = newBody.split(/\n\n+/).map(chunk => chunk.trim());
    // Map chunks to existing segments in order
    const newSegments = currentSegments.map((segment, i) => ({
      ...segment,
      text: chunks[i] || ""
    }));
    // Handle extra chunks (append to last section)
    if (chunks.length > currentSegments.length && newSegments.length > 0) {
      const extraContent = chunks.slice(currentSegments.length).join('\n\n');
      newSegments[newSegments.length - 1].text += (newSegments[newSegments.length - 1].text ? '\n\n' : '') + extraContent;
    }
    return { newSegments, newBreakdown: { ...currentBreakdown } };
  }

  // When the body is edited, update the segments and breakdown
  const handleBodySave = () => {
    setEditingBody(false);
    setEditingBodyActive(false);
    setPendingBodyChanges(false);
    // Use simple chunk-to-section mapping
    const { newSegments, newBreakdown } = parseBodyIntoSegmentsSimple(
      bodyValue,
      segments,
      breakdown
    );
    setSegments(newSegments);
    setBreakdown(newBreakdown);
    setSegmentValues(newSegments.map(s => s.text));
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

  // Add a new type for custom segments
  const getNextCustomType = () => `custom-${segments.length + 1}`;

  // Mode switching handlers
  const switchToBodyMode = () => {
    setBodyValue(segmentValues.join('\n\n'));
    // Measure the rendered body height and set textarea height
    if (renderedBodyRef.current) {
      const height = renderedBodyRef.current.offsetHeight;
      setBodyTextareaHeight(height ? `${height}px` : undefined);
    } else {
      setBodyTextareaHeight(undefined);
    }
    setEditingMode(EditingMode.Body);
  };
  const switchToBreakdownMode = () => {
    // Use simple chunk-to-section mapping
    const { newSegments, newBreakdown } = parseBodyIntoSegmentsSimple(
      bodyValue,
      segments,
      breakdown
    );
    setSegments(newSegments);
    setBreakdown(newBreakdown);
    setSegmentValues(newSegments.map(s => s.text));
    setEditingMode(EditingMode.Breakdown);
  };

  const renderColorCodedBody = () => (
    <div className="space-y-2">
      {segmentValues.map((text, index) => (
        <div
          key={index}
          className={`p-2 rounded border transition-all duration-200 cursor-pointer ${segments[index]?.color || ''} ${hoveredSegment === segments[index]?.type ? "ring-2 ring-blue-400" : ""}`}
          onMouseEnter={() => setHoveredSegment(segments[index]?.type)}
          onMouseLeave={() => setHoveredSegment(null)}
        >
          <div className="flex items-start justify-between">
            {editingSegment === index ? (
              <textarea
                ref={el => { segmentInputRefs.current[index] = el; }}
                className="w-full text-sm font-sans bg-white border rounded p-2"
                value={segmentValues[index]}
                onChange={e => {
                  const newVals = [...segmentValues];
                  newVals[index] = e.target.value;
                  setSegmentValues(newVals);
                }}
                onBlur={() => handleSegmentSave(index)}
                onKeyDown={e => handleSegmentKeyDown(e, index)}
                autoFocus
                rows={Math.max(2, segmentValues[index].split('\n').length)}
              />
            ) : (
              <pre
                className="text-sm whitespace-pre-wrap font-sans flex-1"
                onClick={() => setEditingSegment(index)}
                tabIndex={0}
                style={{
                  cursor: "text",
                  minHeight: text ? undefined : '2rem',
                  display: 'flex',
                  alignItems: text ? 'flex-start' : 'center',
                }}
              >
                {text || (
                  <span className="text-gray-400 italic">Click to add content...</span>
                )}
              </pre>
            )}
            <Badge variant="secondary" className="ml-2 text-xs">
              {breakdown[segments[index]?.type]?.label}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  );

  const handleToggleBreakdown = () => {
    if (showBreakdown) {
      // Hiding breakdown: switch to body mode
      setShowBreakdown(false);
      switchToBodyMode();
    } else {
      // Showing breakdown: switch to breakdown mode
      setShowBreakdown(true);
      switchToBreakdownMode();
    }
  };

  // Handler to open InputModal for editing label
  const handleEditLabel = (index: number) => {
    setEditingLabelIndex(index);
    setInputModalOpen(true);
  };

  // Handler for InputModal submit
  const handleLabelSubmit = ({ name }: { name: string; description: string }) => {
    if (editingLabelIndex === null) return;
    const segType = segments[editingLabelIndex].type;
    setBreakdown(bd => ({
      ...bd,
      [segType]: {
        ...bd[segType],
        label: name,
      },
    }));
    setInputModalOpen(false);
    setEditingLabelIndex(null);
  };

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8">
      {/* Email Preview */}
      <div className="w-full min-w-[500px] bg-white rounded-lg shadow border p-6">
        <div className="flex flex-row items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Generated Email</h3>
            <p className="text-sm text-gray-500 mt-1">Generated on {email.timestamp}</p>
          </div>
          <div className="flex space-x-2">
            <Button size="sm" variant="outline" onClick={handleToggleBreakdown}>
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
                </div>
              </div>
            )}
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-700">Email Body</Label>
            <div className="mt-1 p-4 bg-gray-50 rounded-lg border">
              {editingMode === EditingMode.Body ? (
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
                <div ref={renderedBodyRef}>
                  {renderColorCodedBody()}
                </div>
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
            <p className="text-sm text-gray-500">Click and drag to reorder. Click a card to edit its title.</p>
          </div>
          <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            modifiers={[restrictToVerticalAxis, restrictToParentElement]}
          >
            <SortableContext 
              items={segments.map(s => s.type)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {segments.map((segment, index) => (
                  <SortableSegment
                    key={segment.type}
                    segment={segment}
                    index={index}
                    breakdown={breakdown}
                    hoveredSegment={hoveredSegment}
                    setHoveredSegment={setHoveredSegment}
                    handleEditLabel={handleEditLabel}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
          {/* Add new component card */}
          <div
            className="p-3 rounded border-2 border-dashed border-blue-300 bg-blue-50 text-blue-700 text-center cursor-pointer hover:bg-blue-100 transition-all duration-200 mt-3"
            onClick={() => {
              const newType = getNextCustomType();
              setSegments(segs => [...segs, { text: "", type: newType, color: "bg-blue-50 border-blue-200" }]);
              setBreakdown(bd => ({
                ...bd,
                [newType]: {
                  label: "Custom",
                  description: "Custom component",
                  color: "bg-blue-50 border-blue-200",
                },
              }));
              setSegmentValues(vals => [...vals, ""]);
              setEditingSegment(segments.length);
            }}
          >
            + Add new component
          </div>
          {/* InputModal for editing label */}
          <InputModal
            isOpen={inputModalOpen}
            onClose={() => {
              setInputModalOpen(false);
              setEditingLabelIndex(null);
            }}
            onSubmit={handleLabelSubmit}
            title="Edit Segment Title"
            subtitle="Change the name of this segment."
            nameLabel="Segment Title"
            descriptionLabel="(Optional) Description"
            namePlaceholder="Enter segment title..."
            descriptionPlaceholder="Enter description (optional)"
            submitLabel="Save"
            cancelLabel="Cancel"
            defaultName={editingLabelIndex !== null ? breakdown[segments[editingLabelIndex]?.type]?.label || "" : ""}
            defaultDescription={editingLabelIndex !== null ? breakdown[segments[editingLabelIndex]?.type]?.description || "" : ""}
          />
        </div>
      )}
    </div>
  )
} 