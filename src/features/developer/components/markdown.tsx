"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

/** Renders GitHub-flavored Markdown. Raw HTML is never rendered. */
export function MarkdownView({ source, className }: { source: string; className?: string }) {
  if (!source.trim()) {
    return <p className="text-sm text-muted-foreground italic">No description.</p>;
  }
  return (
    <div
      className={cn(
        "prose prose-sm max-w-none dark:prose-invert prose-pre:rounded-md prose-pre:border prose-pre:bg-muted prose-pre:text-foreground prose-code:before:content-none prose-code:after:content-none prose-code:rounded prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:font-mono prose-code:text-[0.85em] prose-pre:prose-code:bg-transparent prose-pre:prose-code:p-0",
        className,
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml>
        {source}
      </ReactMarkdown>
    </div>
  );
}

type MarkdownEditorProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
};

export function MarkdownEditor({ id, value, onChange, onBlur, placeholder }: MarkdownEditorProps) {
  return (
    <Tabs defaultValue="write" className="gap-2">
      <TabsList>
        <TabsTrigger value="write">Write</TabsTrigger>
        <TabsTrigger value="preview">Preview</TabsTrigger>
      </TabsList>
      <TabsContent value="write">
        <Textarea
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          rows={10}
          spellCheck={false}
          className="min-h-48 font-mono text-[13px] leading-relaxed"
        />
        <p className="mt-1 text-[11px] text-muted-foreground">
          Markdown supported — use ``` fences for code and stack traces.
        </p>
      </TabsContent>
      <TabsContent value="preview" className="min-h-48 rounded-md border px-3 py-2">
        <MarkdownView source={value} />
      </TabsContent>
    </Tabs>
  );
}
