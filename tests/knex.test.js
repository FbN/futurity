import test from 'ava'
import Knex from 'knex'
import { Futurity, coMap, envMap } from '../index.js'
import * as F from 'fluture'

const I = a => a
const pipe = (...args) => args.reduce((f, g) => x => g(f(x)))

const DbFuturity = (db, args) =>
    Futurity.lift(
        p => db(...args),
        qb => F.attemptP(() => qb)
    )

test.before(t => {
    t.context.db = Knex({
        client: 'sqlite3',
        connection: {
            filename: 'tests/chinook.sqlite'
        },
        useNullAsDefault: true
    })
})

test.after(t => {
    t.context.db.destroy()
})

test('query dotted', async t => {
    const { db } = t.context

    const query = pipe(
        coMap(qb => qb.where({ Composer: 'Nirvana' })),
        coMap(qb => qb.limit(2)),
        F.map(rows => rows.map(track => track.Name))
    )(DbFuturity(db, ['Track']))

    const value = await F.promise(query)

    t.deepEqual(value, ['Aneurysm', 'Smells Like Teen Spirit'])
})

test('query by params', async t => {
    const { db } = t.context

    const query = pipe(
        coMap((qb, { Composer }) => qb.where({ Composer })),
        coMap(qb => qb.limit(2)),
        F.map(rows => rows.map(track => track.Name)),
        envMap(() => ({
            Composer: 'O. Osbourne, R. Daisley, R. Rhoads'
        }))
    )(DbFuturity(db, ['Track']))

    const value = await F.promise(query)
    t.deepEqual(value, ["I Don't Know", 'Crazy Train'])
})
