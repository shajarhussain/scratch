import { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar as CalendarIcon, Clock, MapPin, Users, AlertCircle } from 'lucide-react';

const MySchedules = () => {
    const [schedules, setSchedules] = useState([]);
    const [upcomingEvents, setUpcomingEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMySchedules();
        fetchUpcomingEvents();
    }, []);

    const fetchMySchedules = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('/api/schedules', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSchedules(res.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching schedules:', error);
            setLoading(false);
        }
    };

    const fetchUpcomingEvents = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('/api/schedules/upcoming', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUpcomingEvents(res.data);
        } catch (error) {
            console.error('Error fetching upcoming events:', error);
        }
    };

    const getEventIcon = (eventType) => {
        const icons = {
            'Proposal Defense': 'ðŸŽ¯',
            'Interim Evaluation I': 'ðŸ“Š',
            'Mid-Term Evaluation II': 'ðŸ“ˆ',
            'Final Viva': 'ðŸŽ“',
            'Submission Deadline': 'ðŸ“…',
            'Re-Evaluation': 'ðŸ”'
        };
        return icons[eventType] || 'ðŸ“‹';
    };

    const getEventColor = (eventType) => {
        const colors = {
            'Proposal Defense': 'green',
            'Interim Evaluation I': 'blue',
            'Mid-Term Evaluation II': 'blue',
            'Final Viva': 'purple',
            'Submission Deadline': 'orange',
            'Re-Evaluation': 'red'
        };
        return colors[eventType] || 'gray';
    };

    if (loading) {
        return <div className="flex items-center justify-center h-64">Loading schedules...</div>;
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 rounded-xl shadow-lg text-white">
                <h1 className="text-2xl font-bold flex items-center space-x-2">
                    <CalendarIcon size={28} />
                    <span>My Schedules</span>
                </h1>
                <p className="mt-1 text-blue-100">View your upcoming evaluations, defenses, and deadlines</p>
            </div>

            {/* Upcoming Events */}
            {upcomingEvents.length > 0 && (
                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
                    <div className="flex items-start space-x-2">
                        <AlertCircle className="text-yellow-600 mt-0.5" size={20} />
                        <div>
                            <div className="font-medium text-yellow-900">Upcoming Events (Next 7 Days)</div>
                            <div className="mt-2 space-y-2">
                                {upcomingEvents.map(event => (
                                    <div key={event._id} className="text-sm text-yellow-800">
                                        {getEventIcon(event.eventType)} <strong>{event.eventType}</strong> - {new Date(event.eventDate).toLocaleDateString()} at {event.startTime}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* All Schedules */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                <div className="p-6 border-b border-slate-100 bg-slate-50">
                    <h2 className="text-lg font-bold text-slate-800">All Schedules</h2>
                    <p className="text-sm text-slate-500 mt-1">{schedules.length} events scheduled</p>
                </div>

                <div className="divide-y divide-slate-200">
                    {schedules.length === 0 ? (
                        <div className="p-12 text-center">
                            <CalendarIcon className="mx-auto text-slate-300 mb-4" size={48} />
                            <p className="text-slate-500">No scheduled events yet</p>
                        </div>
                    ) : (
                        schedules.map(schedule => (
                            <div key={schedule._id} className="p-6 hover:bg-slate-50 transition-colors">
                                <div className={`border-l-4 border-${getEventColor(schedule.eventType)}-500 pl-4`}>
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-2 mb-2">
                                                <span className="text-2xl">{getEventIcon(schedule.eventType)}</span>
                                                <h3 className="text-lg font-bold text-slate-800">{schedule.eventType}</h3>
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${schedule.status === 'Scheduled' ? 'bg-blue-100 text-blue-700'
                                                    : schedule.status === 'Completed' ? 'bg-green-100 text-green-700'
                                                        : 'bg-gray-100 text-gray-700'
                                                    }`}>
                                                    {schedule.status}
                                                </span>
                                            </div>

                                            <div className="space-y-2 text-sm text-slate-600">
                                                {schedule.eventDate && (
                                                    <div className="flex items-center space-x-2">
                                                        <CalendarIcon size={16} />
                                                        <span>{new Date(schedule.eventDate).toLocaleDateString('en-US', {
                                                            weekday: 'long',
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric'
                                                        })}</span>
                                                    </div>
                                                )}

                                                {schedule.startTime && (
                                                    <div className="flex items-center space-x-2">
                                                        <Clock size={16} />
                                                        <span>{schedule.startTime} - {schedule.endTime}</span>
                                                    </div>
                                                )}

                                                {schedule.venue && (
                                                    <div className="flex items-center space-x-2">
                                                        <MapPin size={16} />
                                                        <span>{schedule.venue}</span>
                                                        {schedule.isOnline && schedule.meetingLink && (
                                                            <a
                                                                href={schedule.meetingLink}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-blue-600 hover:underline ml-2"
                                                            >
                                                                Join Meeting â†’
                                                            </a>
                                                        )}
                                                    </div>
                                                )}

                                                {schedule.internalEvaluators && schedule.internalEvaluators.length > 0 && (
                                                    <div className="flex items-center space-x-2">
                                                        <Users size={16} />
                                                        <span>Panel: {schedule.internalEvaluators.map(e => e.name).join(', ')}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {schedule.description && (
                                                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                                    <div className="text-xs font-medium text-blue-700 mb-1">Details</div>
                                                    <p className="text-sm text-blue-800">{schedule.description}</p>
                                                </div>
                                            )}

                                            {schedule.requirements && (
                                                <div className="mt-2 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                                                    <div className="text-xs font-medium text-purple-700 mb-1">What to Prepare</div>
                                                    <p className="text-sm text-purple-800">{schedule.requirements}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default MySchedules;
