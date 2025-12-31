import { useState, useEffect } from 'react';
import { attendanceApi } from '../../api/attendance.api';
import { Card, CardHeader, CardBody } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { formatDate, formatTime, getTimeDifference } from '../../utils/date';

export function EmployeeHistoryPage() {
  const [attendance, setAttendance] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    loadData();
  }, [page, filters]);

  const loadData = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const [historyData, statsData] = await Promise.all([
        attendanceApi.getHistory(params),
        attendanceApi.getStats(),
      ]);
      setAttendance(historyData.attendance);
      setPagination(historyData.pagination);
      setStats(statsData);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && page === 1 && !attendance.length) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Attendance History</h1>
            <p className="text-orange-100 mt-1">View your past check-ins and check-outs</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
              <p className="text-orange-100 text-xs uppercase tracking-wide">Total Records</p>
              <p className="text-2xl font-bold">{stats?.totalRecords || 0}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
              <p className="text-orange-100 text-xs uppercase tracking-wide">Avg Hours</p>
              <p className="text-2xl font-bold">{stats?.avgWorkHoursThisMonth?.toFixed(1) || '0'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <QuickStatCard
          label="This Month"
          value={stats?.monthlyAttendance || 0}
          icon={CalendarIcon}
          color="blue"
        />
        <QuickStatCard
          label="This Week"
          value={stats?.weeklyAttendance || 0}
          icon={ClockIcon}
          color="green"
        />
        <QuickStatCard
          label="Total Days"
          value={stats?.totalRecords || 0}
          icon={ClipboardIcon}
          color="orange"
        />
        <QuickStatCard
          label="Today"
          value={stats?.todayCheckedIn ? 'Checked In' : 'Not Yet'}
          icon={CheckIcon}
          color={stats?.todayCheckedIn ? 'green' : 'gray'}
          small
        />
      </div>

      {/* Filters */}
      <Card>
        <CardBody>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                type="date"
                label="Start Date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              />
              <Input
                type="date"
                label="End Date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              />
            </div>
            <Button
              variant="ghost"
              onClick={() => {
                setFilters({ startDate: '', endDate: '' });
                setPage(1);
              }}
              className="w-full sm:w-auto"
            >
              Clear Filters
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* History List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Attendance Records
            </h2>
            <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              {pagination?.total || 0} records
            </span>
          </div>
        </CardHeader>

        <div className="divide-y divide-gray-100">
          {attendance.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-gray-500 font-medium">No attendance records found</p>
              <p className="text-gray-400 text-sm mt-1">Start checking in to see your history here</p>
            </div>
          ) : (
            attendance.map((record, index) => (
              <AttendanceRow key={record.id} record={record} index={index} />
            ))
          )}
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50">
            <p className="text-sm text-gray-500">
              Showing {((page - 1) * 10) + 1} - {Math.min(page * 10, pagination.total)} of {pagination.total}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

function AttendanceRow({ record, index }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="hover:bg-gray-50 transition-colors">
      <div
        className="px-4 py-4 sm:px-6 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-4">
          {/* Date icon */}
          <div className="hidden sm:flex w-14 h-14 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl items-center justify-center flex-shrink-0">
            <div className="text-center">
              <p className="text-xs text-orange-600 font-medium">
                {new Date(record.checkInTime).toLocaleDateString('en-US', { month: 'short' })}
              </p>
              <p className="text-lg font-bold text-gray-900">
                {new Date(record.checkInTime).getDate()}
              </p>
            </div>
          </div>

          {/* Main Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="font-semibold text-gray-900">{formatDate(record.checkInTime)}</p>
              <Badge variant={record.status === 'CHECKED_OUT' ? 'success' : 'warning'} className="text-xs">
                {record.status === 'CHECKED_OUT' ? 'Completed' : 'In Progress'}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14" />
                </svg>
                {formatTime(record.checkInTime)}
              </span>
              {record.checkOutTime && (
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7" />
                  </svg>
                  {formatTime(record.checkOutTime)}
                </span>
              )}
            </div>
          </div>

          {/* Duration */}
          {record.status === 'CHECKED_OUT' && record.checkOutTime && (
            <div className="hidden md:block text-right">
              <p className="text-lg font-bold text-green-600">
                {getTimeDifference(record.checkInTime, record.checkOutTime)}
              </p>
              <p className="text-xs text-gray-400">duration</p>
            </div>
          )}

          {/* Expand arrow */}
          <div className="flex-shrink-0">
            <svg
              className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="px-4 pb-4 sm:px-6 sm:pb-6">
          <div className="bg-gray-50 rounded-xl p-4 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              {/* Check In */}
              <div className="bg-white rounded-lg p-4 border border-gray-100">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14" />
                    </svg>
                  </div>
                  <span className="font-medium text-green-700">Check In</span>
                </div>
                <p className="text-lg font-bold text-gray-900 mb-1">{formatTime(record.checkInTime)}</p>
                <p className="text-sm text-gray-600">{record.checkInAddress}</p>
              </div>

              {/* Check Out */}
              <div className={`bg-white rounded-lg p-4 border ${record.checkOutTime ? 'border-gray-100' : 'border-dashed border-gray-200'}`}>
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${record.checkOutTime ? 'bg-blue-100' : 'bg-gray-100'}`}>
                    <svg className={`w-4 h-4 ${record.checkOutTime ? 'text-blue-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7" />
                    </svg>
                  </div>
                  <span className={`font-medium ${record.checkOutTime ? 'text-blue-700' : 'text-gray-400'}`}>Check Out</span>
                </div>
                {record.checkOutTime ? (
                  <>
                    <p className="text-lg font-bold text-gray-900 mb-1">{formatTime(record.checkOutTime)}</p>
                    <p className="text-sm text-gray-600">{record.checkOutAddress}</p>
                  </>
                ) : (
                  <p className="text-gray-400">Not checked out yet</p>
                )}
              </div>
            </div>

            {/* Duration bar */}
            {record.checkOutTime && (
              <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white text-center">
                <p className="text-sm text-white/80">Total Working Hours</p>
                <p className="text-2xl font-bold">{getTimeDifference(record.checkInTime, record.checkOutTime)}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function QuickStatCard({ label, value, icon: Icon, color, small }) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
    gray: 'bg-gray-50 text-gray-600',
  };

  return (
    <Card>
      <CardBody className="p-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <p className={`font-bold text-gray-900 ${small ? 'text-sm' : 'text-xl'}`}>{value}</p>
            <p className="text-xs text-gray-500">{label}</p>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

function CalendarIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
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

function ClipboardIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  );
}

function CheckIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}
