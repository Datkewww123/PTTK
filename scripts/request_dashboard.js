const url = 'http://localhost:3000/api/store/dashboard'
const devUser = process.argv[2]
if (!devUser) {
  console.error('Usage: node scripts/request_dashboard.js <userId>')
  process.exit(1)
}

;(async ()=>{
  try {
    const resp = await fetch(url, { headers: { 'x-dev-userid': devUser } })
    const body = await resp.text()
    console.log('status', resp.status)
    console.log('body', body)
  } catch (e) {
    console.error('ERROR', e.message)
    process.exit(1)
  }
})()
