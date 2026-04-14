import TopHeader from './TopHeader';
import CategoryNav from './CategoryNav';
import authService from '@/features/auth/services/authService';

function Navbar() {
  // Use unified authService for user profile
  const profile = authService.getCurrentUser();

  const handleLogout = () => {
    authService.logout();
  };

  return (
    <header className="sticky top-0 z-[90] flex w-full flex-col bg-white/95 shadow-[0_8px_24px_rgba(15,23,42,0.08)] backdrop-blur">
      <TopHeader profile={profile} handleLogout={handleLogout} />
      <CategoryNav />
    </header>
  );
}

export default Navbar;
