import { TicketUpload } from '@/components/Tickets/TicketUpload';

export default function UploadTicketPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Subir Ticket</h1>
      <TicketUpload />
    </div>
  );
}

