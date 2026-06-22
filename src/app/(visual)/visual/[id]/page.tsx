"use client";

import React, { useState, useEffect, useCallback, use } from "react";
import ReactFlow, {
    addEdge,
    MiniMap,
    Controls,
    Background,
    BackgroundVariant,
    useNodesState,
    useEdgesState,
    Connection,
    Edge,
    Node,
    NodeTypes,
    Handle,
    Position,
    ConnectionMode,
    NodeToolbar,
    useReactFlow,
    ReactFlowProvider,
} from "reactflow";
import "reactflow/dist/style.css";
import { getMindMap, saveMindMap } from "@/app/actions/mindmap";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Save, Loader2, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

// --- Custom Noir Node ---
// Each node exposes 4 visible handles (one per compass direction).
// With connectionMode="loose", any handle can be source or target.
const colorPresets = {
    zinc: {
        bg: "bg-zinc-950 text-zinc-100 border-zinc-700/50 hover:border-zinc-500",
        selected: "bg-zinc-100 text-zinc-950 border-zinc-100 shadow-[0_0_24px_rgba(255,255,255,0.5)]",
        dot: "#71717a",
        dotSelected: "#f4f4f5",
        dotBtn: "bg-zinc-700 hover:scale-110",
        edgeColor: "rgba(255,255,255,0.5)",
    },
    slate: {
        bg: "bg-slate-950 text-slate-100 border-slate-700/50 hover:border-slate-500",
        selected: "bg-slate-100 text-slate-950 border-slate-100 shadow-[0_0_24px_rgba(148,163,184,0.6)]",
        dot: "#475569",
        dotSelected: "#f1f5f9",
        dotBtn: "bg-slate-500 hover:scale-110",
        edgeColor: "#64748b",
    },
    red: {
        bg: "bg-red-950/70 text-red-200 border-red-900/50 hover:border-red-600",
        selected: "bg-red-500 text-white border-red-400 shadow-[0_0_24px_rgba(239,68,68,0.6)]",
        dot: "#b91c1c",
        dotSelected: "#ffffff",
        dotBtn: "bg-red-600 hover:scale-110",
        edgeColor: "#ef4444",
    },
    amber: {
        bg: "bg-amber-950/70 text-amber-200 border-amber-900/50 hover:border-amber-600",
        selected: "bg-amber-500 text-black border-amber-400 shadow-[0_0_24px_rgba(245,158,11,0.6)]",
        dot: "#d97706",
        dotSelected: "#000000",
        dotBtn: "bg-amber-600 hover:scale-110",
        edgeColor: "#f59e0b",
    },
    emerald: {
        bg: "bg-emerald-950/70 text-emerald-200 border-emerald-900/50 hover:border-emerald-600",
        selected: "bg-emerald-500 text-white border-emerald-400 shadow-[0_0_24px_rgba(16,185,129,0.6)]",
        dot: "#047857",
        dotSelected: "#ffffff",
        dotBtn: "bg-emerald-600 hover:scale-110",
        edgeColor: "#10b981",
    },
    blue: {
        bg: "bg-blue-950/70 text-blue-200 border-blue-900/50 hover:border-blue-600",
        selected: "bg-blue-500 text-white border-blue-400 shadow-[0_0_24px_rgba(59,130,246,0.6)]",
        dot: "#1d4ed8",
        dotSelected: "#ffffff",
        dotBtn: "bg-blue-600 hover:scale-110",
        edgeColor: "#3b82f6",
    },
};

const shapeStyles = {
    rectangle: "px-5 py-3 min-w-[120px] rounded-xl",
    circle: "w-24 h-24 rounded-full flex items-center justify-center aspect-square",
    pill: "px-6 py-2.5 min-w-[100px] rounded-full",
    diamond: "w-24 h-24 rotate-45 flex items-center justify-center border",
};

function NoirNode({ id, data, selected }: { id: string; data: { label: string; shape?: string; colorPreset?: string; isReadOnly?: boolean }; selected: boolean }) {
    const [editing, setEditing] = useState(false);
    const [label, setLabel] = useState(data.label);
    const { setNodes } = useReactFlow();

    const commitLabel = () => {
        if (data.isReadOnly) return;
        setEditing(false);
        data.label = label; // mutate so parent state reflects on save
        setNodes((nds) =>
            nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, label } } : n))
        );
    };

    const shape = data.shape || "rectangle";
    const colorPreset = data.colorPreset || "zinc";
    const preset = colorPresets[colorPreset as keyof typeof colorPresets] || colorPresets.zinc;
    const isDiamond = shape === "diamond";
    const isReadOnly = !!data.isReadOnly;

    const handleShapeChange = (e: React.MouseEvent, newShape: string) => {
        e.stopPropagation();
        if (isReadOnly) return;
        setNodes((nds) =>
            nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, shape: newShape } } : n))
        );
    };

    const handleColorChange = (e: React.MouseEvent, newColor: string) => {
        e.stopPropagation();
        if (isReadOnly) return;
        setNodes((nds) =>
            nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, colorPreset: newColor } } : n))
        );
    };

    const dot = {
        width: 12,
        height: 12,
        background: "#ffffff",
        border: `2px solid ${preset.dot}`,
        borderRadius: "50%",
        display: isReadOnly ? "none" : "block",
    };

    return (
        <div
            onDoubleClick={() => !isReadOnly && setEditing(true)}
            style={{ position: "relative" }}
            className={`
                text-center border font-bold uppercase tracking-widest transition-all duration-200 cursor-pointer select-none
                ${isDiamond ? shapeStyles.diamond : shapeStyles[shape as keyof typeof shapeStyles] || shapeStyles.rectangle}
                ${selected ? preset.selected : preset.bg}
            `}
        >
            {/* 4 directional connection points */}
            <Handle id="top" type="source" position={Position.Top} style={{ ...dot, top: isDiamond ? -10 : -7, left: "50%", transform: "translateX(-50%)" }} />
            <Handle id="bottom" type="source" position={Position.Bottom} style={{ ...dot, bottom: isDiamond ? -10 : -7, left: "50%", transform: "translateX(-50%)" }} />
            <Handle id="left" type="source" position={Position.Left} style={{ ...dot, left: isDiamond ? -10 : -7, top: "50%", transform: "translateY(-50%)" }} />
            <Handle id="right" type="source" position={Position.Right} style={{ ...dot, right: isDiamond ? -10 : -7, top: "50%", transform: "translateY(-50%)" }} />

            {/* Float Toolbar when selected */}
            <NodeToolbar isVisible={selected && !isReadOnly} position={Position.Top} className="flex flex-col gap-2 p-2 rounded-xl bg-zinc-950 border border-white/10 shadow-2xl z-50 min-w-[150px]">
                {/* Shape selectors */}
                <div className="flex items-center gap-1.5 border-b border-white/5 pb-1.5 justify-between">
                    <span className="text-[8px] font-bold text-white/40 uppercase tracking-widest mr-1">Forma:</span>
                    <div className="flex gap-1">
                        <button
                            onClick={(e) => handleShapeChange(e, "rectangle")}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase transition ${shape === "rectangle" ? "bg-white text-black" : "text-white/60 hover:bg-white/10"}`}
                            title="Retângulo"
                        >
                            ■
                        </button>
                        <button
                            onClick={(e) => handleShapeChange(e, "circle")}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase transition ${shape === "circle" ? "bg-white text-black" : "text-white/60 hover:bg-white/10"}`}
                            title="Círculo"
                        >
                            ●
                        </button>
                        <button
                            onClick={(e) => handleShapeChange(e, "pill")}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase transition ${shape === "pill" ? "bg-white text-black" : "text-white/60 hover:bg-white/10"}`}
                            title="Pílula"
                        >
                            ⬭
                        </button>
                        <button
                            onClick={(e) => handleShapeChange(e, "diamond")}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase transition ${shape === "diamond" ? "bg-white text-black" : "text-white/60 hover:bg-white/10"}`}
                            title="Losango"
                        >
                            ♦
                        </button>
                    </div>
                </div>
                {/* Color selectors */}
                <div className="flex items-center gap-1.5 pt-0.5 justify-between">
                    <span className="text-[8px] font-bold text-white/40 uppercase tracking-widest mr-1">Cor:</span>
                    <div className="flex gap-1.5">
                        {Object.keys(colorPresets).map((presetKey) => {
                            const presetColor = colorPresets[presetKey as keyof typeof colorPresets];
                            return (
                                <button
                                    key={presetKey}
                                    onClick={(e) => handleColorChange(e, presetKey)}
                                    className={`w-3 h-3 rounded-full border border-white/10 transition-transform ${presetColor.dotBtn} ${colorPreset === presetKey ? "ring-2 ring-white scale-110" : ""}`}
                                    title={presetKey}
                                />
                            );
                        })}
                    </div>
                </div>
            </NodeToolbar>

            {/* Inner text content (compensated if diamond shape is rotated) */}
            <div className={`${isDiamond ? "-rotate-45 select-none font-bold text-xs uppercase tracking-widest w-full h-full flex items-center justify-center px-1" : "w-full h-full flex items-center justify-center"}`}>
                {editing ? (
                    <input
                        autoFocus
                        value={label}
                        onChange={(e) => setLabel(e.target.value)}
                        onBlur={commitLabel}
                        onKeyDown={(e) => e.key === "Enter" && commitLabel()}
                        className="bg-transparent outline-none text-center w-full text-sm uppercase tracking-widest"
                    />
                ) : (
                    <span className="break-words line-clamp-3 leading-tight">{label || "Nova Ideia"}</span>
                )}
            </div>
        </div>
    );
}

const nodeTypes: NodeTypes = { noir: NoirNode };

const defaultNodes: Node[] = [
    {
        id: "1",
        type: "noir",
        position: { x: 0, y: 0 },
        data: { label: "Ideia Central", shape: "rectangle", colorPreset: "zinc" },
    },
];

let nodeId = 2;

export default function VisualNotePage({ params }: { params: Promise<{ id: string }> }) {
    // Next.js 15: params is a Promise for client components — must use React.use()
    const { id } = use(params);

    const [nodes, setNodes, onNodesChange] = useNodesState(defaultNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isReadOnly, setIsReadOnly] = useState(false);

    useEffect(() => {
        const load = async () => {
            const res = await getMindMap(id);
            if (res.success && res.data) {
                const content = res.data.content as any;
                const readOnly = !!res.isReadOnly;
                setIsReadOnly(readOnly);

                if (content?.nodes?.length) {
                    const mappedNodes = content.nodes.map((n: any) => ({
                        ...n,
                        data: { ...n.data, isReadOnly: readOnly }
                    }));
                    setNodes(mappedNodes);
                }
                if (content?.edges?.length) setEdges(content.edges);
            }
            setLoading(false);
        };
        load();
    }, [id]);

    const [connectionType, setConnectionType] = useState<"default" | "straight" | "step">("default");
    const [lineType, setLineType] = useState<"solid" | "dashed" | "dotted">("solid");

    const onConnect = useCallback(
        (params: Connection) =>
            setEdges((eds) => {
                const sourceNode = nodes.find((n) => n.id === params.source);
                const sourceColorPreset = sourceNode?.data?.colorPreset || "zinc";
                const preset = colorPresets[sourceColorPreset as keyof typeof colorPresets] || colorPresets.zinc;

                let strokeDasharray = undefined;
                let animated = false;
                if (lineType === "dashed") {
                    strokeDasharray = "5,5";
                    animated = true;
                } else if (lineType === "dotted") {
                    strokeDasharray = "2,3";
                    animated = false;
                }

                return addEdge(
                    {
                        ...params,
                        type: connectionType,
                        animated: animated,
                        style: {
                            stroke: preset.edgeColor,
                            strokeWidth: 2,
                            strokeDasharray: strokeDasharray,
                        },
                    },
                    eds
                );
            }),
        [setEdges, nodes, connectionType, lineType]
    );

    const styleSelectedEdges = () => {
        let strokeDasharray = undefined;
        let animated = false;
        if (lineType === "dashed") {
            strokeDasharray = "5,5";
            animated = true;
        } else if (lineType === "dotted") {
            strokeDasharray = "2,3";
            animated = false;
        }

        setEdges((eds) =>
            eds.map((e) => {
                if (e.selected) {
                    return {
                        ...e,
                        type: connectionType,
                        animated: animated,
                        style: {
                            ...e.style,
                            strokeDasharray: strokeDasharray,
                        },
                    };
                }
                return e;
            })
        );
        toast.success("Conexões selecionadas atualizadas!");
    };

    const addNode = () => {
        if (isReadOnly) return;
        const newNode: Node = {
            id: `${nodeId++}`,
            type: "noir",
            position: {
                x: (Math.random() - 0.5) * 400,
                y: (Math.random() - 0.5) * 300,
            },
            data: { label: "Nova Ideia", shape: "rectangle", colorPreset: "zinc", isReadOnly },
        };
        setNodes((nds) => [...nds, newNode]);
    };

    const deleteSelected = () => {
        if (isReadOnly) return;
        const nodesToKeep = nodes.filter((n) => !n.selected);
        const keptNodeIds = new Set(nodesToKeep.map((n) => n.id));
        
        setNodes(nodesToKeep);
        setEdges((eds) => eds.filter((e) => !e.selected && keptNodeIds.has(e.source) && keptNodeIds.has(e.target)));
        toast.success("Elementos selecionados removidos!");
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const result = await saveMindMap(id, { nodes, edges });
            if (result.success) {
                toast.success("Brain Flow salvo!");
            } else {
                console.error("Save error:", result.error);
                toast.error(`Erro: ${result.error}`);
            }
        } catch (e: any) {
            toast.error(`Exceção: ${e?.message}`);
        }
        setSaving(false);
    };

    if (loading) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-black">
                <Loader2 className="h-10 w-10 animate-spin text-white" />
            </div>
        );
    }

    return (
        <div className="h-screen w-screen flex flex-col bg-black overflow-hidden">
            <style dangerouslySetInnerHTML={{
                __html: `
                .react-flow__edge-path { stroke: rgba(255,255,255,0.4); stroke-width: 2px !important; }
                .react-flow__edge.selected .react-flow__edge-path { stroke: #fff !important; stroke-width: 3px !important; }
                .react-flow__connection-path { stroke: rgba(255,255,255,0.7) !important; stroke-width: 2px !important; }
                .react-flow__controls { background: rgba(20,20,20,0.9) !important; border: 1px solid rgba(255,255,255,0.1) !important; border-radius: 12px !important; }
                .react-flow__controls-button { background: transparent !important; border: none !important; color: rgba(255,255,255,0.6) !important; fill: rgba(255,255,255,0.6) !important; }
                .react-flow__controls-button:hover { background: rgba(255,255,255,0.1) !important; fill: #fff !important; }
                .react-flow__minimap { background: rgba(10,10,10,0.95) !important; border: 1px solid rgba(255,255,255,0.1) !important; border-radius: 12px !important; }
                .react-flow__attribution { display: none !important; }
            `}} />

            {/* Sovereign Header */}
            <header className="h-16 flex items-center justify-between px-6 bg-black border-b border-white/5 shrink-0 gap-4">
                <div className="flex items-center gap-4 shrink-0">
                    <Button variant="ghost" size="icon" asChild className="rounded-full hover:bg-white/10">
                        <Link href="/notes">
                            <ChevronLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <div className="flex flex-col">
                        <h1 className="text-sm font-black tracking-[0.3em] uppercase text-white leading-none">Brain Flow</h1>
                        <span className="text-[8px] font-bold tracking-widest text-white/30 uppercase mt-0.5">Sovereign Mind Map Engine</span>
                    </div>
                </div>

                {/* Connection Style Selector (Header Middle) */}
                <div className="hidden lg:flex items-center gap-3 border-l border-r border-white/10 px-6 py-1 h-10">
                    <span className="text-[8px] font-black text-white/40 uppercase tracking-[0.2em] mr-1">Ligações:</span>
                    <select
                        value={connectionType}
                        onChange={(e) => setConnectionType(e.target.value as any)}
                        className="bg-zinc-950 text-white border border-white/10 rounded px-2.5 py-1 text-[9px] font-black uppercase tracking-widest outline-none cursor-pointer hover:border-white/30 hover:bg-zinc-900 transition h-8"
                    >
                        <option value="default">Curva</option>
                        <option value="straight">Reta</option>
                        <option value="step">Passos</option>
                    </select>
                    <select
                        value={lineType}
                        onChange={(e) => setLineType(e.target.value as any)}
                        className="bg-zinc-950 text-white border border-white/10 rounded px-2.5 py-1 text-[9px] font-black uppercase tracking-widest outline-none cursor-pointer hover:border-white/30 hover:bg-zinc-900 transition h-8"
                    >
                        <option value="solid">Sólida</option>
                        <option value="dashed">Tracejada</option>
                        <option value="dotted">Pontilhada</option>
                    </select>
                    <Button
                        onClick={styleSelectedEdges}
                        variant="ghost"
                        className="h-8 rounded border border-white/10 hover:bg-white/10 text-[9px] font-black uppercase tracking-widest px-3 transition-colors shrink-0"
                    >
                        Aplicar
                    </Button>
                </div>

                {isReadOnly ? (
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] tracking-widest font-black uppercase px-3 py-1.5 rounded-full bg-zinc-900 text-zinc-400 border border-zinc-700">
                            Apenas Leitura
                        </span>
                    </div>
                ) : (
                    <div className="flex items-center gap-3 shrink-0">
                        <Button
                            onClick={addNode}
                            variant="ghost"
                            className="rounded-full border border-white/20 hover:bg-white/10 hover:border-white/40 text-white font-black uppercase text-[10px] px-5 h-9 gap-2"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            Nó
                        </Button>
                        <Button
                            onMouseDown={(e) => {
                                e.preventDefault();
                                deleteSelected();
                            }}
                            variant="ghost"
                            className="rounded-full border border-red-500/30 hover:bg-red-500/10 hover:border-red-500/60 text-red-400 font-black uppercase text-[10px] px-5 h-9 gap-2"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                            Deletar
                        </Button>
                        <div className="h-6 w-px bg-white/10" />
                        <Button
                            onClick={handleSave}
                            disabled={saving}
                            className="rounded-full bg-white text-black hover:bg-white/90 font-black uppercase text-[10px] px-7 h-9 gap-2 shadow-[0_0_20px_rgba(255,255,255,0.15)] transition-all active:scale-95"
                        >
                            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                            Salvar
                        </Button>
                    </div>
                )}
            </header>

            {/* Canvas */}
            <div className="flex-1 w-full">
                <ReactFlowProvider>
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={isReadOnly ? undefined : onConnect}
                        nodesDraggable={!isReadOnly}
                        nodesConnectable={!isReadOnly}
                        elementsSelectable={!isReadOnly}
                        onEdgeDoubleClick={isReadOnly ? undefined : (event, edge) => {
                            setEdges((eds) => eds.filter((e) => e.id !== edge.id));
                            toast.success("Conexão removida!");
                        }}
                        nodeTypes={nodeTypes}
                        connectionMode={ConnectionMode.Loose}
                        fitView
                        fitViewOptions={{ padding: 0.3 }}
                        defaultEdgeOptions={{
                            animated: false,
                            style: { stroke: "rgba(255,255,255,0.5)", strokeWidth: 2 },
                        }}
                    >
                        <Background
                            variant={BackgroundVariant.Dots}
                            gap={24}
                            size={1}
                            color="rgba(255,255,255,0.06)"
                        />
                        <Controls style={{ bottom: 24, left: 24 }} />
                        <MiniMap
                            nodeColor={() => "rgba(255,255,255,0.2)"}
                            maskColor="rgba(0,0,0,0.7)"
                            style={{ bottom: 24, right: 24 }}
                        />
                    </ReactFlow>
                </ReactFlowProvider>
            </div>
        </div>
    );
}
