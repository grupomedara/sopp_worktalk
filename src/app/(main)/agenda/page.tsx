import { getEvents } from "@/app/actions/events";
import { getProjects } from "@/app/actions/projects";
import { getPeople } from "@/app/actions/people";
import { AgendaBoard } from "@/components/agenda/AgendaBoard";

export const dynamic = 'force-dynamic';

export default async function AgendaPage() {
    const resultEvents = await getEvents();
    const events = resultEvents.data || [];

    const resultProjects = await getProjects();
    const projects = resultProjects.data || [];

    const resultPeople = await getPeople();
    const people = resultPeople.data || [];

    return (
        <AgendaBoard 
            events={events} 
            projects={projects} 
            people={people} 
        />
    );
}
