import { FiBookOpen } from 'react-icons/fi';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-primary text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
        <div>
          <div className="flex items-center gap-2 font-serif text-lg font-semibold mb-2">
            <FiBookOpen size={18} className="text-accent" />
            IUEA Library
          </div>
          <p className="text-primary-light text-xs leading-relaxed">
            International University of East Africa<br />
            Digital Library — Books, Podcasts & AI Reading Assistant
          </p>
        </div>
        <div>
          <h4 className="font-semibold mb-2 text-accent">Quick Links</h4>
          <ul className="space-y-1 text-primary-light">
            <li><Link to="/"         className="hover:text-white transition-colors">Home</Link></li>
            <li><Link to="/search"   className="hover:text-white transition-colors">Browse Books</Link></li>
            <li><Link to="/podcasts" className="hover:text-white transition-colors">Podcasts</Link></li>
            <li><Link to="/library"  className="hover:text-white transition-colors">My Library</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-2 text-accent">Contact</h4>
          <p className="text-primary-light text-xs leading-relaxed">
            IUEA Campus, Kampala, Uganda<br />
            library@iuea.ac.ug<br />
            +256 (0) 312 350 800
          </p>
        </div>
      </div>
      <div className="border-t border-primary-light text-center py-3 text-xs text-primary-light">
        © {new Date().getFullYear()} IUEA Library. All rights reserved.
      </div>
    </footer>
  );
}
