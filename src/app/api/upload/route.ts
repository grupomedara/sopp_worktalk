import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

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

        // Sanitize filename to avoid directory traversal
        const sanitizedOriginalName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
        const uniqueFilename = `${Date.now()}_${sanitizedOriginalName}`;

        const uploadDir = join(process.cwd(), "public", "uploads");

        // Ensure directory exists
        if (!existsSync(uploadDir)) {
            await mkdir(uploadDir, { recursive: true });
        }

        const filePath = join(uploadDir, uniqueFilename);
        await writeFile(filePath, buffer);

        const fileUrl = `/uploads/${uniqueFilename}`;

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
