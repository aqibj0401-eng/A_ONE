import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="w-full bg-[#fcfcfc] border-t border-gray-200 py-12 px-6 md:px-12 mt-auto text-[#111111]">
       <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
         <div className="md:col-span-2">
            <h2 className="font-serif text-3xl font-medium mb-4 tracking-tight">A-ONE MOBILE & LAPTOP</h2>
            <p className="text-sm text-gray-500 max-w-xs leading-relaxed">
              Your trusted destination for mobiles and laptops. Quality technology for everyday life.
            </p>
         </div>
         <div>
            <h4 className="font-medium mb-4 text-xs uppercase tracking-widest text-gray-900">Shop</h4>
            <ul className="text-sm text-gray-500 space-y-3">
               <li><Link to="/products" className="hover:text-black transition-colors">All Products</Link></li>
               <li><Link to="#" className="hover:text-black transition-colors">New Arrivals</Link></li>
               <li><Link to="#" className="hover:text-black transition-colors">Best Sellers</Link></li>
            </ul>
         </div>
         <div>
            <h4 className="font-medium mb-4 text-xs uppercase tracking-widest text-gray-900">Company</h4>
            <ul className="text-sm text-gray-500 space-y-3">
               <li><Link to="#" className="hover:text-black transition-colors">About Us</Link></li>
               <li><Link to="#" className="hover:text-black transition-colors">Contact</Link></li>
               <li><Link to="#" className="hover:text-black transition-colors">Terms of Service</Link></li>
            </ul>
         </div>
       </div>
       <div className="max-w-[1400px] mx-auto mt-16 pt-8 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center text-xs text-gray-400">
          <p>&copy; {new Date().getFullYear()} A-ONE MOBILE & LAPTOP. All rights reserved.</p>
          <div className="mt-4 md:mt-0 space-x-6">
             <Link to="#" className="hover:text-gray-900 transition-colors">Privacy Policy</Link>
             <Link to="#" className="hover:text-gray-900 transition-colors">Cookie Policy</Link>
          </div>
       </div>
    </footer>
  );
};

export default Footer;
