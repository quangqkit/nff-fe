"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface NumberInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  placeholder?: string;
  className?: string;
  id?: string;
}

export function NumberInput({
  value,
  onChange,
  min = 0,
  max = 999,
  placeholder = "0",
  className,
  id,
}: NumberInputProps) {
  const [inputValue, setInputValue] = useState(value.toString());
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      setInputValue(value.toString());
    }
  }, [value, isFocused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    
    if (newValue === "") {
      setInputValue("");
      return;
    }

    if (!/^\d*$/.test(newValue)) {
      return;
    }

    setInputValue(newValue);

    const numValue = parseInt(newValue);
    if (!isNaN(numValue)) {
      const clampedValue = Math.min(Math.max(numValue, min), max);
      onChange(clampedValue);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    
    if (inputValue === "" || isNaN(parseInt(inputValue))) {
      setInputValue(min.toString());
      onChange(min);
    } else {
      const numValue = parseInt(inputValue);
      const clampedValue = Math.min(Math.max(numValue, min), max);
      setInputValue(clampedValue.toString());
      onChange(clampedValue);
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    setTimeout(() => {
      if (inputValue === "0" || inputValue === min.toString()) {
        setInputValue("");
      }
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const allowedKeys = [
      'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
      'Home', 'End', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'
    ];
    
    if (e.ctrlKey || e.metaKey) {
      return;
    }
    
    // Block any key that' not a number or allowed key
    if (!allowedKeys.includes(e.key) && !/^\d$/.test(e.key)) {
      e.preventDefault();
    }
  };

  return (
    <Input
      id={id}
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      value={inputValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      className={cn(
        "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
        className
      )}
    />
  );
}
