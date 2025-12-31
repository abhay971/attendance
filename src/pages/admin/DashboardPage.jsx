import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../api/admin.api';
import { Card, CardHeader, CardBody } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { formatTime } from '../../utils/date';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from 'recharts';

const COLORS = ['#F37E3A', '#288EC2', '#6EBD49', '#8B5CF6', '#EC4899'];

export function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [weeklyStats, setWeeklyStats] = useState([]);
  const [departmentStats, setDepartmentStats] = useState([]);
  const [notCheckedIn, setNotCheckedIn] = useState([]);
  const [needCheckout, setNeedCheckout] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsData, weeklyData, deptData, notCheckedInData, needCheckoutData] = await Promise.all([
        adminApi.getDashboardStats(),
        adminApi.getWeeklyStats(),
        adminApi.getDepartmentStats(),
        adminApi.getEmployeesNotCheckedIn(),
        adminApi.getEmployeesNeedingCheckOut(),
      ]);
      setStats(statsData);
      setWeeklyStats(weeklyData);
      setDepartmentStats(deptData);
      setNotCheckedIn(notCheckedInData);
      setNeedCheckout(needCheckoutData);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const attendanceRate = stats?.activeEmployees > 0
    ? Math.round((stats?.todayCheckIns / stats?.activeEmployees) * 100)
    : 0;

  const pieData = [
    { name: 'Present', value: stats?.todayCheckIns || 0 },
    { name: 'Absent', value: (stats?.activeEmployees || 0) - (stats?.todayCheckIns || 0) },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-blue-100 mt-1">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center gap-6">
            <div className="text-center">
              <p className="text-blue-100 text-xs uppercase tracking-wide">Today's Rate</p>
              <p className="text-3xl font-bold">{attendanceRate}%</p>
            </div>
            <div className="w-16 h-16 relative">
              <svg className="w-16 h-16 transform -rotate-90">
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth="8"
                  fill="none"
                />
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  stroke="white"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${attendanceRate * 1.76} 176`}
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Employees"
          value={stats?.totalEmployees || 0}
          icon={UsersIcon}
          color="blue"
          trend={`${stats?.activeEmployees || 0} active`}
        />
        <StatCard
          label="Today's Check-ins"
          value={stats?.todayCheckIns || 0}
          icon={ClockIcon}
          color="green"
          trend={`of ${stats?.activeEmployees || 0} employees`}
        />
        <StatCard
          label="Currently Working"
          value={stats?.currentlyCheckedIn || 0}
          icon={BriefcaseIcon}
          color="orange"
          trend="in office now"
        />
        <StatCard
          label="This Month"
          value={stats?.monthlyAttendance || 0}
          icon={CalendarIcon}
          color="purple"
          trend="total check-ins"
        />
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Weekly Attendance Chart */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-900">Weekly Attendance Trend</h2>
          </CardHeader>
          <CardBody>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyStats}>
                  <defs>
                    <linearGradient id="colorCheckIns" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6EBD49" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6EBD49" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorCheckOuts" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#288EC2" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#288EC2" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="day" stroke="#9ca3af" fontSize={12} />
                  <YAxis stroke="#9ca3af" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="checkIns"
                    stroke="#6EBD49"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorCheckIns)"
                    name="Check Ins"
                  />
                  <Area
                    type="monotone"
                    dataKey="checkOuts"
                    stroke="#288EC2"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorCheckOuts)"
                    name="Check Outs"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>

        {/* Today's Attendance Pie */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-900">Today's Attendance</h2>
          </CardHeader>
          <CardBody>
            <div className="h-64 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={index === 0 ? '#6EBD49' : '#e5e7eb'}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-4">
              <div className="bg-green-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-green-600">{stats?.todayCheckIns || 0}</p>
                <p className="text-xs text-gray-500">Present</p>
              </div>
              <div className="bg-orange-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-orange-600">{stats?.currentlyCheckedIn || 0}</p>
                <p className="text-xs text-gray-500">Working</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-gray-600">
                  {(stats?.activeEmployees || 0) - (stats?.todayCheckIns || 0)}
                </p>
                <p className="text-xs text-gray-500">Absent</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Department Stats */}
      {departmentStats.length > 0 && (
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-900">Department Overview</h2>
          </CardHeader>
          <CardBody>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={departmentStats} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" stroke="#9ca3af" fontSize={12} />
                  <YAxis
                    dataKey="department"
                    type="category"
                    stroke="#9ca3af"
                    fontSize={12}
                    width={100}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="employees" fill="#288EC2" name="Total" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="present" fill="#6EBD49" name="Present Today" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Pending Attendance Status */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Employees Not Checked In */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="font-semibold text-gray-900">Not Checked In</h2>
              </div>
              <Badge variant="danger">{notCheckedIn.length}</Badge>
            </div>
          </CardHeader>
          <CardBody className="max-h-80 overflow-y-auto p-0">
            {notCheckedIn.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p className="text-sm">All employees have checked in! 🎉</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notCheckedIn.slice(0, 10).map((employee) => (
                  <div key={employee.id} className="px-4 py-3 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-gray-600 font-medium text-sm">
                          {employee.firstName[0]}{employee.lastName[0]}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {employee.firstName} {employee.lastName}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{employee.department || 'No department'}</p>
                      </div>
                      <Badge variant="warning" className="text-xs">Pending</Badge>
                    </div>
                  </div>
                ))}
                {notCheckedIn.length > 10 && (
                  <div className="px-4 py-2 bg-gray-50 text-center">
                    <p className="text-xs text-gray-500">+{notCheckedIn.length - 10} more employees</p>
                  </div>
                )}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Employees Need Check Out */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="font-semibold text-gray-900">Need Check Out</h2>
              </div>
              <Badge variant="info">{needCheckout.length}</Badge>
            </div>
          </CardHeader>
          <CardBody className="max-h-80 overflow-y-auto p-0">
            {needCheckout.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p className="text-sm">No employees currently checked in</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {needCheckout.map((employee) => (
                  <div key={employee.id} className="px-4 py-3 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-green-600 font-medium text-sm">
                          {employee.firstName[0]}{employee.lastName[0]}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {employee.firstName} {employee.lastName}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-xs text-gray-500">{formatTime(employee.checkInTime)}</p>
                          <span className="text-xs text-gray-400">•</span>
                          <p className="text-xs text-gray-500 truncate">{employee.department || 'No dept'}</p>
                        </div>
                      </div>
                      <Badge variant="success" className="text-xs">Working</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-900">Quick Actions</h2>
          </CardHeader>
          <CardBody className="space-y-3">
            <Link
              to="/admin/employees"
              className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-colors group"
            >
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <UsersIcon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">Manage Employees</p>
                <p className="text-sm text-gray-500">Add, edit, or remove team members</p>
              </div>
              <svg className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            <Link
              to="/admin/attendance"
              className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-orange-50 to-amber-50 hover:from-orange-100 hover:to-amber-100 transition-colors group"
            >
              <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <ClipboardIcon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">View Attendance</p>
                <p className="text-sm text-gray-500">See all records with location on map</p>
              </div>
              <svg className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </CardBody>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Recent Activity</h2>
              <Link to="/admin/attendance" className="text-sm text-blue-500 hover:text-blue-600 font-medium">
                View all
              </Link>
            </div>
          </CardHeader>
          <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
            {stats?.recentAttendance?.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No recent activity
              </div>
            ) : (
              stats?.recentAttendance?.map((record) => (
                <div key={record.id} className="px-6 py-3 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
                    {record.user?.firstName?.[0]}{record.user?.lastName?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {record.user?.firstName} {record.user?.lastName}
                    </p>
                    <p className="text-xs text-gray-500">{record.user?.department || 'No department'}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant={record.status === 'CHECKED_IN' ? 'success' : 'secondary'} className="text-xs">
                      {record.status === 'CHECKED_IN' ? 'In' : 'Out'}
                    </Badge>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatTime(record.checkInTime)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color, trend }) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    orange: 'from-orange-500 to-orange-600',
    purple: 'from-purple-500 to-purple-600',
  };

  return (
    <Card className={`bg-gradient-to-br ${colorClasses[color]} text-white overflow-hidden relative`}>
      <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10" />
      <CardBody>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-white/80 text-xs font-medium uppercase tracking-wide">{label}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
            <p className="text-white/60 text-xs mt-1">{trend}</p>
          </div>
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

function UsersIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}

function ClockIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function BriefcaseIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function CalendarIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function ClipboardIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  );
}
