export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">Parque</h1>
        <p className="text-gray-400 text-lg mb-8">Premium Valet Parking</p>
        <div className="bg-[#1F2937] rounded-2xl p-6 max-w-sm">
          <p className="text-gray-300 text-sm">
            Looking for your vehicle status? Check the link in your SMS or scan the QR code from your valet ticket.
          </p>
        </div>
      </div>
    </div>
  );
}
