type IconName = "search" | "chevron" | "bone" | "joint" | "muscle" | "brain" | "heart" | "lungs" | "digestive" | "kidney" | "reproductive" | "endocrine" | "eye" | "organ" | "spark" | "book" | "volume" | "close";

export default function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const p = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  if (name === "search") return <svg {...p}><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/></svg>;
  if (name === "chevron") return <svg {...p}><path d="m7 10 5 5 5-5"/></svg>;
  if (name === "bone") return <svg {...p}><path d="M7.1 8.6a3.1 3.1 0 1 1-2.7-4.8 3.3 3.3 0 0 1 4.2.5l6.8 6.8a3.3 3.3 0 0 1 .5 4.2 3.1 3.1 0 1 1-4.8 2.7l-6.8-6.8a3.3 3.3 0 0 1-.2-4.5"/><path d="M8.5 15.5a3.3 3.3 0 0 1-4.2.2"/></svg>;
  if (name === "joint") return <svg {...p}><path d="M8 3v5.2c0 1.3.7 2.5 1.8 3.1l.2.1v2.9c0 1-.4 2-1.1 2.7L7 19"/><path d="M16 3v5.2c0 1.3-.7 2.5-1.8 3.1l-.2.1v2.9c0 1 .4 2 1.1 2.7l1.9 2"/><path d="M9.8 11.3h4.4M10 14.3h4"/></svg>;
  if (name === "organ") return <svg {...p}><path d="M12 20c-4.8-2.6-7-5.3-7-9a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 3.7-2.2 6.4-7 9Z"/></svg>;
  if (name === "muscle") return <svg {...p}><path d="M8 7c2-2 5-2 7 0l2 2c1.4 1.4 1.4 3.6 0 5l-1 1c-1.8 1.8-4.8 1.8-6.6 0L7 12.6c-1.8-1.8-1.8-4.8 0-6.6L9 4"/><path d="m10 11 4 4M12 8l4 4"/></svg>;
  if (name === "brain") return <svg {...p}><path d="M9.2 19.2A3.5 3.5 0 0 1 5.8 16a3.4 3.4 0 0 1-1.2-5.7A3.5 3.5 0 0 1 7.8 5a3.2 3.2 0 0 1 6-1 3.3 3.3 0 0 1 4.6 4.5 3.4 3.4 0 0 1-.2 6.1 3.5 3.5 0 0 1-4.4 4.6L12 21l-2.8-1.8Z"/><path d="M9 7.5c1.5.3 2.5 1.3 3 2.8M7 13c1.8-.5 3.4.1 4.4 1.4M14 5.2c-.7 1.5-.5 3 .6 4.3M14 14c1.2-.8 2.6-.8 4-.2M12 10.3V21"/></svg>;
  if (name === "heart") return <svg {...p}><path d="M12 20c-4.7-2.8-7.2-5.5-7.2-9.2A3.9 3.9 0 0 1 12 8.6a3.9 3.9 0 0 1 7.2 2.2c0 3.7-2.5 6.4-7.2 9.2Z"/><path d="M12 8.6V4M9.3 7 8 4M14.7 7 16 3.5"/></svg>;
  if (name === "lungs") return <svg {...p}><path d="M11 11V4M13 11V4M11 8 8.5 6"/><path d="M9.8 9.3c-1.2-.5-2.4 0-3.2 1.2C5.1 12.7 4.3 15.4 4 19c2.7.9 5 .1 6.2-2.1.6-1.1.8-2.5.8-4.1V10l-1.2-.7ZM14.2 9.3c1.2-.5 2.4 0 3.2 1.2 1.5 2.2 2.3 4.9 2.6 8.5-2.7.9-5 .1-6.2-2.1-.6-1.1-.8-2.5-.8-4.1V10l1.2-.7Z"/></svg>;
  if (name === "digestive") return <svg {...p}><path d="M9 3v5.5c0 1.3 1 2.3 2.3 2.3h1.2c1.7 0 2.8 1.5 2.8 3 0 2.8-2.2 5.2-5.1 5.2H8.8C6.7 19 5 17.3 5 15.2c0-1.7 1-3.2 2.5-3.8"/><path d="M13 3v4.2c0 1.1.9 2 2 2h2.5"/></svg>;
  if (name === "kidney") return <svg {...p}><path d="M9.8 4.2C6.4 3.5 4.3 6.8 4.3 11c0 4.7 2.6 7.5 5.5 6.5 1.9-.7 2.2-2.8 2.2-5.6V7.1c0-1.5-.8-2.6-2.2-2.9ZM14.2 4.2c3.4-.7 5.5 2.6 5.5 6.8 0 4.7-2.6 7.5-5.5 6.5-1.9-.7-2.2-2.8-2.2-5.6V7.1c0-1.5.8-2.6 2.2-2.9Z"/><path d="M12 12v9"/></svg>;
  if (name === "reproductive") return <svg {...p}><circle cx="12" cy="9" r="4"/><path d="M12 13v8M8.5 17h7M18 4h3v3M18.5 6.5 16 9"/></svg>;
  if (name === "endocrine") return <svg {...p}><path d="M12 4v16M12 8c-2.5-3.5-6.5-3.4-7.5-.4-.8 2.5 1.6 4.6 4.2 4.2 1.4-.2 2.5-1.2 3.3-2.2M12 8c2.5-3.5 6.5-3.4 7.5-.4.8 2.5-1.6 4.6-4.2 4.2-1.4-.2-2.5-1.2-3.3-2.2"/><circle cx="12" cy="17" r="2"/></svg>;
  if (name === "eye") return <svg {...p}><path d="M2.8 12S6.2 6.5 12 6.5 21.2 12 21.2 12 17.8 17.5 12 17.5 2.8 12 2.8 12Z"/><circle cx="12" cy="12" r="2.7"/></svg>;
  if (name === "book") return <svg {...p}><path d="M4.5 5.5A2.5 2.5 0 0 1 7 3h4.5v16H7a2.5 2.5 0 0 0-2.5 2.5V5.5ZM19.5 5.5A2.5 2.5 0 0 0 17 3h-4.5v16H17a2.5 2.5 0 0 1 2.5 2.5V5.5Z"/></svg>;
  if (name === "spark") return <svg {...p}><path d="m12 3 1.4 5.6L19 10l-5.6 1.4L12 17l-1.4-5.6L5 10l5.6-1.4L12 3Z"/><path d="m18.5 16 .5 2 2 .5-2 .5-.5 2-.5-2-2-.5 2-.5.5-2Z"/></svg>;
  if (name === "volume") return <svg {...p}><path d="M5 10v4h3l4 3V7L8 10H5Z"/><path d="M15 9.2a4 4 0 0 1 0 5.6M17.5 6.8a7.2 7.2 0 0 1 0 10.4"/></svg>;
  return <svg {...p}><path d="m7 7 10 10M17 7 7 17"/></svg>;
}
