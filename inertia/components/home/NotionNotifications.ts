import { notifications } from '@mantine/notifications'
import { createElement } from 'react'
import { LuCheck, LuClockAlert, LuInfo, LuSend, LuX } from 'react-icons/lu'

export const NotionNotifications = {
    // Notification de début d'envoi
    sendingStart: (type: 'single' | 'bulk', itemsCount?: number) => {
        notifications.show({
            id: 'notion-sending',
            title: type === 'bulk' ? 'Envoi groupé en cours...' : 'Envoi vers n8n...',
            message:
                type === 'bulk'
                    ? `Envoi de ${itemsCount} pages vers n8n en cours...`
                    : 'Envoi de la page vers n8n en cours...',
            color: 'blue',
            icon: createElement(LuSend, { size: 18 }),
            loading: true,
            autoClose: false,
        })
    },

    // Notification de succès
    sendingSuccess: (type: 'single' | 'bulk', itemsCount?: number) => {
        notifications.update({
            id: 'notion-sending',
            title: type === 'bulk' ? 'Envoi groupé réussi !' : 'Envoi réussi !',
            message:
                type === 'bulk'
                    ? `${itemsCount} pages envoyées avec succès vers n8n`
                    : 'Page envoyée avec succès vers n8n',
            color: 'green',
            icon: createElement(LuCheck, { size: 18 }),
            loading: false,
            autoClose: 5000,
        })
    },

    // Notification d'erreur
    sendingError: (type: 'single' | 'bulk', errorMessage: string) => {
        notifications.update({
            id: 'notion-sending',
            title: type === 'bulk' ? 'Erreur envoi groupé' : "Erreur d'envoi",
            message: errorMessage,
            color: 'red',
            icon: createElement(LuX, { size: 18 }),
            loading: false,
            autoClose: 8000,
        })
    },

    // Notification d'information générale
    info: (title: string, message: string) => {
        notifications.show({
            title,
            message,
            color: 'blue',
            icon: createElement(LuInfo, { size: 18 }),
            autoClose: 4000,
        })
    },

    // Notification d'avertissement
    warning: (title: string, message: string) => {
        notifications.show({
            title,
            message,
            color: 'orange',
            icon: createElement(LuClockAlert, { size: 18 }),
            autoClose: 6000,
        })
    },

    // Fermer toutes les notifications
    clearAll: () => {
        notifications.clean()
    },
}
