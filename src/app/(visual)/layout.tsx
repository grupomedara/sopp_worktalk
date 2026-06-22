export default function VisualLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <main className="h-screen w-screen overflow-hidden bg-background">
            {children}
        </main>
    );
}
