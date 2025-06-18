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
    location_id: string
    account_id: string
    notion_id?: string
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
    location_id: string
    account_id: string
    notion_id: string
}

// Props principales de la page
export interface GmbPostsPageProps {
    posts: PaginatedPosts
    filters: FilterState
    filterOptions: FilterOptions
    currentUser: CurrentUser
    postsToGenerateCount: number
}
