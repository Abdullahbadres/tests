targetScope = 'resourceGroup'

@minLength(5)
@maxLength(50)
param acrName string

@secure()
param postgresAdminPassword string

@description('Nama server PostgreSQL harus unik global (bukan hanya di RG)')
param postgresServerName string = 'test-postgre'

param location string = resourceGroup().location

@description('Lokasi PostgreSQL (subscription Anda diblokir eastus untuk Postgres — pakai southeastasia)')
param postgresLocation string = 'southeastasia'

resource acr 'Microsoft.ContainerRegistry/registries@2023-07-01' = {
  name: acrName
  location: location
  sku: {
    name: 'Basic'
  }
  properties: {
    adminUserEnabled: true
  }
}

resource postgres 'Microsoft.DBforPostgreSQL/flexibleServers@2022-12-01' = {
  name: postgresServerName
  location: postgresLocation
  sku: {
    name: 'Standard_B1ms'
    tier: 'Burstable'
  }
  properties: {
    version: '15'
    administratorLogin: 'pgadmin'
    administratorLoginPassword: postgresAdminPassword
    storage: {
      storageSizeGB: 32
    }
    backup: {
      backupRetentionDays: 7
      geoRedundantBackup: 'Disabled'
    }
    highAvailability: {
      mode: 'Disabled'
    }
  }
}

resource laravelDb 'Microsoft.DBforPostgreSQL/flexibleServers/databases@2022-12-01' = {
  parent: postgres
  name: 'laravel'
  properties: {
    charset: 'UTF8'
    collation: 'en_US.utf8'
  }
}

resource pgFirewall 'Microsoft.DBforPostgreSQL/flexibleServers/firewallRules@2022-12-01' = {
  parent: postgres
  name: 'allow-all-temp'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '255.255.255.255'
  }
}

output acrLoginServer string = acr.properties.loginServer
output acrName string = acr.name
output postgresFqdn string = postgres.properties.fullyQualifiedDomainName
