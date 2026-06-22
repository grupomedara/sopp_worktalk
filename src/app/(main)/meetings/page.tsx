import { getMeetings, getMeetingFilterOptions } from "@/app/actions/meetings";
import { getPeople } from "@/app/actions/people";
import { MeetingDialog } from "@/components/meetings/MeetingDialog";
import { MeetingTable } from "@/components/meetings/MeetingTable";
import { MeetingFilters } from "@/components/meetings/MeetingFilters";
import { MeetingMetrics } from "@/components/meetings/MeetingMetrics";
import { auth } from "@/auth";

export const dynamic = 'force-dynamic';

export default async function MeetingsPage({
    searchParams,
}: {
    searchParams: Promise<{
        sort?: string;
        order?: string;
        companyOrPerson?: string;
        theme?: string;
        startDate?: string;
        endDate?: string;
    }>;
}) {
    const params = await searchParams;
    const sort = params.sort || "date";
    const order = (params.order as "asc" | "desc") || "desc";

    const companyOrPerson = params.companyOrPerson;
    const theme = params.theme;
    const startDate = params.startDate;
    const endDate = params.endDate;

    const [meetingsResult, optionsResult, peopleResult] = await Promise.all([
        getMeetings(sort, order, { companyOrPerson, theme, startDate, endDate }),
        getMeetingFilterOptions(),
        getPeople("name", "asc"),
    ]);

    const meetings = meetingsResult.success ? meetingsResult.data || [] : [];
    const filterOptions = optionsResult.success ? optionsResult.data || { companies: [], themes: [] } : { companies: [], themes: [] };
    const people = peopleResult.success ? peopleResult.data || [] : [];

    const session = await auth();
    const currentUserId = session?.user?.id;

    return (
        <div className="space-y-8 pb-16">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">Ata de Reuniões</h2>
                    <p className="text-muted-foreground">
                        Gestão e registro de reuniões e atas.
                    </p>
                </div>
                <MeetingDialog people={people} />
            </div>

            <MeetingMetrics meetings={meetings as any} />

            <MeetingFilters
                companies={filterOptions.companies}
                themes={filterOptions.themes}
            />

            <MeetingTable meetings={meetings} people={people} currentUserId={currentUserId} />
        </div>
    );
}
