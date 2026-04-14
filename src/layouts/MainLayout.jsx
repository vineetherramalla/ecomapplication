import Footer from '../components/common/Footer';
import Navbar from '../components/common/Navbar';
import FloatingEnquiry from '../components/common/FloatingEnquiry';

function MainLayout({ children }) {
  return (
    <div className="flex min-h-screen flex-col overflow-x-clip bg-slate-50">
      <Navbar />
      <main className="flex-1 overflow-x-clip">{children}</main>
      <Footer />
      <FloatingEnquiry />
    </div>
  );
}

export default MainLayout;
