import { useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const Layout = ({ children, activeTab, setActiveTab }) => {
    // Map tab IDs to readable titles
    const titles = {
        dashboard: 'Dashboard',
        'my-group': 'My Group',
        group: 'Group Management',
        groups: 'View Groups',
        'group-requests': 'Group Requests',
        proposal: 'Proposal Submission',
        schedule: 'Schedule Defense',
        grading: 'Grading Form',
        hod: 'HOD Dashboard',
        review: 'Proposal Review',
        progress: 'Student Progress',
        invite: 'Invite Evaluator',
        admin: 'Admin Dashboard'
    };

    return (
        <div className="min-h-screen bg-slate-50 flex" >
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

            <div className="flex-1 ml-64 flex flex-col">
                <Navbar title={titles[activeTab] || 'Dashboard'} />

                <main className="flex-1 p-8 overflow-y-auto">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div >
    );
};

export default Layout;
