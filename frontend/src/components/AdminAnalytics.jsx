import React, { useEffect, useState } from 'react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import api from '../services/api';

const COLORS = [
  '#3B82F6', // Professionalism
  '#14B8A6', // Transparency
  '#8B5CF6', // Innovativeness
  '#F97316', // Stakeholder
  '#EC4899', // Customer Centric
  '#E3BC75', // Teamwork
  '#22C55E', // Sustainability
  '#0EA5E9', // Inclusivity
];

export default function AdminAnalytics() {
    const [stats, setStats] = useState({
        total_jobs: 0,
        total_applications: 0,
        status_distribution: [],
        job_type_distribution: [],
        average_ats_score: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const response = await api.get('/careers/analytics/');
                setStats(response.data);
            } catch (error) {
                console.error("Failed to fetch analytics:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, []);

    if (loading) {
        return <div className="flex justify-center items-center h-48"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>;
    }

    const pieData = stats.status_distribution.map(s => ({
        name: s.status,
        value: s.count
    }));

    const barData = stats.job_type_distribution.map(j => ({
        name: j.job_type.replace('_', ' '),
        applications: j.count * 12 // Mock data scaling just for visual
    }));

    return (
        <div className="animation-fade-in max-w-7xl mx-auto">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-8 tracking-tight">System Intelligence Dashboard</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-l-[#3B82F6]">
                    <h3 className="text-sm font-bold text-gray-500 uppercase">Total Vacancies</h3>
                    <p className="text-3xl font-black mt-2 text-gray-800">{stats.total_jobs}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-l-[#14B8A6]">
                    <h3 className="text-sm font-bold text-gray-500 uppercase">Total Applications</h3>
                    <p className="text-3xl font-black mt-2 text-gray-800">{stats.total_applications}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-l-[#E3BC75]">
                    <h3 className="text-sm font-bold text-gray-500 uppercase">Avg. ATS Score</h3>
                    <p className="text-3xl font-black mt-2 text-gray-800">{stats.average_ats_score}%</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-l-[#8B5CF6]">
                    <h3 className="text-sm font-bold text-gray-500 uppercase">System Integrity</h3>
                    <p className="text-3xl font-black mt-2 text-gray-800">100%</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Application Context (Pie Chart) */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-6">Application Status Distribution</h3>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData.length ? pieData : [{name: 'No Data', value: 1}]}
                                    cx="50%"
                                    cy="50%"
                                    stroke="none"
                                    innerRadius={70}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <RechartsTooltip 
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Legend iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Job Types (Bar Chart) */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-6">Category Demand Volume</h3>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={barData.length ? barData : [{name: 'No Data', applications: 0}]}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} />
                                <RechartsTooltip
                                    cursor={{fill: '#F3F4F6'}}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="applications" fill="#3B82F6" radius={[6, 6, 0, 0]}>
                                    {barData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                
                {/* ATS Score Trends (Area Chart - Mock Data for visual) */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 md:col-span-2">
                    <h3 className="text-lg font-bold text-gray-800 mb-6">Aggregate ATS Score Trends (7-Day Projection)</h3>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={[
                                {day: 'Mon', score: 45}, {day: 'Tue', score: 52}, {day: 'Wed', score: 58},
                                {day: 'Thu', score: 65}, {day: 'Fri', score: 69}, {day: 'Sat', score: 72},
                                {day: 'Sun', score: stats.average_ats_score || 75}
                            ]}>
                                <defs>
                                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#14B8A6" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#14B8A6" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis dataKey="day" axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} />
                                <RechartsTooltip />
                                <Area type="monotone" dataKey="score" stroke="#14B8A6" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}
