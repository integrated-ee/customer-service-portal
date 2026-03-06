import { useUser } from '../../contexts/UserContext';

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useUser();

  if (loading) {
    return <p className="p-6 text-gray-500">Checking permissions...</p>;
  }

  if (!user?.isAdmin) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-red-800 font-semibold">Access Denied</h2>
          <p className="text-red-600 mt-1">You do not have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
