export function Card({ children, className = '', ...props }) {
  return (
    <div
      className={`bg-white rounded-xl shadow-sm border border-gray-100 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }) {
  return (
    <div className={`px-4 py-3 border-b border-gray-100 sm:px-6 ${className}`}>
      {children}
    </div>
  );
}

export function CardBody({ children, className = '' }) {
  return (
    <div className={`px-4 py-4 sm:px-6 ${className}`}>
      {children}
    </div>
  );
}
