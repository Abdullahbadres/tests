@description('Nama Web App (harus unik global, huruf kecil + angka)')
param appName string

@description('Region Azure')
param location string = resourceGroup().location

@description('SKU App Service Plan (B1 = Basic hemat)')
@allowed(['B1', 'S1', 'P1v2'])
param sku string = 'B1'

var planName = '${appName}-plan'
var skuTier = sku == 'B1' ? 'Basic' : sku == 'S1' ? 'Standard' : 'PremiumV2'

resource hostingPlan 'Microsoft.Web/serverfarms@2023-01-01' = {
  name: planName
  location: location
  sku: {
    name: sku
    tier: skuTier
  }
  kind: 'linux'
  properties: {
    reserved: true
  }
}

resource webApp 'Microsoft.Web/sites@2023-01-01' = {
  name: appName
  location: location
  kind: 'app,linux'
  properties: {
    serverFarmId: hostingPlan.id
    httpsOnly: true
    siteConfig: {
      linuxFxVersion: 'PHP|8.2'
      alwaysOn: sku != 'B1'
      http20Enabled: true
      minTlsVersion: '1.2'
    }
  }
}

output webAppName string = webApp.name
output defaultHostname string = webApp.properties.defaultHostName
output resourceId string = webApp.id
