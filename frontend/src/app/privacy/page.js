import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Privacy Policy | QueueWise',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-grow pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12">
          <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2">Privacy Policy</h1>
          
          <div className="prose prose-blue max-w-none text-gray-600 space-y-6">
            <p>
              At QueueWise, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or use our application.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">1. Information We Collect</h2>
            <p>We may collect information about you in a variety of ways. The information we may collect includes:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Personal Data:</strong> Personally identifiable information, such as your name, email address, and telephone number, that you voluntarily give to us when you register.</li>
              <li><strong>Location Data:</strong> We may request access or permission to track location-based information from your mobile device to verify you are within a business's required geofence before joining a queue.</li>
              <li><strong>Form Data:</strong> Information you submit through custom forms required by businesses when joining their queues.</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">2. Use of Your Information</h2>
            <p>Having accurate information about you permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you to:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Create and manage your account.</li>
              <li>Facilitate your placement in digital queues and notify you of your status.</li>
              <li>Enable business owners to serve you efficiently based on the details you provided.</li>
              <li>Compile anonymous statistical data and analysis for internal use or with third parties.</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">3. Data Security</h2>
            <p>
              We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">4. Contact Us</h2>
            <p>
              If you have questions or comments about this Privacy Policy, please contact us at queuewise.support@gmail.com.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

