export interface NotionPage {
    id: string
    title: string
    url: string
    created_time: string
    last_edited_time: string
    properties: any
}

export interface DatabaseInfo {
    title: string
    id: string
    url: string
    created_time: string
    last_edited_time: string
}

export interface Stats {
    totalPages: number
    recentPages: number
}

export interface HomeProps {
    notionPages: NotionPage[]
    databaseInfo: DatabaseInfo | null
    stats: Stats
    userDatabase?: string
    userNotionId?: string | null
    hasNotionId?: boolean
    error?: {
        message: string
        details: string
    }
}
