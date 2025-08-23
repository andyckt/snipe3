"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Trash2, GripVertical, PlusCircle } from "lucide-react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { PersonalDetailField, PersonalDetailsConfig } from "./personal-details-collector"

interface PersonalDetailsSettingsProps {
  config: PersonalDetailsConfig
  onConfigChange: (config: PersonalDetailsConfig) => void
}

// Sortable field component for drag and drop functionality
interface SortableFieldProps {
  field: PersonalDetailField;
  onUpdateField: (id: string, updates: Partial<PersonalDetailField>) => void;
  onAddDropdownOption: (fieldId: string) => void;
  onUpdateDropdownOption: (fieldId: string, optionIndex: number, value: string) => void;
  onRemoveDropdownOption: (fieldId: string, optionIndex: number) => void;
  onRemoveField: (id: string) => void;
  disableRemove: boolean;
}

function SortableField({
  field,
  onUpdateField,
  onAddDropdownOption,
  onUpdateDropdownOption,
  onRemoveDropdownOption,
  onRemoveField,
  disableRemove
}: SortableFieldProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`border border-gray-200 rounded-lg p-4 space-y-4 ${isDragging ? 'bg-gray-50' : ''}`}
    >
      <div className="flex items-center gap-2">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-2 text-gray-400 hover:text-gray-600 touch-none"
        >
          <GripVertical className="h-5 w-5" />
        </div>

        <div className="flex-1 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor={`field-label-${field.id}`} className="text-sm font-medium mb-1 block">
                Question
              </Label>
              <Input
                id={`field-label-${field.id}`}
                value={field.label}
                onChange={(e) => onUpdateField(field.id, { label: e.target.value })}
                placeholder="Enter question"
              />
            </div>

            <div>
              <Label htmlFor={`field-type-${field.id}`} className="text-sm font-medium mb-1 block">
                Answer Type
              </Label>
              <Select
                value={field.type}
                onValueChange={(value) => {
                  const updates: Partial<PersonalDetailField> = { 
                    type: value as "text" | "dropdown" | "checkbox"
                  }
                  
                  if (value === "dropdown" && !field.dropdownOptions) {
                    updates.dropdownOptions = ["Option 1", "Option 2"]
                  }
                  
                  onUpdateField(field.id, updates)
                }}
              >
                <SelectTrigger id={`field-type-${field.id}`}>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text Input</SelectItem>
                  <SelectItem value="dropdown">Dropdown</SelectItem>
                  <SelectItem value="checkbox">Checkbox</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {field.type === "dropdown" && (
            <div className="space-y-2 border-t border-gray-100 pt-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Options</Label>
                <div className="flex items-center gap-2">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id={`multiple-${field.id}`}
                      checked={field.allowMultiple || false}
                      onCheckedChange={(checked) => onUpdateField(field.id, { allowMultiple: checked })}
                    />
                    <Label htmlFor={`multiple-${field.id}`} className="text-xs">
                      Allow multiple
                    </Label>
                  </div>
                  <Button
                    onClick={() => onAddDropdownOption(field.id)}
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                  >
                    <PlusCircle className="h-3 w-3 mr-1" /> Add Option
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                {(field.dropdownOptions || []).map((option, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={option}
                      onChange={(e) => onUpdateDropdownOption(field.id, index, e.target.value)}
                      placeholder="Option text"
                      className="text-sm"
                    />
                    <Button
                      onClick={() => onRemoveDropdownOption(field.id, index)}
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-500"
                      disabled={(field.dropdownOptions || []).length <= 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center space-x-2">
            <Switch
              id={`required-${field.id}`}
              checked={field.required}
              onCheckedChange={(checked) => onUpdateField(field.id, { required: checked })}
            />
            <Label htmlFor={`required-${field.id}`} className="text-xs">
              Required
            </Label>
          </div>
          <Button
            onClick={() => onRemoveField(field.id)}
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-red-500"
            disabled={disableRemove}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function PersonalDetailsSettings({ config, onConfigChange }: PersonalDetailsSettingsProps) {
  const [includePersonalDetails, setIncludePersonalDetails] = useState(config.includePersonalDetails)
  const [personalFields, setPersonalFields] = useState<PersonalDetailField[]>(config.personalFields)
  
  // Set up sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        // This ensures a small movement is needed before drag starts
        // to avoid conflicts with click events
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleToggleIncludePersonalDetails = () => {
    const newValue = !includePersonalDetails
    setIncludePersonalDetails(newValue)
    onConfigChange({
      includePersonalDetails: newValue,
      personalFields
    })
  }

  const handleAddField = () => {
    const newField: PersonalDetailField = {
      id: crypto.randomUUID(),
      label: "New Question",
      type: "text",
      required: true
    }
    const newFields = [...personalFields, newField]
    setPersonalFields(newFields)
    onConfigChange({
      includePersonalDetails,
      personalFields: newFields
    })
  }

  const handleRemoveField = (id: string) => {
    const newFields = personalFields.filter(field => field.id !== id)
    setPersonalFields(newFields)
    onConfigChange({
      includePersonalDetails,
      personalFields: newFields
    })
  }

  const handleUpdateField = (id: string, updates: Partial<PersonalDetailField>) => {
    const newFields = personalFields.map(field => 
      field.id === id ? { ...field, ...updates } : field
    )
    setPersonalFields(newFields)
    onConfigChange({
      includePersonalDetails,
      personalFields: newFields
    })
  }
  
  // Handle the end of a drag operation
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    
    // If no over element or same element, no reordering needed
    if (!over || active.id === over.id) {
      return
    }
    
    // Find the indices of the dragged item and the drop target
    const oldIndex = personalFields.findIndex(field => field.id === active.id)
    const newIndex = personalFields.findIndex(field => field.id === over.id)
    
    // Update the array order using arrayMove from dnd-kit
    const newFields = arrayMove(personalFields, oldIndex, newIndex)
    setPersonalFields(newFields)
    onConfigChange({
      includePersonalDetails,
      personalFields: newFields
    })
  }

  const handleAddDropdownOption = (fieldId: string) => {
    const newFields = personalFields.map(field => {
      if (field.id === fieldId) {
        const currentOptions = field.dropdownOptions || []
        return {
          ...field,
          dropdownOptions: [...currentOptions, "New Option"]
        }
      }
      return field
    })
    setPersonalFields(newFields)
    onConfigChange({
      includePersonalDetails,
      personalFields: newFields
    })
  }

  const handleUpdateDropdownOption = (fieldId: string, optionIndex: number, value: string) => {
    const newFields = personalFields.map(field => {
      if (field.id === fieldId && field.dropdownOptions) {
        const newOptions = [...field.dropdownOptions]
        newOptions[optionIndex] = value
        return {
          ...field,
          dropdownOptions: newOptions
        }
      }
      return field
    })
    setPersonalFields(newFields)
    onConfigChange({
      includePersonalDetails,
      personalFields: newFields
    })
  }

  const handleRemoveDropdownOption = (fieldId: string, optionIndex: number) => {
    const newFields = personalFields.map(field => {
      if (field.id === fieldId && field.dropdownOptions) {
        const newOptions = field.dropdownOptions.filter((_, i) => i !== optionIndex)
        return {
          ...field,
          dropdownOptions: newOptions
        }
      }
      return field
    })
    setPersonalFields(newFields)
    onConfigChange({
      includePersonalDetails,
      personalFields: newFields
    })
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Personal Details Collection</h2>
        <div className="flex items-center space-x-2">
          <Switch 
            id="include-personal-details"
            checked={includePersonalDetails}
            onCheckedChange={handleToggleIncludePersonalDetails}
          />
          <Label htmlFor="include-personal-details">
            {includePersonalDetails ? "Enabled" : "Disabled"}
          </Label>
        </div>
      </div>

      {includePersonalDetails && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Questions</h3>
            <Button 
              onClick={handleAddField}
              variant="outline" 
              size="sm"
              className="flex items-center gap-1"
            >
              <PlusCircle className="h-4 w-4" /> Add Question
            </Button>
          </div>

          <div className="space-y-4">
            <DndContext 
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext 
                items={personalFields.map(field => field.id)}
                strategy={verticalListSortingStrategy}
              >
                {personalFields.map((field) => (
                  <SortableField
                    key={field.id}
                    field={field}
                    onUpdateField={handleUpdateField}
                    onAddDropdownOption={handleAddDropdownOption}
                    onUpdateDropdownOption={handleUpdateDropdownOption}
                    onRemoveDropdownOption={handleRemoveDropdownOption}
                    onRemoveField={handleRemoveField}
                    disableRemove={personalFields.length <= 1}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>
        </div>
      )}
    </div>
  )
}
