import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'About Us | QueueWise',
  description: 'Learn more about QueueWise and our mission to eliminate waiting lines.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-grow pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12">
          <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-6">About QueueWise</h1>
          
          <div className="prose prose-blue max-w-none text-gray-600 space-y-6">
            <p className="text-lg leading-relaxed">
              QueueWise was built with a simple mission: <strong>to give people their time back.</strong>
            </p>
            <p>
              We believe that waiting in physical lines is an outdated concept that causes frustration for customers and operational bottlenecks for businesses. Whether it's a bustling clinic, a popular restaurant, or a busy government office, the experience of waiting should be seamless, transparent, and digital.
            </p>
            
            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">Our Vision</h2>
            <p>
              Our vision is a world where physical queues no longer exist. We empower businesses to offer smart, location-aware digital queuing solutions that let their customers wait from the comfort of their cars, nearby cafes, or homes. 
            </p>
            
            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">Why QueueWise?</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Real-time transparency:</strong> Customers always know their exact position in line.</li>
              <li><strong>Geofencing security:</strong> Ensure people joining the queue are actually nearby when required.</li>
              <li><strong>Data-driven operations:</strong> We provide businesses with the analytics they need to optimize staffing and serve customers faster.</li>
            </ul>

            <div className="mt-12 p-6 bg-blue-50 rounded-xl border border-blue-100">
              <h3 className="text-lg font-bold text-blue-900 mb-2">Join the Queue Revolution</h3>
              <p className="text-blue-800">
                Are you a business owner looking to improve your customer experience? 
                <a href="/auth/signup?type=business" className="text-blue-600 font-bold hover:underline ml-2">Get started with QueueWise today.</a>
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

