export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold mb-2">Logging you in...</h2>
        <p className="text-gray-600">Please wait while we verify your magic link</p>
      </div>
    </div>
  );
}