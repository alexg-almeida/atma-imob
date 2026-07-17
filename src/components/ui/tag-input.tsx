"use client";

import { useState, type KeyboardEvent } from "react";
import { X } from "@phosphor-icons/react";

type TagInputProps = {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  id?: string;
};

export function TagInput({ value, onChange, placeholder, id }: TagInputProps) {
  const [draft, setDraft] = useState("");

  function addDraft() {
    const tag = draft.trim();
    if (!tag) return;
    if (!value.includes(tag)) onChange([...value, tag]);
    setDraft("");
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addDraft();
    } else if (event.key === "Backspace" && !draft && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }

  return (
    <div className="border-b border-line pb-2 transition-colors duration-150 focus-within:border-primary">
      {value.length > 0 ? (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {value.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-sm bg-surface px-2 py-1 text-xs text-ink"
            >
              {tag}
              <button
                type="button"
                aria-label={`Remover ${tag}`}
                onClick={() => onChange(value.filter((t) => t !== tag))}
                className="text-muted-foreground transition-colors hover:text-alert"
              >
                <X size={11} aria-hidden />
              </button>
            </span>
          ))}
        </div>
      ) : null}
      <input
        id={id}
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={addDraft}
        placeholder={placeholder ?? "Digite e pressione Enter"}
        className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-muted-foreground"
      />
    </div>
  );
}
