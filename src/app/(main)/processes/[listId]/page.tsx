import { getList } from "@/app/actions/processes";
import { SpreadsheetGrid } from "@/components/processes/SpreadsheetGrid";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/auth";

export default async function ListDetailsPage({ params }: { params: Promise<{ listId: string }> }) {
    const session = await auth();
    if (!session?.user) redirect("/login");

    const { listId } = await params;

    const listResult = await getList(listId);

    if (!listResult.success || !listResult.data) {
        notFound();
    }

    const list = listResult.data;

    return (
        <div className="h-full flex flex-col min-w-0">
            <SpreadsheetGrid 
                list={list} 
                currentUserId={session.user.id}
            />
        </div>
    );
}
