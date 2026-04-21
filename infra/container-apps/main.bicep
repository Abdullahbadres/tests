// Azure Container Apps: environment + backend (Laravel) + frontend (Next.js)
// Azure SQL: server & database Anda sudah ada — isi parameter SQL di bawah.
// Build image backend:  docker build -f Dockerfile.aca -t <acr>/api:v1 --platform linux/amd64 laravel-api-app
// Build image frontend: docker build --build-arg NEXT_PUBLIC_API_URL=https://<api-name>.<defaultDomain> -t <acr>/web:v1 --platform linux/amd64 frontend

@minLength(2)
@maxLength(26)
param namePrefix string

param location string = resourceGroup().location

@description('Full image ref, contoh: myacr.azurecr.io/aisales-api:v1')
param backendImage string

@description('Full image ref, contoh: myacr.azurecr.io/aisales-web:v1')
param frontendImage string

@description('Hostname Azure SQL, contoh: myserver.database.windows.net')
param sqlServerFqdn string

param sqlDatabaseName string
param sqlAdminUsername string

@secure()
param sqlAdminPassword string

@secure()
param appKey string

param openAiApiKey string = ''

@description('ACR login server, kosong jika image publik tanpa auth')
param acrLoginServer string = ''

@description('ACR username (admin user), kosong jika tidak pakai ACR')
param acrUsername string = ''

@secure()
param acrPassword string = ''

var logName = '${namePrefix}-logs'
var envName = '${namePrefix}-cae'
var backendAppName = '${namePrefix}-api'
var frontendAppName = '${namePrefix}-web'

resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
  name: logName
  location: location
  properties: {
    sku: {
      name: 'PerGB2018'
    }
  }
}

resource containerEnv 'Microsoft.App/managedEnvironments@2023-05-01' = {
  name: envName
  location: location
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logAnalytics.properties.customerId
        sharedKey: logAnalytics.listKeys().primarySharedKey
      }
    }
  }
}

var defaultDomain = containerEnv.properties.defaultDomain
var backendHost = '${backendAppName}.${defaultDomain}'
var frontendHost = '${frontendAppName}.${defaultDomain}'
var backendUrl = 'https://${backendHost}'
var frontendUrl = 'https://${frontendHost}'

var hasAcr = !empty(acrLoginServer) && !empty(acrUsername)

var backendSecrets = hasAcr
  ? [
      { name: 'sql-admin-password', value: sqlAdminPassword }
      { name: 'app-key', value: appKey }
      { name: 'acr-password', value: acrPassword }
    ]
  : [
      { name: 'sql-admin-password', value: sqlAdminPassword }
      { name: 'app-key', value: appKey }
    ]

var backendRegistries = hasAcr
  ? [
      {
        server: acrLoginServer
        username: acrUsername
        passwordSecretRef: 'acr-password'
      }
    ]
  : []

var backendEnvOpenAi = !empty(openAiApiKey)
  ? [
      {
        name: 'OPENAI_API_KEY'
        value: openAiApiKey
      }
    ]
  : []

resource backend 'Microsoft.App/containerApps@2023-05-01' = {
  name: backendAppName
  location: location
  properties: {
    managedEnvironmentId: containerEnv.id
    configuration: {
      ingress: {
        external: true
        targetPort: 8080
        transport: 'auto'
        allowInsecure: false
      }
      secrets: backendSecrets
      registries: backendRegistries
    }
    template: {
      containers: [
        {
          name: 'laravel'
          image: backendImage
          resources: {
            cpu: json('0.5')
            memory: '1Gi'
          }
          env: concat(
            [
              { name: 'APP_NAME', value: 'AI Sales Page Generator API' }
              { name: 'APP_ENV', value: 'production' }
              { name: 'APP_DEBUG', value: 'false' }
              { name: 'APP_KEY', secretRef: 'app-key' }
              { name: 'APP_URL', value: backendUrl }
              { name: 'DB_CONNECTION', value: 'sqlsrv' }
              { name: 'DB_HOST', value: sqlServerFqdn }
              { name: 'DB_PORT', value: '1433' }
              { name: 'DB_DATABASE', value: sqlDatabaseName }
              { name: 'DB_USERNAME', value: sqlAdminUsername }
              { name: 'DB_PASSWORD', secretRef: 'sql-admin-password' }
              { name: 'DB_ENCRYPT', value: 'yes' }
              { name: 'DB_TRUST_SERVER_CERTIFICATE', value: 'false' }
              { name: 'LOG_CHANNEL', value: 'stderr' }
              { name: 'SESSION_DRIVER', value: 'cookie' }
              { name: 'CACHE_STORE', value: 'file' }
              { name: 'QUEUE_CONNECTION', value: 'sync' }
              { name: 'FRONTEND_URL', value: frontendUrl }
              { name: 'SANCTUM_STATEFUL_DOMAINS', value: frontendHost }
              { name: 'OPENAI_MODEL', value: 'gpt-4o' }
            ],
            backendEnvOpenAi
          )
        }
      ]
      scale: {
        minReplicas: 0
        maxReplicas: 5
      }
    }
  }
}

resource frontend 'Microsoft.App/containerApps@2023-05-01' = {
  name: frontendAppName
  location: location
  properties: {
    managedEnvironmentId: containerEnv.id
    configuration: {
      ingress: {
        external: true
        targetPort: 3000
        transport: 'auto'
        allowInsecure: false
      }
      secrets: hasAcr
        ? [{ name: 'acr-password', value: acrPassword }]
        : []
      registries: hasAcr
        ? [
            {
              server: acrLoginServer
              username: acrUsername
              passwordSecretRef: 'acr-password'
            }
          ]
        : []
    }
    template: {
      containers: [
        {
          name: 'next'
          image: frontendImage
          resources: {
            cpu: json('0.5')
            memory: '1Gi'
          }
          env: [
            {
              name: 'NEXT_PUBLIC_API_URL'
              value: backendUrl
            }
            {
              name: 'HOSTNAME'
              value: '0.0.0.0'
            }
            {
              name: 'PORT'
              value: '3000'
            }
          ]
        }
      ]
      scale: {
        minReplicas: 0
        maxReplicas: 5
      }
    }
  }
  dependsOn: [
    backend
  ]
}

output containerEnvironmentId string = containerEnv.id
output defaultDomain string = defaultDomain
output backendUrl string = backendUrl
output frontendUrl string = frontendUrl
output backendAppNameOut string = backendAppName
output frontendAppNameOut string = frontendAppName
