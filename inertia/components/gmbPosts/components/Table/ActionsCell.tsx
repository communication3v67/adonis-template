import { ActionIcon, Group, Tooltip } from '@mantine/core'
import { LuCopy, LuSend, LuSettings, LuTrash } from 'react-icons/lu'
import { GmbPost } from '../../types'

interface ActionsCellProps {
    post: GmbPost
    sendingSinglePost: number | null
    onEdit: (post: GmbPost) => void
    onDelete: (postId: number) => void
    onDuplicate: (postId: number) => void
    onSendToN8n: (post: GmbPost) => void
}

export const ActionsCell = ({
    post,
    sendingSinglePost,
    onEdit,
    onDelete,
    onDuplicate,
    onSendToN8n,
}: ActionsCellProps) => {
    const canSendToN8n = post.status === 'Post à générer'
    const isSending = sendingSinglePost === post.id

    return (
        <Group gap={4} wrap="nowrap" justify="center">
            {/* Bouton d'envoi vers n8n si applicable */}
            {canSendToN8n && (
                <Tooltip label="Envoyer vers n8n">
                    <ActionIcon
                        size="sm"
                        variant="light"
                        color="blue"
                        onClick={() => onSendToN8n(post)}
                        loading={isSending}
                    >
                        <LuSend size={14} />
                    </ActionIcon>
                </Tooltip>
            )}

            {/* Bouton de modification */}
            <Tooltip label="Modifier">
                <ActionIcon
                    size="sm"
                    variant="subtle"
                    color="gray"
                    onClick={() => onEdit(post)}
                >
                    <LuSettings size={14} />
                </ActionIcon>
            </Tooltip>

            {/* Bouton de duplication */}
            <Tooltip label="Dupliquer">
                <ActionIcon
                    size="sm"
                    variant="subtle"
                    color="gray"
                    onClick={() => onDuplicate(post.id)}
                >
                    <LuCopy size={14} />
                </ActionIcon>
            </Tooltip>

            {/* Bouton de suppression */}
            <Tooltip label="Supprimer">
                <ActionIcon
                    size="sm"
                    variant="subtle"
                    color="red"
                    onClick={() => onDelete(post.id)}
                >
                    <LuTrash size={14} />
                </ActionIcon>
            </Tooltip>
        </Group>
    )
}
