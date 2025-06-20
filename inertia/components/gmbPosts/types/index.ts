// Types principaux pour les posts GMB
export interface GmbPost {
    id: number
    status: string
    text: string
    date: string
    image_url?: string
    link_url?: string
    keyword?: string
    client: string
    project_name: string
    city?: string
    location_id: string
    account_id: string
    notion_id?: string
    // Nouveaux champs IA et coûts
    input_tokens?: number | null
    output_tokens?: number | null
    model?: string | null
    price?: number | null
    // Champs utilitaires calculés
    totalTokens?: number
    hasAiData?: boolean
    formattedPrice?: string
    costPerToken?: number
    createdAt: string
    updatedAt: string
}

export interface PaginatedPosts {
    data: GmbPost[]
    meta: {
        current_page: number
        last_page: number
        per_page: number
        total: number
    }
}

export interface FilterState {
    search: string
    status: string
    client: string
    project: string
    sortBy: string
    sortOrder: string
    dateFrom: string
    dateTo: string
}

export interface FilterOptions {
    clients: string[]
    projects: string[]
    statuses: string[]
}

export interface CurrentUser {
    id: number
    username: string
    email: string
    notion_id: string | null
}

// Interface pour le scroll infini
export interface InfiniteScrollState {
    allPosts: GmbPost[]
    currentPage: number
    hasMore: boolean
    isLoading: boolean
    isLoadingMore: boolean
}

// Interface pour l'édition en masse
export interface BulkEditData {
    status: string
    client: string
    project_name: string
    city: string
    location_id: string
    account_id: string
    notion_id: string
    // Nouveaux champs IA
    input_tokens?: number
    output_tokens?: number
    model?: string
    price?: number
    // Images en masse
    images?: string[]
}

// Interface pour les statistiques IA
export interface AiStats {
    totalInputTokens: number
    totalOutputTokens: number
    totalCost: number
    aiPostsCount: number
    avgCostPerPost: number
    costsByModel: {
        model: string
        totalCost: number
        postsCount: number
        avgCost: number
    }[]
    mostExpensivePosts: GmbPost[]
}

export interface StatsData {
    total: number
    byStatus: {
        status: string
        count: number
    }[]
    ai: AiStats
}

// Props principales de la page
export interface GmbPostsPageProps {
    posts: PaginatedPosts
    filters: FilterState
    filterOptions: FilterOptions
    currentUser: CurrentUser
    postsToGenerateCount: number
}
