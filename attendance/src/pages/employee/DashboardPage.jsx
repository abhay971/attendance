import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLocation } from '../../hooks/useLocation';
import { attendanceApi } from '../../api/attendance.api';
import { Card, CardBody, CardHeader } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Alert } from '../../components/common/Alert';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { formatTime, formatDate, getTimeDifference } from '../../utils/date';

export function EmployeeDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const { getCurrentLocation, loading: locationLoading, error: locationError } = useLocation();

  const [status, setStatus] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!authLoading && user) {
      loadData();
    }
  }, [authLoading, user]);

  const loadData = async () => {
    try {
      const [statusData, statsData] = await Promise.all([
        attendanceApi.getStatus(),
        attendanceApi.getStats(),
      ]);
      setStatus(statusData);
      setStats(statsData);
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    setError('');
    setSuccess('');
    setActionLoading(true);

    try {
      const coords = await getCurrentLocation();
      await attendanceApi.checkIn(coords.lat, coords.lng);
      setSuccess('Checked in successfully! Have a great day!');
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Check-in failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setError('');
    setSuccess('');
    setActionLoading(true);

    try {
      const coords = await getCurrentLocation();
      await attendanceApi.checkOut(coords.lat, coords.lng);
      setSuccess('Checked out successfully! See you tomorrow!');
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Check-out failed');
    } finally {
      setActionLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const currentTime = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header with greeting */}
      <div className="bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-orange-100 text-sm">Welcome back,</p>
            <h1 className="text-2xl md:text-3xl font-bold mt-1">
              {user?.firstName} {user?.lastName}
            </h1>
            <p className="text-orange-100 mt-2 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
          <div className="mt-4 md:mt-0 text-right">
            <p className="text-orange-100 text-sm">Current Time</p>
            <p className="text-3xl font-bold">{currentTime}</p>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <Alert type="error" message={error} onClose={() => setError('')} />
      )}
      {success && (
        <Alert type="success" message={success} onClose={() => setSuccess('')} />
      )}
      {locationError && (
        <Alert type="warning" message={locationError} />
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Check In/Out Card */}
        <div className="lg:col-span-2">
          <Card className="overflow-hidden">
            <div className={`h-2 ${status?.isCheckedIn ? 'bg-green-400' : status?.hasCompletedToday ? 'bg-blue-400' : 'bg-gray-200'}`} />
            <CardBody className="p-6">
              {status?.hasCompletedToday && !status?.isCheckedIn ? (
                // Completed for today
                <div className="text-center py-8">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">All Done for Today!</h2>
                  <p className="text-gray-500 mb-6">You've completed your attendance. Great work!</p>

                  <div className="bg-gray-50 rounded-xl p-4 max-w-md mx-auto">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Check In</p>
                        <p className="font-semibold text-gray-900">
                          {formatTime(status.todayAttendance?.checkInTime)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Check Out</p>
                        <p className="font-semibold text-gray-900">
                          {formatTime(status.todayAttendance?.checkOutTime)}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-gray-500">Total Hours</p>
                        <p className="font-semibold text-green-600 text-lg">
                          {getTimeDifference(status.todayAttendance?.checkInTime, status.todayAttendance?.checkOutTime)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : status?.isCheckedIn ? (
                // Currently checked in
                <div className="text-center py-4">
                  <Badge variant="success" className="text-sm px-4 py-1.5 mb-4">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse inline-block"></span>
                    Currently Working
                  </Badge>

                  <p className="text-gray-500 text-sm mb-1">You checked in at</p>
                  <p className="text-4xl font-bold text-gray-900 mb-2">
                    {formatTime(status.currentAttendance?.checkInTime)}
                  </p>

                  <div className="bg-blue-50 rounded-lg p-3 mb-6 max-w-md mx-auto">
                    <p className="text-blue-600 text-sm font-medium flex items-center justify-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Working for {getTimeDifference(status.currentAttendance?.checkInTime, new Date())}
                    </p>
                  </div>

                  <div className="text-xs text-gray-400 mb-6 max-w-md mx-auto">
                    <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {status.currentAttendance?.checkInAddress}
                  </div>

                  <Button
                    variant="danger"
                    size="lg"
                    onClick={handleCheckOut}
                    loading={actionLoading || locationLoading}
                    disabled={actionLoading || locationLoading}
                    className="px-12 shadow-lg hover:shadow-xl transition-shadow"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Check Out
                  </Button>
                </div>
              ) : (
                // Not checked in
                <div className="text-center py-8">
                  <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-10 h-10 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Ready to Start?</h2>
                  <p className="text-gray-500 mb-6">Clock in to begin tracking your work hours</p>

                  <Button
                    variant="success"
                    size="lg"
                    onClick={handleCheckIn}
                    loading={actionLoading || locationLoading}
                    disabled={actionLoading || locationLoading}
                    className="px-12 shadow-lg hover:shadow-xl transition-shadow"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    Check In
                  </Button>

                  <p className="text-xs text-gray-400 mt-4">
                    Your location will be recorded for verification
                  </p>
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="space-y-4">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">This Month</p>
                  <p className="text-3xl font-bold">{stats?.monthlyAttendance || 0}</p>
                  <p className="text-blue-100 text-xs">days present</p>
                </div>
                <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Avg. Work Hours</p>
                  <p className="text-3xl font-bold">{stats?.avgWorkHoursThisMonth?.toFixed(1) || '0'}</p>
                  <p className="text-green-100 text-xs">hours per day</p>
                </div>
                <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">This Week</p>
                  <p className="text-3xl font-bold">{stats?.weeklyAttendance || 0}</p>
                  <p className="text-purple-100 text-xs">days present</p>
                </div>
                <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Today's Info Card */}
      {status?.isCheckedIn && status.currentAttendance && (
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
              Today's Check-in Location
            </h3>
          </CardHeader>
          <CardBody>
            <p className="text-gray-600">{status.currentAttendance.checkInAddress}</p>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
