import { Checkbox } from '@mantine/core'
import { GmbPost, FilterOptions } from '../../types'
import { InlineEditCell } from './InlineEditCell'
import { ActionsCell } from './ActionsCell'

interface PostRowProps {
    post: GmbPost
    isSelected: boolean
    sendingSinglePost: number | null
    filterOptions: FilterOptions
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
    onSelect,
    onInlineEdit,
    onEdit,
    onDelete,
    onDuplicate,
    onSendToN8n,
}: PostRowProps) => {
    return (
        <tr key={post.id} style={{ height: '60px' }}>
            <td style={{ width: '60px', maxWidth: '60px', textAlign: 'center', verticalAlign: 'middle', padding: '8px' }}>
                <Checkbox
                    checked={isSelected}
                    onChange={() => onSelect(post.id)}
                />
            </td>
            <td style={{ width: '180px', maxWidth: '180px', verticalAlign: 'middle', padding: '8px' }}>
                <InlineEditCell
                    value={post.status}
                    field="status"
                    post={post}
                    type="select"
                    filterOptions={filterOptions}
                    onSave={onInlineEdit}
                />
            </td>
            <td style={{ width: '500px', maxWidth: '500px', minWidth: '400px', verticalAlign: 'middle', padding: '8px' }}>
                <InlineEditCell
                    value={post.text}
                    field="text"
                    post={post}
                    type="textarea"
                    onSave={onInlineEdit}
                />
            </td>
            <td style={{ width: '180px', maxWidth: '180px', verticalAlign: 'middle', padding: '8px' }}>
                <InlineEditCell
                    value={post.date}
                    field="date"
                    post={post}
                    type="datetime-local"
                    onSave={onInlineEdit}
                />
            </td>
            <td style={{ width: '160px', maxWidth: '160px', verticalAlign: 'middle', padding: '8px' }}>
                <InlineEditCell
                    value={post.keyword || ''}
                    field="keyword"
                    post={post}
                    onSave={onInlineEdit}
                />
            </td>
            <td style={{ width: '180px', maxWidth: '180px', verticalAlign: 'middle', padding: '8px' }}>
                <InlineEditCell
                    value={post.client}
                    field="client"
                    post={post}
                    type="select"
                    filterOptions={filterOptions}
                    onSave={onInlineEdit}
                />
            </td>
            <td style={{ width: '200px', maxWidth: '200px', verticalAlign: 'middle', padding: '8px' }}>
                <InlineEditCell
                    value={post.project_name}
                    field="project_name"
                    post={post}
                    onSave={onInlineEdit}
                />
            </td>
            <td style={{ width: '120px', maxWidth: '120px', verticalAlign: 'middle', padding: '8px' }}>
                <InlineEditCell
                    value={post.image_url || ''}
                    field="image_url"
                    post={post}
                    onSave={onInlineEdit}
                />
            </td>
            <td style={{ width: '120px', maxWidth: '120px', verticalAlign: 'middle', padding: '8px' }}>
                <InlineEditCell
                    value={post.link_url || ''}
                    field="link_url"
                    post={post}
                    onSave={onInlineEdit}
                />
            </td>
            <td style={{ width: '160px', maxWidth: '160px', verticalAlign: 'middle', padding: '8px' }}>
                <InlineEditCell
                    value={post.location_id}
                    field="location_id"
                    post={post}
                    onSave={onInlineEdit}
                />
            </td>
            <td style={{ width: '160px', maxWidth: '160px', verticalAlign: 'middle', padding: '8px' }}>
                <InlineEditCell
                    value={post.account_id}
                    field="account_id"
                    post={post}
                    onSave={onInlineEdit}
                />
            </td>
            <td style={{ width: '160px', maxWidth: '160px', verticalAlign: 'middle', padding: '8px' }}>
                <InlineEditCell
                    value={post.notion_id || ''}
                    field="notion_id"
                    post={post}
                    onSave={onInlineEdit}
                />
            </td>
            <td style={{ width: '180px', maxWidth: '180px', verticalAlign: 'middle', padding: '8px', textAlign: 'center' }}>
                <ActionsCell
                    post={post}
                    sendingSinglePost={sendingSinglePost}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onDuplicate={onDuplicate}
                    onSendToN8n={onSendToN8n}
                />
            </td>
        </tr>
    )
}
