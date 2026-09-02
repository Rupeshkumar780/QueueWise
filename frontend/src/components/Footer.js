export default function Footer() {
  return (
    <footer className="bg-gray-100 border-t mt-12 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center">
        <div className="mb-4 md:mb-0">
          <h3 className="text-xl font-bold">QueueWise</h3>
          <p className="text-sm text-gray-500 mt-1">Smart Appointment & Waitlist Optimization System</p>
        </div>
        <div className="flex space-x-6 text-sm text-gray-600">
          <a href="#" className="hover:text-black transition">Plan what all to keep in this</a>
          <a href="#" className="hover:text-black transition">Privacy Policy</a>
          <a href="#" className="hover:text-black transition">Terms of Service</a>
        </div>
      </div>
      <div className="text-center text-xs text-gray-400 mt-8">
        &copy; {new Date().getFullYear()} QueueWise. All rights reserved.
      </div>
    </footer>
  );
}

