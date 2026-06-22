"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { useEffect, useCallback } from "react";
import { SlashCommands } from "./SlashCommands";
import suggestion from "./suggestion";
import {
    Bold, Italic, Underline as UnderlineIcon, Strikethrough,
    AlignLeft, AlignCenter, AlignRight,
    Link as LinkIcon, Undo, Redo,
    Heading2, Heading3, Minus, Type
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import "./RichTextEditor.css";

interface RichTextEditorProps {
    value?: string;
    onChange?: (value: string) => void;
    placeholder?: string;
    className?: string;
    minHeight?: number;
    readOnly?: boolean;
}

function ToolbarButton({
    onClick,
    active,
    title,
    children,
}: {
    onClick: () => void;
    active?: boolean;
    title?: string;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            title={title}
            onMouseDown={(e) => {
                e.preventDefault();
                onClick();
            }}
            className={cn(
                "h-7 w-7 flex items-center justify-center rounded text-xs transition-colors",
                active
                     ? "bg-zinc-700 text-white"
                     : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
            )}
        >
            {children}
        </button>
    );
}

function Divider() {
    return <div className="w-px h-5 bg-zinc-700 mx-0.5 shrink-0" />;
}

export function RichTextEditor({
    value,
    onChange,
    placeholder = "Escreva aqui... Ctrl+V para colar imagens.",
    className,
    minHeight = 150,
    readOnly = false,
}: RichTextEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                bulletList: { keepMarks: true },
                orderedList: { keepMarks: true },
            }),
            Underline,
            TextAlign.configure({ types: ["heading", "paragraph"] }),
            Link.configure({ openOnClick: false, HTMLAttributes: { class: "text-blue-400 underline cursor-pointer" } }),
            Image.configure({ HTMLAttributes: { class: "max-w-full rounded-lg my-2 border border-zinc-800" } }),
            Placeholder.configure({ placeholder }),
            TaskList.configure({
                HTMLAttributes: {
                    class: "task-list-container",
                },
            }),
            TaskItem.configure({
                nested: true,
            }),
            SlashCommands.configure({ suggestion }),
        ],
        content: value || "",
        editable: !readOnly,
        onUpdate: ({ editor }) => {
            onChange?.(editor.getHTML());
        },
        editorProps: {},
    });

    useEffect(() => {
        if (!editor) return;
        editor.setEditable(!readOnly);
    }, [readOnly, editor]);

    // Sync external value changes and force re-render on transaction
    useEffect(() => {
        if (!editor) return;
  
        const current = editor.getHTML();
        if (value !== undefined && value !== current) {
            editor.commands.setContent(value || "", { emitUpdate: false });
        }
  
        // The editor object itself stays the same, but we need to trigger re-renders 
        // when the selection or content changes so the toolbar updates
        const handleUpdate = () => { };
        editor.on("transaction", handleUpdate);
  
        return () => {
            editor.off("transaction", handleUpdate);
        };
    }, [value, editor]);

    const setLink = useCallback(() => {
        if (!editor) return;
        const prev = editor.getAttributes("link").href;
        const url = window.prompt("URL do link:", prev);
        if (url === null) return;
        if (url === "") {
            editor.chain().focus().extendMarkRange("link").unsetLink().run();
        } else {
            editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
        }
    }, [editor]);

    if (!editor) return null;

    return (
        <div className={cn("border border-zinc-800 rounded-lg overflow-hidden bg-zinc-950", className)}>
            {/* Toolbar */}
            {!readOnly && (
                <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-zinc-800 bg-zinc-900/60">
                    <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Negrito (Ctrl+B)">
                        <Bold className="w-3.5 h-3.5" />
                    </ToolbarButton>
                    <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Itálico (Ctrl+I)">
                        <Italic className="w-3.5 h-3.5" />
                    </ToolbarButton>
                    <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="Sublinhado">
                        <UnderlineIcon className="w-3.5 h-3.5" />
                    </ToolbarButton>
                    <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} title="Tachado">
                        <Strikethrough className="w-3.5 h-3.5" />
                    </ToolbarButton>

                    <Divider />

                    <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} title="Título 2">
                        <Heading2 className="w-3.5 h-3.5" />
                    </ToolbarButton>
                    <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })} title="Título 3">
                        <Heading3 className="w-3.5 h-3.5" />
                    </ToolbarButton>

                    <Divider />

                    <Select
                        value={editor.isActive("bulletList") ? "bullet" : editor.isActive("orderedList") ? "ordered" : "none"}
                        onValueChange={(value) => {
                            if (value === "bullet" && !editor.isActive("bulletList")) {
                                editor.chain().focus().toggleBulletList().run();
                            } else if (value === "ordered" && !editor.isActive("orderedList")) {
                                editor.chain().focus().toggleOrderedList().run();
                            } else if (value === "none") {
                                if (editor.isActive("bulletList")) editor.chain().focus().toggleBulletList().run();
                                if (editor.isActive("orderedList")) editor.chain().focus().toggleOrderedList().run();
                            }
                        }}
                    >
                        <SelectTrigger className="h-7 w-[120px] bg-zinc-800/50 border-zinc-700/50 text-zinc-300 text-[10px] px-2 py-0 focus:ring-0 focus:ring-offset-0">
                            <div className="flex items-center gap-2">
                                <Type className="h-3 w-3 text-zinc-500" />
                                <SelectValue placeholder="Tipo de lista" />
                            </div>
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-300 min-w-[140px]">
                            <SelectItem value="none" className="text-[11px] py-1.5 focus:bg-zinc-800">Texto Normal</SelectItem>
                            <SelectItem value="bullet" className="text-[11px] py-1.5 focus:bg-zinc-800">Lista Marcadores</SelectItem>
                            <SelectItem value="ordered" className="text-[11px] py-1.5 focus:bg-zinc-800">Lista Numerada</SelectItem>
                        </SelectContent>
                    </Select>

                    <Divider />

                    <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("left").run()} active={editor.isActive({ textAlign: "left" })} title="Alinhar esquerda">
                        <AlignLeft className="w-3.5 h-3.5" />
                    </ToolbarButton>
                    <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("center").run()} active={editor.isActive({ textAlign: "center" })} title="Centralizar">
                        <AlignCenter className="w-3.5 h-3.5" />
                    </ToolbarButton>
                    <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("right").run()} active={editor.isActive({ textAlign: "right" })} title="Alinhar direita">
                        <AlignRight className="w-3.5 h-3.5" />
                    </ToolbarButton>

                    <Divider />

                    <ToolbarButton onClick={setLink} active={editor.isActive("link")} title="Inserir link">
                        <LinkIcon className="w-3.5 h-3.5" />
                    </ToolbarButton>
                    <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Linha horizontal">
                        <Minus className="w-3.5 h-3.5" />
                    </ToolbarButton>

                    <Divider />

                    <ToolbarButton onClick={() => editor.chain().focus().undo().run()} title="Desfazer (Ctrl+Z)">
                        <Undo className="w-3.5 h-3.5" />
                    </ToolbarButton>
                    <ToolbarButton onClick={() => editor.chain().focus().redo().run()} title="Refazer (Ctrl+Y)">
                        <Redo className="w-3.5 h-3.5" />
                    </ToolbarButton>
                </div>
            )}

            {/* Editor area */}
            <EditorContent
                editor={editor}
                className="rich-editor"
                style={{ minHeight }}
            />
        </div>
    );
}
