import { Outlet } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

const PublicLayout = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow w-full max-w-container-max mx-auto px-sm md:px-xl py-md">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default PublicLayout;
