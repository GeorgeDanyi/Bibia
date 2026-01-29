import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

interface HealthCheckResult {
  status: 'healthy' | 'unhealthy'
  timestamp: string
  checks: {
    staticData: {
      status: 'pass' | 'fail'
      message: string
      path: string
    }
    apiEndpoint: {
      status: 'pass' | 'fail'
      message: string
    }
    dataLoader: {
      status: 'pass' | 'fail'
      message: string
      therapistCount?: number
    }
  }
}

export async function GET() {
  const timestamp = new Date().toISOString()
  const result: HealthCheckResult = {
    status: 'healthy',
    timestamp,
    checks: {
      staticData: { status: 'fail', message: '', path: '' },
      apiEndpoint: { status: 'fail', message: '' },
      dataLoader: { status: 'fail', message: '' }
    }
  }

  // Check 1: Static JSON file exists and is readable
  const publicJsonPath = path.join(process.cwd(), 'public', 'data', 'therapists.json')
  const serverJsonPath = path.join(process.cwd(), 'data', 'therapists.json')
  
  try {
    if (fs.existsSync(publicJsonPath)) {
      const data = fs.readFileSync(publicJsonPath, 'utf-8')
      const therapists = JSON.parse(data)
      if (Array.isArray(therapists) && therapists.length > 0) {
        result.checks.staticData = {
          status: 'pass',
          message: `✅ Static data loaded: ${therapists.length} therapists`,
          path: 'public/data/therapists.json'
        }
      } else {
        result.checks.staticData = {
          status: 'fail',
          message: '❌ Static data file exists but contains no valid therapists',
          path: 'public/data/therapists.json'
        }
      }
    } else if (fs.existsSync(serverJsonPath)) {
      const data = fs.readFileSync(serverJsonPath, 'utf-8')
      const therapists = JSON.parse(data)
      if (Array.isArray(therapists) && therapists.length > 0) {
        result.checks.staticData = {
          status: 'pass',
          message: `✅ Server data loaded: ${therapists.length} therapists`,
          path: 'data/therapists.json'
        }
      } else {
        result.checks.staticData = {
          status: 'fail',
          message: '❌ Server data file exists but contains no valid therapists',
          path: 'data/therapists.json'
        }
      }
    } else {
      result.checks.staticData = {
        status: 'fail',
        message: '❌ No therapist data files found in public/data/ or data/ directories',
        path: 'not found'
      }
    }
  } catch (error) {
    result.checks.staticData = {
      status: 'fail',
      message: `❌ Error reading therapist data: ${error instanceof Error ? error.message : 'Unknown error'}`,
      path: 'error'
    }
  }

  // Check 2: API endpoint is functional
  try {
    const { getTherapists } = await import('@/src/data/therapists')
    const therapists = await getTherapists()
    
    if (Array.isArray(therapists) && therapists.length > 0) {
      result.checks.apiEndpoint = {
        status: 'pass',
        message: `✅ API endpoint functional: ${therapists.length} therapists available`
      }
      result.checks.dataLoader = {
        status: 'pass',
        message: `✅ Data loader working: ${therapists.length} therapists loaded`,
        therapistCount: therapists.length
      }
    } else {
      result.checks.apiEndpoint = {
        status: 'fail',
        message: '❌ API endpoint returns no therapists'
      }
      result.checks.dataLoader = {
        status: 'fail',
        message: '❌ Data loader returns no therapists'
      }
    }
  } catch (error) {
    result.checks.apiEndpoint = {
      status: 'fail',
      message: `❌ API endpoint error: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
    result.checks.dataLoader = {
      status: 'fail',
      message: `❌ Data loader error: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }

  // Determine overall health status
  const allChecksPass = Object.values(result.checks).every(check => check.status === 'pass')
  result.status = allChecksPass ? 'healthy' : 'unhealthy'

  // Return appropriate HTTP status code
  const httpStatus = allChecksPass ? 200 : 503

  return NextResponse.json(result, { status: httpStatus })
}
