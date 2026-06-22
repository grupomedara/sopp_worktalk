import { ReactRenderer } from "@tiptap/react";
import tippy from "tippy.js";
import {
    Heading2,
    Heading3,
    List,
    ListOrdered,
    CheckSquare,
    Flame,
    Type,
} from "lucide-react";
import { CommandsList } from "./CommandsList";

export default {
    items: ({ query }: { query: string }) => {
        return [
            {
                title: "Título 2",
                icon: Heading2,
                command: ({ editor, range }: any) => {
                    editor
                        .chain()
                        .focus()
                        .deleteRange(range)
                        .setNode("heading", { level: 2 })
                        .run();
                },
            },
            {
                title: "Título 3",
                icon: Heading3,
                command: ({ editor, range }: any) => {
                    editor
                        .chain()
                        .focus()
                        .deleteRange(range)
                        .setNode("heading", { level: 3 })
                        .run();
                },
            },
            {
                title: "Lista de Marcadores",
                icon: List,
                command: ({ editor, range }: any) => {
                    editor.chain().focus().deleteRange(range).toggleBulletList().run();
                },
            },
            {
                title: "Lista Numerada",
                icon: ListOrdered,
                command: ({ editor, range }: any) => {
                    editor.chain().focus().deleteRange(range).toggleOrderedList().run();
                },
            },
            {
                title: "Tarefa / Checkbox",
                icon: CheckSquare,
                command: ({ editor, range }: any) => {
                    editor.chain().focus().deleteRange(range).toggleTaskList().run();
                },
            },
            {
                title: "Urgente",
                icon: Flame,
                command: ({ editor, range }: any) => {
                    editor
                        .chain()
                        .focus()
                        .deleteRange(range)
                        .insertContent("🔥 URGENTE: ")
                        .run();
                },
            },
            {
                title: "Texto Normal",
                icon: Type,
                command: ({ editor, range }: any) => {
                    editor.chain().focus().deleteRange(range).setNode("paragraph").run();
                },
            },
        ]
            .filter((item) =>
                item.title.toLowerCase().startsWith(query.toLowerCase())
            )
            .slice(0, 10);
    },

    render: () => {
        let component: any;
        let popup: any;

        return {
            onStart: (props: any) => {
                component = new ReactRenderer(CommandsList, {
                    props,
                    editor: props.editor,
                });

                if (!props.clientRect) {
                    return;
                }

                popup = tippy("body", {
                    getReferenceClientRect: props.clientRect,
                    appendTo: () => props.editor.options.element,
                    content: component.element,
                    showOnCreate: true,
                    interactive: true,
                    trigger: "manual",
                    placement: "bottom-start",
                    zIndex: 9999,
                });
            },

            onUpdate(props: any) {
                component.updateProps(props);

                if (!props.clientRect) {
                    return;
                }

                popup[0].setProps({
                    getReferenceClientRect: props.clientRect,
                });
            },

            onKeyDown(props: any) {
                if (props.event.key === "Escape") {
                    popup[0].hide();
                    return true;
                }

                return component.ref?.onKeyDown(props);
            },

            onExit() {
                popup[0].destroy();
                component.destroy();
            },
        };
    },
};
