/** Set the confirmed event details here. Unannounced fields are intentional placeholders. */
export const eventConfig = {
  name: "THE HAUNTED HOUSE",
  type: "One-Day Event",
  date: "To be announced",
  time: "To be announced",
  location: "To be announced",
  // Set only when the organizer specifies an exact ID length.
  studentIdLength: null as number | null,
  payment: {
    bankName: "",
    accountName: "",
    accountNumber: "",
    promptPayQr: "",
    contact: "",
  },
  ticket: {
    category: "EARLY BIRD",
    name: "Early Bird - Single Ticket",
    price: 30,
    description: "One ticket. The full haunted house experience.",
  },
} as const;
