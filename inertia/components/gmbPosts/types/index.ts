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
    informations?: string | null
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
    informations: string
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

// Types pour le système de filtres avancés façon Notion
export type FilterOperator = 
  | 'equals' 
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'ends_with'
  | 'is_empty'
  | 'is_not_empty'
  | 'before'
  | 'after'
  | 'on_or_before'
  | 'on_or_after'
  | 'between'
  | 'greater_than'
  | 'less_than'
  | 'greater_than_or_equal'
  | 'less_than_or_equal'

export type FilterCondition = 'and' | 'or'

export interface AdvancedFilter {
  id: string
  property: string
  operator: FilterOperator
  value: string | number | string[] | { from: string; to: string }
  condition?: FilterCondition // utilisé pour combiner avec le filtre suivant
}

export interface FilterGroup {
  id: string
  filters: AdvancedFilter[]
  condition: FilterCondition // and/or entre les groupes
}

export interface AdvancedFilterState {
  groups: FilterGroup[]
  isActive: boolean
}

export interface FilterProperty {
  key: string
  label: string
  type: 'text' | 'select' | 'date' | 'number' | 'boolean'
  options?: string[] // pour les types select
}

// Opérateurs disponibles par type de propriété
export const OPERATORS_BY_TYPE: Record<string, { value: FilterOperator; label: string }[]> = {
  text: [
    { value: 'equals', label: 'Est égal à' },
    { value: 'not_equals', label: 'N\'est pas égal à' },
    { value: 'contains', label: 'Contient' },
    { value: 'not_contains', label: 'Ne contient pas' },
    { value: 'starts_with', label: 'Commence par' },
    { value: 'ends_with', label: 'Se termine par' },
    { value: 'is_empty', label: 'Est vide' },
    { value: 'is_not_empty', label: 'N\'est pas vide' },
  ],
  select: [
    { value: 'equals', label: 'Est' },
    { value: 'not_equals', label: 'N\'est pas' },
    { value: 'is_empty', label: 'Est vide' },
    { value: 'is_not_empty', label: 'N\'est pas vide' },
  ],
  date: [
    { value: 'equals', label: 'Est' },
    { value: 'before', label: 'Avant' },
    { value: 'after', label: 'Après' },
    { value: 'on_or_before', label: 'Le ou avant' },
    { value: 'on_or_after', label: 'Le ou après' },
    { value: 'between', label: 'Entre' },
    { value: 'is_empty', label: 'Est vide' },
    { value: 'is_not_empty', label: 'N\'est pas vide' },
  ],
  number: [
    { value: 'equals', label: 'Est égal à' },
    { value: 'not_equals', label: 'N\'est pas égal à' },
    { value: 'greater_than', label: 'Plus grand que' },
    { value: 'less_than', label: 'Plus petit que' },
    { value: 'greater_than_or_equal', label: 'Plus grand ou égal à' },
    { value: 'less_than_or_equal', label: 'Plus petit ou égal à' },
    { value: 'between', label: 'Entre' },
    { value: 'is_empty', label: 'Est vide' },
    { value: 'is_not_empty', label: 'N\'est pas vide' },
  ],
}

// Propriétés filtrables pour les posts GMB
export const FILTERABLE_PROPERTIES: FilterProperty[] = [
  { key: 'text', label: 'Texte', type: 'text' },
  { key: 'status', label: 'Statut', type: 'select' },
  { key: 'client', label: 'Client', type: 'select' },
  { key: 'project_name', label: 'Projet', type: 'select' },
  { key: 'keyword', label: 'Mot-clé', type: 'text' },
  { key: 'city', label: 'Ville', type: 'text' },
  { key: 'date', label: 'Date', type: 'date' },
  { key: 'createdAt', label: 'Date de création', type: 'date' },
  { key: 'updatedAt', label: 'Date de modification', type: 'date' },
  { key: 'price', label: 'Prix IA', type: 'number' },
  { key: 'input_tokens', label: 'Tokens d\'entrée', type: 'number' },
  { key: 'output_tokens', label: 'Tokens de sortie', type: 'number' },
  { key: 'model', label: 'Modèle IA', type: 'text' },
  { key: 'location_id', label: 'ID de localisation', type: 'text' },
  { key: 'account_id', label: 'ID de compte', type: 'text' },
  { key: 'notion_id', label: 'ID Notion', type: 'text' },
  { key: 'informations', label: 'Informations', type: 'text' },
]

// Utilitaires pour les filtres avancés
export const createDefaultAdvancedFilter = (): AdvancedFilter => ({
  id: Date.now().toString(36) + Math.random().toString(36).substr(2),
  property: 'text',
  operator: 'contains',
  value: ''
})

export const createDefaultFilterGroup = (): FilterGroup => ({
  id: Date.now().toString(36) + Math.random().toString(36).substr(2),
  filters: [createDefaultAdvancedFilter()],
  condition: 'and'
})

export const createDefaultAdvancedFilterState = (): AdvancedFilterState => ({
  groups: [],
  isActive: false
})

// Interface mise à jour pour inclure les filtres avancés
export interface ExtendedFilterState extends FilterState {
  advanced: AdvancedFilterState
}

// Props principales de la page
export interface GmbPostsPageProps {
    posts: PaginatedPosts
    filters: FilterState
    filterOptions: FilterOptions
    currentUser: CurrentUser
    postsToGenerateCount: number
}
