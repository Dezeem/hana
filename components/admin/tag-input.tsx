"use client";

import { useState, type KeyboardEvent } from "react";
import { Plus, X } from "lucide-react";

type TagInputProps = {
  /** Comma-separated, matching the form field the server action parses. */
  value: string;
  onChange: (value: string) => void;
  suggestions?: string[];
  placeholder?: string;
};

function parse(raw: string): string[] {
  return raw
    .split(/[,，、]/)
    .map((tag) => tag.trim())
    .filter(Boolean);
}

/** Chip editor: type + Enter, or tap a suggestion. Keeps the form value a string. */
export function TagInput({ value, onChange, suggestions = [], placeholder }: TagInputProps) {
  const [draft, setDraft] = useState("");
  const tags = [...new Set(parse(value))];

  function commit(next: string[]) {
    onChange([...new Set(next)].join(", "));
  }

  function add(raw: string) {
    const added = parse(raw);
    if (!added.length) return;
    commit([...tags, ...added]);
    setDraft("");
  }

  function remove(tag: string) {
    commit(tags.filter((item) => item !== tag));
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    // Let the IME finish a Chinese word before treating Enter as "commit".
    if (event.nativeEvent.isComposing) return;
    if (event.key === "Enter" || event.key === "," || event.key === "，") {
      event.preventDefault();
      add(draft);
    } else if (event.key === "Backspace" && !draft && tags.length) {
      remove(tags[tags.length - 1]);
    }
  }

  const remaining = suggestions.filter((tag) => !tags.includes(tag));

  return (
    <div>
      <div className="flex flex-wrap items-center gap-1.5 border-b-2 border-line pb-2 pt-1 transition-colors focus-within:border-ink">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full border border-line bg-mist-soft px-2.5 py-0.5 text-[13px] text-ink-soft"
          >
            {tag}
            <button
              type="button"
              onClick={() => remove(tag)}
              aria-label={`移除标签 ${tag}`}
              className="text-ink-faint transition-colors hover:text-ink"
            >
              <X className="h-3 w-3" strokeWidth={1.8} />
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => add(draft)}
          placeholder={tags.length ? "" : (placeholder ?? "输入后回车，或点下面的常用标签")}
          className="min-w-[7rem] flex-1 bg-transparent py-1 text-[16px] text-ink outline-none placeholder:text-ink-faint"
        />
      </div>

      {remaining.length ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {remaining.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => add(tag)}
              className="inline-flex items-center gap-1 rounded-full border border-dashed border-line px-2.5 py-0.5 text-[12px] text-ink-soft transition-colors hover:border-ink hover:text-ink"
            >
              <Plus className="h-3 w-3" strokeWidth={1.8} aria-hidden />
              {tag}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
