"use client";

import React, { useState } from "react";

interface CurrencyInputProps {
  id?: string;
  value: number | undefined | null;
  onChange: (val: number) => void;
  className?: string;
  placeholder?: string;
  title?: string;
  disabled?: boolean;
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  id,
  value,
  onChange,
  className = "",
  placeholder = "0",
  title,
  disabled = false,
}) => {
  const formatNumber = (num: number | undefined | null): string => {
    if (num === undefined || num === null || isNaN(num) || num === 0) return "";
    return num.toLocaleString("id-ID");
  };

  const [isFocused, setIsFocused] = useState(false);
  const [localVal, setLocalVal] = useState("");

  const displayVal = isFocused ? localVal : formatNumber(value);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawDigits = e.target.value.replace(/\D/g, "");
    if (!rawDigits) {
      setLocalVal("");
      onChange(0);
      return;
    }
    const num = parseInt(rawDigits, 10);
    setLocalVal(num.toLocaleString("id-ID"));
    onChange(num);
  };

  const handleFocus = () => {
    setIsFocused(true);
    setLocalVal(formatNumber(value));
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  return (
    <input
      id={id}
      type="text"
      inputMode="numeric"
      value={displayVal}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      placeholder={placeholder}
      className={className}
      title={title}
      disabled={disabled}
    />
  );
};
