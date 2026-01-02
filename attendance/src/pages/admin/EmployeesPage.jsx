import { useState, useEffect } from 'react';
import { adminApi } from '../../api/admin.api';
import { Card, CardHeader, CardBody } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Modal } from '../../components/common/Modal';
import { Badge } from '../../components/common/Badge';
import { Alert } from '../../components/common/Alert';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { formatDate } from '../../utils/date';

export function AdminEmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadEmployees();
  }, [page, search]);

  const loadEmployees = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getEmployees({ page, limit: 10, search });
      setEmployees(data.employees);
      setPagination(data.pagination);
    } catch (err) {
      console.error('Failed to load employees:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEmployee = () => {
    setEditingEmployee(null);
    setIsModalOpen(true);
  };

  const handleEditEmployee = (employee) => {
    setEditingEmployee(employee);
    setIsModalOpen(true);
  };

  const handleDeleteEmployee = async (id) => {
    if (!confirm('Are you sure you want to deactivate this employee?\n\nThey will be marked as inactive but their data will be preserved.')) return;

    try {
      await adminApi.deleteEmployee(id);
      setSuccess('Employee deactivated successfully');
      loadEmployees();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to deactivate employee');
    }
  };

  const handlePermanentDelete = async (id) => {
    if (!confirm('⚠️ PERMANENT DELETE ⚠️\n\nAre you ABSOLUTELY SURE you want to permanently delete this employee?\n\nThis will:\n- Delete the employee account\n- Delete ALL their attendance records\n- Delete ALL their data\n\nThis action CANNOT be undone!')) return;

    // Double confirmation for safety
    if (!confirm('Final confirmation: Type YES in your mind and click OK to proceed with PERMANENT deletion.')) return;

    try {
      await adminApi.permanentlyDeleteEmployee(id);
      setSuccess('Employee permanently deleted');
      loadEmployees();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to permanently delete employee');
    }
  };

  const handleFormSubmit = async (formData) => {
    try {
      if (editingEmployee) {
        await adminApi.updateEmployee(editingEmployee.id, formData);
        setSuccess('Employee updated successfully');
      } else {
        await adminApi.createEmployee(formData);
        setSuccess('Employee created successfully');
      }
      setIsModalOpen(false);
      loadEmployees();
    } catch (err) {
      throw err;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
          <p className="text-gray-500 mt-1">Manage your team members</p>
        </div>
        <Button onClick={handleAddEmployee}>
          Add Employee
        </Button>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <Input
              placeholder="Search employees..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="sm:max-w-xs"
            />
            <span className="text-sm text-gray-500">
              {pagination?.total || 0} employees
            </span>
          </div>
        </CardHeader>

        {loading ? (
          <div className="p-8 flex justify-center">
            <LoadingSpinner />
          </div>
        ) : (
          <>
            {/* Mobile view */}
            <div className="sm:hidden divide-y divide-gray-100">
              {employees.map((employee) => (
                <div key={employee.id} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                        <span className="text-orange-600 font-medium text-sm">
                          {employee.firstName[0]}{employee.lastName[0]}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {employee.firstName} {employee.lastName}
                        </p>
                        <p className="text-sm text-gray-500">{employee.email}</p>
                      </div>
                    </div>
                    <Badge variant={employee.isActive ? 'success' : 'danger'}>
                      {employee.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" variant="outline" onClick={() => handleEditEmployee(employee)}>
                      Edit
                    </Button>
                    {employee.isActive && (
                      <Button size="sm" variant="warning" onClick={() => handleDeleteEmployee(employee.id)}>
                        Deactivate
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handlePermanentDelete(employee.id)}
                      title="Permanently delete this employee and all their data"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop view */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-y border-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {employees.map((employee) => (
                    <tr key={employee.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                            <span className="text-orange-600 font-medium text-sm">
                              {employee.firstName[0]}{employee.lastName[0]}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {employee.firstName} {employee.lastName}
                            </p>
                            <p className="text-sm text-gray-500">{employee.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {employee.department || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={employee.role === 'ADMIN' ? 'secondary' : 'default'}>
                          {employee.role}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={employee.isActive ? 'success' : 'danger'}>
                          {employee.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDate(employee.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="ghost" onClick={() => handleEditEmployee(employee)}>
                            Edit
                          </Button>
                          {employee.isActive && (
                            <Button size="sm" variant="warning" onClick={() => handleDeleteEmployee(employee.id)}>
                              Deactivate
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handlePermanentDelete(employee.id)}
                            title="Permanently delete this employee and all their data"
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {employees.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                No employees found
              </div>
            )}
          </>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Page {pagination.page} of {pagination.totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Employee Modal */}
      <EmployeeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        employee={editingEmployee}
        onSubmit={handleFormSubmit}
      />
    </div>
  );
}

function EmployeeModal({ isOpen, onClose, employee, onSubmit }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    department: '',
    position: '',
    role: 'EMPLOYEE',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (employee) {
      setFormData({
        email: employee.email || '',
        password: '',
        firstName: employee.firstName || '',
        lastName: employee.lastName || '',
        phone: employee.phone || '',
        department: employee.department || '',
        position: employee.position || '',
        role: employee.role || 'EMPLOYEE',
      });
    } else {
      setFormData({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        phone: '',
        department: '',
        position: '',
        role: 'EMPLOYEE',
      });
    }
    setError('');
  }, [employee, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = { ...formData };
      if (!data.password) delete data.password;
      if (!data.phone) delete data.phone;
      if (!data.department) delete data.department;
      if (!data.position) delete data.position;

      await onSubmit(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save employee');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={employee ? 'Edit Employee' : 'Add Employee'}
      size="lg"
    >
      {error && <Alert type="error" message={error} className="mb-4" />}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <Input
            label="First Name"
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            required
          />
          <Input
            label="Last Name"
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            required
          />
        </div>

        <Input
          label="Email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />

        <Input
          label={employee ? 'Password (leave blank to keep current)' : 'Password'}
          type="password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          required={!employee}
          minLength={6}
        />

        <div className="grid sm:grid-cols-2 gap-4">
          <Input
            label="Phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
          <Select
            label="Role"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            options={[
              { value: 'EMPLOYEE', label: 'Employee' },
              { value: 'ADMIN', label: 'Admin' },
            ]}
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Input
            label="Department"
            value={formData.department}
            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
          />
          <Input
            label="Position"
            value={formData.position}
            onChange={(e) => setFormData({ ...formData, position: e.target.value })}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            {employee ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
