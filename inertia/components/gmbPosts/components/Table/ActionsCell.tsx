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

    // Vérifier si les champs requis sont remplis pour l'envoi
    const hasRequiredFields = !!(post.status && post.text && post.keyword)
    const isN8nButtonDisabled = !canSendToN8n || !hasRequiredFields || isSending

    // Message du tooltip selon l'état
    const getN8nTooltipMessage = () => {
        if (!canSendToN8n) {
            return 'Seuls les posts "Post à générer" peuvent être envoyés'
        }
        if (!post.status) {
            return "Le statut est requis pour l'envoi"
        }
        if (!post.text) {
            return "Le texte est requis pour l'envoi"
        }
        if (!post.keyword) {
            return "Le mot-clé est requis pour l'envoi"
        }
        if (isSending) {
            return 'Envoi en cours...'
        }
        return 'Envoyer vers n8n'
    }

    return (
        <Group gap={4} wrap="nowrap" justify="start">
            {/* Bouton d'envoi vers n8n - toujours visible */}
            <Tooltip label={getN8nTooltipMessage()}>
                <ActionIcon
                    size="sm"
                    variant={isN8nButtonDisabled ? 'subtle' : 'light'}
                    color={isN8nButtonDisabled ? 'gray' : 'blue'}
                    onClick={() => !isN8nButtonDisabled && onSendToN8n(post)}
                    loading={isSending}
                    disabled={isN8nButtonDisabled}
                    style={{
                        opacity: isN8nButtonDisabled ? 0.5 : 1,
                        cursor: isN8nButtonDisabled ? 'not-allowed' : 'pointer',
                    }}
                >
                    <LuSend size={14} />
                </ActionIcon>
            </Tooltip>

            {/* Bouton de modification */}
            <Tooltip label="Modifier">
                <ActionIcon size="sm" variant="subtle" color="gray" onClick={() => onEdit(post)}>
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
