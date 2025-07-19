import { Checkbox, Tooltip } from '@mantine/core'
import { LuCircleAlert, LuCircleCheck, LuClock, LuRefreshCw, LuX } from 'react-icons/lu'
import { calculatePrice } from '../../../../utils/pricing'
import { FilterOptions, GmbPost } from '../../types'
import { ActionsCell } from './ActionsCell'
import { ColumnConfig } from './ColumnVisibilityManager'
import { InlineEditCell } from './InlineEditCell'

interface PostRowProps {
    post: GmbPost
    isSelected: boolean
    sendingSinglePost: number | null
    filterOptions: FilterOptions
    visibleColumns: ColumnConfig[]
    getColumnWidth: (key: string) => number
    onSelect: (postId: number) => void
    onInlineEdit: (postId: number, field: string, value: string) => Promise<void>
    onOptimisticUpdate?: (postId: number, updates: Partial<GmbPost>) => void // NOUVEAU
    onEdit: (post: GmbPost) => void
    onDelete: (postId: number) => void
    onDuplicate: (postId: number) => void
    onSendToN8n: (post: GmbPost) => void
}

export const PostRow = ({
    post,
    isSelected,
    sendingSinglePost,
    filterOptions,
    visibleColumns,
    getColumnWidth,
    onSelect,
    onInlineEdit,
    onOptimisticUpdate, // NOUVEAU
    onEdit,
    onDelete,
    onDuplicate,
    onSendToN8n,
}: PostRowProps) => {
    // Fonction pour vérifier si un champ est rempli
    const isFieldFilled = (value: string | null | undefined): boolean => {
        return value !== null && value !== undefined && value.trim() !== ''
    }

    // Fonction pour obtenir l'icône de préparation
    const getReadinessIcon = () => {
        // Logique pour "Titre généré" - Action utilisateur nécessaire pour passer à "Post à générer"
        if (post.status === 'Titre généré') {
            return (
                <Tooltip
                    label="Titre généré - Action utilisateur requise pour passer au statut 'Post à générer'"
                    multiline
                    withArrow
                    position="right"
                >
                    <LuRefreshCw size={14} style={{ color: '#fd7e14', cursor: 'help' }} />
                </Tooltip>
            )
        }

        // Logique pour "Post généré" - Action utilisateur nécessaire pour passer à "Post à publier"
        if (post.status === 'Post généré') {
            return (
                <Tooltip
                    label="Post généré - Action utilisateur requise pour passer au statut 'Post à publier'"
                    multiline
                    withArrow
                    position="right"
                >
                    <LuClock size={14} style={{ color: '#fd7e14', cursor: 'help' }} />
                </Tooltip>
            )
        }

        // Logique pour "Post à générer"
        if (post.status === 'Post à générer') {
            const hasText = isFieldFilled(post.text)
            const hasKeyword = isFieldFilled(post.keyword)
            const hasClient = isFieldFilled(post.client)

            const isReadyForGeneration = hasText && hasKeyword && hasClient

            if (isReadyForGeneration) {
                return (
                    <Tooltip label="Prêt pour la génération" multiline withArrow position="right">
                        <LuCircleCheck size={14} style={{ color: '#40c057', cursor: 'help' }} />
                    </Tooltip>
                )
            } else {
                return (
                    <Tooltip
                        label={`Incomplet pour la génération - Champs manquants: ${[
                            !hasText && 'Texte',
                            !hasKeyword && 'Mot-clé',
                            !hasClient && 'Client',
                        ]
                            .filter(Boolean)
                            .join(', ')}`}
                        multiline
                        withArrow
                        position="right"
                    >
                        <LuCircleAlert size={14} style={{ color: '#fd7e14', cursor: 'help' }} />
                    </Tooltip>
                )
            }
        }

        // Logique pour "Post à publier"
        if (post.status === 'Post à publier') {
            const hasText = isFieldFilled(post.text)
            const hasDate = isFieldFilled(post.date)
            const hasAccountId = isFieldFilled(post.account_id)
            const hasLocationId = isFieldFilled(post.location_id)
            const hasUrl = isFieldFilled(post.link_url) || isFieldFilled(post.image_url)

            const isReadyForPublication =
                hasText && hasDate && hasAccountId && hasLocationId && hasUrl

            if (isReadyForPublication) {
                return (
                    <Tooltip
                        label="Prêt pour la publication - Tous les champs requis sont remplis (Texte, Date, Account ID, Location ID, URL)"
                        multiline
                        withArrow
                        position="right"
                    >
                        <LuCircleCheck size={14} style={{ color: '#228be6', cursor: 'help' }} />
                    </Tooltip>
                )
            } else {
                return (
                    <Tooltip
                        label={`Incomplet pour la publication - Champs manquants: ${[
                            !hasText && 'Texte',
                            !hasDate && 'Date',
                            !hasAccountId && 'Account ID',
                            !hasLocationId && 'Location ID',
                            !hasUrl && 'URL (Image ou Lien)',
                        ]
                            .filter(Boolean)
                            .join(', ')}`}
                        multiline
                        withArrow
                        position="right"
                    >
                        <LuX size={14} style={{ color: '#fa5252', cursor: 'help' }} />
                    </Tooltip>
                )
            }
        }

        // Pas d'icône pour les autres statuts
        return null
    }

    const renderCell = (column: ColumnConfig) => {
        const width = column.width
        const baseStyle = {
            width: `${width}px`,
            maxWidth: `${width}px`,
            verticalAlign: 'middle' as const,
            padding: '8px',
        }

        switch (column.key) {
            case 'readiness':
                return (
                    <td
                        key={column.key}
                        style={{ ...baseStyle, textAlign: 'center', verticalAlign: 'middle' }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                height: '100%',
                            }}
                        >
                            {getReadinessIcon()}
                        </div>
                    </td>
                )
            case 'checkbox':
                return (
                    <td key={column.key} style={{ ...baseStyle, textAlign: 'center' }}>
                        <Checkbox checked={isSelected} onChange={() => onSelect(post.id)} />
                    </td>
                )
            case 'id':
                return (
                    <td key={column.key} style={{ ...baseStyle, textAlign: 'center', fontWeight: 'bold', fontSize: '12px', color: '#6c757d' }}>
                        {post.id}
                    </td>
                )
            case 'status':
                return (
                    <td key={column.key} style={baseStyle}>
                        <InlineEditCell
                            value={post.status}
                            field="status"
                            post={post}
                            type="select"
                            filterOptions={filterOptions}
                            onSave={onInlineEdit}
                            onOptimisticUpdate={onOptimisticUpdate}
                        />
                    </td>
                )
            case 'text':
                return (
                    <td key={column.key} style={{ ...baseStyle }}>
                        <InlineEditCell
                            value={post.text}
                            field="text"
                            post={post}
                            type="textarea"
                            onSave={onInlineEdit}
                            onOptimisticUpdate={onOptimisticUpdate}
                        />
                    </td>
                )
            case 'date':
                return (
                    <td key={column.key} style={baseStyle}>
                        <InlineEditCell
                            value={post.date}
                            field="date"
                            post={post}
                            type="datetime-local"
                            onSave={onInlineEdit}
                            onOptimisticUpdate={onOptimisticUpdate}
                        />
                    </td>
                )
            case 'keyword':
                return (
                    <td key={column.key} style={baseStyle}>
                        <InlineEditCell
                            value={post.keyword || ''}
                            field="keyword"
                            post={post}
                            onSave={onInlineEdit}
                            onOptimisticUpdate={onOptimisticUpdate}
                        />
                    </td>
                )
            case 'client':
                return (
                    <td key={column.key} style={baseStyle}>
                        <InlineEditCell
                            value={post.client}
                            field="client"
                            post={post}
                            type="select"
                            filterOptions={filterOptions}
                            onSave={onInlineEdit}
                            onOptimisticUpdate={onOptimisticUpdate}
                        />
                    </td>
                )
            case 'project_name':
                return (
                    <td key={column.key} style={baseStyle}>
                        <InlineEditCell
                            value={post.project_name}
                            field="project_name"
                            post={post}
                            onSave={onInlineEdit}
                            onOptimisticUpdate={onOptimisticUpdate}
                        />
                    </td>
                )
            case 'city':
                return (
                    <td key={column.key} style={baseStyle}>
                        <InlineEditCell
                            value={post.city || ''}
                            field="city"
                            post={post}
                            onSave={onInlineEdit}
                            onOptimisticUpdate={onOptimisticUpdate}
                        />
                    </td>
                )
            case 'price':
                return (
                    <td key={column.key} style={{ ...baseStyle, textAlign: 'right' }}>
                        <InlineEditCell
                            value={post.price ? post.price.toString() : ''}
                            field="price"
                            post={post}
                            type="number"
                            onSave={onInlineEdit}
                            onOptimisticUpdate={onOptimisticUpdate}
                            displayValue={
                                post.price !== null && post.price !== undefined
                                    ? post.price.toString()
                                    : post.model && post.input_tokens && post.output_tokens
                                      ? calculatePrice(
                                            post.model,
                                            post.input_tokens,
                                            post.output_tokens
                                        )?.toString() || '-'
                                      : '-'
                            }
                        />
                    </td>
                )
            case 'model':
                return (
                    <td key={column.key} style={baseStyle}>
                        <InlineEditCell
                            value={post.model || ''}
                            field="model"
                            post={post}
                            onSave={onInlineEdit}
                            onOptimisticUpdate={onOptimisticUpdate}
                        />
                    </td>
                )
            case 'input_tokens':
                return (
                    <td key={column.key} style={{ ...baseStyle, textAlign: 'right' }}>
                        <InlineEditCell
                            value={post.input_tokens ? post.input_tokens.toString() : ''}
                            field="input_tokens"
                            post={post}
                            type="number"
                            onSave={onInlineEdit}
                            onOptimisticUpdate={onOptimisticUpdate}
                            displayValue={
                                post.input_tokens ? post.input_tokens.toLocaleString() : '-'
                            }
                        />
                    </td>
                )
            case 'output_tokens':
                return (
                    <td key={column.key} style={{ ...baseStyle, textAlign: 'right' }}>
                        <InlineEditCell
                            value={post.output_tokens ? post.output_tokens.toString() : ''}
                            field="output_tokens"
                            post={post}
                            type="number"
                            onSave={onInlineEdit}
                            onOptimisticUpdate={onOptimisticUpdate}
                            displayValue={
                                post.output_tokens ? post.output_tokens.toLocaleString() : '-'
                            }
                        />
                    </td>
                )
            case 'image_url':
                return (
                    <td key={column.key} style={baseStyle}>
                        <InlineEditCell
                            value={post.image_url || ''}
                            field="image_url"
                            post={post}
                            onSave={onInlineEdit}
                            onOptimisticUpdate={onOptimisticUpdate}
                        />
                    </td>
                )
            case 'link_url':
                return (
                    <td key={column.key} style={baseStyle}>
                        <InlineEditCell
                            value={post.link_url || ''}
                            field="link_url"
                            post={post}
                            onSave={onInlineEdit}
                            onOptimisticUpdate={onOptimisticUpdate}
                        />
                    </td>
                )
            case 'location_id':
                return (
                    <td key={column.key} style={baseStyle}>
                        <InlineEditCell
                            value={post.location_id}
                            field="location_id"
                            post={post}
                            onSave={onInlineEdit}
                            onOptimisticUpdate={onOptimisticUpdate}
                        />
                    </td>
                )
            case 'account_id':
                return (
                    <td key={column.key} style={baseStyle}>
                        <InlineEditCell
                            value={post.account_id}
                            field="account_id"
                            post={post}
                            onSave={onInlineEdit}
                            onOptimisticUpdate={onOptimisticUpdate}
                        />
                    </td>
                )
            case 'notion_id':
                return (
                    <td key={column.key} style={baseStyle}>
                        <InlineEditCell
                            value={post.notion_id || ''}
                            field="notion_id"
                            post={post}
                            onSave={onInlineEdit}
                            onOptimisticUpdate={onOptimisticUpdate}
                        />
                    </td>
                )
            case 'informations':
                return (
                    <td key={column.key} style={baseStyle}>
                        <InlineEditCell
                            value={post.informations || ''}
                            field="informations"
                            post={post}
                            type="textarea"
                            onSave={onInlineEdit}
                            onOptimisticUpdate={onOptimisticUpdate}
                        />
                    </td>
                )
            case 'actions':
                return (
                    <td key={column.key} style={{ ...baseStyle, textAlign: 'center' }}>
                        <ActionsCell
                            post={post}
                            sendingSinglePost={sendingSinglePost}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onDuplicate={onDuplicate}
                            onSendToN8n={onSendToN8n}
                        />
                    </td>
                )
            default:
                return null
        }
    }

    return (
        <tr key={post.id} style={{ height: '60px' }}>
            {visibleColumns.map((column) => renderCell(column))}
        </tr>
    )
}
