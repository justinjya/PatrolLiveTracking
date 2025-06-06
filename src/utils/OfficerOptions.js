export const shiftOptions = [
  {
    value: "pagi",
    label: "Pagi (07:00 - 15:00)",
    minTime: "07:00",
    maxTime: "15:00"
  },
  {
    value: "siang",
    label: "Siang (07:00 - 19:00)",
    minTime: "07:00",
    maxTime: "19:00"
  },
  {
    value: "sore",
    label: "Sore (15:00 - 23:00)",
    minTime: "15:00",
    maxTime: "23:00"
  },
  {
    value: "malam",
    label: "Malam (23:00 - 07:00)",
    minTime: "23:00",
    maxTime: "07:00"
  },
  {
    value: "malam_panjang",
    label: "Malam (19:00 - 07:00)",
    minTime: "19:00",
    maxTime: "07:00"
  }
];

export const typeOptions = [
  { value: "outsource", label: "Outsource", style: { backgroundColor: "#FDF8E4", color: "#9B7E00" } },
  { value: "organik", label: "Organik", style: { backgroundColor: "#E7F9EA", color: "#007217" } }
];
