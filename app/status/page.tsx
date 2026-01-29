import { env } from '@/core/lib/config/env'

export default function StatusPage() {
  const buildInfo = {
    version: env.APP_VERSION,
    environment: env.APP_ENV,
    buildTime: new Date().toISOString(),
    nodeVersion: process.version,
  }

  const featureFlags = Object.entries(env.FEATURES).map(([key, value]) => ({
    name: key,
    enabled: value,
  }))

  const dataHealth = {
    mockData: env.USE_MOCK_DATA,
    dataSource: env.DATA_SOURCE,
    hasApiUrl: !!env.API_BASE_URL,
    hasDatabase: !!env.DATABASE_URL,
  }

  const uxToggles = {
    debugMode: env.DEBUG_MODE,
    statusPage: env.SHOW_STATUS_PAGE,
  }

  const StatusIndicator = ({ status }: { status: boolean }) => (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
      status 
        ? 'bg-green-100 text-green-800' 
        : 'bg-red-100 text-red-800'
    }`}>
      {status ? '✅' : '❌'} {status ? 'OK' : 'FAIL'}
    </span>
  )

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">BIBIA Status Dashboard</h1>
            <p className="text-gray-600 mt-1">System health and configuration overview</p>
          </div>
          
          <div className="p-6 space-y-8">
            {/* Build Information */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Build Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <dt className="text-sm font-medium text-gray-500">Version</dt>
                  <dd className="mt-1 text-sm text-gray-900">{buildInfo.version}</dd>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <dt className="text-sm font-medium text-gray-500">Environment</dt>
                  <dd className="mt-1 text-sm text-gray-900">{buildInfo.environment}</dd>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <dt className="text-sm font-medium text-gray-500">Build Time</dt>
                  <dd className="mt-1 text-sm text-gray-900">{buildInfo.buildTime}</dd>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <dt className="text-sm font-medium text-gray-500">Node Version</dt>
                  <dd className="mt-1 text-sm text-gray-900">{buildInfo.nodeVersion}</dd>
                </div>
              </div>
            </section>

            {/* Feature Flags */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Feature Flags</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {featureFlags.map((flag) => (
                  <div key={flag.name} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">{flag.name}</span>
                      <StatusIndicator status={flag.enabled} />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Data Health */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Data Health</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">Mock Data</span>
                    <StatusIndicator status={dataHealth.mockData} />
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">Data Source</span>
                    <span className="text-sm text-gray-600">{dataHealth.dataSource}</span>
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">API URL</span>
                    <StatusIndicator status={dataHealth.hasApiUrl} />
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">Database</span>
                    <StatusIndicator status={dataHealth.hasDatabase} />
                  </div>
                </div>
              </div>
            </section>

            {/* UX Toggles */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">UX Toggles</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">Debug Mode</span>
                    <StatusIndicator status={uxToggles.debugMode} />
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">Status Page</span>
                    <StatusIndicator status={uxToggles.statusPage} />
                  </div>
                </div>
              </div>
            </section>

            {/* System Status */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">System Status</h2>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className="text-green-400">✅</span>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">All Systems Operational</h3>
                    <p className="text-sm text-green-700 mt-1">
                      Core application is running normally. All essential services are available.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
