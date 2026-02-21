export default function ShortsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 bg-black">
      {children}
    </div>
  );
}
