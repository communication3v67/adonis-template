import { Badge, Button, Group, Modal, NumberInput, Textarea, TextInput, Stack, Text } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import React, { useEffect, useState } from 'react'
import { LuSave, LuX } from 'react-icons/lu'
import { GmbPost, FilterOptions } from '../../types'
import { CreatableSelect } from '../CreatableSelect'

interface EditPostModalProps {
    post: GmbPost | null
    opened: boolean
    onClose: () => void
    filterOptions: FilterOptions
}

export const EditPostModal = ({ post, opened, onClose, filterOptions }: EditPostModalProps) => {
    const [data, setData] = useState({
        status: '',
        text: '',
        date: '',
        image_url: '',
        link_url: '',
        keyword: '',
        client: '',
        project_name: '',
        city: '',
        location_id: '',
        account_id: '',
        notion_id: '',
        informations: '',
        last_modified: '',
    })
    
    const [processing, setProcessing] = useState(false)
    const [errors, setErrors] = useState<any>({})

    // Garder une référence des valeurs originales
    const [originalData, setOriginalData] = useState<any>({})
    const [conflictData, setConflictData] = useState<any>(null)
    const [showConflictModal, setShowConflictModal] = useState(false)

    // Options pour le statut
    const [statusOptions, setStatusOptions] = useState([
        { value: 'Post à générer', label: 'Post à générer' },
        { value: 'Brouillon', label: 'Brouillon' },
        { value: 'Publié', label: 'Publié' },
        { value: 'Programmé', label: 'Programmé' },
        { value: 'Échec', label: 'Échec' },
        { value: 'Titre généré', label: 'Titre généré' },
        { value: 'Post généré', label: 'Post généré' },
        { value: 'Post à publier', label: 'Post à publier' },
    ])

    // Options pour les clients
    const [clientOptions, setClientOptions] = useState(
        filterOptions.clients.map(client => ({ value: client, label: client }))
    )

    // Options pour les projets
    const [projectOptions, setProjectOptions] = useState(
        filterOptions.projects.map(project => ({ value: project, label: project }))
    )

    // Protection pour éviter les conflits SSE pendant l'édition
    useEffect(() => {
        if (opened) {
            window._isModalEditing = true
        } else {
            window._isModalEditing = false
        }
        
        return () => {
            window._isModalEditing = false
        }
    }, [opened])

    // Mettre à jour le formulaire quand le post change
    useEffect(() => {
        if (post && opened) {
            const initialData = {
                status: post.status || '',
                text: post.text || '',
                date: post.date ? new Date(post.date).toISOString().slice(0, 16) : '',
                image_url: post.image_url || '',
                link_url: post.link_url || '',
                keyword: post.keyword || '',
                client: post.client || '',
                project_name: post.project_name || '',
                city: post.city || '',
                location_id: post.location_id || '',
                account_id: post.account_id || '',
                notion_id: post.notion_id || '',
                informations: post.informations || '',
                last_modified: post.updatedAt || post.updated_at || '',
            }

            setData(initialData)
            setOriginalData(initialData)
            setErrors({})
        } else if (!opened) {
            reset()
        }
    }, [post, opened])

    const reset = () => {
        setData({
            status: '',
            text: '',
            date: '',
            image_url: '',
            link_url: '',
            keyword: '',
            client: '',
            project_name: '',
            city: '',
            location_id: '',
            account_id: '',
            notion_id: '',
            informations: '',
            last_modified: '',
        })
        setOriginalData({})
        setErrors({})
        setProcessing(false)
    }

    // Fonction pour vérifier si un champ a été modifié
    const isFieldChanged = (fieldName: string) => {
        return data[fieldName] !== originalData[fieldName]
    }

    // Compter le nombre de champs modifiés (exclure last_modified)
    const changedFieldsCount = Object.keys(data)
        .filter((key) => !['last_modified'].includes(key))
        .filter((key) => isFieldChanged(key)).length

    // Fonction pour gérer les conflits de version
    const handleVersionConflict = (conflictResponse: any) => {
        setConflictData(conflictResponse.current_post)
        setShowConflictModal(true)
        console.log('⚠️ Conflit de version détecté:', conflictResponse)
    }
    
    // Résoudre le conflit en faveur des données locales
    const resolveConflictKeepLocal = async () => {
        if (!post || !conflictData) return
        
        const changedFields: any = {}
        Object.keys(data).forEach((key) => {
            if (!['last_modified'].includes(key) && data[key] !== originalData[key]) {
                changedFields[key] = data[key]
            }
        })
        
        const forceUpdateData = { 
            ...changedFields, 
            force_update: true, 
            last_modified: conflictData.last_modified 
        }
        
        try {
            setProcessing(true)
            
            const response = await fetch(`/gmb-posts/${post.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                },
                body: JSON.stringify(forceUpdateData)
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.message || `Erreur HTTP: ${response.status}`)
            }

            notifications.show({
                title: 'Succès',
                message: 'Post mis à jour avec vos modifications (conflit résolu)',
                color: 'green',
            })
            
            setShowConflictModal(false)
            setConflictData(null)
            onClose()
            
        } catch (error) {
            notifications.show({
                title: 'Erreur',
                message: 'Erreur lors de la résolution du conflit',
                color: 'red',
            })
        } finally {
            setProcessing(false)
        }
    }
    
    // Résoudre le conflit en faveur des données serveur
    const resolveConflictKeepServer = () => {
        if (!conflictData) return
        
        // Mettre à jour les données locales avec les données serveur
        const serverData = {
            status: conflictData.status || '',
            text: conflictData.text || '',
            date: conflictData.date ? new Date(conflictData.date).toISOString().slice(0, 16) : '',
            image_url: conflictData.image_url || '',
            link_url: conflictData.link_url || '',
            keyword: conflictData.keyword || '',
            client: conflictData.client || '',
            project_name: conflictData.project_name || '',
            city: conflictData.city || '',
            location_id: conflictData.location_id || '',
            account_id: conflictData.account_id || '',
            notion_id: conflictData.notion_id || '',
            informations: conflictData.informations || '',
            last_modified: conflictData.updated_at || conflictData.updatedAt || '',
        }
        
        setData(serverData)
        setOriginalData(serverData)
        setShowConflictModal(false)
        setConflictData(null)
        
        notifications.show({
            title: 'Données actualisées',
            message: 'Les données ont été mises à jour avec la version serveur',
            color: 'blue',
        })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!post) return

        // Vérifier s'il y a des modifications (exclure last_modified)
        const changedFields: any = {}
        Object.keys(data).forEach((key) => {
            if (!['last_modified'].includes(key) && data[key] !== originalData[key]) {
                changedFields[key] = data[key]
            }
        })

        // Vérifier s'il y a des modifications
        if (Object.keys(changedFields).length === 0) {
            notifications.show({
                title: 'Information',
                message: 'Aucune modification détectée',
                color: 'blue',
            })
            return
        }

        // Ajouter les métadonnées de timestamp pour détection de conflit
        const submitData = {
            ...changedFields,
            last_modified: data.last_modified,
            client_timestamp: Date.now(),
        }
        
        try {
            setProcessing(true)
            setErrors({})
            
            console.log('=== ÉDITION MODAL AVEC FETCH API ===')
            console.log('Post ID:', post.id)
            console.log('Champs modifiés:', Object.keys(changedFields))
            console.log('====================================')
            
            // ✅ UTILISER FETCH au lieu d'Inertia pour cohérence avec inline edit
            const response = await fetch(`/gmb-posts/${post.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                },
                body: JSON.stringify(submitData)
            })

            if (!response.ok) {
                const errorData = await response.json()
                
                // Gestion spécifique des conflits de timestamp
                if (errorData.version_conflict) {
                    handleVersionConflict(errorData.version_conflict)
                    return
                }
                
                throw new Error(errorData.message || `Erreur HTTP: ${response.status}`)
            }

            const result = await response.json()
            
            console.log('=== SUCCÈS ÉDITION MODALE ===')
            console.log('Résultat:', result)
            console.log('Champs modifiés:', Object.keys(changedFields))
            console.log('================================')
            
            notifications.show({
                title: 'Succès',
                message: `${Object.keys(changedFields).length} champ(s) mis à jour avec succès !`,
                color: 'green',
            })
            
            // ✅ FERMETURE IMMÉDIATE sans attendre de rechargement
            onClose()
            
        } catch (error: any) {
            console.error('Erreur édition modal:', error)
            
            setErrors({ message: error.message })
            notifications.show({
                title: 'Erreur',
                message: error.message || 'Erreur lors de la mise à jour',
                color: 'red',
            })
        } finally {
            setProcessing(false)
        }
    }

    if (!post) return null

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={
                <Group>
                    <Text>Modifier le post</Text>
                    {changedFieldsCount > 0 && (
                        <Badge color="orange" variant="light">
                            {changedFieldsCount} champ(s) modifié(s)
                        </Badge>
                    )}
                </Group>
            }
            size="lg"
        >
            <form onSubmit={handleSubmit}>
                <Stack gap="md">
                    <Group grow>
                        <CreatableSelect
                            label="Statut"
                            placeholder="Sélectionner un statut"
                            data={statusOptions}
                            value={data.status}
                            onChange={(value) => setData(prev => ({ ...prev, status: value || '' }))}
                            onCreate={(query) => {
                                const newOption = { value: query, label: query }
                                setStatusOptions(prev => [...prev, newOption])
                                setData(prev => ({ ...prev, status: query }))
                            }}
                            error={errors.status}
                            styles={{
                                input: {
                                    borderColor: isFieldChanged('status') ? '#fd7e14' : undefined,
                                    backgroundColor: isFieldChanged('status') ? '#fff4e6' : undefined,
                                },
                            }}
                            />
                        <TextInput
                            label="Date"
                            type="datetime-local"
                            value={data.date}
                            onChange={(e) => setData(prev => ({ ...prev, date: e.target.value }))}
                            error={errors.date}
                            styles={{
                                input: {
                                    borderColor: isFieldChanged('date') ? '#fd7e14' : undefined,
                                    backgroundColor: isFieldChanged('date') ? '#fff4e6' : undefined,
                                },
                            }}
                        />
                    </Group>

                    {/* URLs */}
                    <Group grow>
                        <TextInput
                            label="URL de l'image"
                            placeholder="https://..."
                            value={data.image_url}
                            onChange={(e) => setData(prev => ({ ...prev, image_url: e.target.value }))}
                            error={errors.image_url}
                            styles={{
                                input: {
                                    borderColor: isFieldChanged('image_url') ? '#fd7e14' : undefined,
                                    backgroundColor: isFieldChanged('image_url') ? '#fff4e6' : undefined,
                                },
                            }}
                        />
                        <TextInput
                            label="URL du lien"
                            placeholder="https://..."
                            value={data.link_url}
                            onChange={(e) => setData(prev => ({ ...prev, link_url: e.target.value }))}
                            error={errors.link_url}
                            styles={{
                                input: {
                                    borderColor: isFieldChanged('link_url') ? '#fd7e14' : undefined,
                                    backgroundColor: isFieldChanged('link_url') ? '#fff4e6' : undefined,
                                },
                            }}
                        />
                    </Group>

                    <Textarea
                        label="Texte du post"
                        placeholder="Contenu du post..."
                        resize="vertical"
                        value={data.text}
                        onChange={(e) => setData(prev => ({ ...prev, text: e.target.value }))}
                        error={errors.text}
                        minRows={3}
                        styles={{
                            input: {
                                borderColor: isFieldChanged('text') ? '#fd7e14' : undefined,
                                backgroundColor: isFieldChanged('text') ? '#fff4e6' : undefined,
                            },
                        }}
                    />

                    <Textarea
                        label="Informations supplémentaires"
                        placeholder="Ajoutez des informations sur ce post (optionnel)..."
                        resize="vertical"
                        value={data.informations}
                        onChange={(e) => setData(prev => ({ ...prev, informations: e.target.value }))}
                        error={errors.informations}
                        minRows={3}
                        styles={{
                            input: {
                                borderColor: isFieldChanged('informations') ? '#fd7e14' : undefined,
                                backgroundColor: isFieldChanged('informations') ? '#fff4e6' : undefined,
                            },
                        }}
                    />

                    <Group grow>
                        <CreatableSelect
                            label="Client"
                            placeholder="Sélectionner un client"
                            data={clientOptions}
                            value={data.client}
                            onChange={(value) => setData(prev => ({ ...prev, client: value || '' }))}
                            onCreate={(query) => {
                                const newOption = { value: query, label: query }
                                setClientOptions(prev => [...prev, newOption])
                                setData(prev => ({ ...prev, client: query }))
                            }}
                            error={errors.client}
                            styles={{
                                input: {
                                    borderColor: isFieldChanged('client') ? '#fd7e14' : undefined,
                                    backgroundColor: isFieldChanged('client') ? '#fff4e6' : undefined,
                                },
                            }}
                        />
                        <CreatableSelect
                            label="Nom du projet"
                            placeholder="Sélectionner un projet"
                            data={projectOptions}
                            value={data.project_name}
                            onChange={(value) => setData(prev => ({ ...prev, project_name: value || '' }))}
                            onCreate={(query) => {
                                const newOption = { value: query, label: query }
                                setProjectOptions(prev => [...prev, newOption])
                                setData(prev => ({ ...prev, project_name: query }))
                            }}
                            error={errors.project_name}
                            styles={{
                                input: {
                                    borderColor: isFieldChanged('project_name') ? '#fd7e14' : undefined,
                                    backgroundColor: isFieldChanged('project_name') ? '#fff4e6' : undefined,
                                },
                            }}
                        />
                    </Group>

                    <Group grow>
                        <TextInput
                            label="Mot-clé"
                            placeholder="Mot-clé principal"
                            value={data.keyword}
                            onChange={(e) => setData(prev => ({ ...prev, keyword: e.target.value }))}
                            error={errors.keyword}
                            styles={{
                                input: {
                                    borderColor: isFieldChanged('keyword') ? '#fd7e14' : undefined,
                                    backgroundColor: isFieldChanged('keyword') ? '#fff4e6' : undefined,
                                },
                            }}
                        />
                        <TextInput
                            label="Ville"
                            placeholder="Ville"
                            value={data.city}
                            onChange={(e) => setData(prev => ({ ...prev, city: e.target.value }))}
                            error={errors.city}
                            styles={{
                                input: {
                                    borderColor: isFieldChanged('city') ? '#fd7e14' : undefined,
                                    backgroundColor: isFieldChanged('city') ? '#fff4e6' : undefined,
                                },
                            }}
                        />
                    </Group>

                    {/* IDs */}
                    <Group grow>
                        <TextInput
                            label="Location ID"
                            placeholder="ID de la localisation"
                            value={data.location_id}
                            onChange={(e) => setData(prev => ({ ...prev, location_id: e.target.value }))}
                            error={errors.location_id}
                            styles={{
                                input: {
                                    borderColor: isFieldChanged('location_id') ? '#fd7e14' : undefined,
                                    backgroundColor: isFieldChanged('location_id') ? '#fff4e6' : undefined,
                                },
                            }}
                        />
                        <TextInput
                            label="Account ID"
                            placeholder="ID du compte"
                            value={data.account_id}
                            onChange={(e) => setData(prev => ({ ...prev, account_id: e.target.value }))}
                            error={errors.account_id}
                            styles={{
                                input: {
                                    borderColor: isFieldChanged('account_id') ? '#fd7e14' : undefined,
                                    backgroundColor: isFieldChanged('account_id') ? '#fff4e6' : undefined,
                                },
                            }}
                        />
                    </Group>

                    {/* Notion ID */}
                    <TextInput
                        label="Notion ID"
                        placeholder="ID Notion (optionnel)"
                        value={data.notion_id}
                        onChange={(e) => setData(prev => ({ ...prev, notion_id: e.target.value }))}
                        error={errors.notion_id}
                        styles={{
                            input: {
                                borderColor: isFieldChanged('notion_id') ? '#fd7e14' : undefined,
                                backgroundColor: isFieldChanged('notion_id') ? '#fff4e6' : undefined,
                            },
                        }}
                    />

                    <Group justify="flex-end" mt="md">
                        <Button variant="light" onClick={onClose} leftSection={<LuX size={16} />}>
                            Annuler
                        </Button>
                        <Button
                            type="submit"
                            loading={processing}
                            disabled={changedFieldsCount === 0}
                            leftSection={<LuSave size={16} />}
                        >
                            Enregistrer {changedFieldsCount > 0 && `(${changedFieldsCount})`}
                        </Button>
                    </Group>
                </Stack>
            </form>
            
            {/* Modal de résolution de conflit */}
            <Modal
                opened={showConflictModal}
                onClose={() => setShowConflictModal(false)}
                title="Conflit de version détecté"
                size="lg"
                centered
            >
                <Stack gap="md">
                    <Text size="sm" c="orange">
                        ⚠️ Ce post a été modifié par quelqu'un d'autre pendant que vous l'éditiez.
                        Choisissez quelle version conserver :
                    </Text>
                    
                    <Group grow>
                        <div style={{ padding: '12px', border: '1px solid #e9ecef', borderRadius: '8px' }}>
                            <Text fw={500} size="sm" mb="xs">Vos modifications</Text>
                            <Text size="xs" c="dimmed">Version locale avec vos changements</Text>
                            {changedFieldsCount > 0 && (
                                <Badge color="blue" variant="light" size="sm" mt="xs">
                                    {changedFieldsCount} champ(s) modifié(s)
                                </Badge>
                            )}
                        </div>
                        
                        <div style={{ padding: '12px', border: '1px solid #e9ecef', borderRadius: '8px' }}>
                            <Text fw={500} size="sm" mb="xs">Version serveur</Text>
                            <Text size="xs" c="dimmed">
                                Modifié le {conflictData?.updated_at ? 
                                    new Date(conflictData.updated_at).toLocaleString() : 
                                    'Récemment'
                                }
                            </Text>
                            <Badge color="green" variant="light" size="sm" mt="xs">
                                Version la plus récente
                            </Badge>
                        </div>
                    </Group>
                    
                    <Group justify="flex-end" mt="md">
                        <Button 
                            variant="light" 
                            onClick={() => setShowConflictModal(false)}
                        >
                            Annuler
                        </Button>
                        <Button 
                            color="blue" 
                            onClick={resolveConflictKeepLocal}
                            loading={processing}
                        >
                            Garder mes modifications
                        </Button>
                        <Button 
                            color="green" 
                            onClick={resolveConflictKeepServer}
                        >
                            Utiliser la version serveur
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </Modal>
    )
}
