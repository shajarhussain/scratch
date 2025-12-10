import { Bell, Search } from 'lucide-react';
import NotificationBell from './NotificationBell';

const Navbar = ({ title }) => {
    return (
        <div className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10">
            <h2 className="text-xl font-semibold text-slate-800">{title}</h2>

            <div className="flex items-center space-x-6">
                <div className="relative hidden md:block">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search..."
                        className="pl-10 pr-4 py-2 bg-slate-100 border-none rounded-full text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all w-64"
                    />
                </div>

                <NotificationBell />
            </div>
        </div>
    );
};

export default Navbar;
