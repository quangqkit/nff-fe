import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Edit, X, Save } from 'lucide-react';

interface ReportHeaderProps {
  title: string;
  onSave: (newTitle: string) => Promise<void>;
  className?: string;
}

export function ReportHeader({ title, onSave, className }: ReportHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(title);
  const [isSaving, setIsSaving] = useState(false);

  const handleStartEdit = () => {
    setEditedTitle(title);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setEditedTitle(title);
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (editedTitle.trim() === title) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await onSave(editedTitle.trim());
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save title:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isEditing) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Input
          value={editedTitle}
          onChange={(e) => setEditedTitle(e.target.value)}
          className="text-2xl font-bold"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSave();
            } else if (e.key === 'Escape') {
              handleCancelEdit();
            }
          }}
        />
        <Button
          size="sm"
          onClick={handleSave}
          disabled={isSaving || !editedTitle.trim()}
        >
          <Save className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <h1 className="text-2xl font-bold">{title}</h1>
      <Button size="sm" variant="ghost" onClick={handleStartEdit}>
        <Edit className="h-4 w-4" />
      </Button>
    </div>
  );
}



