import { TicketList } from '@/components/Tickets/TicketList';

export default function TicketsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Tickets</h1>
      </div>
      <TicketList />
    </div>
  );
}

