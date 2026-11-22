import Header from './Header';
import BottomNav from './BottomNav';

export default function StudentLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50 pb-16 md:pb-0">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
