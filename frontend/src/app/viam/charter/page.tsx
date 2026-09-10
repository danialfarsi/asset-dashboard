import Link from 'next/link';

export default function CharterIndex() {
  return (
    <div className="container mx-auto p-6 rtl">
      <h1 className="text-2xl font-bold text-gray-800">صفحه منشور</h1>
      <p className="text-gray-600 mt-2">این صفحه تست است</p>
      <Link href="/viam/charter/new">
        <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg">
          رفتن به صفحه جدید
        </button>
      </Link>
    </div>
  );
}
