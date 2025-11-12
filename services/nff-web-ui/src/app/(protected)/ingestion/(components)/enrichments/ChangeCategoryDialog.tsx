"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface ChangeCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tweetId: string;
  currentCategory: string;
  categories?: string[];
  onSave: (newCategory: string) => void;
}

export function ChangeCategoryDialog({
  open,
  onOpenChange,
  tweetId,
  currentCategory,
  categories = ["Earnings", "Finances", "Economic", "Gold/ETF"],
  onSave,
}: ChangeCategoryDialogProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const handleSave = () => {
    if (selectedCategory && selectedCategory !== currentCategory) {
      onSave(selectedCategory);
      setSelectedCategory(null);
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    setSelectedCategory(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Change Category for Tweet ID: {tweetId}</DialogTitle>
          <DialogDescription>
            Current category: {currentCategory}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Category Buttons */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => {
              const isSelected = selectedCategory === category;
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  className={cn(
                    "px-4 py-2 rounded-md border text-sm font-medium transition-colors",
                    isSelected
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                      : "border-border bg-background hover:bg-accent"
                  )}
                >
                  {category}
                </button>
              );
            })}
          </div>

          {/* Confirmation Message */}
          {selectedCategory && selectedCategory !== currentCategory && (
            <div className="text-sm text-muted-foreground p-3 bg-muted/50 rounded-md">
              Change [Tweet ID: {tweetId}] from category [{currentCategory}] to
              [{selectedCategory}]
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!selectedCategory || selectedCategory === currentCategory}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
