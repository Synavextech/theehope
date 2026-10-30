import { jsPDF } from 'jspdf';
import { format } from 'date-fns';

export interface TicketData {
    eventTitle: string;
    eventDate: string;
    eventLocation: string;
    userName: string;
    userEmail: string;
    category: string;
    amountPaid: number;
    bookingId: string;
    attendanceType?: string;
    deliveryMethod?: string;
    itemContributions?: string[];
}

export const generateTicketPDF = (data: TicketData) => {
    const doc = new jsPDF();

    // Brand Emerald Green Background for Header (#2E5E43)
    doc.setFillColor(46, 94, 67);
    doc.rect(0, 0, 210, 60, 'F');

    // Website Title / Branding
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('The Voice of strength Kenya', 20, 28);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(204, 184, 139); // Warm Gold #CCB88B
    doc.text('Hope for the future - Charity Outreach', 20, 36);
    doc.setTextColor(255, 255, 255);
    doc.text('Tel: +254 798 182 108 / +254 798 332 690', 20, 43);

    // Ticket Header
    doc.setFontSize(20);
    doc.setTextColor(204, 184, 139);
    doc.text('EVENT PASS & RECEIPT', 120, 35);

    // Event Details Section
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('EVENT DETAILS', 20, 80);

    doc.setDrawColor(204, 184, 139); // Gold border #CCB88B
    doc.line(20, 82, 190, 82);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text(data.eventTitle, 20, 95);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.text(`Date: ${data.eventDate}`, 20, 105);
    doc.text(`Location: ${data.eventLocation}`, 20, 112);

    // Attendee Details
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('CONTRIBUTOR / ATTENDEE INFORMATION', 20, 130);
    doc.setDrawColor(204, 184, 139);
    doc.line(20, 132, 190, 132);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Name: ${data.userName}`, 20, 145);
    doc.text(`Email: ${data.userEmail}`, 20, 152);
    doc.text(`Participation: ${data.category}`, 20, 159);
    doc.text(`Contribution: KES ${Number(data.amountPaid || 0).toLocaleString()}`, 20, 166);

    // Booking ID / QR Area (Placeholder)
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(`Booking Reference ID: ${data.bookingId}`, 20, 185);

    // Footer
    doc.setFillColor(248, 250, 252); // slate-50
    doc.rect(0, 260, 210, 37, 'F');
    doc.setTextColor(46, 94, 67);
    doc.setFontSize(10);
    doc.text('Please present this pass upon arrival at the outreach venue.', 105, 275, { align: 'center' });
    doc.text('Thank you for bringing hope, smiles, and love to Kenya’s needy communities! ❤️', 105, 282, { align: 'center' });

    // Save the PDF
    doc.save(`Pass_${data.eventTitle.replace(/\s+/g, '_')}.pdf`);
};
