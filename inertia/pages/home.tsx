import { Head } from '@inertiajs/react'
import { Stack } from '@mantine/core'
import { useState } from 'react'
import { 
    NotionWebhookModal, 
    NotionNotifications, 
    HomeProps,
    NotionPage,
    PageHeader,
    ConfigurationAlert,
    ErrorAlert,
    NotionPagesTable,
    StatsGrid,
    DatabaseInfoCard
} from '../components/home'

export default function Home({
    notionPages,
    databaseInfo,
    stats,
    userDatabase,
    userNotionId,
    hasNotionId,
    error,
}: HomeProps) {
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [localPages, setLocalPages] = useState(notionPages)
    const [localStats, setLocalStats] = useState(stats)
    const [sendingWebhook, setSendingWebhook] = useState<string | null>(null)
    const [webhookResponse, setWebhookResponse] = useState<any>(null)
    const [showResponseModal, setShowResponseModal] = useState(false)
    const [modalType, setModalType] = useState<'single' | 'bulk'>('single')
    const [processingCount, setProcessingCount] = useState(0)
    const [sendingBulk, setSendingBulk] = useState(false)

    // Fonction pour recharger la page
    const handleSuccessReload = () => {
        console.log('Rechargement de la page déclenché!') // Debug
        window.location.reload()
    }

    // Fonction pour rafraichir les donnees Notion
    const refreshNotionData = async () => {
        setIsRefreshing(true)
        try {
            const response = await fetch('/api/notion-pages')
            const data = await response.json()

            if (data.success) {
                setLocalPages(data.data)
                setLocalStats({
                    totalPages: data.data.length,
                    recentPages: data.data.filter((page: NotionPage) => {
                        const createdDate = new Date(page.created_time)
                        const weekAgo = new Date()
                        weekAgo.setDate(weekAgo.getDate() - 7)
                        return createdDate > weekAgo
                    }).length,
                })
            }
        } catch (error) {
            console.error('Erreur lors du rafraichissement:', error)
        } finally {
            setIsRefreshing(false)
        }
    }

    // Fonction pour envoyer UNE page vers n8n
    // Note: Utilise maintenant le même format que l'envoi global (pages + total_count)
    // pour harmoniser le traitement côté serveur
    const sendToN8n = async (page: NotionPage) => {
        setSendingWebhook(page.id)
        setWebhookResponse(null)
        setModalType('single')

        // Notification de début
        NotionNotifications.sendingStart('single')

        try {
            console.log('🚀 Envoi webhook individuel pour:', page.title, '(format bulk avec 1 page)')

            // Récupération du token CSRF
            const csrfToken = document
                .querySelector('meta[name="csrf-token"]')
                ?.getAttribute('content')
            console.log('🔐 CSRF Token trouvé:', csrfToken ? 'OUI' : 'NON')

            if (!csrfToken) {
                throw new Error('Token CSRF manquant. Actualisez la page.')
            }

            const response = await fetch('/webhook/n8n-bulk', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    pages: [{
                        id: page.id,
                        title: page.title,
                        url: page.url,
                        created_time: page.created_time,
                        last_edited_time: page.last_edited_time,
                        properties: page.properties,
                    }],
                    total_count: 1,
                }),
            })

            console.log('📡 Statut réponse:', response.status, response.statusText)

            // Vérifier si c'est une redirection ou erreur HTTP
            if (!response.ok) {
                const errorText = await response.text()
                console.error('❌ Erreur HTTP:', response.status, errorText.substring(0, 300))
                throw new Error(`Erreur HTTP ${response.status}: ${response.statusText}`)
            }

            // Lire et parser la réponse
            const responseText = await response.text()
            console.log('📥 Réponse brute (100 premiers chars):', responseText.substring(0, 100))

            // Vérifier si c'est du HTML (redirection vers accueil)
            if (responseText.trim().startsWith('<!DOCTYPE')) {
                throw new Error(
                    "La requête a été redirigée vers la page d'accueil. Problème d'authentification ou de route."
                )
            }

            let result
            try {
                result = JSON.parse(responseText)
            } catch (parseError) {
                console.error('❌ Erreur parsing JSON:', parseError)
                throw new Error('Réponse serveur invalide (JSON attendu)')
            }

            console.log('✅ Résultat parsé:', result)

            // Notification de succès
            NotionNotifications.sendingSuccess('single')

            // Afficher la réponse
            setWebhookResponse(result.data || result)
            setShowResponseModal(true)
        } catch (error) {
            console.error('🚨 Erreur complète webhook:', error)

            let errorMessage = 'Erreur inconnue'
            if (error instanceof Error) {
                errorMessage = error.message
            }

            // Notification d'erreur
            NotionNotifications.sendingError('single', errorMessage)

            // Afficher aussi la modale d'erreur
            setWebhookResponse({ error: true, message: errorMessage })
            setShowResponseModal(true)
        } finally {
            setSendingWebhook(null)
        }
    }

    // Fonction pour envoyer TOUTES les pages vers n8n
    const sendAllToN8n = async () => {
        if (localPages.length === 0) {
            NotionNotifications.warning('Aucune page', 'Aucune page à envoyer')
            return
        }

        setSendingBulk(true)
        setWebhookResponse(null)
        setProcessingCount(0)
        setModalType('bulk')

        // Notification de début
        NotionNotifications.sendingStart('bulk', localPages.length)

        try {
            console.log(`🚀 Envoi de ${localPages.length} pages vers n8n`)

            // Récupération du token CSRF
            const csrfToken = document
                .querySelector('meta[name="csrf-token"]')
                ?.getAttribute('content')
            console.log('🔐 CSRF Token trouvé:', csrfToken ? 'OUI' : 'NON')

            if (!csrfToken) {
                throw new Error('Token CSRF manquant. Actualisez la page.')
            }

            // Préparation des données pour l'envoi groupé
            const allPagesData = localPages.map((page) => ({
                id: page.id,
                title: page.title,
                url: page.url,
                created_time: page.created_time,
                last_edited_time: page.last_edited_time,
                properties: page.properties,
            }))

            const response = await fetch('/webhook/n8n-bulk', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    pages: allPagesData,
                    total_count: allPagesData.length,
                }),
            })

            console.log('📡 Statut réponse:', response.status, response.statusText)

            // Vérifier si c'est une redirection ou erreur HTTP
            if (!response.ok) {
                const errorText = await response.text()
                console.error('❌ Erreur HTTP:', response.status, errorText.substring(0, 300))
                throw new Error(`Erreur HTTP ${response.status}: ${response.statusText}`)
            }

            // Lire et parser la réponse
            const responseText = await response.text()
            console.log('📥 Réponse brute (100 premiers chars):', responseText.substring(0, 100))

            // Vérifier si c'est du HTML (redirection vers accueil)
            if (responseText.trim().startsWith('<!DOCTYPE')) {
                throw new Error(
                    "La requête a été redirigée vers la page d'accueil. Problème d'authentification ou de route."
                )
            }

            let result
            try {
                result = JSON.parse(responseText)
            } catch (parseError) {
                console.error('❌ Erreur parsing JSON:', parseError)
                throw new Error('Réponse serveur invalide (JSON attendu)')
            }

            console.log('✅ Résultat parsé:', result)

            // Notification de succès
            NotionNotifications.sendingSuccess('bulk', localPages.length)

            // Afficher la réponse
            setWebhookResponse(result.data || result)
            setShowResponseModal(true)
        } catch (error) {
            console.error('🚨 Erreur complète webhook:', error)

            let errorMessage = 'Erreur inconnue'
            if (error instanceof Error) {
                errorMessage = error.message
            }

            // Notification d'erreur
            NotionNotifications.sendingError('bulk', errorMessage)

            // Afficher aussi la modale d'erreur
            setWebhookResponse({ error: true, message: errorMessage })
            setShowResponseModal(true)
        } finally {
            setSendingBulk(false)
            setProcessingCount(0)
        }
    }

    return (
        <>
            <Head title="Accueil - GMB & Notion" />

            <Stack gap="xl">
                {/* En-tête */}
                <PageHeader />

                {/* Alertes */}
                <ConfigurationAlert 
                    hasNotionId={hasNotionId}
                    userDatabase={userDatabase}
                    userNotionId={userNotionId}
                />
                
                <ErrorAlert error={error} />

                {/* Tableau des pages Notion */}
                <NotionPagesTable
                    pages={localPages}
                    isRefreshing={isRefreshing}
                    sendingWebhook={sendingWebhook}
                    sendingBulk={sendingBulk}
                    error={error}
                    onRefresh={refreshNotionData}
                    onSendAll={sendAllToN8n}
                    onSendSingle={sendToN8n}
                />

                {/* Statistiques */}
                <StatsGrid
                    stats={localStats}
                    databaseInfo={databaseInfo}
                    isRefreshing={isRefreshing}
                    onRefresh={refreshNotionData}
                />

                {/* Informations de la base de données Notion */}
                <DatabaseInfoCard databaseInfo={databaseInfo} />

                {/* Modal pour afficher la réponse de n8n */}
                <NotionWebhookModal
                    opened={showResponseModal}
                    response={webhookResponse}
                    onClose={() => setShowResponseModal(false)}
                    type={modalType}
                    itemsCount={modalType === 'bulk' ? localPages.length : 1}
                    onSuccess={handleSuccessReload}
                />
            </Stack>
        </>
    )
}
