import { useState, useRef, useEffect } from "react"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { Copy, RefreshCw, Save } from "lucide-react"
import { Label } from "../ui/label"
import InputModal from "../modals/InputModal"
import type { GeneratedEmail } from "../../types/api"
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

interface EmailPreviewProps {
  email: GeneratedEmail
  onCreateVariant: (email: GeneratedEmail) => void
  onCopy: (email: GeneratedEmail) => void
  onSend: (email: GeneratedEmail) => void
  editingMode: EditingMode
  setEditingMode: (mode: EditingMode) => void
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
  Component: 'component',
  Writing: 'writing',
} as const;
type EditingMode = (typeof EditingMode)[keyof typeof EditingMode];

// NOTE: If you see module not found errors for @dnd-kit/*, run:
// npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities

interface SortableSegmentProps {
  segment: Segment;
  index: number;
  breakdown: Breakdown;
  hoveredSegment: string | null;
  setHoveredSegment: (type: string | null) => void;
  handleEditLabel: (index: number) => void;
  getSegmentColor: (segmentType: string) => string;
}

// SortableSegment component for drag-and-drop
function SortableSegment({ segment, index, breakdown, hoveredSegment, setHoveredSegment, handleEditLabel, getSegmentColor }: SortableSegmentProps) {
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
      className={`p-3 rounded border transition-all duration-200 hover:ring-2 hover:ring-blue-400 ${getSegmentColor(segment.type)} ${
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

export function EmailPreview({ email, onCreateVariant, onCopy, onSend, editingMode }: EmailPreviewProps) {
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null)
  const [editingSubject, setEditingSubject] = useState(false)
  const [subjectValue, setSubjectValue] = useState(email.subject)
  const [editingSegment, setEditingSegment] = useState<number | null>(null)
  const [segments, setSegments] = useState(email.segments)
  const [breakdown, setBreakdown] = useState(email.breakdown)
  const [segmentValues, setSegmentValues] = useState(email.segments.map(s => s.text))
  const [bodyValue, setBodyValue] = useState(email.segments.map(s => s.text).join('\n\n'))
  
  // Fix stale closure bug: Update state when email prop changes (following React best practices)
  useEffect(() => {
    setSubjectValue(email.subject);
    setSegments(email.segments);
    setBreakdown(email.breakdown);
    setSegmentValues(email.segments.map(s => s.text));
    setBodyValue(email.segments.map(s => s.text).join('\n\n'));
  }, [email.subject, email.segments, email.breakdown]);
  const subjectInputRef = useRef<HTMLInputElement>(null)
  const segmentInputRefs = useRef<(HTMLTextAreaElement | null)[]>([])
  const [bodyTextareaHeight, setBodyTextareaHeight] = useState<string | undefined>(undefined)
  const renderedBodyRef = useRef<HTMLDivElement>(null)
  const [editingLabelIndex, setEditingLabelIndex] = useState<number | null>(null);
  const [inputModalOpen, setInputModalOpen] = useState(false);

  const getNextCustomType = () => {
    const customTypes = segments.filter(s => s.type.startsWith('custom-'));
    return `custom-${customTypes.length + 1}`;
  };

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
    // Only include email body segments in the body value
    setBodyValue(newSegments.filter(s => isEmailBodySegment(s.type)).map(s => s.text).join('\n\n'))
  }

  // Save segment on blur or Enter
  const handleSegmentKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>, idx: number) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSegmentSave(idx)
    }
  }

  // Smart content mapping that preserves components and maps edited text back intelligently
  function parseBodyIntoSegmentsSmart(
    newBody: string,
    currentSegments: Segment[],
    currentBreakdown: Breakdown
  ): { newSegments: Segment[]; newBreakdown: Breakdown } {
    const chunks = newBody.split(/\n\n+/).map(chunk => chunk.trim()).filter(chunk => chunk);
    
    // Get only the body segments (preserve non-body segments like subject unchanged)
    const bodySegments = currentSegments.filter(segment => isEmailBodySegment(segment.type));
    const nonBodySegments = currentSegments.filter(segment => !isEmailBodySegment(segment.type));
    
    // Create a mapping of chunks to segments using content similarity
    const updatedBodySegments = [...bodySegments];
    const usedChunks = new Set<number>();
    
    // First pass: Match chunks to existing segments based on content similarity
    bodySegments.forEach((segment, segmentIndex) => {
      if (!segment.text.trim()) return; // Skip empty segments
      
      let bestMatch = -1;
      let bestScore = 0;
      
      chunks.forEach((chunk, chunkIndex) => {
        if (usedChunks.has(chunkIndex)) return;
        
        // Calculate similarity score (simple word overlap + length similarity)
        const segmentWords = segment.text.toLowerCase().split(/\s+/);
        const chunkWords = chunk.toLowerCase().split(/\s+/);
        const commonWords = segmentWords.filter(word => chunkWords.includes(word));
        
        const wordOverlap = commonWords.length / Math.max(segmentWords.length, chunkWords.length);
        const lengthSimilarity = 1 - Math.abs(segment.text.length - chunk.length) / Math.max(segment.text.length, chunk.length);
        const score = (wordOverlap * 0.7) + (lengthSimilarity * 0.3);
        
        if (score > bestScore && score > 0.3) { // Minimum similarity threshold
          bestScore = score;
          bestMatch = chunkIndex;
        }
      });
      
      if (bestMatch >= 0) {
        updatedBodySegments[segmentIndex] = { ...segment, text: chunks[bestMatch] };
        usedChunks.add(bestMatch);
      }
    });
    
    // Second pass: Handle remaining chunks by positional mapping to empty segments
    const unusedChunks = chunks.filter((_, index) => !usedChunks.has(index));
    const emptySegments = updatedBodySegments
      .map((segment, index) => ({ segment, index }))
      .filter(({ segment }) => !segment.text.trim());
    
    unusedChunks.forEach((chunk, i) => {
      if (i < emptySegments.length) {
        const segmentIndex = emptySegments[i].index;
        updatedBodySegments[segmentIndex] = { ...updatedBodySegments[segmentIndex], text: chunk };
      } else if (updatedBodySegments.length > 0) {
        // Append to last segment if no empty segments available
        const lastIndex = updatedBodySegments.length - 1;
        updatedBodySegments[lastIndex].text += '\n\n' + chunk;
      }
    });
    
    // Reconstruct all segments maintaining original order
    const newSegments = currentSegments.map(segment => {
      if (isEmailBodySegment(segment.type)) {
        // Find the updated version of this body segment
        const bodyIndex = bodySegments.findIndex(bs => bs.type === segment.type);
        return bodyIndex >= 0 ? updatedBodySegments[bodyIndex] : segment;
      } else {
        // Keep non-body segments (like subject) unchanged
        return segment;
      }
    });
    
    return { newSegments, newBreakdown: { ...currentBreakdown } };
  }

  // When the body is edited, update the segments and breakdown
  const handleBodySave = () => {
    // Use smart content mapping to preserve components
    const { newSegments, newBreakdown } = parseBodyIntoSegmentsSmart(
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

  // Define which segment types should be excluded from email body display
  const isEmailBodySegment = (segmentType: string) => {
    const excludedFromBody = ['subject', 'subject-line', 'email-subject'];
    return !excludedFromBody.includes(segmentType?.toLowerCase());
  };

  // Fallback color assignment for segments without colors in breakdown
  const getSegmentColor = (segmentType: string) => {
    const breakdownColor = breakdown[segmentType]?.color;
    if (breakdownColor) return breakdownColor;
    
    // Fallback color mapping
    const fallbackColors = {
      'subject': 'bg-purple-50 border-purple-200',
      'intro': 'bg-blue-50 border-blue-200', 
      'opening': 'bg-blue-50 border-blue-200',
      'pain-point': 'bg-red-50 border-red-200',
      'company-intro': 'bg-green-50 border-green-200',
      'emphasis': 'bg-indigo-50 border-indigo-200',
      'cta': 'bg-yellow-50 border-yellow-200',
      'signature': 'bg-gray-50 border-gray-200'
    };
    
    return fallbackColors[segmentType] || 'bg-blue-50 border-blue-200';
  };

  // Restore renderColorCodedBody
  const renderColorCodedBody = () => (
    <div className="space-y-2">
      {segmentValues.map((text, index) => {
        // Skip segments that shouldn't appear in email body
        if (!isEmailBodySegment(segments[index]?.type)) return null;
        return (
        <div
          key={index}
          className={`p-2 rounded border transition-all duration-200 cursor-pointer ${getSegmentColor(segments[index]?.type)} ${hoveredSegment === segments[index]?.type ? "ring-2 ring-blue-400" : ""}`}
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
            <Badge variant="secondary" className="ml-2 text-xs bg-gray-100 text-gray-900 border-gray-300">
              {breakdown[segments[index]?.type]?.label}
            </Badge>
          </div>
        </div>
        );
      })}
    </div>
  );

  // Remove all local editingMode state and toggle logic
  // Sync all mode-dependent logic via useEffect
  useEffect(() => {
    if (editingMode === EditingMode.Writing) {
      // Switch to writing mode: join segments, estimate height, hide breakdown
      // Only include email body segments, not subject segments
      const bodySegmentValues = segmentValues.filter((_, index) => isEmailBodySegment(segments[index]?.type));
      const joined = bodySegmentValues.join('\n\n');
      setBodyValue(joined);
      // Estimate height: 20px per line + 40px padding, min 120px
      const lineCount = joined.split('\n').length;
      const estimatedHeight = Math.max(120, lineCount * 20 + 40);
      setBodyTextareaHeight(`${estimatedHeight}px`);
    } else {
      // Switch to component mode: parse body changes back to segments intelligently
      const { newSegments, newBreakdown } = parseBodyIntoSegmentsSmart(
        bodyValue,
        segments,
        breakdown
      );
      setSegments(newSegments);
      setBreakdown(newBreakdown);
      setSegmentValues(newSegments.map(s => s.text));
      setBodyTextareaHeight(undefined);
    }
    // eslint-disable-next-line
  }, [editingMode]);

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
            <Button size="sm" variant="outline" onClick={() => onCopy(email)}>
              <Copy className="w-4 h-4 mr-2" />
              Copy
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
                className={`mt-1 p-3 rounded-lg border transition-all duration-200 cursor-pointer ${email.breakdown.subject?.color || "bg-purple-50 border-purple-200"} ${hoveredSegment === "subject" ? "ring-2 ring-blue-400" : ""}`}
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
              {editingMode === EditingMode.Writing ? (
                <textarea
                  className="email-body-textarea w-full text-sm font-sans bg-white border rounded p-2"
                  style={bodyTextareaHeight ? { height: bodyTextareaHeight, resize: 'vertical' } : { minHeight: '120px', resize: 'vertical' }}
                  value={bodyValue}
                  onChange={e => setBodyValue(e.target.value)}
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

          <Button onClick={() => {
            // Create updated email object with current UI state
            const updatedEmail = {
              ...email,
              subject: subjectValue,
              segments: segments,
              breakdown: breakdown,
              // Update subjects object to reflect the new primary subject
              subjects: {
                ...email.subjects,
                primary: subjectValue
              }
            };
            console.log('[EMAIL-PREVIEW] Sending updated email data:', {
              originalSubject: email.subject,
              updatedSubject: subjectValue,
              originalSubjectsPrimary: email.subjects?.primary,
              updatedSubjectsPrimary: updatedEmail.subjects.primary
            });
            onSend(updatedEmail);
          }} className="w-full bg-green-600 hover:bg-green-700">
            <Save className="w-4 h-4 mr-2" />
            Save Email
          </Button>
        </div>
      </div>

      {/* Breakdown */}
      {editingMode === EditingMode.Component && (
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
              items={segments.filter(s => isEmailBodySegment(s.type)).map(s => s.type)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {segments.filter((segment) => isEmailBodySegment(segment.type)).map((segment, index) => (
                  <SortableSegment
                    key={segment.type}
                    segment={segment}
                    index={index}
                    breakdown={breakdown}
                    hoveredSegment={hoveredSegment}
                    setHoveredSegment={setHoveredSegment}
                    handleEditLabel={handleEditLabel}
                    getSegmentColor={getSegmentColor}
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