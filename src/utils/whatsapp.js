export function openWhatsAppConfirmation(reservation) {
  const phone = reservation.phone.replace(/\D/g, "");
  const message = `Hello ${reservation.name}, your reservation at Open Cafe is confirmed.\n\nDate: ${reservation.date}\nTime: ${reservation.time}\nBooking: ${reservation.table}\n\nThank you for choosing Open Cafe.`;
  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
}
