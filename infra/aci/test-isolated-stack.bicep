// Stack proyek "test" — terpisah dari PPIS. ACI + PostgreSQL Flexible (managed).
// Set useAcr=true + image ACR + kredensial untuk menarik image privat.

targetScope = 'resourceGroup'

@description('FQDN server PostgreSQL Flexible (isi dari skrip deploy; jangan hardcode nama server di repo publik)')
param managedPostgresFqdn string

param location string = 'southeastasia'

@description('Label DNS ACI (pertahankan saat update)')
param dnsNameLabel string

param backendImage string = 'gcr.io/google-samples/hello-app:1.0'
param frontendImage string = 'docker.io/library/nginx:alpine'

@description('Tarik image dari ACR privat')
param useAcr bool = false

param acrLoginServer string = ''
param acrUsername string = ''

@secure()
param acrPassword string = ''

@secure()
param laravelDbPassword string

@secure()
param laravelAppKey string

var cgName = 'test-fe-be-pg'
var fqdn = '${dnsNameLabel}.${location}.azurecontainer.io'

var registryCreds = useAcr
  ? [
      {
        server: acrLoginServer
        username: acrUsername
        password: acrPassword
      }
    ]
  : []

var backendEnv = [
  { name: 'APP_NAME', value: 'AI Sales Page Generator API' }
  { name: 'APP_ENV', value: 'production' }
  { name: 'APP_DEBUG', value: 'false' }
  { name: 'APP_URL', value: 'http://${fqdn}:8080' }
  { name: 'LOG_CHANNEL', value: 'stderr' }
  { name: 'SESSION_DRIVER', value: 'cookie' }
  { name: 'CACHE_STORE', value: 'file' }
  { name: 'QUEUE_CONNECTION', value: 'sync' }
  { name: 'DB_CONNECTION', value: 'pgsql' }
  { name: 'DB_HOST', value: managedPostgresFqdn }
  { name: 'DB_PORT', value: '5432' }
  { name: 'DB_DATABASE', value: 'laravel' }
  { name: 'DB_USERNAME', value: 'pgadmin' }
  { name: 'DB_SSLMODE', value: 'require' }
  { name: 'FRONTEND_URL', value: 'http://${fqdn}' }
  { name: 'SANCTUM_STATEFUL_DOMAINS', value: fqdn }
  { name: 'APP_KEY', secureValue: laravelAppKey }
  { name: 'DB_PASSWORD', secureValue: laravelDbPassword }
]

var frontendEnv = [
  { name: 'NEXT_PUBLIC_API_URL', value: 'http://${fqdn}:8080' }
]

resource containerGroup 'Microsoft.ContainerInstance/containerGroups@2023-05-01' = {
  name: cgName
  location: location
  properties: {
    sku: 'Standard'
    osType: 'Linux'
    restartPolicy: 'Always'
    imageRegistryCredentials: registryCreds
    ipAddress: {
      type: 'Public'
      dnsNameLabel: dnsNameLabel
      ports: [
        { port: 80, protocol: 'TCP' }
        { port: 8080, protocol: 'TCP' }
      ]
    }
    containers: [
      {
        name: 'test-backend'
        properties: {
          image: backendImage
          resources: {
            requests: {
              cpu: json('1.5')
              memoryInGB: json('2')
            }
          }
          ports: [
            { port: 8080, protocol: 'TCP' }
          ]
          environmentVariables: backendEnv
        }
      }
      {
        name: 'test-frontend'
        properties: {
          image: frontendImage
          resources: {
            requests: {
              cpu: json('1.0')
              memoryInGB: json('1.5')
            }
          }
          ports: [
            { port: 80, protocol: 'TCP' }
          ]
          environmentVariables: frontendEnv
        }
      }
    ]
  }
}

output fqdn string = containerGroup.properties.ipAddress.fqdn
output ip string = containerGroup.properties.ipAddress.ip
output dnsNameLabelOut string = dnsNameLabel
output containerGroupName string = cgName
output laravelDbHost string = managedPostgresFqdn
output laravelDbPort string = '5432'
output laravelDbDatabase string = 'laravel'
output laravelDbUsername string = 'pgadmin'
output hint string = 'Backend :8080, frontend :80. DB = Flexible PostgreSQL (SSL).'
