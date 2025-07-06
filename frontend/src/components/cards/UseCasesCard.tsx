import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Plus, Edit3, Trash2 } from "lucide-react";
import type { UseCase } from "../../types/api";

interface UseCasesCardProps {
  useCases: UseCase[];
  onAdd: (newUseCase: UseCase) => void;
  onEdit: (idx: number, updatedUseCase: UseCase) => void;
  onDelete: (idx: number) => void;
}

const emptyFields: UseCase = {
  useCase: "",
  painPoints: "",
  capability: "",
  desiredOutcome: ""
};

export default function UseCasesCard({ useCases, onAdd, onEdit, onDelete }: UseCasesCardProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalFields, setModalFields] = useState<UseCase>(emptyFields);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);

  const openAddModal = () => {
    setModalFields(emptyFields);
    setEditingIdx(null);
    setModalOpen(true);
  };

  const openEditModal = (idx: number) => {
    setModalFields(useCases[idx]);
    setEditingIdx(idx);
    setModalOpen(true);
  };

  const handleSave = () => {
    if (
      modalFields.useCase.trim() &&
      modalFields.painPoints.trim() &&
      modalFields.capability.trim() &&
      modalFields.desiredOutcome.trim()
    ) {
      if (editingIdx === null) {
        onAdd(modalFields);
      } else {
        onEdit(editingIdx, modalFields);
      }
      setModalOpen(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <div>
            <CardTitle className="mb-1">Use Cases</CardTitle>
            <div className="text-sm text-gray-500">Ways this persona would use your product or service</div>
          </div>
          <Button size="sm" variant="ghost" onClick={openAddModal}>
            <Plus className="w-4 h-4 mr-2" /> Add
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {useCases.length > 0 ? (
          <div className="space-y-3">
            {useCases.map((uc, idx) => (
              <div
                key={idx}
                className="group flex flex-col border border-gray-200 rounded-lg transition-all duration-200 overflow-hidden hover:bg-gray-50 relative"
              >
                <div className="flex items-center justify-between px-3 pt-3 pb-0">
                  <div className="flex-1 min-w-0 pr-4 px-3">
                    <div className="flex items-center text-left">
                      <span className="text-med font-semibold text-gray-900">{uc.useCase}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10" onClick={e => e.stopPropagation()}>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={e => { e.stopPropagation(); openEditModal(idx); }}
                      className="text-blue-600"
                    >
                      <Edit3 className="w-5 h-5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={e => { e.stopPropagation(); onDelete(idx); }}
                      className="text-red-500"
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
                <div className="px-6 pt-0 pb-4 text-sm text-gray-600 text-left space-y-2">
                  <div><strong>Pain Points:</strong> {uc.painPoints}</div>
                  <div><strong>Capability:</strong> {uc.capability}</div>
                  <div><strong>Desired Outcome:</strong> {uc.desiredOutcome}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No use cases identified
          </div>
        )}
      </CardContent>
      {/* Modal for Add/Edit Use Case */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-1">{editingIdx === null ? "Add Use Case" : "Edit Use Case"}</h3>
            <div className="text-sm text-gray-500 mb-4">Ways this persona would use your product or service</div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Use Case</label>
                <input
                  className="w-full border rounded px-3 py-2 text-sm"
                  value={modalFields.useCase}
                  onChange={e => setModalFields(f => ({ ...f, useCase: e.target.value }))}
                  maxLength={100}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Pain Points</label>
                <textarea
                  className="w-full border rounded px-3 py-2 text-sm"
                  value={modalFields.painPoints}
                  onChange={e => setModalFields(f => ({ ...f, painPoints: e.target.value }))}
                  rows={2}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Capability</label>
                <textarea
                  className="w-full border rounded px-3 py-2 text-sm"
                  value={modalFields.capability}
                  onChange={e => setModalFields(f => ({ ...f, capability: e.target.value }))}
                  rows={2}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Desired Outcome</label>
                <textarea
                  className="w-full border rounded px-3 py-2 text-sm"
                  value={modalFields.desiredOutcome}
                  onChange={e => setModalFields(f => ({ ...f, desiredOutcome: e.target.value }))}
                  rows={2}
                  required
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button
                onClick={handleSave}
                disabled={!(modalFields.useCase.trim() && modalFields.painPoints.trim() && modalFields.capability.trim() && modalFields.desiredOutcome.trim())}
              >
                {editingIdx === null ? "Add Use Case" : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
} 