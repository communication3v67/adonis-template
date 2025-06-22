import {
    Accordion,
    Alert,
    Button,
    Code,
    Group,
    Modal,
    ScrollArea,
    Stack,
    Text,
    Title,
    Progress,
    Badge,
    Loader,
} from '@mantine/core'
import { LuBadgeAlert, LuChevronDown, LuSend, LuX, LuCheck, LuRefreshCw } from 'react-icons/lu'
import { useState } from 'react'

interface NotionWebhookModalProps {
    opened: boolean
    response: any
    onClose: () => void
    type: 'single' | 'bulk'
    itemsCount?: number
    onSuccess?: () => void
}

export const NotionWebhookModal = ({ 
    opened, 
    response, 
    onClose, 
    type, 
    itemsCount = 0,
    onSuccess
}: NotionWebhookModalProps) => {
    const [isReloading, setIsReloading] = useState(false)
    
    const isError = response?.error === true || response?.success === false
    const isSuccess = !isError && response // Si pas d'erreur et qu'on a une réponse, c'est un succès
    
    console.log('Modal Debug:', { isError, isSuccess, response, onSuccess }) // Debug
    
    // Titre dynamique selon le type et le résultat
    const getTitle = () => {
        if (isError) {
            return type === 'bulk' 
                ? "Erreur lors de l'envoi groupé vers n8n"
                : "Erreur d'envoi vers n8n"
        }
        return type === 'bulk'
            ? `Envoi groupé vers n8n réussi (${itemsCount} pages)`
            : 'Envoi vers n8n réussi'
    }

    const titleColor = isError ? 'red' : 'green'
    const alertIcon = isError ? <LuBadgeAlert size={20} /> : <LuSend size={20} />

    const handleClose = () => {
        console.log('handleClose called:', { isSuccess, onSuccess }) // Debug
        
        // Version plus agressive : si on n'a pas d'erreur explicite, on recharge
        if (!isError && onSuccess) {
            console.log('Calling onSuccess() - version agressive') // Debug
            setIsReloading(true)
            
            // Recharger la page après 1 seconde
            setTimeout(() => {
                onSuccess()
            }, 1000)
        } else {
            onClose()
        }
    }

    return (
        <Modal
            opened={opened}
            onClose={isReloading ? undefined : handleClose} // Empêcher la fermeture pendant le rechargement
            title={
                <Group gap="xs">
                    <Title order={4} c={titleColor}>
                        {getTitle()}
                    </Title>
                    {type === 'bulk' && isSuccess && (
                        <Badge color="green" variant="light">
                            {itemsCount} pages
                        </Badge>
                    )}
                </Group>
            }
            size="lg"
            closeOnClickOutside={!isReloading}
            closeOnEscape={!isReloading}
        >
            <Stack gap="lg">
                {/* Alert principal */}
                <Alert
                    icon={alertIcon}
                    title={isError ? "Erreur lors de l'envoi" : 'Envoi réussi'}
                    color={isError ? 'red' : 'green'}
                    variant="light"
                    radius="md"
                >
                    {isError
                        ? type === 'bulk'
                            ? `L'envoi groupé de ${itemsCount} pages vers n8n a échoué. Veuillez vérifier les détails ci-dessous.`
                            : "Les données n'ont pas pu être envoyées vers n8n. Veuillez vérifier les détails ci-dessous."
                        : type === 'bulk'
                            ? `${itemsCount} pages ont été envoyées avec succès vers n8n et seront traitées sous peu.`
                            : 'La page a été envoyée avec succès vers n8n et sera traitée sous peu.'
                    }
                </Alert>

                {/* Message d'erreur spécifique */}
                {isError && response?.message && (
                    <Alert color="red" variant="filled" radius="md">
                        <Stack gap="xs">
                            <Text size="sm" fw={600} c="white">
                                Cause de l'erreur :
                            </Text>
                            <Text size="sm" c="white">
                                {response.message}
                            </Text>
                        </Stack>
                    </Alert>
                )}

                {/* Message de rechargement */}
                {isReloading && (
                    <Alert color="blue" variant="light" radius="md">
                        <Group gap="xs">
                            <Loader size={16} />
                            <Text size="sm">
                                Rechargement de la page en cours...
                            </Text>
                        </Group>
                    </Alert>
                )}

                {/* Informations de succès avec détails du traitement */}
                {isSuccess && !isReloading && (
                    <Alert color="green" variant="light" radius="md">
                        <Stack gap="xs">
                            <Text size="sm" fw={500}>
                                Prochaines étapes :
                            </Text>
                            <Text size="sm">
                                {type === 'bulk' ? (
                                    <>
                                        • {itemsCount} pages Notion sont en cours de traitement par n8n
                                        <br />
                                        • Le workflow va générer les posts GMB correspondants
                                        <br />
                                        • Vous pouvez suivre l'avancement dans la section GMB Posts
                                        <br />
                                        • Les pages traitées disparaîtront de la liste des opérations en attente
                                    </>
                                ) : (
                                    <>
                                        • Votre page Notion est en cours de traitement par n8n
                                        <br />
                                        • Le workflow va générer le post GMB correspondant
                                        <br />
                                        • Vous recevrez une notification une fois le traitement terminé
                                        <br />
                                        • La page traitée disparaîtra de la liste des opérations en attente
                                    </>
                                )}
                            </Text>
                        </Stack>
                    </Alert>
                )}

                {/* Statistiques pour l'envoi groupé */}
                {type === 'bulk' && isSuccess && response?.processed_count && !isReloading && (
                    <Alert color="blue" variant="light" radius="md">
                        <Group justify="space-between" align="center">
                            <Text size="sm" fw={500}>
                                Pages traitées avec succès
                            </Text>
                            <Badge color="blue" size="lg">
                                {response.processed_count} / {itemsCount}
                            </Badge>
                        </Group>
                        {response.processed_count < itemsCount && (
                            <Progress 
                                value={(response.processed_count / itemsCount) * 100} 
                                color="blue" 
                                mt="xs"
                            />
                        )}
                    </Alert>
                )}

                {/* Accordéon pour les détails techniques */}
                {!isReloading && (
                    <Accordion variant="separated" radius="md">
                        <Accordion.Item value="technical-details">
                            <Accordion.Control icon={<LuChevronDown size={16} />}>
                                <Text fw={500}>
                                    {isError
                                        ? "Détails techniques de l'erreur"
                                        : 'Détails de la réponse n8n'}
                                </Text>
                            </Accordion.Control>
                            <Accordion.Panel>
                                <Stack gap="md">
                                    <Text size="sm" c="dimmed">
                                        {isError
                                            ? 'Informations techniques pour le débogage :'
                                            : type === 'bulk'
                                                ? 'Réponse complète du webhook n8n pour l\'envoi groupé :'
                                                : 'Réponse complète du webhook n8n :'}
                                    </Text>

                                    <ScrollArea h={300}>
                                        <Code
                                            block
                                            style={{
                                                backgroundColor: isError ? '#fef2f2' : '#f0fdf4',
                                                border: `1px solid ${isError ? '#fecaca' : '#bbf7d0'}`,
                                                borderRadius: '8px',
                                            }}
                                        >
                                            {JSON.stringify(response, null, 2)}
                                        </Code>
                                    </ScrollArea>
                                </Stack>
                            </Accordion.Panel>
                        </Accordion.Item>
                    </Accordion>
                )}

                {/* Boutons d'action */}
                <Group justify="space-between">
                    {isError && !isReloading && (
                        <Text size="xs" c="dimmed">
                            Si le problème persiste, contactez l'administrateur
                        </Text>
                    )}
                    <Group ml="auto">
                        <Button
                            onClick={handleClose}
                            variant={isError ? 'filled' : 'light'}
                            color={isError ? 'red' : 'green'}
                            leftSection={
                                isReloading ? (
                                    <Loader size={16} color="white" />
                                ) : isError ? (
                                    <LuX size={16} />
                                ) : (
                                    <LuCheck size={16} />
                                )
                            }
                            loading={isReloading}
                            disabled={isReloading}
                        >
                            {isReloading
                                ? 'Rechargement...'
                                : isError
                                ? 'Fermer'
                                : 'Parfait !'}
                        </Button>
                    </Group>
                </Group>
            </Stack>
        </Modal>
    )
}
