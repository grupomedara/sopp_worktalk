import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ success: false, error: "Não autorizado" }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json({ success: false, error: "Nenhum arquivo enviado" }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64 = buffer.toString("base64");
        
        // Construct Data URL
        const mimeType = file.type || "application/octet-stream";
        const fileUrl = `data:${mimeType};base64,${base64}`;

        return NextResponse.json({
            success: true,
            url: fileUrl,
            name: file.name,
            size: file.size
        });
    } catch (error: any) {
        console.error("Erro no upload de arquivo:", error);
        return NextResponse.json({
            success: false,
            error: error.message || "Erro interno no upload de arquivo"
        }, { status: 500 });
    }
}
