'use strict'

import test from 'ava'
import micro from 'micro'
import listen from 'test-listen'
import request from 'request-promise'
import fixtures from './fixtures/'
import config from '../config'
import pictures from '../pictures'
import utils from '../lib/utils'

test.beforeEach(async t => {
  let srv = micro(pictures)
  t.context.url = await listen(srv)
})

test('GET /:id', async t => {
  let image = fixtures.getImage()
  let url = t.context.url

  let body = await request({ uri: `${url}/${image.publicId}`, json: true })

  t.deepEqual(body, image)
})

test('no token POST /', async t => {
  let image = fixtures.getImage()
  let url = t.context.url

  let options = {
    method: 'POST',
    uri: url,
    json: true,
    resolveWithFullResponse: true,
    body: {
      description: image.description,
      src: image.src,
      userId: image.userId
    }
  }

  await t.throws(request(options), /invalid token/)
})

test('invalid token POST /', async t => {
  let image = fixtures.getImage()
  let url = t.context.url
  let token = await utils.signToken({ userId: 'foobar' }, config.secret)

  let options = {
    method: 'POST',
    uri: url,
    json: true,
    resolveWithFullResponse: true,
    body: {
      description: image.description,
      src: image.src,
      userId: image.userId
    },
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }

  await t.throws(request(options), /invalid token/)
})

test('secure POST /', async t => {
  let image = fixtures.getImage()
  let url = t.context.url
  let token = await utils.signToken({ userId: image.userId }, config.secret)

  let options = {
    method: 'POST',
    uri: url,
    json: true,
    resolveWithFullResponse: true,
    body: {
      description: image.description,
      src: image.src,
      userId: image.userId
    },
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }

  let response = await request(options)

  t.is(response.statusCode, 201)
  t.deepEqual(response.body, image)
})

test('POST /:id/like', async t => {
  let image = fixtures.getImage()
  let url = t.context.url

  let options = {
    method: 'POST',
    uri: `${url}/${image.id}/like`,
    json: true
  }

  let body = await request(options)
  let imageNew = JSON.parse(JSON.stringify(image))
  imageNew.liked = true
  imageNew.likes = 1

  t.deepEqual(body, imageNew)
})

test('GET /list', async t => {
  let images = fixtures.getImages()
  let url = t.context.url

  let options = {
    methos: 'GET',
    uri: `${url}/list`,
    json: true
  }

  let body = await request(options)

  t.deepEqual(body, images)
})

test('GET /tag/:tag', async t => {
  let images = fixtures.getImagesByTag()
  let url = t.context.url

  let options = {
    methos: 'GET',
    uri: `${url}/tag/awesome`,
    json: true
  }

  let body = await request(options)

  t.deepEqual(body, images)
})
