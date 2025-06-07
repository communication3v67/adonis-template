/* eslint-disable @typescript-eslint/naming-convention */
import GmbPost from '#models/gmb_post'
import { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'

export default class GmbPostsController {
    public async index({ inertia }: HttpContext) {
        const gmb_posts = await GmbPost.all()
        return inertia.render('gmb_posts/index', { gmb_posts })
    }

    public async create({ inertia }: HttpContext) {
        return inertia.render('gmb_posts/create')
    }

    public async store({ request, response }: HttpContext) {
        const payload = {
            status: request.input('status'),
            text: request.input('text'),
            date: request.input('date') ? DateTime.fromISO(request.input('date')) : DateTime.now(),
            image_url: request.input('image_url'),
            link_url: request.input('link_url'),
            keyword: request.input('keyword'),
            client: request.input('client'),
            project_name: request.input('project_name'),
            location_id: request.input('location_id'),
            account_id: request.input('account_id'),
            notion_id: request.input('notion_id'),
        }
        await GmbPost.create(payload)
        return response.redirect().toRoute('gmb_posts.index')
    }

    // METHODE POUR AFFICHER LE FORMULAIRE D'EDITION
    public async edit({ params, inertia, response }: HttpContext) {
        const post = await GmbPost.find(params.id)
        if (!post) {
            return response.notFound()
        }
        return inertia.render('gmb_posts/edit', { post })
    }

    // METHODE POUR MODIFIER UN POST
    public async update({ params, request, response }: HttpContext) {
        const post = await GmbPost.find(params.id)
        if (!post) {
            return response.notFound()
        }
        post.status = request.input('status')
        post.text = request.input('text')
        post.date = request.input('date') ? DateTime.fromISO(request.input('date')) : post.date
        post.image_url = request.input('image_url')
        post.link_url = request.input('link_url')
        post.keyword = request.input('keyword')
        post.client = request.input('client')
        post.project_name = request.input('project_name')
        post.location_id = request.input('location_id')
        post.account_id = request.input('account_id')
        post.notion_id = request.input('notion_id')

        await post.save()
        return response.redirect().toRoute('gmb_posts.index')
    }

    // METHODE POUR SUPPRIMER UN POST
    public async destroy({ params, response }: HttpContext) {
        const post = await GmbPost.find(params.id)
        if (!post) {
            return response.notFound()
        }
        await post.delete()
        return response.redirect().toRoute('gmb_posts.index')
    }
}
