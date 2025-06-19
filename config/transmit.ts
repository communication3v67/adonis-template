import { defineConfig } from '@adonisjs/transmit'

export default defineConfig({
  pingInterval: '30s',
  transport: null, // Pas de Redis pour l'instant, on peut ajouter plus tard
})
