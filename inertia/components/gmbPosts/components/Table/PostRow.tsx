import { Checkbox } from '@mantine/core'
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
    getColumnWidth: (key: string) => string
    onSelect: (postId: number) => void
    onInlineEdit: (postId: number, field: string, value: string) => Promise<void>
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
    onEdit,
    onDelete,
    onDuplicate,
    onSendToN8n,
}: PostRowProps) => {
    const renderCell = (column: ColumnConfig) => {
        const width = column.width
        const baseStyle = {
            width: `${width}px`,
            maxWidth: `${width}px`,
            verticalAlign: 'middle' as const,
            padding: '8px',
        }

        switch (column.key) {
            case 'checkbox':
                return (
                    <td key={column.key} style={{ ...baseStyle, textAlign: 'center' }}>
                        <Checkbox checked={isSelected} onChange={() => onSelect(post.id)} />
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
