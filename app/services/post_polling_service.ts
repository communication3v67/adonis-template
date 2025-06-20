import SSEController from '#controllers/sse_controller'
import GmbPost from '#models/gmbPost'

/**
 * Service de polling pour détecter les changements en base de données
 */
export class PostPollingService {
    private static instance: PostPollingService
    private intervalId: NodeJS.Timeout | null = null
    private lastCheck: Map<number, { updatedAt: string; hash: string; postData?: any }> = new Map()
    private isRunning = false

    static getInstance(): PostPollingService {
        if (!PostPollingService.instance) {
            PostPollingService.instance = new PostPollingService()
        }
        return PostPollingService.instance
    }

    /**
     * Démarre le polling
     */
    start(intervalMs: number = 30000) {
        // 30 secondes par défaut
        if (this.isRunning) {
            console.log('📊 Polling déjà en cours')
            return
        }

        console.log(`📊 Démarrage du polling des posts GMB (${intervalMs}ms)`)
        this.isRunning = true

        this.intervalId = setInterval(async () => {
            await this.checkForChanges()
        }, intervalMs)

        // Premier check immédiat
        this.checkForChanges()
    }

    /**
     * Arrête le polling
     */
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId)
            this.intervalId = null
            this.isRunning = false
            console.log('📊 Polling arrêté')
        }
    }

    /**
     * Vérifie les changements en base
     */
    private async checkForChanges() {
        try {
            console.log('🔍 Vérification des changements en base...')

            // Récupérer tous les posts avec TOUTES les colonnes
            const posts = await GmbPost.query()
                .select('*') // Sélectionner toutes les colonnes
                .orderBy('updated_at', 'desc')

            for (const post of posts) {
                const postId = post.id
                const currentHash = this.generatePostHash(post)
                const currentUpdatedAt = post.updatedAt.toISO()

                const lastKnown = this.lastCheck.get(postId)

                if (!lastKnown) {
                    // Premier check pour ce post
                    this.lastCheck.set(postId, {
                        updatedAt: currentUpdatedAt,
                        hash: currentHash,
                        postData: post.serialize ? post.serialize() : post, // Sauvegarder les données
                    })
                    continue
                }

                // Vérifier si le post a été modifié
                if (lastKnown.updatedAt !== currentUpdatedAt || lastKnown.hash !== currentHash) {
                    console.log(`🔄 Changement détecté pour le post ${postId}`)
                    
                    // Debug: afficher les changements détaillés
                    if (lastKnown.hash !== currentHash) {
                        console.log('  🔍 Changement de contenu détecté (hash différent)')
                        
                        // Détecter quelles colonnes ont changé
                        if (lastKnown.postData) {
                            const changedFields = this.getChangedFields(lastKnown.postData, post.serialize ? post.serialize() : post)
                            if (changedFields.length > 0) {
                                console.log('  📝 Colonnes modifiées:', changedFields.join(', '))
                            }
                        }
                        
                        console.log('  - Ancien hash:', lastKnown.hash.substring(0, 20) + '...')
                        console.log('  - Nouveau hash:', currentHash.substring(0, 20) + '...')
                    }
                    
                    if (lastKnown.updatedAt !== currentUpdatedAt) {
                        console.log('  🕰️ Changement de timestamp détecté')
                        console.log('  - Ancien updated_at:', lastKnown.updatedAt)
                        console.log('  - Nouveau updated_at:', currentUpdatedAt)
                    }

                    // Mettre à jour notre cache
                    this.lastCheck.set(postId, {
                        updatedAt: currentUpdatedAt,
                        hash: currentHash,
                        postData: post.serialize ? post.serialize() : post, // Mettre à jour les données
                    })

                    // Diffuser l'événement SSE
                    await this.broadcastPostChange(post, 'updated')
                }
            }

            // Nettoyer les posts supprimés de notre cache
            await this.cleanupDeletedPosts(posts.map((p) => p.id))
        } catch (error) {
            console.error('❌ Erreur lors du polling:', error)
        }
    }

    /**
     * Génère un hash pour détecter les changements de contenu sur toutes les colonnes
     */
    private generatePostHash(post: any): string {
        // Créer un hash basé sur toutes les colonnes importantes
        // Exclure les timestamps et l'ID qui changent automatiquement
        const relevantFields = {
            user_id: post.user_id,
            status: post.status,
            text: post.text,
            date: post.date?.toISOString?.() || post.date, // Gérer les dates Luxon
            image_url: post.image_url,
            link_url: post.link_url,
            keyword: post.keyword,
            client: post.client,
            project_name: post.project_name,
            city: post.city,
            location_id: post.location_id,
            account_id: post.account_id,
            notion_id: post.notion_id,
            // Nouveaux champs IA
            input_tokens: post.input_tokens,
            output_tokens: post.output_tokens,
            model: post.model,
            price: post.price,
        }
        
        // Convertir en chaîne stable pour le hash
        const content = JSON.stringify(relevantFields, Object.keys(relevantFields).sort())
        
        // Générer un hash base64
        return Buffer.from(content).toString('base64')
    }
    
    /**
     * Compare deux posts et retourne les colonnes qui ont changé
     */
    private getChangedFields(oldPost: any, newPost: any): string[] {
        const changedFields: string[] = []
        
        const fieldsToCheck = [
            'user_id', 'status', 'text', 'date', 'image_url', 'link_url',
            'keyword', 'client', 'project_name', 'city', 'location_id', 
            'account_id', 'notion_id', 'input_tokens', 'output_tokens', 'model', 'price'
        ]
        
        for (const field of fieldsToCheck) {
            const oldValue = oldPost?.[field]
            const newValue = newPost?.[field]
            
            // Normaliser les dates pour la comparaison
            const normalizedOld = field === 'date' ? 
                (oldValue?.toISOString?.() || oldValue) : oldValue
            const normalizedNew = field === 'date' ? 
                (newValue?.toISOString?.() || newValue) : newValue
                
            if (normalizedOld !== normalizedNew) {
                changedFields.push(field)
            }
        }
        
        return changedFields
    }

    /**
     * Diffuse un changement de post via SSE avec toutes les données
     */
    private async broadcastPostChange(post: any, action: string) {
        try {
            // Sérialiser toutes les données du post
            const postData = {
                // Identifiants
                id: post.id,
                user_id: post.user_id,
                
                // Contenu principal
                status: post.status,
                text: post.text,
                date: post.date?.toISOString?.() || post.date,
                
                // Médias et liens
                image_url: post.image_url,
                link_url: post.link_url,
                
                // Métadonnées
                keyword: post.keyword,
                client: post.client,
                project_name: post.project_name,
                city: post.city,
                location_id: post.location_id,
                account_id: post.account_id,
                notion_id: post.notion_id,
                
                // Timestamps
                created_at: post.createdAt?.toISOString?.() || post.created_at,
                updated_at: post.updatedAt?.toISOString?.() || post.updated_at,
                
                // Nouveaux champs IA
                input_tokens: post.input_tokens,
                output_tokens: post.output_tokens,
                model: post.model,
                price: post.price,
                
                // Métadonnées de l'événement
                action,
                timestamp: new Date().toISOString(),
                source: 'database_polling',
            }

            // Diffuser vers le canal utilisateur
            SSEController.broadcast(`gmb-posts/user/${post.user_id}`, {
                type: 'post_update',
                data: postData,
            })

            // Diffuser vers le canal post spécifique
            SSEController.broadcast(`gmb-posts/post/${post.id}`, {
                type: 'post_update',
                data: postData,
            })

            console.log(`📻 SSE Polling: ${action} pour post ${post.id} (user ${post.user_id})`)
            console.log(`  - Colonnes surveillées: status, text, date, image_url, link_url, keyword, client, project_name, city, location_id, account_id, notion_id, input_tokens, output_tokens, model, price`)
        } catch (error) {
            console.error('❌ Erreur diffusion SSE depuis polling:', error)
        }
    }

    /**
     * Nettoie les posts supprimés du cache
     */
    private async cleanupDeletedPosts(existingPostIds: number[]) {
        const cachedPostIds = Array.from(this.lastCheck.keys())

        for (const cachedId of cachedPostIds) {
            if (!existingPostIds.includes(cachedId)) {
                console.log(`🗑️ Post ${cachedId} supprimé détecté`)
                this.lastCheck.delete(cachedId)

                // On ne peut pas récupérer l'user_id du post supprimé facilement
                // Pour une implémentation complète, il faudrait une table de log
            }
        }
    }

    /**
     * Statistiques du polling
     */
    getStats() {
        return {
            isRunning: this.isRunning,
            trackedPosts: this.lastCheck.size,
            lastCheckTime: new Date().toISOString(),
        }
    }
}
