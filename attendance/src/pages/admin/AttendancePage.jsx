import { useState, useEffect } from 'react';
import { adminApi } from '../../api/admin.api';
import { Card, CardHeader, CardBody } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { formatDate, formatTime, getTimeDifference } from '../../utils/date';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default marker icon issue with bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const TABS = {
  ALL: 'all',
  NOT_CHECKED_IN: 'not_checked_in',
  WORKING: 'working',
  COMPLETED: 'completed',
};

export function AdminAttendancePage() {
  const [activeTab, setActiveTab] = useState(TABS.ALL);
  const [selectedEmployee, setSelectedEmployee] = useState('');

  // All attendance records
  const [allAttendance, setAllAttendance] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);

  // Employee lists
  const [employees, setEmployees] = useState([]);
  const [notCheckedIn, setNotCheckedIn] = useState([]);
  const [currentlyWorking, setCurrentlyWorking] = useState([]);
  const [completedToday, setCompletedToday] = useState([]);

  // Individual employee tracking
  const [employeeAttendance, setEmployeeAttendance] = useState(null);

  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (activeTab === TABS.ALL) {
      loadAllAttendance();
    }
  }, [page, filters, activeTab]);

  useEffect(() => {
    if (selectedEmployee) {
      loadEmployeeAttendance();
    }
  }, [selectedEmployee, filters]);

  const loadData = async () => {
    setLoading(true);
    try {
      console.log('🔄 Starting data load...');

      // Load employees
      console.log('📋 Fetching employees...');
      const employeesData = await adminApi.getEmployees({ limit: 1000, role: 'EMPLOYEE' });
      console.log('✅ Employees response:', employeesData);

      // Load not checked in
      console.log('🔴 Fetching not checked in...');
      const notCheckedInData = await adminApi.getEmployeesNotCheckedIn();
      console.log('✅ Not checked in response:', notCheckedInData);

      // Load currently working
      console.log('🔵 Fetching currently working...');
      const workingData = await adminApi.getEmployeesNeedingCheckOut();
      console.log('✅ Currently working response:', workingData);

      setEmployees(employeesData.employees || []);
      setNotCheckedIn(Array.isArray(notCheckedInData) ? notCheckedInData : []);
      setCurrentlyWorking(Array.isArray(workingData) ? workingData : []);

      console.log('📊 State updated:');
      console.log('  - Employees count:', employeesData.employees?.length || 0);
      console.log('  - Not checked in count:', Array.isArray(notCheckedInData) ? notCheckedInData.length : 0);
      console.log('  - Currently working count:', Array.isArray(workingData) ? workingData.length : 0);

      // Get completed today
      const today = new Date().toISOString().split('T')[0];
      console.log('🟢 Fetching completed today for date:', today);
      const completedData = await adminApi.getAllAttendance({
        startDate: today,
        endDate: today,
        status: 'CHECKED_OUT',
        limit: 1000,
      });
      console.log('✅ Completed today response:', completedData);

      setCompletedToday(completedData.attendance || []);

      // Load all attendance
      await loadAllAttendance();

      console.log('✅ Data load complete!');
    } catch (err) {
      console.error('❌ Failed to load data:', err);
      console.error('Error details:', err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadAllAttendance = async () => {
    try {
      const params = { page, limit: 20 };
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const data = await adminApi.getAllAttendance(params);
      setAllAttendance(data.attendance);
      setPagination(data.pagination);
    } catch (err) {
      console.error('Failed to load attendance:', err);
    }
  };

  const loadEmployeeAttendance = async () => {
    try {
      const params = {};
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const data = await adminApi.getEmployeeAttendance(selectedEmployee, params);
      setEmployeeAttendance(data);
    } catch (err) {
      console.error('Failed to load employee attendance:', err);
      setEmployeeAttendance(null);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSelectedEmployee('');
    setEmployeeAttendance(null);
  };

  const handleEmployeeSelect = (employeeId) => {
    setSelectedEmployee(employeeId);
    if (employeeId) {
      setActiveTab(TABS.ALL);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-600 rounded-2xl p-4 sm:p-6 text-white shadow-lg">
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Employee Attendance Tracking</h1>
            <p className="text-orange-100 mt-1 text-sm sm:text-base">
              Track and manage employee attendance across all categories
            </p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4">
              <p className="text-white/80 text-xs font-medium uppercase tracking-wide">Total Employees</p>
              <p className="text-2xl sm:text-3xl font-bold mt-1">{employees.length}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4">
              <p className="text-white/80 text-xs font-medium uppercase tracking-wide">Not Checked In</p>
              <p className="text-2xl sm:text-3xl font-bold mt-1 text-red-200">{notCheckedIn.length}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4">
              <p className="text-white/80 text-xs font-medium uppercase tracking-wide">Working Now</p>
              <p className="text-2xl sm:text-3xl font-bold mt-1 text-blue-200">{currentlyWorking.length}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4">
              <p className="text-white/80 text-xs font-medium uppercase tracking-wide">Completed Today</p>
              <p className="text-2xl sm:text-3xl font-bold mt-1 text-green-200">{completedToday.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Employee Selector & Filters */}
      <Card>
        <CardBody>
          <div className="grid sm:grid-cols-3 gap-4">
            <Select
              label="Track Individual Employee"
              value={selectedEmployee}
              onChange={(e) => handleEmployeeSelect(e.target.value)}
              options={[
                { value: '', label: 'All Employees' },
                ...employees.map((emp) => ({
                  value: emp.id,
                  label: `${emp.firstName} ${emp.lastName} - ${emp.department || 'No Dept'}`
                }))
              ]}
            />
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
        </CardBody>
      </Card>

      {/* Individual Employee View */}
      {selectedEmployee && employeeAttendance && (
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {employeeAttendance.employee.firstName} {employeeAttendance.employee.lastName}
                </h2>
                <p className="text-sm text-gray-500">
                  {employeeAttendance.employee.email} • {employeeAttendance.employee.department || 'No Department'}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <div className="bg-blue-50 rounded-lg px-4 py-2 text-center">
                  <p className="text-xs text-blue-600 font-medium">This Month</p>
                  <p className="text-xl font-bold text-blue-700">{employeeAttendance.stats.monthlyAttendance}</p>
                </div>
                <div className="bg-green-50 rounded-lg px-4 py-2 text-center">
                  <p className="text-xs text-green-600 font-medium">Avg Hours</p>
                  <p className="text-xl font-bold text-green-700">{employeeAttendance.stats.avgWorkHoursThisMonth.toFixed(1)}</p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardBody className="p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check In</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check Out</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {employeeAttendance.attendance.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedRecord({ ...record, user: employeeAttendance.employee })}>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{formatDate(record.checkInTime)}</div>
                      </td>
                      <td className="px-3 sm:px-6 py-4">
                        <div className="text-sm text-gray-900">{formatTime(record.checkInTime)}</div>
                        <div className="text-xs text-gray-500 max-w-xs truncate">{record.checkInAddress}</div>
                      </td>
                      <td className="px-3 sm:px-6 py-4">
                        {record.checkOutTime ? (
                          <>
                            <div className="text-sm text-gray-900">{formatTime(record.checkOutTime)}</div>
                            <div className="text-xs text-gray-500 max-w-xs truncate">{record.checkOutAddress}</div>
                          </>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {record.checkOutTime ? getTimeDifference(record.checkInTime, record.checkOutTime) : '-'}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                        <Badge variant={record.status === 'CHECKED_OUT' ? 'success' : 'info'}>
                          {record.status === 'CHECKED_OUT' ? 'Completed' : 'Working'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {employeeAttendance.attendance.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                <p>No attendance records found for this employee</p>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* Category Tabs (only show when no individual employee selected) */}
      {!selectedEmployee && (
        <>
          <div className="border-b border-gray-200 overflow-x-auto">
            <nav className="flex space-x-4 sm:space-x-8 px-1" aria-label="Tabs">
              <TabButton
                active={activeTab === TABS.ALL}
                onClick={() => handleTabChange(TABS.ALL)}
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                }
                label="All Records"
                count={pagination?.total}
              />
              <TabButton
                active={activeTab === TABS.NOT_CHECKED_IN}
                onClick={() => handleTabChange(TABS.NOT_CHECKED_IN)}
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
                label="Not Checked In"
                count={notCheckedIn.length}
                variant="danger"
              />
              <TabButton
                active={activeTab === TABS.WORKING}
                onClick={() => handleTabChange(TABS.WORKING)}
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
                label="Currently Working"
                count={currentlyWorking.length}
                variant="info"
              />
              <TabButton
                active={activeTab === TABS.COMPLETED}
                onClick={() => handleTabChange(TABS.COMPLETED)}
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                }
                label="Completed Today"
                count={completedToday.length}
                variant="success"
              />
            </nav>
          </div>

          {/* Tab Content */}
          <Card>
            <CardBody className="p-0">
              {activeTab === TABS.ALL && (
                <AllRecordsView
                  attendance={allAttendance}
                  pagination={pagination}
                  page={page}
                  setPage={setPage}
                  onRecordClick={setSelectedRecord}
                />
              )}
              {activeTab === TABS.NOT_CHECKED_IN && (
                <NotCheckedInView employees={notCheckedIn} />
              )}
              {activeTab === TABS.WORKING && (
                <CurrentlyWorkingView employees={currentlyWorking} />
              )}
              {activeTab === TABS.COMPLETED && (
                <CompletedTodayView attendance={completedToday} onRecordClick={setSelectedRecord} />
              )}
            </CardBody>
          </Card>
        </>
      )}

      {/* Attendance Detail Modal */}
      {selectedRecord && (
        <AttendanceDetailModal record={selectedRecord} onClose={() => setSelectedRecord(null)} />
      )}
    </div>
  );
}

// Tab Button Component
function TabButton({ active, onClick, icon, label, count, variant }) {
  const baseClasses = "flex items-center gap-2 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors";
  const activeClasses = active
    ? "border-orange-500 text-orange-600"
    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300";

  return (
    <button onClick={onClick} className={`${baseClasses} ${activeClasses}`}>
      {icon}
      <span className="hidden sm:inline">{label}</span>
      <span className="sm:hidden">{label.split(' ')[0]}</span>
      {count !== undefined && (
        <Badge
          variant={active ? (variant || 'default') : 'secondary'}
          className="ml-1"
        >
          {count}
        </Badge>
      )}
    </button>
  );
}

// All Records View
function AllRecordsView({ attendance, pagination, page, setPage, onRecordClick }) {
  if (!attendance || attendance.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p>No attendance records found</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check In</th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check Out</th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {attendance.map((record) => (
              <tr key={record.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => onRecordClick(record)}>
                <td className="px-3 sm:px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-orange-600 font-medium text-sm">
                        {record.user.firstName[0]}{record.user.lastName[0]}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {record.user.firstName} {record.user.lastName}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{record.user.department || 'No Dept'}</p>
                    </div>
                  </div>
                </td>
                <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatDate(record.checkInTime)}
                </td>
                <td className="px-3 sm:px-6 py-4">
                  <div className="text-sm text-gray-900">{formatTime(record.checkInTime)}</div>
                  <div className="text-xs text-gray-500 max-w-xs truncate">{record.checkInAddress}</div>
                </td>
                <td className="px-3 sm:px-6 py-4">
                  {record.checkOutTime ? (
                    <>
                      <div className="text-sm text-gray-900">{formatTime(record.checkOutTime)}</div>
                      <div className="text-xs text-gray-500 max-w-xs truncate">{record.checkOutAddress}</div>
                    </>
                  ) : (
                    <span className="text-sm text-gray-400">-</span>
                  )}
                </td>
                <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {record.checkOutTime ? getTimeDifference(record.checkInTime, record.checkOutTime) : '-'}
                </td>
                <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                  <Badge variant={record.status === 'CHECKED_OUT' ? 'success' : 'info'}>
                    {record.status === 'CHECKED_OUT' ? 'Completed' : 'Working'}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <p className="text-sm text-gray-700">
            Showing <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> to{' '}
            <span className="font-medium">
              {Math.min(pagination.page * pagination.limit, pagination.total)}
            </span>{' '}
            of <span className="font-medium">{pagination.total}</span> results
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage(page + 1)}
              disabled={page >= pagination.totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

// Not Checked In View
function NotCheckedInView({ employees }) {
  if (!employees || employees.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        <svg className="w-16 h-16 mx-auto text-green-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <p className="text-lg font-medium text-gray-900">All employees have checked in!</p>
        <p className="text-sm text-gray-500 mt-1">Everyone is accounted for today 🎉</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {employees.map((employee) => (
        <div key={employee.id} className="px-4 sm:px-6 py-4 hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-red-600 font-medium">
                {employee.firstName[0]}{employee.lastName[0]}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">
                {employee.firstName} {employee.lastName}
              </p>
              <p className="text-sm text-gray-500">{employee.email}</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {employee.department && (
                  <Badge variant="secondary" className="text-xs">{employee.department}</Badge>
                )}
                {employee.position && (
                  <Badge variant="secondary" className="text-xs">{employee.position}</Badge>
                )}
              </div>
            </div>
            <Badge variant="danger">Not Checked In</Badge>
          </div>
        </div>
      ))}
    </div>
  );
}

// Currently Working View
function CurrentlyWorkingView({ employees }) {
  if (!employees || employees.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p>No employees currently checked in</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {employees.map((employee) => (
        <div key={employee.id} className="px-4 sm:px-6 py-4 hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-blue-600 font-medium">
                {employee.firstName[0]}{employee.lastName[0]}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">
                {employee.firstName} {employee.lastName}
              </p>
              <p className="text-xs text-gray-500">{employee.email}</p>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <div className="flex items-center gap-1 text-xs text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Checked in at {formatTime(employee.checkInTime)}
                </div>
                {employee.department && (
                  <>
                    <span className="text-xs text-gray-400">•</span>
                    <Badge variant="secondary" className="text-xs">{employee.department}</Badge>
                  </>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-1 truncate">{employee.checkInAddress}</p>
            </div>
            <Badge variant="info">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-1.5 animate-pulse inline-block"></span>
              Working
            </Badge>
          </div>
        </div>
      ))}
    </div>
  );
}

// Completed Today View
function CompletedTodayView({ attendance, onRecordClick }) {
  if (!attendance || attendance.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p>No completed attendance records for today</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {attendance.map((record) => (
        <div
          key={record.id}
          className="px-4 sm:px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer"
          onClick={() => onRecordClick(record)}
        >
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-green-600 font-medium">
                {record.user.firstName[0]}{record.user.lastName[0]}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">
                {record.user.firstName} {record.user.lastName}
              </p>
              <p className="text-xs text-gray-500">{record.user.department || 'No Department'}</p>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div className="bg-gray-50 rounded-lg p-2">
                  <p className="text-xs text-gray-500">Check In</p>
                  <p className="text-sm font-medium text-gray-900">{formatTime(record.checkInTime)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-2">
                  <p className="text-xs text-gray-500">Check Out</p>
                  <p className="text-sm font-medium text-gray-900">{formatTime(record.checkOutTime)}</p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <Badge variant="success" className="mb-2">Completed</Badge>
              <p className="text-sm font-semibold text-green-600">
                {getTimeDifference(record.checkInTime, record.checkOutTime)}
              </p>
              <p className="text-xs text-gray-500">Total Hours</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Attendance Detail Modal
function AttendanceDetailModal({ record, onClose }) {
  const checkInIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  const checkOutIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  const hasCheckOut = record.checkOutLat && record.checkOutLng;
  const center = hasCheckOut
    ? [(record.checkInLat + record.checkOutLat) / 2, (record.checkInLng + record.checkOutLng) / 2]
    : [record.checkInLat, record.checkInLng];
  const zoom = hasCheckOut ? 14 : 15;

  return (
    <Modal isOpen={true} onClose={onClose} title="Attendance Details" size="lg">
      <div className="space-y-4">
        {/* Employee Info */}
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
              <span className="text-white font-medium">
                {record.user.firstName[0]}{record.user.lastName[0]}
              </span>
            </div>
            <div>
              <p className="font-semibold text-gray-900">
                {record.user.firstName} {record.user.lastName}
              </p>
              <p className="text-sm text-gray-600">{record.user.email}</p>
              {record.user.department && (
                <Badge variant="secondary" className="mt-1">{record.user.department}</Badge>
              )}
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="h-64 rounded-xl overflow-hidden border-2 border-gray-200">
          <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={[record.checkInLat, record.checkInLng]} icon={checkInIcon}>
              <Popup>
                <div className="p-1">
                  <p className="font-semibold text-green-700">Check In</p>
                  <p className="text-sm">{formatTime(record.checkInTime)}</p>
                  <p className="text-xs text-gray-600 mt-1">{record.checkInAddress}</p>
                </div>
              </Popup>
            </Marker>
            {hasCheckOut && (
              <Marker position={[record.checkOutLat, record.checkOutLng]} icon={checkOutIcon}>
                <Popup>
                  <div className="p-1">
                    <p className="font-semibold text-blue-700">Check Out</p>
                    <p className="text-sm">{formatTime(record.checkOutTime)}</p>
                    <p className="text-xs text-gray-600 mt-1">{record.checkOutAddress}</p>
                  </div>
                </Popup>
              </Marker>
            )}
          </MapContainer>
        </div>

        {/* Map Legend */}
        <div className="flex items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-gray-600">Check In Location</span>
          </div>
          {hasCheckOut && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-gray-600">Check Out Location</span>
            </div>
          )}
        </div>

        {/* Time Details */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              <p className="font-medium text-green-900">Check-in Details</p>
            </div>
            <p className="text-sm text-gray-600">Date</p>
            <p className="font-semibold text-gray-900">{formatDate(record.checkInTime)}</p>
            <p className="text-sm text-gray-600 mt-2">Time</p>
            <p className="font-semibold text-gray-900">{formatTime(record.checkInTime)}</p>
            <p className="text-sm text-gray-600 mt-2">Location</p>
            <p className="text-sm text-gray-700">{record.checkInAddress}</p>
          </div>

          {hasCheckOut ? (
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <p className="font-medium text-blue-900">Check-out Details</p>
              </div>
              <p className="text-sm text-gray-600">Date</p>
              <p className="font-semibold text-gray-900">{formatDate(record.checkOutTime)}</p>
              <p className="text-sm text-gray-600 mt-2">Time</p>
              <p className="font-semibold text-gray-900">{formatTime(record.checkOutTime)}</p>
              <p className="text-sm text-gray-600 mt-2">Location</p>
              <p className="text-sm text-gray-700">{record.checkOutAddress}</p>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-center">
              <div className="text-center">
                <Badge variant="info" className="mb-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-1.5 animate-pulse inline-block"></span>
                  Currently Working
                </Badge>
                <p className="text-sm text-gray-500">Employee has not checked out yet</p>
              </div>
            </div>
          )}
        </div>

        {/* Duration */}
        {hasCheckOut && (
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-600">Total Work Duration</p>
            <p className="text-3xl font-bold text-purple-700 mt-1">
              {getTimeDifference(record.checkInTime, record.checkOutTime)}
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}
