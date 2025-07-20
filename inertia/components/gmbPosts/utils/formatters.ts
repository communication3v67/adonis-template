// Fonctions utilitaires pour le formatage

/**
 * Tronque un texte à une longueur donnée
 */
export const truncateText = (text: string, maxLength: number = 50): string => {
    if (!text) return '-'
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text
}

/**
 * Formate une date pour l'affichage
 */
export const formatDate = (dateString: string, isClient: boolean = true): string => {
    if (!dateString) return '-'
    
    const date = new Date(dateString)

    // Pendant l'hydratation, utiliser un format déterministe
    if (!isClient) {
        const isoString = date.toISOString()
        const datePart = isoString.split('T')[0]
        const timePart = isoString.split('T')[1].substring(0, 5)
        
        const [year, month, day] = datePart.split('-')
        return `${day}/${month}/${year} ${timePart}`
    }

    // Après hydratation, utiliser le format localisé
    return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit', 
        year: 'numeric',
    })
}

/**
 * Formate une date pour l'édition (input datetime-local)
 * CORRIGÉ : Préserve le fuseau horaire local pour éviter les décalages
 */
export const formatDateForEdit = (dateString: string): string => {
    if (!dateString) return ''
    
    const date = new Date(dateString)
    
    // Vérifier si la date est valide
    if (isNaN(date.getTime())) {
        console.warn('Date invalide reçue pour formatage:', dateString)
        return ''
    }
    
    // CORRECTION : Utiliser les méthodes locales au lieu de toISOString()
    // pour éviter les décalages de fuseau horaire
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    
    const formattedDate = `${year}-${month}-${day}T${hours}:${minutes}`
    
    console.log(`📅 formatDateForEdit: "${dateString}" -> "${formattedDate}"`, {
        original: dateString,
        parsed: date.toString(),
        formatted: formattedDate,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    })
    
    return formattedDate
}

/**
 * Calcule les dates pour les filtres rapides
 */
export const calculateQuickDateRange = (period: string): { dateFrom: string; dateTo: string } => {
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    let dateFrom = ''
    let dateTo = ''
    
    switch (period) {
        case 'today':
            dateFrom = dateTo = today.toISOString().split('T')[0]
            break
        case 'yesterday':
            dateFrom = dateTo = yesterday.toISOString().split('T')[0]
            break
        case 'tomorrow':
            dateFrom = dateTo = tomorrow.toISOString().split('T')[0]
            break
        case 'last7days':
            const last7 = new Date(today)
            last7.setDate(last7.getDate() - 7)
            dateFrom = last7.toISOString().split('T')[0]
            dateTo = today.toISOString().split('T')[0]
            break
        case 'next7days':
            const next7 = new Date(today)
            next7.setDate(next7.getDate() + 7)
            dateFrom = today.toISOString().split('T')[0]
            dateTo = next7.toISOString().split('T')[0]
            break
        case 'last30days':
            const last30 = new Date(today)
            last30.setDate(last30.getDate() - 30)
            dateFrom = last30.toISOString().split('T')[0]
            dateTo = today.toISOString().split('T')[0]
            break
        case 'next30days':
            const next30 = new Date(today)
            next30.setDate(next30.getDate() + 30)
            dateFrom = today.toISOString().split('T')[0]
            dateTo = next30.toISOString().split('T')[0]
            break
        case 'thismonth':
            dateFrom = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]
            dateTo = today.toISOString().split('T')[0]
            break
        case 'lastmonth':
            const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
            const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0)
            dateFrom = lastMonth.toISOString().split('T')[0]
            dateTo = lastMonthEnd.toISOString().split('T')[0]
            break
        case 'nextmonth':
            const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1)
            const nextMonthEnd = new Date(today.getFullYear(), today.getMonth() + 2, 0)
            dateFrom = nextMonth.toISOString().split('T')[0]
            dateTo = nextMonthEnd.toISOString().split('T')[0]
            break
    }
    
    return { dateFrom, dateTo }
}

/**
 * Vérifie si une URL est valide
 */
export const isValidUrl = (string: string): boolean => {
    try {
        new URL(string)
        return true
    } catch (_) {
        return false
    }
}

/**
 * Génère un libellé de tri
 */
export const getSortLabel = (sortBy: string): string => {
    const labels: Record<string, string> = {
        'date': 'Date',
        'status': 'Statut',
        'text': 'Texte',
        'client': 'Client',
        'project_name': 'Projet',
        'keyword': 'Mot-clé',
        'location_id': 'Location ID',
        'account_id': 'Account ID',
        'notion_id': 'Notion ID',
        'createdAt': 'Créé le',
        'updatedAt': 'Modifié le'
    }
    return labels[sortBy] || sortBy
}
