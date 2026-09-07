import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Terms of Service | QueueWise',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-grow pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12">
          <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2">Terms of Service</h1>
          
          <div className="prose prose-blue max-w-none text-gray-600 space-y-6">
            <p>
              Welcome to QueueWise. These Terms of Service outline the rules and regulations for the use of our digital queue management platform.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">1. Acceptance of Terms</h2>
            <p>
              By accessing this application, we assume you accept these terms and conditions. Do not continue to use QueueWise if you do not agree to take all of the terms and conditions stated on this page.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">2. User Accounts</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>You must be at least 13 years of age to use this platform.</li>
              <li>You are responsible for maintaining the confidentiality of your account and password.</li>
              <li>You agree to accept responsibility for all activities that occur under your account.</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">3. Fair Use of Queues</h2>
            <p>
              As a customer, you agree not to abuse the queuing system by generating fake tickets, abandoning queues maliciously, or bypassing geofence restrictions using location spoofing tools. Businesses reserve the right to remove you from their queue at their discretion.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">4. Limitation of Liability</h2>
            <p>
              QueueWise is provided "as is". We shall not be held responsible for any damages arising out of or in connection with the use of our platform, including but not limited to missed appointments, lost business revenue, or technical downtime.
            </p>

            <p className="mt-8 text-sm italic">
              These terms are subject to change without notice. Please review them periodically.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

