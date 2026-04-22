// Container Apps stack for RG `test` only (new managed environment in this resource group).
// Assumes PostgreSQL Flexible and ACR already exist (same as ACI stack).
// Backend: Laravel + pgsql. Frontend: Next standalone (PORT 3000).

targetScope = 'resourceGroup'

@minLength(2)
@maxLength(12)
param namePrefix string = 'testca'

param location string = resourceGroup().location

@description('Existing PostgreSQL Flexible FQDN (no port)')
param managedPostgresFqdn string

@description('Full backend image ref, e.g. myacr.azurecr.io/test-api:v1')
param backendImage string

@description('Full frontend image ref — rebuild with NEXT_PUBLIC_API_URL after first deploy for correct client bundle')
param frontendImage string

@description('Pull images from private ACR')
param useAcr bool = true

param acrLoginServer string = ''
param acrUsername string = ''

@secure()
param acrPassword string = ''

@secure()
param laravelDbPassword string

@secure()
param laravelAppKey string

var logName = '${namePrefix}-aca-law'
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

var hasAcr = useAcr && !empty(acrLoginServer) && !empty(acrUsername)

var backendSecrets = hasAcr
  ? [
      { name: 'db-password', value: laravelDbPassword }
      { name: 'app-key', value: laravelAppKey }
      { name: 'acr-password', value: acrPassword }
    ]
  : [
      { name: 'db-password', value: laravelDbPassword }
      { name: 'app-key', value: laravelAppKey }
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
            cpu: json('0.75')
            memory: '1.5Gi'
          }
          env: [
            { name: 'APP_NAME', value: 'AI Sales Page Generator API' }
            { name: 'APP_ENV', value: 'production' }
            { name: 'APP_DEBUG', value: 'false' }
            { name: 'APP_KEY', secretRef: 'app-key' }
            { name: 'APP_URL', value: backendUrl }
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
            { name: 'DB_PASSWORD', secretRef: 'db-password' }
            { name: 'FRONTEND_URL', value: frontendUrl }
            { name: 'SANCTUM_STATEFUL_DOMAINS', value: frontendHost }
          ]
        }
      ]
      scale: {
        minReplicas: 1
        maxReplicas: 5
      }
    }
  }
}

var frontendSecrets = hasAcr ? [{ name: 'acr-password', value: acrPassword }] : []

var frontendRegistries = hasAcr
  ? [
      {
        server: acrLoginServer
        username: acrUsername
        passwordSecretRef: 'acr-password'
      }
    ]
  : []

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
      }
      secrets: frontendSecrets
      registries: frontendRegistries
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
            { name: 'NEXT_PUBLIC_API_URL', value: backendUrl }
            { name: 'HOSTNAME', value: '0.0.0.0' }
            { name: 'PORT', value: '3000' }
          ]
        }
      ]
      scale: {
        minReplicas: 1
        maxReplicas: 5
      }
    }
  }
  dependsOn: [
    backend
  ]
}

output containerEnvironmentName string = containerEnv.name
output defaultDomain string = defaultDomain
output backendUrl string = backendUrl
output frontendUrl string = frontendUrl
output backendAppNameOut string = backendAppName
output frontendAppNameOut string = frontendAppName
