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
} from '@mantine/core'
import { LuBadgeAlert, LuChevronDown, LuSend, LuX } from 'react-icons/lu'

interface WebhookModalProps {
    opened: boolean
    response: any
    onClose: () => void
}

export const WebhookModal = ({ opened, response, onClose }: WebhookModalProps) => {
    const isError = response?.error === true
    const title = isError ? "Erreur d'envoi vers n8n" : 'Envoi vers n8n réussi'
    const titleColor = isError ? 'red' : 'green'

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={
                <Title order={4} c={titleColor}>
                    {title}
                </Title>
            }
            size="lg"
        >
            <Stack gap="lg">
                {/* Alert principal */}
                <Alert
                    icon={isError ? <LuBadgeAlert size={20} /> : <LuSend size={20} />}
                    title={isError ? "Erreur lors de l'envoi" : 'Envoi réussi'}
                    color={isError ? 'red' : 'green'}
                    variant="light"
                    radius="md"
                >
                    {isError
                        ? "Les données n'ont pas pu être envoyées vers n8n. Veuillez vérifier les détails ci-dessous."
                        : 'Les données ont été envoyées avec succès vers n8n et seront traitées sous peu.'}
                </Alert>

                {/* Message d'erreur spécifique - plus visible */}
                {isError && response.message && (
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

                {/* Message de succès avec informations */}
                {!isError && (
                    <Alert color="green" variant="light" radius="md">
                        <Stack gap="xs">
                            <Text size="sm" fw={500}>
                                Prochaines étapes :
                            </Text>
                            <Text size="sm">
                                • Vos posts sont en cours de traitement par n8n
                                <br />
                                • Vous recevrez une notification une fois le traitement terminé
                                <br />• Les posts traités apparaîtront dans votre tableau avec le
                                nouveau statut
                            </Text>
                        </Stack>
                    </Alert>
                )}

                {/* Accordéon pour les détails techniques */}
                <Accordion variant="separated" radius="md">
                    <Accordion.Item value="technical-details">
                        <Accordion.Control icon={<LuChevronDown size={16} />}>
                            <Text fw={500}>
                                {isError
                                    ? "Détails techniques de l'erreur"
                                    : 'Détails de la réponse'}
                            </Text>
                        </Accordion.Control>
                        <Accordion.Panel>
                            <Stack gap="md">
                                <Text size="sm" c="dimmed">
                                    {isError
                                        ? 'Informations techniques pour le débogage :'
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

                {/* Boutons d'action */}
                <Group justify="space-between">
                    {isError && (
                        <Text size="xs" c="dimmed">
                            Si le problème persiste, contactez l'administrateur
                        </Text>
                    )}
                    <Group ml="auto">
                        <Button
                            onClick={onClose}
                            variant={isError ? 'filled' : 'light'}
                            color={isError ? 'red' : 'green'}
                            leftSection={<LuX size={16} />}
                        >
                            {isError ? 'Fermer' : 'Parfait !'}
                        </Button>
                    </Group>
                </Group>
            </Stack>
        </Modal>
    )
}
