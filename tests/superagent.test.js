import test from 'ava'
import { Futurity, coMap, envMap } from '../index.js'
import * as F from 'fluture'
import request from 'superagent'

const I = a => a
const pipe = (...args) => args.reduce((f, g) => x => g(f(x)))

const SaFuturity = method =>
    Futurity.lift(request[method], agent => F.attemptP(() => agent))

test.only('get json', async t => {
    const query = pipe(
        envMap(() => 'https://jsonplaceholder.typicode.com/todos/1'),
        F.map(res => res.body),
        F.map(body => body.title),
        coMap(req => req.set('accept', 'json'))
    )(SaFuturity('get'))

    const title = await F.promise(query)
    t.deepEqual('delectus aut autem', title)
})

test('post json', async t => {
    const data = {
        title: 'foo',
        body: 'bar',
        userId: 1
    }

    const query = pipe(
        envMap(() => 'https://jsonplaceholder.typicode.com/posts'),
        coMap(req =>
            req
                .set('accept', 'json')
                .set('Content-Type', 'application/json; charset=UTF-8')
        ),
        coMap(req => req.send(JSON.stringify(data))),
        F.map(res => res.body),
        F.map(body => body.title)
    )(SaFuturity('post'))

    t.deepEqual(data.title, title)
})
